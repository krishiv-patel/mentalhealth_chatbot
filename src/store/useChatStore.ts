import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { getChatCompletionStream } from '../lib/lmstudio';
import type { Message } from '../types';
import { v4 as uuidv4 } from 'uuid';

interface ChatState {
  messages: Message[];
  loading: boolean;
  currentConversationId: string | null;
  conversations: { id: string; title: string; updatedAt: string }[];
  error: string | null;
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
}

export const useChatStore = create<ChatState>((set, get) => ({
  messages: [],
  loading: false,
  currentConversationId: null,
  conversations: [],
  error: null,
  isGenerating: false,
  
  clearError: () => set({ error: null }),
  
  stopGeneration: () => {
    // Implement stop signal for streaming
    window.stopGenerationSignal = true;
    set({ isGenerating: false });
  },
  
  startNewConversation: () => {
    const newConversationId = uuidv4();
    set({ 
      currentConversationId: newConversationId,
      messages: [],
      error: null
    });
    return newConversationId;
  },
  
  addMessage: async (message, files) => {
    const tempId = 'temp-' + uuidv4();
    const tempMessage = {
      id: tempId,
      role: message.role,
      content: message.content,
      timestamp: new Date().toISOString(),
      conversation_id: get().currentConversationId || 'new',
    } as Message;

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
          return;
        }
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('attachments')
          .upload(filePath, file);

        if (uploadError) {
          console.error('File upload error:', uploadError);
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
      } catch (error: any) {
        console.error('Error uploading file:', error);
        set({ error: `Failed to upload file: ${error.message}. Please try again.` });
        return;
      }
    } else if (file) {
      console.error('Invalid file object:', file);
      set({ error: 'Invalid file format. Please try again with a different file.' });
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
        throw userError;
      }
      
      const userId = userData.user?.id;
      if (!userId) {
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
            .eq('id', conversationId)
            .single();
            
          if (convCheckError) {
            if (convCheckError.code !== 'PGRST116') {
              console.error('Conversation check error:', convCheckError);
            }
            // If the conversation doesn't exist, we'll create a new one below
            conversationExists = false;
          } else {
            conversationExists = !!convData;
          }
        } catch (error: any) {
          console.error('Error checking conversation:', error);
          // Continue with creating a new conversation
          conversationExists = false;
        }
      }
      
      if (!conversationId || !conversationExists) {
        conversationId = conversationId || uuidv4();
        
        try {
          const { data: newConvData, error: convError } = await supabase
            .from('conversations')
            .insert([
              {
                id: conversationId,
                user_id: userId,
                title: message.content.substring(0, 50) + (message.content.length > 50 ? '...' : '')
              }
            ])
            .select();
  
          if (convError) {
            console.error('Error creating conversation:', convError);
            throw convError;
          }
          
          set({ currentConversationId: conversationId });
          
          // Update conversations list with the new conversation
          const { data: createdConv } = await supabase
            .from('conversations')
            .select('id, title, updated_at')
            .eq('id', conversationId)
            .single();
            
          if (createdConv) {
            set(state => ({
              conversations: [
                {
                  id: createdConv.id,
                  title: createdConv.title,
                  updatedAt: createdConv.updated_at
                },
                ...state.conversations
              ]
            }));
          }
        } catch (error: any) {
          console.error('Error in conversation creation:', error);
          // Continue with message insertion anyway
        }
      }
      
      // Insert the user message
      try {
        const { data: messageData, error: messageError } = await supabase
          .from('messages')
          .insert([
            {
              role: message.role,
              content: message.content,
              user_id: userId,
              conversation_id: conversationId,
              ...(tempMessage.attachment ? { attachment: tempMessage.attachment } : {})
            }
          ])
          .select();
          
        if (messageError) {
          console.error('Error inserting message:', messageError);
          throw messageError;
        }

        if (!messageData || messageData.length === 0) {
          throw new Error('Failed to save message');
        }

        set((state) => ({
          messages: state.messages.map(msg => 
            msg.id === tempId ? messageData[0] as Message : msg
          ),
        }));

        // Declare tempAssistantId outside the try block to make it accessible in the catch block
        const tempAssistantId = 'temp-' + uuidv4();
        
        try {
          // Create a temporary assistant message that we'll update with the stream
          const tempAssistantMessage: Message = {
            id: tempAssistantId,
            role: 'assistant',
            content: '',
            timestamp: new Date().toISOString(),
            conversation_id: conversationId
          };

          set((state) => ({
            messages: [...state.messages, tempAssistantMessage],
            isGenerating: true,
          }));

          let fullResponse = '';
          
          // Make sure files are valid Blobs before passing them
          const validFiles = filesArray.filter(file => file instanceof Blob);
          
          const stream = getChatCompletionStream([
            ...get().messages.filter(m => m.id !== tempId && m.id !== tempAssistantId),
            messageData[0] as Message
          ], validFiles.length > 0 ? validFiles : undefined);

          for await (const chunk of stream) {
            // Check if generation should be stopped
            if (window.stopGenerationSignal) {
              break;
            }
            
            fullResponse += chunk;
            set((state) => ({
              messages: state.messages.map(msg =>
                msg.id === tempAssistantId
                  ? { ...msg, content: fullResponse }
                  : msg
              ),
            }));
          }
          
          // Save the complete response to the database
          try {
            const { data: aiData, error: aiError } = await supabase
              .from('messages')
              .insert([
                {
                  role: 'assistant',
                  content: fullResponse,
                  user_id: userId,
                  conversation_id: conversationId
                },
              ])
              .select();

            if (aiError) {
              console.error('Error saving AI response:', aiError);
              throw aiError;
            }

            if (aiData && aiData.length > 0) {
              set((state) => ({
                messages: state.messages.map(msg =>
                  msg.id === tempAssistantId ? aiData[0] as Message : msg
                ),
                loading: false,
                isGenerating: false,
              }));
              
              const messagesCount = get().messages.length;
              if (messagesCount <= 2) {
                try {
                  const title = message.content.substring(0, 50) + (message.content.length > 50 ? '...' : '');
                  await get().updateConversationTitle(conversationId, title);
                } catch (titleError) {
                  console.error('Error updating conversation title:', titleError);
                  // Don't fail the whole operation if title update fails
                }
              }
            } else {
              console.error('No AI response data returned');
              throw new Error('Failed to save AI response');
            }
          } catch (aiError: any) {
            console.error('Error getting AI response:', aiError);
            // Keep the user message but show error for the AI response
            set((state) => ({
              messages: state.messages.filter(msg => msg.id !== tempAssistantId),
              loading: false,
              isGenerating: false,
              error: aiError.message || 'Failed to get AI response. Please try again.'
            }));
          }
        } catch (error: any) {
          console.error('Error in addMessage:', error);
          set((state) => ({
            messages: state.messages.filter(msg => msg.id !== tempId),
            loading: false,
            isGenerating: false,
            error: error.message || 'Failed to send message. Please try again.'
          }));
        }
      } catch (error: any) {
        console.error('Error in addMessage:', error);
        set((state) => ({
          messages: state.messages.filter(msg => msg.id !== tempId),
          loading: false,
          isGenerating: false,
          error: error.message || 'Failed to send message. Please try again.'
        }));
      }
    } catch (error: any) {
      console.error('Error in addMessage:', error);
      set((state) => ({
        messages: state.messages.filter(msg => msg.id !== tempId),
        loading: false,
        isGenerating: false,
        error: error.message || 'Failed to send message. Please try again.'
      }));
    }
  },
  
  fetchMessages: async () => {
    try {
      const conversationId = get().currentConversationId;
      if (!conversationId) {
        set({ messages: [], error: null });
        return;
      }
      
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('timestamp', { ascending: true });

      if (error) throw error;
      if (data) {
        set({ messages: data as Message[], error: null });
      }
    } catch (error: any) {
      console.error('Error fetching messages:', error);
      set({ error: error.message || 'Failed to load messages' });
    }
  },
  
  fetchConversations: async () => {
    try {
      const user = await supabase.auth.getUser();
      const userId = user.data.user?.id;
      
      if (!userId) {
        set({ conversations: [], error: 'User not authenticated' });
        return;
      }
      
      // Simplified query to avoid column selection syntax errors
      const { data, error } = await supabase
        .from('conversations')
        .select('id, title, updated_at, user_id')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false });

      if (error) {
        console.error('Supabase query error:', error);
        // Don't throw, just log and handle gracefully
        set({ 
          error: `Failed to load conversations: ${error.message}`,
          // Keep existing conversations to prevent UI disruption
        });
        return;
      }
      
      // Fix: Make sure we handle the case when data is null or empty array
      const conversations = data || [];
      console.log('Fetched conversations:', conversations); // Debug log
      
      set({ 
        conversations: conversations.map(conv => ({
          id: conv.id,
          title: conv.title,
          updatedAt: conv.updated_at
        })),
        error: null
      });
    } catch (error: any) {
      console.error('Error fetching conversations:', error);
      set({ 
        error: error.message || 'Failed to load conversations',
        // Don't clear conversations on error - keep existing state
      });
    }
  },
  
  setCurrentConversation: async (conversationId) => {
    try {
      set({ currentConversationId: conversationId, error: null });
      await get().fetchMessages();
    } catch (error: any) {
      set({ error: error.message || 'Failed to set conversation' });
    }
  },
  
  deleteMessage: async (id) => {
    try {
      const { error } = await supabase.from('messages').delete().eq('id', id);
      if (error) throw error;
      set((state) => ({
        messages: state.messages.filter((msg) => msg.id !== id),
        error: null
      }));
    } catch (error: any) {
      console.error('Error deleting message:', error);
      set({ error: error.message || 'Failed to delete message' });
    }
  },
  
  editMessage: async (id, newContent) => {
    try {
      // First update UI optimistically
      const messageToEdit = get().messages.find(m => m.id === id);
      if (!messageToEdit) {
        throw new Error('Message not found');
      }
      
      // Save old message content for rollback if needed
      const oldContent = messageToEdit.content;
      
      // Skip if content is the same
      if (oldContent === newContent) {
        return;
      }
      
      // Update the UI immediately
      set(state => ({
        messages: state.messages.map(msg => 
          msg.id === id ? { ...msg, content: newContent } : msg
        ),
        loading: true
      }));
      
      // Update the message in the database
      const { error: updateError } = await supabase
        .from('messages')
        .update({ content: newContent })
        .eq('id', id);
      
      if (updateError) {
        // Rollback the UI change if there's an error
        set(state => ({
          messages: state.messages.map(msg => 
            msg.id === id ? { ...msg, content: oldContent } : msg
          ),
          loading: false,
          error: `Failed to update message: ${updateError.message}`
        }));
        throw updateError;
      }
      
      // Get all messages after the edited message to remove them
      const messageIndex = get().messages.findIndex(m => m.id === id);
      if (messageIndex === -1) return;
      
      // Remove all assistant messages that come after this edited message
      const messagesToDelete = get().messages.slice(messageIndex + 1);
      const assistantMessagesToDelete = messagesToDelete.filter(m => m.role === 'assistant');
      
      // Delete these messages from the database
      for (const msg of assistantMessagesToDelete) {
        if (!msg.id.startsWith('temp-')) {
          await supabase
            .from('messages')
            .delete()
            .eq('id', msg.id);
        }
      }
      
      // Remove the messages from the UI
      set(state => ({
        messages: state.messages.filter((_, index) => index <= messageIndex)
      }));
      
      // Now get an updated response for the edited message
      const userId = (await supabase.auth.getUser()).data.user?.id;
      if (!userId) {
        throw new Error('User is not authenticated');
      }
      
      // Add a temporary message for the stream
      const tempAssistantId = 'temp-' + uuidv4();
      const tempAssistantMessage: Message = {
        id: tempAssistantId,
        role: 'assistant',
        content: '',
        timestamp: new Date().toISOString(),
        conversation_id: get().currentConversationId as string
      };
      
      set(state => ({
        messages: [...state.messages, tempAssistantMessage]
      }));
      
      // Reset stop signal before starting generation
      window.stopGenerationSignal = false;
      
      // Stream the new response
      let fullResponse = '';
      const stream = getChatCompletionStream(
        get().messages.filter(m => m.id !== tempAssistantId)
      );
      
      for await (const chunk of stream) {
        // Check if generation should be stopped
        if (window.stopGenerationSignal) {
          break;
        }
        
        fullResponse += chunk;
        set(state => ({
          messages: state.messages.map(msg =>
            msg.id === tempAssistantId
              ? { ...msg, content: fullResponse }
              : msg
          )
        }));
      }
      
      // Save the new response to the database
      const { data: aiData, error: aiError } = await supabase
        .from('messages')
        .insert([
          {
            role: 'assistant',
            content: fullResponse,
            user_id: userId,
            conversation_id: get().currentConversationId
          }
        ])
        .select();
      
      if (aiError) {
        throw aiError;
      }
      
      // Update the temporary message with the real one from the database
      set(state => ({
        messages: state.messages.map(msg =>
          msg.id === tempAssistantId
            ? (aiData[0] as Message)
            : msg
        ),
        loading: false,
        isGenerating: false
      }));
      
    } catch (error: any) {
      console.error('Error editing message:', error);
      set({
        loading: false,
        isGenerating: false,
        error: `Failed to edit message: ${error.message}`
      });
    }
  },
  
  clearHistory: async () => {
    try {
      const user = await supabase.auth.getUser();
      const userId = user.data.user?.id;
      
      if (!userId) {
        set({ error: 'User not authenticated' });
        return;
      }
      
      // Delete all messages
      const { error: msgError } = await supabase
        .from('messages')
        .delete()
        .eq('user_id', userId);
      
      if (msgError) throw msgError;
      
      // Delete all conversations
      const { error: convError } = await supabase
        .from('conversations')
        .delete()
        .eq('user_id', userId);
        
      if (convError) throw convError;
      
      set({ 
        messages: [],
        conversations: [],
        currentConversationId: null,
        error: null
      });
    } catch (error: any) {
      console.error('Error clearing history:', error);
      set({ error: error.message || 'Failed to clear history' });
    }
  },
  
  deleteConversation: async (conversationId) => {
    try {
      // Delete messages in conversation
      const { error: msgError } = await supabase
        .from('messages')
        .delete()
        .eq('conversation_id', conversationId);
        
      if (msgError) throw msgError;
      
      // Delete conversation
      const { error: convError } = await supabase
        .from('conversations')
        .delete()
        .eq('id', conversationId);
        
      if (convError) throw convError;
      
      // Update state
      set((state) => ({
        conversations: state.conversations.filter((conv) => conv.id !== conversationId),
        messages: state.currentConversationId === conversationId ? [] : state.messages,
        currentConversationId: state.currentConversationId === conversationId ? null : state.currentConversationId,
        error: null
      }));
    } catch (error: any) {
      console.error('Error deleting conversation:', error);
      set({ error: error.message || 'Failed to delete conversation' });
    }
  },
  
  updateConversationTitle: async (conversationId, title) => {
    try {
      const { error } = await supabase
        .from('conversations')
        .update({ title })
        .eq('id', conversationId);
        
      if (error) throw error;
      
      set((state) => ({
        conversations: state.conversations.map((conv) => 
          conv.id === conversationId ? { ...conv, title } : conv
        ),
        error: null
      }));
    } catch (error: any) {
      console.error('Error updating conversation title:', error);
      set({ error: error.message || 'Failed to update conversation title' });
    }
  }
}));