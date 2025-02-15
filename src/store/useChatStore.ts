import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { getChatCompletion } from '../lib/lmstudio';
import type { Message } from '../types';

interface ChatState {
  messages: Message[];
  loading: boolean;
  addMessage: (message: Omit<Message, 'id' | 'timestamp'>) => Promise<void>;
  fetchMessages: () => Promise<void>;
  deleteMessage: (id: string) => Promise<void>;
  clearHistory: () => Promise<void>;
}

export const useChatStore = create<ChatState>((set, get) => ({
  messages: [],
  loading: false,
  addMessage: async (message) => {
    set({ loading: true });
    try {
      // Add user message
      const { data: userData, error: userError } = await supabase
        .from('messages')
        .insert([
          {
            role: message.role,
            content: message.content,
            user_id: (await supabase.auth.getUser()).data.user?.id,
          },
        ])
        .select();

      if (userError) throw userError;

      if (userData) {
        set((state) => ({
          messages: [...state.messages, userData[0] as Message],
        }));

        // Get AI response
        const aiResponse = await getChatCompletion(get().messages);
        
        // Add AI message to database
        const { data: aiData, error: aiError } = await supabase
          .from('messages')
          .insert([
            {
              role: 'assistant',
              content: aiResponse,
              user_id: (await supabase.auth.getUser()).data.user?.id,
            },
          ])
          .select();

        if (aiError) throw aiError;

        if (aiData) {
          set((state) => ({
            messages: [...state.messages, aiData[0] as Message],
            loading: false,
          }));
        }
      }
    } catch (error) {
      console.error('Error in addMessage:', error);
      set({ loading: false });
      throw error;
    }
  },
  fetchMessages: async () => {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .order('timestamp', { ascending: true });

    if (error) throw error;
    if (data) {
      set({ messages: data as Message[] });
    }
  },
  deleteMessage: async (id) => {
    const { error } = await supabase.from('messages').delete().eq('id', id);
    if (error) throw error;
    set((state) => ({
      messages: state.messages.filter((msg) => msg.id !== id),
    }));
  },
  clearHistory: async () => {
    const { error } = await supabase
      .from('messages')
      .delete()
      .eq('user_id', (await supabase.auth.getUser()).data.user?.id);
    if (error) throw error;
    set({ messages: [] });
  },
}));