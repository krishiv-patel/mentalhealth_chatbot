import { create } from 'zustand';
import { supabase } from '../lib/supabase';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

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
    const { data, error } = await supabase
      .from('messages')
      .insert([
        {
          role: message.role,
          content: message.content,
          user_id: (await supabase.auth.getUser()).data.user?.id,
        },
      ])
      .select();

    if (error) throw error;
    if (data) {
      set((state) => ({
        messages: [...state.messages, data[0] as Message],
        loading: false,
      }));
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