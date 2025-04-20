import React, { useEffect, useState, useCallback, useRef } from 'react';
import { ChatMessage } from '../components/ChatMessage';
import { ChatInput } from '../components/ChatInput';
import { Layout } from '../components/Layout';
import { useChatStore } from '../store/useChatStore';
import { useProfileStore } from '../store/useProfileStore';
import { useAuthStore } from '../store/useAuthStore';
import { Button } from '../components/ui/Button';
import Profile from '../components/Profile';
import { 
  Trash2, 
  Loader2, 
  Plus, 
  AlertCircle, 
  X, 
  Download,
  Keyboard,
  MessageSquare,
  ChevronDown,
  Menu,
  Settings,
  Heart,
  HeartPulse,
  Moon,
  Sun,
  HelpCircle,
  FileText,
  History as HistoryIcon,
  User,
  Square,
  RefreshCw,
  BookOpen,
  Wand2,
  Languages,
  Zap,
  Share2,
  Copy
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../lib/supabase';
import { useNavigate, Link, useParams } from 'react-router-dom';
import { generateChatReport, generateHTML, downloadReport } from '../lib/reportGenerator';
import { format } from 'date-fns';
import { ReportPreviewModal } from '../components/ReportPreviewModal';
import { useTheme } from '../components/ThemeProvider';
import { MySwal, showConfirm, showSuccess, showError } from '../lib/sweet-alert';
import { showSuccess as showToastSuccess, showError as showToastError } from '../lib/toast';
import { 
  analyzeImage, 
  analyzeMultipleImages, 
  analyzeVideo, 
  analyzeYouTubeVideo,
  analyzeAudio,
  transcribeAudio,
  getAudioTimestampContent
} from '../lib/geminiVision';
import { ai } from '../lib/ai';
import { GEMINI_MODEL } from '../lib/constants';
import { logInfo, logError, LogCategory } from '../lib/logging';
import { v4 as uuidv4 } from 'uuid';

export const Chat: React.FC = () => {
  const { id: conversationIdFromUrl } = useParams<{ id: string }>();
  const { 
    messages, 
    addMessage, 
    deleteMessage, 
    clearHistory, 
    fetchMessages, 
    loading, 
    startNewConversation, 
    currentConversationId,
    error,
    clearError,
    conversations,
    fetchConversations,
    setCurrentConversation,
    editMessage,
    stopGeneration,
    isGenerating,
    apiMode,
    setApiMode
  } = useChatStore();
  const { profile, fetchProfile } = useProfileStore();
  const { user } = useAuthStore();
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [reportData, setReportData] = useState<any>(null);
  const [showKeyboardShortcuts, setShowKeyboardShortcuts] = useState(false);
  const [scrolledToBottom, setScrolledToBottom] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showWelcomeMessage, setShowWelcomeMessage] = useState(true);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();
  const [reportLanguageModalOpen, setReportLanguageModalOpen] = useState(false);
  const [loadingSidebarConversation, setLoadingSidebarConversation] = useState<string | null>(null);
  const [shareToastVisible, setShareToastVisible] = useState(false);
  const [initializationComplete, setInitializationComplete] = useState(false);
  const [localLoading, setLocalLoading] = useState(true);
  const [processingMessages, setProcessingMessages] = useState<Record<string, boolean>>({});

  // Initialize chat - separate from the useEffect to prevent circular dependencies
  const initializeChat = useCallback(async () => {
    if (!user || initializationComplete) return;
    
    setLocalLoading(true);
    try {
      await fetchProfile();
      
      // Check if we have a conversation ID from the URL
      if (conversationIdFromUrl) {
        try {
          // Try to set the current conversation from the URL parameter
          await setCurrentConversation(conversationIdFromUrl);
          // For existing conversations, don't show welcome message
          setShowWelcomeMessage(false);
        } catch (error) {
          console.error('Error loading conversation from URL:', error);
          showToastError('Could not load the requested conversation', 'Starting a new chat instead');
          const newConversationId = startNewConversation();
          // Update URL with the new conversation
          window.history.replaceState(null, '', `/chat/${newConversationId}`);
          // For new conversations, show welcome message
          setShowWelcomeMessage(true);
        }
      } else if (!currentConversationId) {
        try {
          const userData = await supabase.auth.getUser();
          if (userData.data.user) {
            // Safely set the email with nullish coalescing to handle undefined
            setUserEmail(userData.data.user.email || null);
            
            // If we don't have a current conversation but we have conversation history,
            // load the most recent conversation
            if (conversations.length > 0) {
              const conversationId = conversations[0].id;
              await setCurrentConversation(conversationId);
              // Update URL to include the conversation ID
              window.history.replaceState(null, '', `/chat/${conversationId}`);
              // Existing conversation, don't show welcome
              setShowWelcomeMessage(false);
            } else {
              // Start a new conversation if there are no existing ones
              const newConversationId = startNewConversation();
              // Update URL to include the new conversation ID
              window.history.replaceState(null, '', `/chat/${newConversationId}`);
              // New conversation, show welcome
              setShowWelcomeMessage(true);
            }
          }
        } catch (error) {
          console.error('Error initializing chat:', error);
        }
      } else {
        // If we have a current conversation ID, fetch its messages
        await fetchMessages();
        
        // Only update URL if it doesn't already contain the current conversation ID
        const currentUrl = window.location.pathname;
        if (!currentUrl.includes(currentConversationId)) {
          // Update URL to include the current conversation ID
          window.history.replaceState(null, '', `/chat/${currentConversationId}`);
        }
        
        // Set welcome message state based on whether there are messages
        setShowWelcomeMessage(messages.length === 0);
      }
      
      setInitializationComplete(true);
    } catch (error) {
      console.error('Error in chat initialization:', error);
    } finally {
      setLocalLoading(false);
    }
  }, [
    user, 
    conversationIdFromUrl, 
    currentConversationId,
    fetchProfile,
    fetchMessages,
    setCurrentConversation,
    startNewConversation,
    conversations,
    initializationComplete
  ]);

  // Call initialization when component mounts
  useEffect(() => {
    initializeChat();
  }, []);

  // Update messages when currentConversationId changes
  useEffect(() => {
    if (currentConversationId && initializationComplete) {
      fetchMessages();
    }
  }, [currentConversationId, fetchMessages, initializationComplete]);

  // Keep the showWelcomeMessage state synchronized with the store
  useEffect(() => {
    if (messages.length === 0 && !loading && initializationComplete) {
      setShowWelcomeMessage(true);
    } else if (messages.length > 0) {
      setShowWelcomeMessage(false);
    }
  }, [messages.length, loading, initializationComplete]);

  // Define all handler functions before any useEffect hooks that use them
  const handleSend = async (content: string, file?: File) => {
    if (!content.trim() && !file) return;
    
    try {
      await addMessage({ role: 'user', content, isEncrypted: false }, file);
      setShowWelcomeMessage(false);
      setScrolledToBottom(true);
    } catch (error) {
      console.error('Error sending message:', error);
      showToastError('Failed to send message', 'Please try again');
    }
  };

  const handleNewChat = async () => {
    if (messages.length > 0) {
      const result = await showConfirm(
        'Start new conversation?',
        'This will create a new conversation. Your current conversation will be saved.',
        {
          confirmButtonText: 'Yes, start new chat',
        }
      );
      
      if (result.isConfirmed) {
        startNewConversation();
        setShowWelcomeMessage(true);
        showToastSuccess('New conversation started');
      }
    } else {
      startNewConversation();
      setShowWelcomeMessage(true);
    }
  };

  const prepareReport = async () => {
    try {
      if (!currentConversationId || messages.length === 0) return;
      
      const currentConversation = conversations.find(c => c.id === currentConversationId);
      const title = currentConversation?.title || 'Chat History';
      
      // Show language selection dialog
      setReportLanguageModalOpen(true);
      
      // Note: The actual report generation will happen when the user selects a language
    } catch (error) {
      console.error('Error preparing report:', error);
      showToastError('Failed to prepare report', 'Please try again later');
    }
  };

  const generateReport = async (language: string = 'en') => {
    try {
      console.log('===== GENERATING REPORT =====');
      if (!currentConversationId || messages.length === 0) {
        console.log('Aborting report generation: No conversation ID or messages');
        return;
      }
      
      console.log('Current conversation ID:', currentConversationId);
      console.log('Message count:', messages.length);
      console.log('User email:', userEmail);
      
      const currentConversation = conversations.find(c => c.id === currentConversationId);
      const title = currentConversation?.title || 'Chat History';
      console.log('Report title:', title);
      
      // Close the language selection modal
      setReportLanguageModalOpen(false);
      
      // Generate the report with the selected language
      console.log('Generating report with language:', language);
      const data = await generateChatReport(messages, title, language);
      setReportData(data);
      setReportModalOpen(true);
      
      // Show a toast notification when report is ready
      showToastSuccess('Report generated successfully', 'Your conversation report is ready');
      
      // Send email notification to the user if email is available
      if (userEmail) {
        console.log('Attempting to send email notification to:', userEmail);
        try {
          // Import the email module dynamically with proper error handling
          console.log('Importing email module...');
          const emailModule = await import('../lib/email');
          
          console.log('Email module imported successfully');
          const emailSubject = 'Your MindfulAI Chat Report is Ready';
          const emailContent = `<p>Your chat report "${title}" has been generated and is ready to download.</p>
                               <p>Please download it from the application.</p>
                               <p>Thank you for using MindfulAI!</p>`;
          
          console.log('Sending email with subject:', emailSubject);
          const emailResult = await emailModule.sendEmailNotification(
            userEmail,
            emailSubject,
            emailContent
          );
          
          console.log('Email notification result:', emailResult);
          if (emailResult.success === false) {
            console.error('Email API returned error:', emailResult.error);
          }
        } catch (emailError) {
          console.error('Failed to send email notification:', emailError);
          console.error('Error details:', JSON.stringify(emailError, null, 2));
        }
      } else {
        console.log('No user email available, skipping email notification');
      }
      console.log('===== REPORT GENERATION COMPLETE =====');
    } catch (error) {
      console.error('===== ERROR GENERATING REPORT =====');
      console.error('Error generating report:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));
      showToastError('Failed to generate report', 'Please try again later');
    }
  };

  const downloadReportFile = (phoneNumber?: string) => {
    if (!reportData) return;
    
    console.log('===== EXPORT CHAT REPORT STARTED =====');
    console.log('Current user email address:', userEmail);
    console.log('Report data language:', reportData.metadata?.language);
    
    const html = generateHTML(reportData);
    // Include language in the filename if it's not English
    const langSuffix = reportData.metadata?.language !== 'en' ? `-${reportData.metadata.language}` : '';
    const filename = `mindfulai-chat${langSuffix}-${format(new Date(), 'yyyy-MM-dd')}.html`;
    
    console.log('Calling downloadReport with parameters:');
    console.log('- Filename:', filename);
    console.log('- Phone number:', phoneNumber || 'none');
    console.log('- User email:', userEmail || 'undefined');
    
    downloadReport(html, filename, phoneNumber, userEmail || undefined);
    
    console.log('downloadReport function called');
  };

  const scrollToBottom = () => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTo({
        top: chatContainerRef.current.scrollHeight,
        behavior: 'smooth',
      });
      setScrolledToBottom(true);
    }
  };

  const handleClearHistory = async () => {
    const result = await showConfirm(
      'Clear conversation?',
      'This will delete all messages in the current conversation. This action cannot be undone.',
      {
        confirmButtonText: 'Yes, clear it!',
        confirmButtonColor: '#d33',
      }
    );
    
    if (result.isConfirmed) {
      try {
        await clearHistory();
        showToastSuccess('Conversation cleared successfully');
      } catch (error) {
        console.error('Error clearing history:', error);
        showToastError('Failed to clear conversation');
      }
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 18) return "Good Afternoon";
    return "Good Evening";
  };

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (chatContainerRef.current && scrolledToBottom) {
      chatContainerRef.current.scrollTo({
        top: chatContainerRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, [messages, scrolledToBottom]);

  // Handle scroll events
  const handleScroll = useCallback(() => {
    if (!chatContainerRef.current) return;
    
    const { scrollTop, scrollHeight, clientHeight } = chatContainerRef.current;
    const isScrolledToBottom = scrollHeight - scrollTop - clientHeight < 50;
    setScrolledToBottom(isScrolledToBottom);
  }, []);

  useEffect(() => {
    const container = chatContainerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll);
      return () => container.removeEventListener('scroll', handleScroll);
    }
  }, [handleScroll]);

  // Place this after all the function declarations (handleNewChat, prepareReport, handleClearHistory, etc.)
  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent handling shortcuts in input fields
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      
      if (e.altKey) {
        switch (e.key) {
          // Alt+N for new chat
          case 'n':
            e.preventDefault();
            handleNewChat();
            break;
          
          // Alt+E for export
          case 'e':
            e.preventDefault();
            prepareReport();
            break;
          
          // Alt+T for toggle theme
          case 't':
            e.preventDefault();
            setTheme(theme === 'dark' ? 'light' : 'dark');
            break;
          
          // Alt+S for toggle sidebar
          case 's':
            e.preventDefault();
            setSidebarOpen(prev => !prev);
            break;
          
          // Alt+/ for keyboard shortcuts
          case '/':
            e.preventDefault();
            setShowKeyboardShortcuts(prev => !prev);
            break;
            
          // Alt+C for clear history
          case 'c':
            e.preventDefault();
            if (messages.length > 0) {
              handleClearHistory();
            }
            break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown, { capture: true });
    return () => {
      window.removeEventListener('keydown', handleKeyDown, { capture: true });
    };
  }, [
    handleNewChat,
    prepareReport,
    setTheme,
    theme,
    setSidebarOpen,
    setShowKeyboardShortcuts,
    messages.length,
    handleClearHistory
  ]);

  const handleEditMessage = async (id: string, newContent: string) => {
    try {
      // Find the index of the message to edit
      const editedMessageIndex = messages.findIndex(m => m.id === id);
      if (editedMessageIndex >= 0) {
        // Find any assistant messages that came after this message
        const subsequentMessages = messages.slice(editedMessageIndex + 1);
        
        // Delete the original message and all subsequent messages
        await deleteMessage(id);
        
        // Delete all subsequent messages
        for (const msg of subsequentMessages) {
          await deleteMessage(msg.id);
        }
        
        // Add a new message with the edited content
        await addMessage({ role: 'user', content: newContent, isEncrypted: false });
        setScrolledToBottom(true);
      }
    } catch (error) {
      console.error('Error editing message:', error);
      showToastError('Failed to edit message', 'Please try again');
    }
  };

  const handleRegenerateResponse = async () => {
    if (messages.length < 2) return;
    
    // Find the last user message and last assistant message
    const userMessages = messages.filter(m => m.role === 'user');
    const assistantMessages = messages.filter(m => m.role === 'assistant');
    
    if (userMessages.length === 0 || assistantMessages.length === 0) return;
    
    try {
      // Delete the last assistant message first
      const lastAssistantMessage = assistantMessages[assistantMessages.length - 1];
      await deleteMessage(lastAssistantMessage.id);
      
      // Wait a moment to ensure deletion is processed
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Trigger a new API call by sending the last user message again
      // This will appear in the UI as if the user is simply regenerating the response
      // without duplicating the user message
      const lastUserMessage = userMessages[userMessages.length - 1];
      await handleSend(lastUserMessage.content);
      
      setScrolledToBottom(true);
    } catch (error) {
      console.error('Error regenerating response:', error);
      showToastError('Failed to regenerate response', 'Please try again');
    }
  };
  
  const handleStopGeneration = () => {
    stopGeneration();
    showToastSuccess('Generation stopped', 'Response generation was interrupted');
  };

  const handleSidebarConversationClick = async (conversationId: string) => {
    if (loadingSidebarConversation !== null) return; // Prevent clicks while loading
    
    try {
      setLoadingSidebarConversation(conversationId);
      await setCurrentConversation(conversationId);
      setSidebarOpen(false);
    } catch (error) {
      console.error('Error changing conversation:', error);
      showToastError('Failed to load conversation', 'Please try again');
    } finally {
      setLoadingSidebarConversation(null);
    }
  };

  // Add new function to handle media analysis with Gemini Vision
  const handleAnalyzeWithVision = async (prompt: string, files: File[]) => {
    if (!files.length) return;
    
    // Create a temporary "thinking" message ID outside the try block so it's available in catch
    const thinkingMessageId = `thinking-${uuidv4()}`;
    
    try {
      // Show loading state
      setShowWelcomeMessage(false);
      
      // Determine if we're dealing with images, videos, or audio
      const isVideo = files.some(file => file.type.startsWith('video/'));
      const isAudio = files.some(file => file.type.startsWith('audio/'));
      
      // Set initial messages to empty array if this is a new conversation to prevent welcome message
      if (messages.length === 0) {
        // Check if we're analyzing media in a new conversation
        // If so, suppress the default welcome message by marking it as no longer new
        useChatStore.setState(state => ({
          ...state,
          showWelcomeMessage: false 
        }));
      }
      
      // First, add the user message with isEncrypted property to the backend
      // This will also update the UI state through the chat store
      await addMessage({ role: 'user', content: prompt, isEncrypted: false }, files);
      
      // Make sure we scroll to the bottom to show the user message and files
      setScrolledToBottom(true);
      
      // Create a temporary "thinking" message with a loading indicator
      const thinkingMessage = {
        id: thinkingMessageId,
        role: 'assistant' as const,
        content: '...',
        timestamp: new Date().toISOString(),
        isEncrypted: false,
        isThinking: true // Special flag to identify this as a thinking message
      };
      
      // Add the thinking message to local state
      useChatStore.setState(state => ({
        messages: [...state.messages, thinkingMessage]
      }));
      
      // Set this message as processing
      setProcessingMessages(prev => ({ ...prev, [thinkingMessageId]: true }));
      
      let response = '';
      
      // Process the media based on type
      if (isAudio) {
        // For audio files, use the audio analysis function
        if (prompt.toLowerCase().includes('transcript') || prompt.toLowerCase().includes('transcribe')) {
          response = await transcribeAudio(files[0]);
        } else {
          response = await analyzeAudio(files[0], prompt);
        }
      } else if (isVideo) {
        // For videos, use the video analysis function
        response = await analyzeVideo(files[0], prompt);
      } else if (files.length === 1) {
        // For a single image
        response = await analyzeImage(files[0], prompt);
      } else {
        // For multiple images
        response = await analyzeMultipleImages(files, prompt);
      }
      
      // Remove the thinking message before adding the real response
      useChatStore.setState(state => ({
        messages: state.messages.filter(msg => msg.id !== thinkingMessageId)
      }));
      
      // Add the assistant response with isEncrypted property
      if (response) {
        await addMessage({ role: 'assistant', content: response, isEncrypted: false });
        
        // Clear this message from processing
        setProcessingMessages(prev => {
          const updated = { ...prev };
          delete updated[thinkingMessageId];
          return updated;
        });
        
        setScrolledToBottom(true);
      }
      
    } catch (error) {
      console.error('Error analyzing media with Gemini Vision:', error);
      showToastError('Failed to analyze media', 'Please try again');
      
      // Remove the thinking message on error
      useChatStore.setState(state => ({
        messages: state.messages.filter(msg => msg.id !== thinkingMessageId || !('isThinking' in msg))
      }));
      
      // Clear any processing state
      setProcessingMessages(prev => {
        const updated = { ...prev };
        delete updated[thinkingMessageId];
        return updated;
      });
    }
  };

  // Add this new function for YouTube handling above the handleSendWrapper
  const handleYouTubeVideo = async (content: string, youtubeUrl: string) => {
    try {
      // Set initial messages to empty array if this is a new conversation to prevent welcome message
      if (messages.length === 0) {
        useChatStore.setState(state => ({
          ...state,
          showWelcomeMessage: false 
        }));
      }
      
      // Extract prompt without the URL
      const promptWithoutUrl = content.replace(youtubeUrl, '').trim();
      const promptToUse = promptWithoutUrl || "Analyze this video in detail, describing what you see.";
      
      // Use the standard message flow to maintain chat context
      await addMessage({ role: 'user', content, isEncrypted: false });
      
      // Show that we're processing
      setShowWelcomeMessage(false);
      setScrolledToBottom(true);
      
      // Create a temporary "thinking" message with a loading indicator
      const thinkingMessageId = `thinking-${uuidv4()}`;
      const thinkingMessage = {
        id: thinkingMessageId,
        role: 'assistant' as const,
        content: '...',
        timestamp: new Date().toISOString(),
        isEncrypted: false,
        isThinking: true // Special flag to identify this as a thinking message
      };
      
      // Add the thinking message to local state
      useChatStore.setState(state => ({
        messages: [...state.messages, thinkingMessage]
      }));
      
      // Set this message as processing
      setProcessingMessages(prev => ({ ...prev, [thinkingMessageId]: true }));
      
      // Analyze the YouTube video
      const response = await analyzeYouTubeVideo(youtubeUrl, promptToUse);
      
      if (response) {
        // Remove the thinking message
        useChatStore.setState(state => ({
          messages: state.messages.filter(msg => msg.id !== thinkingMessageId)
        }));
        
        // Add the actual response using chat store's addMessage to maintain context
        await addMessage({ role: 'assistant', content: response, isEncrypted: false });
        
        // Clear this message from processing
        setProcessingMessages(prev => {
          const updated = { ...prev };
          delete updated[thinkingMessageId];
          return updated;
        });
        
        setScrolledToBottom(true);
      }
    } catch (error) {
      console.error('Error processing YouTube video:', error);
      showToastError('Failed to analyze YouTube video', 'Please try again');
      
      // Remove the thinking message on error
      useChatStore.setState(state => ({
        messages: state.messages.filter(msg => !('isThinking' in msg))
      }));
      
      // Clear any processing state
      setProcessingMessages({});
    }
  };

  // Update the handleSend function to match the expected signature
  // This will fix the type mismatch with ChatInput's onSend prop
  const handleSendWrapper = (content: string, files?: File[]) => {
    // First check if content contains a YouTube URL
    // Enhanced regex to better catch all YouTube URL variations including Shorts
    const youtubeUrlRegex = /https?:\/\/(www\.)?(youtube\.com\/(?:watch\?v=|shorts\/)|youtu\.be\/)[^\s&]+/g;
    const youtubeMatches = content.match(youtubeUrlRegex);
    
    // If we have a YouTube URL in the message, process it with our special YouTube handler
    if (youtubeMatches && youtubeMatches.length > 0) {
      const youtubeUrl = youtubeMatches[0]; // Use the first match if multiple found
      
      // If we're not already in Gemini mode, switch to it for the YouTube analysis
      if (apiMode !== 'gemini') {
        setApiMode('gemini');
      }
      
      // Handle with our special YouTube function
      handleYouTubeVideo(content, youtubeUrl);
      return; // Skip normal processing
    }
    // If there are media files, automatically use vision mode by switching to Gemini
    else if (files && files.length > 0 && (
      files.some(file => file.type.startsWith('image/')) || 
      files.some(file => file.type.startsWith('video/')) ||
      files.some(file => file.type.startsWith('audio/'))
    )) {
      // If we're not already in Gemini mode, switch to it for the media analysis
      if (apiMode !== 'gemini') {
        setApiMode('gemini');
      }
      // Route to vision analysis for media files
      handleAnalyzeWithVision(content, files);
    } else if (files && files.length > 0) {
      // For other types of files, use the first file and include the text message
      handleSend(content, files[0]);
    } else {
      handleSend(content);
    }
  };

  // Function to handle sharing the conversation
  const handleShareConversation = async () => {
    if (!currentConversationId) return;
    
    // Create the shareable URL
    const shareUrl = `${window.location.origin}/chat/${currentConversationId}`;
    
    try {
      await navigator.clipboard.writeText(shareUrl);
      setShareToastVisible(true);
      showToastSuccess('Link copied to clipboard', 'You can now share this conversation');
      
      // Update URL without reloading the page
      window.history.replaceState(null, '', `/chat/${currentConversationId}`);
      
      // Hide toast after 3 seconds
      setTimeout(() => {
        setShareToastVisible(false);
      }, 3000);
    } catch (error) {
      console.error('Error copying to clipboard:', error);
      showToastError('Failed to copy link', 'Please try again');
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Show loader when initializing */}
      {localLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-50 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-4">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            <div className="text-sm text-muted-foreground">Loading your conversation...</div>
          </div>
        </div>
      )}
    
      {/* Sidebar */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ x: -300, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -300, opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed inset-y-0 left-0 z-30 w-64 border-r bg-card/95 backdrop-blur-md shadow-lg"
          >
            <div className="flex h-full flex-col">
              <div className="flex items-center justify-between border-b p-4">
                <div className="flex items-center gap-2">
                  <HeartPulse className="h-6 w-6 text-rose-500" />
                  <span className="font-bold text-lg">MindfulAI</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSidebarOpen(false)}
                  className="h-8 w-8 p-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="flex-1 overflow-auto p-4">
                <div className="space-y-4">
                  {/* New Chat Button */}
                  <Button 
                    onClick={handleNewChat}
                    className="w-full flex items-center justify-start gap-2 mb-2"
                    variant="outline"
                  >
                    <Plus className="h-4 w-4" />
                    New Chat
                  </Button>
                  
                  {/* Conversation History */}
                  <div className="space-y-1">
                    <h3 className="text-sm font-medium text-muted-foreground mb-2">Recent Conversations</h3>
                    {conversations.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No conversations yet</p>
                    ) : (
                      <div className="space-y-1 max-h-60 overflow-y-auto pr-1">
                        {conversations.map(conversation => (
                          <Button
                            key={conversation.id}
                            variant={currentConversationId === conversation.id ? "secondary" : "ghost"}
                            className={`w-full justify-start text-left truncate py-2 h-auto ${loadingSidebarConversation === conversation.id ? 'opacity-70' : ''}`}
                            onClick={() => handleSidebarConversationClick(conversation.id)}
                            disabled={loadingSidebarConversation !== null}
                          >
                            {loadingSidebarConversation === conversation.id ? (
                              <Loader2 className="h-4 w-4 mr-2 flex-shrink-0 animate-spin" />
                            ) : (
                              <MessageSquare className="h-4 w-4 mr-2 flex-shrink-0" />
                            )}
                            <span className="truncate">{conversation.title}</span>
                          </Button>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  {/* Navigation Links */}
                  <div className="pt-4 border-t border-border/30">
                    <Button
                      variant="ghost"
                      className="w-full justify-start"
                      onClick={() => navigate('/history')}
                    >
                      <HistoryIcon className="h-4 w-4 mr-2" />
                      <span>View All History</span>
                    </Button>
                    <Button
                      variant="ghost"
                      className="w-full justify-start"
                      onClick={() => navigate('/models')}
                    >
                      <Zap className="h-4 w-4 mr-2" />
                      <span>AI Models</span>
                    </Button>
                  </div>
                </div>
              </div>
              
              <div className="border-t p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Profile user={user} />
                    <div className="text-sm font-medium truncate">
                      {profile?.first_name ? `${profile.first_name} ${profile.last_name || ''}` : user?.email?.split('@')[0] || 'User'}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                    className="h-8 w-8 p-0"
                  >
                    {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              {/* Add the API Mode Toggle Button */}
              <div className="px-4 py-2 space-y-1">
                <button
                  onClick={() => setApiMode(apiMode === 'lmstudio' ? 'gemini' : 'lmstudio')}
                  className={`flex items-center space-x-2 w-full px-3 py-2 text-sm rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors ${apiMode === 'gemini' ? 'bg-blue-100 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800' : ''}`}
                  title={`Switch to ${apiMode === 'lmstudio' ? 'Gemini' : 'LMStudio'} API`}
                >
                  <Zap className={`h-4 w-4 ${apiMode === 'gemini' ? 'text-blue-500' : 'text-gray-500'}`} />
                  <div className="flex flex-col">
                    <span className="font-medium flex items-center">
                      {apiMode === 'lmstudio' ? 'Local LM Studio' : 'Google Gemini'}
                      {apiMode === 'gemini' && <span className="ml-1 text-xs text-blue-500 font-normal">(Default)</span>}
                    </span>
                    {apiMode === 'gemini' && (
                      <span className="text-xs text-blue-400">Gemini 2.5 Pro Experimental</span>
                    )}
                  </div>
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Header */}
        <header className="border-b bg-card/70 backdrop-blur-sm z-10">
          <div className="container py-3 px-4 mx-auto">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                  className="h-8 w-8 p-0 flex-shrink-0"
                  title="Toggle Sidebar"
                >
                  {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                </Button>
                <h1 className="text-xl font-bold flex items-center gap-2">
                  <motion.div
                    animate={{ 
                      scale: [1, 1.1, 1], 
                    }}
                    transition={{ 
                      duration: 1.5, 
                      ease: "easeInOut", 
                      repeat: Infinity,
                      repeatType: "reverse"
                    }}
                  >
                    <HeartPulse className="h-5 w-5 text-rose-500" />
                  </motion.div>
                  <Link to="/" className="gradient-text">MindfulAI Chat</Link>
                </h1>
              </div>
              <div className="flex items-center space-x-2">
                {currentConversationId && messages.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleShareConversation}
                    className="h-8 w-8 p-0 rounded-full relative"
                    title="Share Conversation"
                  >
                    <Share2 className="h-4 w-4" />
                    {shareToastVisible && (
                      <motion.span
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="absolute -bottom-8 -left-6 text-xs bg-green-500 text-white px-2 py-1 rounded whitespace-nowrap"
                      >
                        Link copied!
                      </motion.span>
                    )}
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowKeyboardShortcuts(true)}
                  className="h-8 w-8 p-0 rounded-full"
                  title="Keyboard Shortcuts (Alt+/)"
                >
                  <Keyboard className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleNewChat}
                  className="h-8 px-3 text-xs"
                  title="New Chat (Alt+N)"
                >
                  <Plus className="h-3.5 w-3.5 mr-1" />
                  New Chat
                </Button>
              </div>
            </div>
          </div>
        </header>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col overflow-hidden relative">
          {/* Error Message */}
          <AnimatePresence>
            {error && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="bg-destructive/10 border-b border-destructive/20 text-destructive p-2 flex items-center justify-between text-sm"
              >
                <div className="flex items-center px-3">
                  <AlertCircle className="h-4 w-4 mr-2 flex-shrink-0" />
                  <span>{error}</span>
                </div>
                <Button 
                  size="sm" 
                  variant="ghost" 
                  onClick={clearError}
                  className="h-6 w-6 p-0 mr-2"
                >
                  <X className="h-4 w-4" />
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
          
          {/* Chat Messages */}
          <div 
            ref={chatContainerRef}
            className="flex-1 overflow-y-auto p-4 md:p-6 pt-16 scroll-smooth"
          >
            <div className="max-w-3xl mx-auto space-y-4">
              <AnimatePresence initial={false}>
                {showWelcomeMessage && messages.length === 0 ? (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="flex flex-col items-center justify-center min-h-[50vh] text-center p-6 relative"
                  >
                    {/* Animated background dots */}
                    <div className="absolute inset-0 overflow-hidden opacity-10 pointer-events-none">
                      {Array.from({ length: 50 }).map((_, i) => (
                        <motion.div
                          key={i}
                          className="absolute rounded-full bg-primary"
                          style={{
                            width: Math.random() * 6 + 2 + 'px',
                            height: Math.random() * 6 + 2 + 'px',
                            top: Math.random() * 100 + '%',
                            left: Math.random() * 100 + '%',
                          }}
                          animate={{
                            y: [0, Math.random() * -20 - 10],
                            opacity: [0.3, 0.8, 0.3],
                          }}
                          transition={{
                            duration: Math.random() * 2 + 2,
                            repeat: Infinity,
                            repeatType: "reverse",
                            ease: "easeInOut",
                            delay: Math.random() * 2,
                          }}
                        />
                      ))}
                    </div>
                    
                    {/* Floating Heart Icon */}
                    <motion.div
                      animate={{ y: [0, -10, 0] }}
                      transition={{ 
                        duration: 4, 
                        ease: "easeInOut", 
                        repeat: Infinity,
                      }}
                      className="mb-6"
                    >
                      <div className="w-20 h-20 bg-gradient-to-br from-rose-500/20 to-indigo-500/20 rounded-full flex items-center justify-center shadow-lg">
                        <motion.div
                          animate={{ 
                            scale: [1, 1.15, 1], 
                          }}
                          transition={{ 
                            duration: 2, 
                            ease: "easeInOut", 
                            repeat: Infinity,
                            repeatType: "reverse"
                          }}
                        >
                          <HeartPulse className="h-10 w-10 text-rose-500" />
                        </motion.div>
                      </div>
                    </motion.div>
                    
                    <h2 className="text-2xl font-bold mb-2 gradient-text">{getGreeting()}, {profile?.first_name || userEmail || 'Friend'}</h2>
                    <p className="text-muted-foreground max-w-md mb-8">
                      I'm here to listen and support you. Share your thoughts, feelings, or concerns, 
                      and we can work through them together.
                    </p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full max-w-lg">
                      <motion.div 
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        transition={{ type: "spring", stiffness: 400, damping: 17 }}
                      >
                        <Button
                          variant="outline"
                          className="justify-start text-left h-auto py-3 px-4 w-full overflow-hidden group border-primary/20 hover:border-primary/50 transition-all duration-300 hover:shadow-md"
                          onClick={() => handleSend("I've been feeling anxious lately. Can you help?")}
                        >
                          <div className="flex gap-3 items-start w-full">
                            <span className="bg-primary/10 rounded-full p-2 group-hover:bg-primary/20 transition-colors">
                              <AlertCircle className="h-4 w-4 text-primary" />
                            </span>
                            <div>
                              <span className="block font-medium mb-1">Feeling anxious</span>
                              <span className="text-xs text-muted-foreground">I've been feeling anxious lately. Can you help?</span>
                            </div>
                          </div>
                        </Button>
                      </motion.div>
                      
                      <motion.div 
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        transition={{ type: "spring", stiffness: 400, damping: 17 }}
                      >
                        <Button
                          variant="outline"
                          className="justify-start text-left h-auto py-3 px-4 w-full overflow-hidden group border-blue-500/20 hover:border-blue-500/50 transition-all duration-300 hover:shadow-md"
                          onClick={() => handleSend("I'm having trouble sleeping. Any suggestions?")}
                        >
                          <div className="flex gap-3 items-start w-full">
                            <span className="bg-blue-500/10 rounded-full p-2 group-hover:bg-blue-500/20 transition-colors">
                              <Moon className="h-4 w-4 text-blue-500" />
                            </span>
                            <div>
                              <span className="block font-medium mb-1">Sleep issues</span>
                              <span className="text-xs text-muted-foreground">I'm having trouble sleeping. Any suggestions?</span>
                            </div>
                          </div>
                        </Button>
                      </motion.div>
                      
                      <motion.div 
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        transition={{ type: "spring", stiffness: 400, damping: 17 }}
                      >
                        <Button
                          variant="outline"
                          className="justify-start text-left h-auto py-3 px-4 w-full overflow-hidden group border-amber-500/20 hover:border-amber-500/50 transition-all duration-300 hover:shadow-md"
                          onClick={() => handleSend("How can I manage stress better?")}
                        >
                          <div className="flex gap-3 items-start w-full">
                            <span className="bg-amber-500/10 rounded-full p-2 group-hover:bg-amber-500/20 transition-colors">
                              <Settings className="h-4 w-4 text-amber-500" />
                            </span>
                            <div>
                              <span className="block font-medium mb-1">Stress management</span>
                              <span className="text-xs text-muted-foreground">How can I manage stress better?</span>
                            </div>
                          </div>
                        </Button>
                      </motion.div>
                      
                      <motion.div 
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        transition={{ type: "spring", stiffness: 400, damping: 17 }}
                      >
                        <Button
                          variant="outline"
                          className="justify-start text-left h-auto py-3 px-4 w-full overflow-hidden group border-green-500/20 hover:border-green-500/50 transition-all duration-300 hover:shadow-md"
                          onClick={() => handleSend("I'd like to improve my mood. What can I do?")}
                        >
                          <div className="flex gap-3 items-start w-full">
                            <span className="bg-green-500/10 rounded-full p-2 group-hover:bg-green-500/20 transition-colors">
                              <Heart className="h-4 w-4 text-green-500" />
                            </span>
                            <div>
                              <span className="block font-medium mb-1">Mood improvement</span>
                              <span className="text-xs text-muted-foreground">I'd like to improve my mood. What can I do?</span>
                            </div>
                          </div>
                        </Button>
                      </motion.div>
                    </div>
                  </motion.div>
                ) : (
                  messages.map((message, index) => {
                    // Find the last assistant message
                    const assistantMessages = messages.filter(m => m.role === 'assistant');
                    const isLastAssistantMessage = message.role === 'assistant' && 
                      assistantMessages.length > 0 && 
                      message.id === assistantMessages[assistantMessages.length - 1].id;
                    
                    return (
                      <ChatMessage
                        key={message.id}
                        {...message}
                        onDelete={
                          message.role === 'user'
                            ? () => deleteMessage(message.id)
                            : undefined
                        }
                        onEdit={
                          message.role === 'user' && !message.id.startsWith('temp-')
                            ? handleEditMessage
                            : undefined
                        }
                        isLastAssistantMessage={isLastAssistantMessage}
                        onRegenerate={isLastAssistantMessage ? handleRegenerateResponse : undefined}
                      />
                    );
                  })
                )}
              </AnimatePresence>
            </div>
          </div>
          
          {/* Floating Action Buttons */}
          <AnimatePresence>
            {!scrolledToBottom && messages.length > 0 && (
              <motion.button
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={scrollToBottom}
                className="absolute bottom-24 right-6 bg-primary text-white p-2 rounded-full shadow-lg"
              >
                <ChevronDown className="h-5 w-5" />
              </motion.button>
            )}
          </AnimatePresence>
          
          {messages.length > 0 && (
            <div className="absolute top-4 right-4 flex gap-2 z-20">
              {currentConversationId && messages.length > 0 && (
                <>
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleClearHistory}
                      className="text-xs bg-card/80 backdrop-blur-sm shadow-md"
                      title="Clear Chat (Alt+C)"
                    >
                      <Trash2 className="h-3.5 w-3.5 mr-1" />
                      Clear
                    </Button>
                  </motion.div>
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={prepareReport}
                      className="text-xs bg-card/80 backdrop-blur-sm shadow-md"
                      title="Export Report (Alt+E)"
                    >
                      <Download className="h-3.5 w-3.5 mr-1" />
                      Export
                    </Button>
                  </motion.div>
                </>
              )}
            </div>
          )}
          
          {/* Suggested Prompts Row above the input */}
          {messages.length > 1 && (
            <div className="mx-auto max-w-3xl px-4 mb-2">
              <div className="flex gap-2 overflow-x-auto py-2 px-1 hide-scrollbar">
                {[
                  { text: "Suggest related resources", icon: <BookOpen className="h-3 w-3" /> },
                  { text: "Improve mood techniques", icon: <Heart className="h-3 w-3" /> },
                  { text: "Generate practical action steps", icon: <Wand2 className="h-3 w-3" /> }
                ].map((suggestion, i) => (
                  <Button
                    key={i}
                    variant="ghost"
                    size="sm"
                    onClick={() => handleSend(suggestion.text)}
                    className="text-xs bg-card/50 border border-border/50 hover:bg-card/80 shadow-sm whitespace-nowrap flex-shrink-0"
                  >
                    {suggestion.icon}
                    <span className="ml-1">{suggestion.text}</span>
                  </Button>
                ))}
              </div>
            </div>
          )}
          
          {/* Input Area */}
          <div className="p-4 border-t bg-card/70 backdrop-blur-sm">
            <div className="max-w-3xl mx-auto">
              <ChatInput 
                onSend={handleSendWrapper}
                onStopGeneration={handleStopGeneration}
                onAnalyzeWithVision={handleAnalyzeWithVision}
                disabled={loading || !currentConversationId}
                isGenerating={isGenerating}
                apiMode={apiMode}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Report Preview Modal */}
      {reportModalOpen && reportData && (
        <ReportPreviewModal
          title={reportData.title}
          timestamp={reportData.timestamp}
          stats={reportData.stats}
          isOpen={reportModalOpen}
          onClose={() => setReportModalOpen(false)}
          onDownload={downloadReportFile}
          userPhoneNumber={profile?.phone_number}
        />
      )}

      {/* Keyboard Shortcuts Modal */}
      <AnimatePresence>
        {showKeyboardShortcuts && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black z-40"
              onClick={() => setShowKeyboardShortcuts(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="w-full max-w-md bg-card rounded-xl shadow-2xl overflow-hidden border">
                <div className="p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold">Keyboard Shortcuts</h2>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowKeyboardShortcuts(false)}
                      className="rounded-full h-8 w-8 p-0"
                    >
                      <X className="h-5 w-5" />
                    </Button>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center py-2 border-b border-border/30">
                      <span className="text-sm">New Chat</span>
                      <kbd className="px-2 py-1 text-xs font-semibold bg-muted rounded">Alt+N</kbd>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-border/30">
                      <span className="text-sm">Export Report</span>
                      <kbd className="px-2 py-1 text-xs font-semibold bg-muted rounded">Alt+E</kbd>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-border/30">
                      <span className="text-sm">Toggle Dark/Light Mode</span>
                      <kbd className="px-2 py-1 text-xs font-semibold bg-muted rounded">Alt+T</kbd>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-border/30">
                      <span className="text-sm">Toggle Sidebar</span>
                      <kbd className="px-2 py-1 text-xs font-semibold bg-muted rounded">Alt+S</kbd>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-border/30">
                      <span className="text-sm">Clear Chat</span>
                      <kbd className="px-2 py-1 text-xs font-semibold bg-muted rounded">Alt+C</kbd>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-border/30">
                      <span className="text-sm">Send Message</span>
                      <kbd className="px-2 py-1 text-xs font-semibold bg-muted rounded">Ctrl+Enter</kbd>
                    </div>
                    <div className="flex justify-between items-center py-2">
                      <span className="text-sm">Show Keyboard Shortcuts</span>
                      <kbd className="px-2 py-1 text-xs font-semibold bg-muted rounded">Alt+/</kbd>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Language Selection Modal */}
      <AnimatePresence>
        {reportLanguageModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={() => setReportLanguageModalOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-card p-6 rounded-lg shadow-lg max-w-md w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold flex items-center gap-2">
                  <Languages className="h-5 w-5" />
                  Select Report Language
                </h2>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={() => setReportLanguageModalOpen(false)}
                >
                  <span className="sr-only">Close</span>
                  <X className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="grid grid-cols-1 gap-2 mb-4">
                <Button
                  variant="outline"
                  className="justify-start h-12 px-4"
                  onClick={() => generateReport('en')}
                >
                  <span className="mr-2 text-lg">🇺🇸</span>
                  <span>English</span>
                </Button>
                
                <Button
                  variant="outline"
                  className="justify-start h-12 px-4"
                  onClick={() => generateReport('hi')}
                >
                  <span className="mr-2 text-lg">🇮🇳</span>
                  <span>Hindi (हिन्दी)</span>
                </Button>
              </div>
              
              <div className="text-sm text-muted-foreground">
                Choose the language for your report. Report content will remain in the original language of your conversation.
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};