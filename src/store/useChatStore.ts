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
  addMessage: (message: Omit<Message, 'id' | 'timestamp' | 'conversation_id'>, file?: File) => Promise<void>;
  fetchMessages: () => Promise<void>;
  deleteMessage: (id: string) => Promise<void>;
  clearHistory: () => Promise<void>;
  startNewConversation: () => void;
  fetchConversations: () => Promise<void>;
  setCurrentConversation: (conversationId: string) => Promise<void>;
  deleteConversation: (conversationId: string) => Promise<void>;
  updateConversationTitle: (conversationId: string, title: string) => Promise<void>;
  clearError: () => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
  messages: [],
  loading: false,
  currentConversationId: null,
  conversations: [],
  error: null,
  
  clearError: () => set({ error: null }),
  
  startNewConversation: () => {
    const newConversationId = uuidv4();
    set({ 
      currentConversationId: newConversationId,
      messages: [],
      error: null
    });
    return newConversationId;
  },
  
  addMessage: async (message, file) => {
    const tempId = 'temp-' + uuidv4();
    const tempMessage = {
      id: tempId,
      role: message.role,
      content: message.content,
      timestamp: new Date().toISOString(),
      conversation_id: get().currentConversationId || 'new',
    } as Message;

    if (file) {
      const fileName = file.name;
      const filePath = `${get().currentConversationId || 'new'}/${uuidv4()}-${fileName}`;
      
      try {
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
          type: 'document',
          name: fileName,
          url: urlData.publicUrl,
          size: file.size
        };
      } catch (error: any) {
        console.error('Error uploading file:', error);
        set({ error: `Failed to upload file: ${error.message}. Please try again.` });
        return;
      }
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
          }));

          let fullResponse = '';
          const stream = getChatCompletionStream([
            ...get().messages.filter(m => m.id !== tempId && m.id !== tempAssistantId),
            messageData[0] as Message
          ], file);

          for await (const chunk of stream) {
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
              error: aiError.message || 'Failed to get AI response. Please try again.'
            }));
          }
        } catch (error: any) {
          console.error('Error in addMessage:', error);
          set((state) => ({
            messages: state.messages.filter(msg => msg.id !== tempId),
            loading: false,
            error: error.message || 'Failed to send message. Please try again.'
          }));
        }
      } catch (error: any) {
        console.error('Error in addMessage:', error);
        set((state) => ({
          messages: state.messages.filter(msg => msg.id !== tempId),
          loading: false,
          error: error.message || 'Failed to send message. Please try again.'
        }));
      }
    } catch (error: any) {
      console.error('Error in addMessage:', error);
      set((state) => ({
        messages: state.messages.filter(msg => msg.id !== tempId),
        loading: false,
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