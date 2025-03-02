import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { getChatCompletion } from '../lib/lmstudio';
import type { Message } from '../types';
import { v4 as uuidv4 } from 'uuid';

interface ChatState {
  messages: Message[];
  loading: boolean;
  currentConversationId: string | null;
  conversations: { id: string; title: string; updatedAt: string }[];
  error: string | null;
  addMessage: (message: Omit<Message, 'id' | 'timestamp' | 'conversation_id'>) => Promise<void>;
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
  
  addMessage: async (message) => {
    // Add optimistic update for better UI responsiveness
    const tempId = 'temp-' + uuidv4();
    const tempMessage = {
      id: tempId,
      role: message.role,
      content: message.content,
      timestamp: new Date().toISOString(),
      conversation_id: get().currentConversationId || 'new',
    } as Message;
    
    // Add message to UI immediately
    set(state => ({ 
      messages: [...state.messages, tempMessage],
      loading: true,
      error: null
    }));
    
    try {
      // Get user ID first
      const { data: userData, error: userError } = await supabase.auth.getUser();
      
      if (userError) throw userError;
      
      const userId = userData.user?.id;
      
      if (!userId) {
        throw new Error('User is not authenticated');
      }
      
      // Ensure we have a conversation ID and it exists in the database
      let conversationId = get().currentConversationId;
      let conversationExists = false;
      
      if (conversationId) {
        // Check if this conversation exists
        const { data: convData, error: convCheckError } = await supabase
          .from('conversations')
          .select('id')
          .eq('id', conversationId)
          .single();
          
        if (convCheckError && convCheckError.code !== 'PGRST116') { // PGRST116 is "not found" which is expected if it doesn't exist
          throw convCheckError;
        }
        
        conversationExists = !!convData;
      }
      
      // If conversation doesn't exist, create one
      if (!conversationId || !conversationExists) {
        conversationId = conversationId || uuidv4();
        
        // Create a new conversation entry
        const { data: newConvData, error: convError } = await supabase
          .from('conversations')
          .insert([
            {
              id: conversationId,
              user_id: userId,
              title: message.content.substring(0, 50) + (message.content.length > 50 ? '...' : ''),
              updated_at: new Date().toISOString()
            },
          ])
          .select();
          
        if (convError) throw convError;
        
        // Verify the conversation was created
        if (!newConvData || newConvData.length === 0) {
          throw new Error('Failed to create conversation');
        }
        
        // Update state with the new conversation ID
        set({ currentConversationId: conversationId });
      } else {
        // Update conversation's updated_at time
        const { error: updateError } = await supabase
          .from('conversations')
          .update({ updated_at: new Date().toISOString() })
          .eq('id', conversationId);
          
        if (updateError) throw updateError;
      }

      // Insert user message into the database
      const { data: messageData, error: messageError } = await supabase
        .from('messages')
        .insert([
          {
            role: message.role,
            content: message.content,
            user_id: userId,
            conversation_id: conversationId
          },
        ])
        .select();

      if (messageError) throw messageError;

      if (!messageData || messageData.length === 0) {
        throw new Error('Failed to save message');
      }

      // Replace the optimistic message with the real one
      set((state) => ({
        messages: state.messages.map(msg => 
          msg.id === tempId ? messageData[0] as Message : msg
        ),
      }));

      try {
        // Get AI response
        const aiResponse = await getChatCompletion([
          ...get().messages.filter(m => m.id !== tempId),
          messageData[0] as Message
        ]);
        
        // Add AI message to database
        const { data: aiData, error: aiError } = await supabase
          .from('messages')
          .insert([
            {
              role: 'assistant',
              content: aiResponse,
              user_id: userId,
              conversation_id: conversationId
            },
          ])
          .select();

        if (aiError) throw aiError;

        if (aiData && aiData.length > 0) {
          set((state) => ({
            messages: [...state.messages, aiData[0] as Message],
            loading: false,
          }));
          
          // Update conversation title if it's the first message
          const messagesCount = get().messages.length;
          if (messagesCount <= 2) {
            const title = message.content.substring(0, 50) + (message.content.length > 50 ? '...' : '');
            await get().updateConversationTitle(conversationId, title);
          }
        } else {
          throw new Error('Failed to get AI response');
        }
      } catch (aiError: any) {
        console.error('Error getting AI response:', aiError);
        set((state) => ({
          messages: state.messages,
          loading: false,
          error: aiError.message || 'Failed to get AI response. Please try again.'
        }));
      }
    } catch (error: any) {
      console.error('Error in addMessage:', error);
      // Remove the optimistic message on error
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
      
      const { data, error } = await supabase
        .from('conversations')
        .select('*')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false });

      if (error) throw error;
      if (data) {
        set({ 
          conversations: data.map(conv => ({
            id: conv.id,
            title: conv.title,
            updatedAt: conv.updated_at
          })),
          error: null
        });
      }
    } catch (error: any) {
      console.error('Error fetching conversations:', error);
      set({ error: error.message || 'Failed to load conversations' });
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