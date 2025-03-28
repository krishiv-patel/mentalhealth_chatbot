import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { getChatCompletionStream, LLMMessage, CompletionOptions } from '../lib/lmstudio';
import type { Message, EncryptedData } from '../types';
import { v4 as uuidv4 } from 'uuid';
import { 
  encryptForStorage, 
  decryptFromStorage,
  hasEncryptionKeys,
  initializeEncryption
} from '../lib/encryption';
import { 
  setupUserEncryption, 
  getUserPublicKey, 
  getServerPublicKey
} from '../lib/encryptionManager';
import {
  logInfo,
  logError,
  logWarning,
  LogCategory
} from '../lib/logging';

// Utility function to ensure message has proper types
function createMessage(msg: any): Message {
  return {
    id: msg.id || uuidv4(),
    role: msg.role as 'user' | 'assistant' | 'system',
    content: msg.content || '',
    timestamp: msg.timestamp || new Date().toISOString(),
    conversation_id: msg.conversation_id,
    attachment: msg.attachment,
    isEncrypted: msg.isEncrypted === true || msg.is_encrypted === true ? true : false
  };
}

interface ChatState {
  messages: Message[];
  loading: boolean;
  currentConversationId: string | null;
  conversations: { id: string; title: string; updatedAt: string; publicKey?: string }[];
  error: string | null;
  isEncryptionEnabled: boolean;
  isEncryptionInitialized: boolean;
  addMessage: (message: Omit<Message, 'id' | 'timestamp' | 'conversation_id'>, files?: File | File[]) => Promise<void>;
  fetchMessages: () => Promise<void>;
  deleteMessage: (id: string) => Promise<void>;
  editMessage: (id: string, newContent: string) => Promise<void>;
  clearHistory: () => Promise<void>;
  startNewConversation: () => void;
  fetchConversations: () => Promise<void>;
  setCurrentConversation: (conversationId: string) => Promise<void>;
  deleteConversation: (conversationId: string) => Promise<void>;
  updateConversationTitle: (conversationId: string, title: string) => Promise<void>;
  clearError: () => void;
  stopGeneration: () => void;
  isGenerating: boolean;
  initializeEncryption: () => Promise<void>;
  toggleEncryption: (enabled: boolean) => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
  messages: [],
  loading: false,
  currentConversationId: null,
  conversations: [],
  error: null,
  isGenerating: false,
  isEncryptionEnabled: false,
  isEncryptionInitialized: false,
  
