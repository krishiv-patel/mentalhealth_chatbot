import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { User } from '@supabase/supabase-js';

interface AuthState {
  user: User | null;
  session: any;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<any>;
  signOut: () => Promise<void>;
  setUser: (user: User | null) => void;
  deleteAccount: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  session: null,
  loading: true,
  signIn: async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
  },
  signUp: async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });
    if (error) throw error;
    return { data, error };
  },
  signOut: async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    set({ user: null, session: null });
  },
  setUser: (user) => set({ user }),
  deleteAccount: async () => {
    try {
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) throw new Error('No user found');

      // First try using the edge function (most secure way)
      try {
        const { data: functionData, error: functionError } = await supabase.functions.invoke('delete-user');
        
        if (!functionError) {
          // Successfully deleted via edge function
          set({ user: null, session: null });
          return;
        }
        
        // If edge function fails, continue with fallback approaches
        console.error('Edge function delete failed:', functionError);
      } catch (edgeFunctionError) {
        console.error('Error calling edge function:', edgeFunctionError);
        // Continue with fallback approaches
      }

      // Fallback 1: Delete user data and try RPC function
      // Delete all user conversations
      const { error: convError } = await supabase
        .from('conversations')
        .delete()
        .eq('user_id', user.id);
      
      if (convError) console.error('Error deleting conversations:', convError);

      // Delete all user messages
      const { error: msgError } = await supabase
        .from('messages')
        .delete()
        .eq('user_id', user.id);
      
      if (msgError) console.error('Error deleting messages:', msgError);

      // Delete user profile
      const { error: profileError } = await supabase
        .from('profiles')
        .delete()
        .eq('id', user.id);
      
      if (profileError) console.error('Error deleting profile:', profileError);

      // Fallback 2: Use RPC function to delete the user completely from auth system
      try {
        const { error: deleteError } = await supabase.rpc('delete_user');
        if (!deleteError) {
          // Successfully deleted via RPC
          await supabase.auth.signOut();
          set({ user: null, session: null });
          return;
        }
        console.error('RPC delete failed:', deleteError);
      } catch (rpcError) {
        console.error('Error in RPC function:', rpcError);
      }

      // Fallback 3: Try to make the account unusable
      try {
        // Generate a random secure password that even the user won't know
        const randomPassword = Math.random().toString(36).slice(-10) + 
                              Math.random().toString(36).slice(-10) + 
                              Date.now().toString();
        
        // Change email to something invalid and randomize password
        const { error: updateError } = await supabase.auth.updateUser({
          email: `deleted-${user.id}@deleted-account.invalid`,
          password: randomPassword,
          data: { 
            deleted: true,
            deletedAt: new Date().toISOString()
          }
        });
        
        if (updateError) throw updateError;
      } catch (updateError) {
        console.error('Error updating user:', updateError);
        throw new Error('Failed to delete account. Please contact support.');
      }

      // Sign out after all attempts
      await supabase.auth.signOut();
      set({ user: null, session: null });
    } catch (error) {
      console.error('Error deleting account:', error);
      throw error;
    }
  },
}));