  // Initialize encryption for the current user
  initializeEncryption: async () => {
    try {
      // Check if encryption is already initialized in local storage
      if (hasEncryptionKeys()) {
        // Keys already exist locally
        set({ 
          isEncryptionInitialized: true,
          isEncryptionEnabled: true,
          error: null
        });
        logInfo(LogCategory.ENCRYPTION, "Encryption initialized from local keys", null);
        return;
      }
      
      // Check if user is authenticated
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError) {
        console.error('Auth error during encryption initialization:', userError);
        logError(LogCategory.ENCRYPTION, "Auth error during encryption initialization", null, null, { error: userError.message });
        
        // Generate keys anyway for local use
        initializeEncryption();
        set({ 
          isEncryptionInitialized: true,
          isEncryptionEnabled: true,
          error: null
        });
        logInfo(LogCategory.ENCRYPTION, "Fallback to local encryption due to auth error", null);
        return;
      }
      
      if (!userData.user) {
        console.warn('User not authenticated, using local encryption only');
        logWarning(LogCategory.ENCRYPTION, "User not authenticated, using local encryption only", null);
        
        // Generate keys anyway for local use
        initializeEncryption();
        set({ 
          isEncryptionInitialized: true,
          isEncryptionEnabled: true,
          error: null
        });
        return;
      }
      
      // Setup encryption for the user - this now returns keys even if DB operations fail
      const keys = await setupUserEncryption(userData.user.id);
      
      if (keys && keys.publicKey && keys.privateKey) {
        set({ 
          isEncryptionInitialized: true,
          isEncryptionEnabled: true,
          error: null
        });
        logInfo(LogCategory.ENCRYPTION, "User encryption successfully initialized", userData.user.id);
      } else {
        // If setupUserEncryption failed to return valid keys, fallback to local only
        const localKeys = initializeEncryption();
        set({ 
          isEncryptionInitialized: true,
          isEncryptionEnabled: true,
          error: null
        });
        logWarning(LogCategory.ENCRYPTION, "Fallback to local encryption due to key setup failure", userData.user.id);
      }
    } catch (error: any) {
      console.error('Error initializing encryption:', error);
      logError(LogCategory.ENCRYPTION, "Failed to initialize encryption", null, null, { error: error.message });
      
      // On error, still try to initialize local encryption
      try {
        initializeEncryption();
        set({ 
          isEncryptionInitialized: true,
          isEncryptionEnabled: true,
          error: null
        });
        logInfo(LogCategory.ENCRYPTION, "Fallback to local encryption after error", null);
      } catch (localError: any) {
        set({ 
          error: `Failed to initialize encryption: ${error.message}`,
          isEncryptionInitialized: false,
          isEncryptionEnabled: false
        });
        logError(LogCategory.ENCRYPTION, "Failed even local encryption initialization", null, null, { error: localError.message });
      }
    }
  },
  
  // Toggle encryption on/off
  toggleEncryption: (enabled: boolean) => {
    set({ isEncryptionEnabled: enabled });
    logInfo(LogCategory.ENCRYPTION, `Encryption ${enabled ? 'enabled' : 'disabled'}`, null);
  },
  
  clearError: () => set({ error: null }),
  
  stopGeneration: () => {
    // Implement stop signal for streaming
    window.stopGenerationSignal = true;
    set({ isGenerating: false });
    logInfo(LogCategory.CHAT, "User stopped message generation", null, get().currentConversationId);
  },
  
  startNewConversation: () => {
    const newConversationId = uuidv4();
    set({ 
      currentConversationId: newConversationId,
      messages: [],
      error: null
    });
    logInfo(LogCategory.CHAT, "Started new conversation", null, newConversationId);
    return newConversationId;
  },
  
  addMessage: async (message, files) => {
    const tempId = 'temp-' + uuidv4();
    const tempMessage = createMessage({
      id: tempId,
      role: message.role,
      content: message.content,
      timestamp: new Date().toISOString(),
      conversation_id: get().currentConversationId || 'new',
      isEncrypted: false
    });

    // Normalize files to array
    const filesArray = files ? (Array.isArray(files) ? files : [files]) : [];

    // Handle the first file for compatibility with existing code
    const file = filesArray.length > 0 ? filesArray[0] : undefined;

    // Validate file before processing
    if (file && file instanceof Blob) {
      const fileName = file.name;
      const filePath = `${get().currentConversationId || 'new'}/${uuidv4()}-${fileName}`;
      
      try {
        // Ensure the file type is supported before uploading
        const isImage = file.type.startsWith('image/');
        const isDocument = file.type === 'application/pdf' || 
                          file.type === 'text/plain' ||
                          file.type === 'text/csv' ||
                          file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
                          file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
        
        // If file has no type, try to infer from extension
        const extension = fileName.split('.').pop()?.toLowerCase();
        const hasValidExtension = extension && ['txt', 'pdf', 'doc', 'docx', 'csv', 'jpg', 'jpeg', 'png', 'gif'].includes(extension);
        
        if (!isImage && !isDocument && !hasValidExtension) {
          set({ error: 'Unsupported file type. Please upload text documents, PDFs, or images.' });
          logError(LogCategory.FILE, "Unsupported file type", null, get().currentConversationId, { fileType: file.type, fileName });
          return;
        }
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('attachments')
          .upload(filePath, file);

        if (uploadError) {
          console.error('File upload error:', uploadError);
          logError(LogCategory.FILE, "File upload error", null, get().currentConversationId, { error: uploadError.message, fileName });
          throw uploadError;
        }

        const { data: urlData } = await supabase.storage
          .from('attachments')
          .getPublicUrl(filePath);

        tempMessage.attachment = {
          type: file.type.startsWith('image/') ? 'image' : 'document',
          name: fileName,
          url: urlData.publicUrl,
          size: file.size
        };
        
        logInfo(LogCategory.FILE, "File uploaded successfully", null, get().currentConversationId, { 
          fileName, 
          fileType: file.type, 
          fileSize: file.size 
        });
      } catch (error: any) {
        console.error('Error uploading file:', error);
        set({ error: `Failed to upload file: ${error.message}. Please try again.` });
        logError(LogCategory.FILE, "Failed to upload file", null, get().currentConversationId, { error: error.message });
        return;
      }
    } else if (file) {
      console.error('Invalid file object:', file);
      set({ error: 'Invalid file format. Please try again with a different file.' });
      logError(LogCategory.FILE, "Invalid file format", null, get().currentConversationId);
      return;
    }
    
    set(state => ({ 
      messages: [...state.messages, tempMessage],
      loading: true,
      error: null
    }));
    
    try {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError) {
        console.error('Auth error:', userError);
        logError(LogCategory.AUTH, "Auth error when adding message", null, get().currentConversationId, { error: userError.message });
        throw userError;
      }
      
      const userId = userData.user?.id;
      if (!userId) {
        logError(LogCategory.AUTH, "User is not authenticated", null, get().currentConversationId);
        throw new Error('User is not authenticated');
      }
      
      let conversationId = get().currentConversationId;
      let conversationExists = false;
      
      // Check if the conversation exists
      if (conversationId) {
        try {
          const { data: convData, error: convCheckError } = await supabase
            .from('conversations')
            .select('id')
            .eq('id', conversationId);
          
          conversationExists = convData ? convData.length > 0 : false;
        } catch (error) {
          console.error('Error checking conversation:', error);
        }
      }
      
      // If this is a new conversation, create it
      if (!conversationExists || !conversationId) {
        if (!conversationId) {
          conversationId = uuidv4();
        }

        // Check if encryption is enabled and initialized
        const isEncryptionEnabled = get().isEncryptionEnabled && get().isEncryptionInitialized;
        let publicKey = null;

        if (isEncryptionEnabled) {
          // Get user's public key for the conversation
          publicKey = await getUserPublicKey(userId);
        }
        
        // Create conversation with only required fields
        const basicConversation = {
          id: conversationId,
          user_id: userId,
          title: message.content.substring(0, 30) + (message.content.length > 30 ? '...' : '')
        };
        
        try {
          // Insert without timestamp columns to avoid schema issues
          const { error: createConvError } = await supabase
            .from('conversations')
            .insert(basicConversation);
            
          if (createConvError) {
            console.error('Error creating conversation:', createConvError);
            throw createConvError;
          }
        } catch (error) {
          console.error('Failed to create conversation:', error);
          throw error;
        }
        
        set({ currentConversationId: conversationId });
      }
      
      // Handle message encryption if enabled
      let dbMessage: any = {
        id: uuidv4(),
        user_id: userId,
        role: message.role,
        content: message.content,
        conversation_id: conversationId,
      };
      
      // Add timestamp using the 'timestamp' field (from our migration) instead of created_at
      dbMessage.timestamp = new Date().toISOString();
      
      // If there's an attachment, add it
      if (tempMessage.attachment) {
        dbMessage.attachment = tempMessage.attachment;
      }
      
      // Encrypt the message if encryption is enabled
      const isEncryptionEnabled = get().isEncryptionEnabled && get().isEncryptionInitialized;
      if (isEncryptionEnabled && hasEncryptionKeys()) {
        try {
          // Encrypt the content
          const { encryptedData, nonce } = encryptForStorage(message.content);
          
          // Update the message with encrypted data
          dbMessage = {
            ...dbMessage,
            is_encrypted: true,
            encrypted_content: encryptedData,
            nonce: nonce,
            // Keep the original content for now, we'll remove it when we get response
            content: '[Encrypted Message]'
          };
        } catch (encryptError: any) {
          console.error('Error encrypting message:', encryptError);
          set({ error: `Failed to encrypt message: ${encryptError.message}` });
          // Continue with unencrypted message if encryption fails
        }
      }
      
      // Insert the user message
      const { error: insertError } = await supabase
        .from('messages')
        .insert(dbMessage);
      
      if (insertError) {
        console.error('Error inserting message:', insertError);
        throw insertError;
      }
      
      // Update conversations list
      get().fetchConversations();
      
      // Only call the AI if this is a user message
      if (message.role === 'user') {
        set({ isGenerating: true });
        
        // Safety timeout to ensure isGenerating is reset after 2 minutes
        // even if something goes wrong with the normal completion process
        const safetyTimeout = setTimeout(() => {
          set({ isGenerating: false });
          console.warn('Safety timeout triggered to reset isGenerating state');
        }, 120000); // 2 minutes
        
        // Call the LMStudio API or your AI service
        try {
          // Send all previous messages in the conversation for context
          // but remove temporary messages first
          const convoMessages: LLMMessage[] = get().messages
            .filter(m => !m.id.startsWith('temp-'))
            .map(m => ({
              role: m.role,
              content: m.content,
              attachment: m.attachment
            }));
            
          // Add the new user message
          convoMessages.push({
            role: message.role,
            content: message.content,
            attachment: tempMessage.attachment
          });
          
          // Generate AI response
          const assistantMessageId = uuidv4();
          
          // Add a temporary assistant message
          const assistantMessage = createMessage({
            id: assistantMessageId,
            role: 'assistant',
            content: '',
            timestamp: new Date().toISOString(),
            conversation_id: conversationId || 'new',
            isEncrypted: false
          });
          
          set(state => ({
            messages: [
              ...state.messages.filter(m => m.id !== tempId),
              {
                ...tempMessage,
                id: dbMessage.id, // Replace the temp id with the real one
              },
              assistantMessage
            ],
          }));
          
          // Start streaming response
          let fullAssistantResponse = '';
          
          try {
            const completionStream = getChatCompletionStream(convoMessages, {
              onResponse: (chunk: string) => {
                fullAssistantResponse += chunk;
                
                set(state => ({
                  messages: state.messages.map(msg => 
                    msg.id === assistantMessageId 
                      ? { ...msg, content: fullAssistantResponse }
                      : msg
                  )
                }));
              },
              onFinish: async () => {
                // Prepare the assistant message for database
                let finalAssistantMessage: any = {
                  id: assistantMessageId,
                  user_id: userId,
                  role: 'assistant',
                  content: fullAssistantResponse,
                  conversation_id: conversationId,
                  timestamp: new Date().toISOString()
                };
                
                // Encrypt assistant message if encryption is enabled
                if (isEncryptionEnabled && hasEncryptionKeys()) {
                  try {
                    const { encryptedData, nonce } = encryptForStorage(fullAssistantResponse);
                    
                    finalAssistantMessage = {
                      ...finalAssistantMessage,
                      is_encrypted: true,
                      encrypted_content: encryptedData,
                      nonce: nonce,
                      // Store both for compatibility
                      content: '[Encrypted Message]'
                    };
                  } catch (encryptError: any) {
                    console.error('Error encrypting assistant message:', encryptError);
                    // Continue with unencrypted message
                  }
                }
                
                // Insert the assistant message into the database
                const { error: assistantInsertError } = await supabase
                  .from('messages')
                  .insert(finalAssistantMessage);
                
                if (assistantInsertError) {
                  console.error('Error inserting assistant message:', assistantInsertError);
                  throw assistantInsertError;
                }

                // Set isGenerating to false after completion
                set({ isGenerating: false });
                clearTimeout(safetyTimeout);
              }
            });
            
            // Consume the generator to make it run
            for await (const chunk of completionStream) {
              // The onResponse callback will handle the update
            }
          } catch (aiError: any) {
            console.error('AI error:', aiError);
            set({ 
              error: `Error generating response: ${aiError.message}`,
              isGenerating: false
            });
            clearTimeout(safetyTimeout);
          }
        } catch (aiError: any) {
          console.error('AI error:', aiError);
          set({ 
            error: `Error generating response: ${aiError.message}`,
            isGenerating: false
          });
          clearTimeout(safetyTimeout);
        }
      }
      
      // Update messages list with real IDs
      await get().fetchMessages();
      
      // After successful message processing
      logInfo(
        LogCategory.CHAT,
        `Added ${message.role} message`,
        userId,
        conversationId,
        {
          messageId: dbMessage.id,
          isEncrypted: isEncryptionEnabled && hasEncryptionKeys(),
          hasAttachment: !!tempMessage.attachment
        }
      );
      
    } catch (error: any) {
      console.error('Error in addMessage:', error);
      set({ 
        loading: false,
        error: `Failed to add message: ${error.message}`
      });
      
      // Log the error
      logError(
        LogCategory.CHAT,
        "Failed to add message",
        null,
        get().currentConversationId,
        { error: error.message }
      );
      
      // Remove the temporary message
      set(state => ({
        messages: state.messages.filter(m => m.id !== tempId)
      }));
    }
  },
  
  // Fetch messages with decryption support
  fetchMessages: async () => {
    const conversationId = get().currentConversationId;
    if (!conversationId) {
      set({ messages: [] });
      return;
    }
    
    set({ loading: true, error: null });
    
    try {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError) {
        console.error('Auth error:', userError);
        logError(LogCategory.AUTH, "Auth error when fetching messages", null, conversationId, { error: userError.message });
        throw userError;
      }
      
      const userId = userData.user?.id;
      if (!userId) {
        logError(LogCategory.AUTH, "User not authenticated when fetching messages", null, conversationId);
        throw new Error('User is not authenticated');
      }
      
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('timestamp', { ascending: true });
      
      if (error) {
        console.error('Error fetching messages:', error);
        logError(LogCategory.CHAT, "Error fetching messages", userId, conversationId, { error: error.message });
        throw error;
      }
      
      const isEncryptionEnabled = get().isEncryptionEnabled && get().isEncryptionInitialized;
      
      if (data && data.length > 0) {
        const processedMessages = data.map(msg => {
          // Handle encrypted messages
          if (msg.is_encrypted && isEncryptionEnabled && hasEncryptionKeys()) {
            try {
              // Attempt to decrypt if we have the keys
              if (msg.encrypted_content && msg.nonce) {
                const decryptedContent = decryptFromStorage(msg.encrypted_content, msg.nonce);
                msg.content = decryptedContent;
              }
            } catch (decryptError) {
              console.error('Failed to decrypt message:', decryptError);
              logError(
                LogCategory.ENCRYPTION, 
                "Failed to decrypt message", 
                userId, 
                conversationId, 
                { messageId: msg.id, error: (decryptError as Error).message }
              );
              // Keep the placeholder if decryption fails
              msg.content = '[Encrypted Message - Unable to Decrypt]';
            }
          }
          
          return createMessage(msg);
        });
        
        set({ messages: processedMessages, loading: false });
        logInfo(LogCategory.CHAT, "Successfully fetched messages", userId, conversationId, { messageCount: data.length });
      } else {
        set({ messages: [], loading: false });
        logInfo(LogCategory.CHAT, "No messages found for conversation", userId, conversationId);
      }
    } catch (error: any) {
      console.error('Error in fetchMessages:', error);
      set({ 
        loading: false, 
        error: `Failed to fetch messages: ${error.message}`,
        messages: []
      });
      logError(LogCategory.CHAT, "Failed to fetch messages", null, conversationId, { error: error.message });
    }
  },
  
  fetchConversations: async () => {
    try {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError) {
        console.error('Auth error:', userError);
        logError(LogCategory.AUTH, "Auth error when fetching conversations", null, null, { error: userError.message });
        throw userError;
      }
      
      const userId = userData.user?.id;
      if (!userId) {
        logError(LogCategory.AUTH, "User not authenticated when fetching conversations", null);
        throw new Error('User is not authenticated');
      }
      
      const { data, error } = await supabase
        .from('conversations')
        .select('*')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching conversations:', error);
        logError(LogCategory.CHAT, "Failed to fetch conversations", userId, null, { error: error.message });
        throw error;
      }
      
      if (data) {
        // Format the conversations for the UI
        const formattedConversations = data.map(conv => ({
          id: conv.id,
          title: conv.title || 'Untitled Conversation',
          updatedAt: conv.updated_at || conv.created_at || new Date().toISOString(),
          publicKey: conv.public_key
        }));
        
        set({ conversations: formattedConversations });
        logInfo(LogCategory.CHAT, "Successfully fetched conversations", userId, null, { conversationCount: data.length });
      }
    } catch (error: any) {
      console.error('Error in fetchConversations:', error);
      set({ error: `Failed to load conversations: ${error.message}` });
      logError(LogCategory.CHAT, "Failed to fetch conversations", null, null, { error: error.message });
    }
  },
  
  setCurrentConversation: async (conversationId: string) => {
    set({ 
      currentConversationId: conversationId,
      messages: [],
      loading: true,
      error: null
    });
    
    try {
      // Get user information for logging
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData?.user?.id;
      
      // Fetch messages for the conversation
      await get().fetchMessages();
      
      logInfo(LogCategory.CHAT, "Set current conversation", userId, conversationId);
    } catch (error: any) {
      console.error('Error in setCurrentConversation:', error);
      set({
        loading: false,
        error: `Failed to load conversation: ${error.message}`
      });
      logError(LogCategory.CHAT, "Failed to set current conversation", null, conversationId, { error: error.message });
    }
  },
  
  deleteConversation: async (conversationId: string) => {
    set({ loading: true, error: null });
    
    try {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError) {
        console.error('Auth error:', userError);
        logError(LogCategory.AUTH, "Auth error when deleting conversation", null, conversationId, { error: userError.message });
        throw userError;
      }
      
      const userId = userData.user?.id;
      if (!userId) {
        logError(LogCategory.AUTH, "User not authenticated when deleting conversation", null, conversationId);
        throw new Error('User is not authenticated');
      }
      
      // Delete all messages in the conversation first
      const { error: messagesError } = await supabase
        .from('messages')
        .delete()
        .eq('conversation_id', conversationId);
      
      if (messagesError) {
        console.error('Error deleting conversation messages:', messagesError);
        logError(
          LogCategory.CHAT, 
          "Failed to delete conversation messages", 
          userId, 
          conversationId, 
          { error: messagesError.message }
        );
        throw messagesError;
      }
      
      // Then delete the conversation
      const { error: conversationError } = await supabase
        .from('conversations')
        .delete()
        .eq('id', conversationId);
      
      if (conversationError) {
        console.error('Error deleting conversation:', conversationError);
        logError(
          LogCategory.CHAT, 
          "Failed to delete conversation record", 
          userId, 
          conversationId, 
          { error: conversationError.message }
        );
        throw conversationError;
      }
      
      // Update local state
      set(state => ({
        conversations: state.conversations.filter(c => c.id !== conversationId),
        currentConversationId: state.currentConversationId === conversationId ? null : state.currentConversationId,
        messages: state.currentConversationId === conversationId ? [] : state.messages,
        loading: false
      }));
      
      logInfo(LogCategory.CHAT, "Conversation deleted successfully", userId, conversationId);
    } catch (error: any) {
      console.error('Error in deleteConversation:', error);
      set({
        loading: false,
        error: `Failed to delete conversation: ${error.message}`
      });
      logError(LogCategory.CHAT, "Failed to delete conversation", null, conversationId, { error: error.message });
    }
  },
  
  updateConversationTitle: async (conversationId: string, title: string) => {
    try {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError) {
        console.error('Auth error:', userError);
        logError(LogCategory.AUTH, "Auth error when updating conversation title", null, conversationId, { error: userError.message });
        throw userError;
      }
      
      const userId = userData.user?.id;
      if (!userId) {
        logError(LogCategory.AUTH, "User not authenticated when updating conversation title", null, conversationId);
        throw new Error('User is not authenticated');
      }
      
      // Validate title
      const trimmedTitle = title.trim();
      if (!trimmedTitle) {
        set({ error: 'Conversation title cannot be empty' });
        logWarning(LogCategory.CHAT, "Empty conversation title rejected", userId, conversationId);
        return;
      }
      
      const { error } = await supabase
        .from('conversations')
        .update({ title: trimmedTitle })
        .eq('id', conversationId);
      
      if (error) {
        console.error('Error updating conversation title:', error);
        set({ error: `Failed to update title: ${error.message}` });
        logError(LogCategory.CHAT, "Failed to update conversation title", userId, conversationId, { error: error.message });
        return;
      }
      
      // Update local state
      set(state => ({
        conversations: state.conversations.map(c => 
          c.id === conversationId ? { ...c, title: trimmedTitle } : c
        ),
        error: null
      }));
      
      logInfo(LogCategory.CHAT, "Updated conversation title", userId, conversationId, { newTitle: trimmedTitle });
    } catch (error: any) {
      console.error('Error in updateConversationTitle:', error);
      set({ error: `Failed to update title: ${error.message}` });
      logError(LogCategory.CHAT, "Failed to update conversation title", null, conversationId, { error: error.message });
    }
  },
  
  deleteMessage: async (id: string) => {
    set({ loading: true, error: null });
    
    try {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError) {
        console.error('Auth error:', userError);
        logError(LogCategory.AUTH, "Auth error when deleting message", null, get().currentConversationId, { error: userError.message });
        throw userError;
      }
      
      const userId = userData.user?.id;
      if (!userId) {
        logError(LogCategory.AUTH, "User not authenticated when deleting message", null, get().currentConversationId);
        throw new Error('User is not authenticated');
      }
      
      const { error } = await supabase
        .from('messages')
        .delete()
        .eq('id', id);
      
      if (error) {
        console.error('Error deleting message:', error);
        logError(LogCategory.CHAT, "Failed to delete message", userId, get().currentConversationId, { messageId: id, error: error.message });
        throw error;
      }
      
      // Update local state
      set(state => ({
        messages: state.messages.filter(m => m.id !== id),
        loading: false
      }));
      
      logInfo(LogCategory.CHAT, "Message deleted successfully", userId, get().currentConversationId, { messageId: id });
    } catch (error: any) {
      console.error('Error in deleteMessage:', error);
      set({
        loading: false,
        error: `Failed to delete message: ${error.message}`
      });
      logError(LogCategory.CHAT, "Failed to delete message", null, get().currentConversationId, { messageId: id, error: error.message });
    }
  },
  
  editMessage: async (id, newContent) => {
    set({ loading: true });
    
    try {
      // Get the current message
      const message = get().messages.find(m => m.id === id);
      if (!message) {
        throw new Error('Message not found');
      }
      
      let updateData: any = {
        content: newContent
      };
      
      // Check if encryption is enabled
      const isEncryptionEnabled = get().isEncryptionEnabled && get().isEncryptionInitialized;
      if (isEncryptionEnabled && hasEncryptionKeys()) {
        try {
          const { encryptedData, nonce } = encryptForStorage(newContent);
          
          updateData = {
            content: '[Encrypted Message]',
            is_encrypted: true,
            encrypted_content: encryptedData,
            nonce: nonce
          };
        } catch (encryptError: any) {
          console.error('Error encrypting edited message:', encryptError);
          set({ error: `Failed to encrypt message: ${encryptError.message}` });
          // Continue with unencrypted message
        }
      }
      
      const { error } = await supabase
        .from('messages')
        .update(updateData)
        .eq('id', id);
      
      if (error) {
        throw error;
      }
      
      // Update the message in the local state
      set(state => ({
        messages: state.messages.map(m => 
          m.id === id ? { ...m, content: newContent } : m
        ),
        loading: false
      }));
    } catch (error: any) {
      console.error('Error editing message:', error);
      set({ 
        error: `Failed to edit message: ${error.message}`,
        loading: false
      });
    }
  },
  
  clearHistory: async () => {
    set({ loading: true, error: null });
    
    try {
      const conversationId = get().currentConversationId;
      if (!conversationId) {
        set({ loading: false });
        logWarning(LogCategory.CHAT, "Attempted to clear history with no active conversation", null);
        return;
      }
      
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError) {
        console.error('Auth error:', userError);
        logError(LogCategory.AUTH, "Auth error when clearing history", null, conversationId, { error: userError.message });
        throw userError;
      }
      
      const userId = userData.user?.id;
      if (!userId) {
        logError(LogCategory.AUTH, "User not authenticated when clearing history", null, conversationId);
        throw new Error('User is not authenticated');
      }
      
      const { error } = await supabase
        .from('messages')
        .delete()
        .eq('conversation_id', conversationId);
      
      if (error) {
        console.error('Error clearing history:', error);
        logError(LogCategory.CHAT, "Failed to clear history", userId, conversationId, { error: error.message });
        throw error;
      }
      
      set({ messages: [], loading: false });
      logInfo(LogCategory.CHAT, "Conversation history cleared", userId, conversationId);
    } catch (error: any) {
      console.error('Error in clearHistory:', error);
      set({
        loading: false,
        error: `Failed to clear history: ${error.message}`
      });
      logError(LogCategory.CHAT, "Failed to clear history", null, get().currentConversationId, { error: error.message });
    }
  }
}));