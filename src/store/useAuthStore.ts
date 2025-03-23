import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { User } from '@supabase/supabase-js';
import { logInfo, logError, LogCategory } from '../lib/logging';

interface AuthState {
  user: User | null;
  session: any;
  loading: boolean;
  error: string | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<any>;
  signOut: () => Promise<void>;
  setUser: (user: User | null) => void;
  deleteAccount: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  session: null,
  loading: true,
  error: null,
  
  signIn: async (email: string, password: string) => {
    set({ loading: true, error: null });
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) {
        set({ error: error.message, loading: false });
        logError(LogCategory.AUTH, "Login failed", null, null, { 
          email, 
          error: error.message 
        });
        return;
      }
      
      set({ user: data.user, session: data.session, loading: false });
      logInfo(LogCategory.AUTH, "User logged in successfully", data.user?.id);
    } catch (error: any) {
      set({ error: error.message, loading: false });
      logError(LogCategory.AUTH, "Login error", null, null, { 
        email, 
        error: error.message 
      });
    }
  },
  
  signUp: async (email: string, password: string) => {
    set({ loading: true, error: null });
    
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });
      
      if (error) {
        set({ error: error.message, loading: false });
        logError(LogCategory.AUTH, "Signup failed", null, null, { 
          email, 
          error: error.message 
        });
        return { data, error };
      }
      
      set({ user: data.user, session: data.session, loading: false });
      logInfo(LogCategory.AUTH, "User signed up successfully", data.user?.id);
      return { data, error };
    } catch (error: any) {
      set({ error: error.message, loading: false });
      logError(LogCategory.AUTH, "Signup error", null, null, { 
        email, 
        error: error.message 
      });
      return { data: null, error: error.message };
    }
  },
  
  signOut: async () => {
    set({ loading: true, error: null });
    
    try {
      // Get the user ID before logging out for logging purposes
      const userId = get().user?.id;
      
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        set({ error: error.message, loading: false });
        logError(LogCategory.AUTH, "Logout failed", userId, null, { 
          error: error.message 
        });
        return;
      }
      
      set({ user: null, session: null, loading: false });
      logInfo(LogCategory.AUTH, "User logged out successfully", userId);
    } catch (error: any) {
      set({ error: error.message, loading: false });
      logError(LogCategory.AUTH, "Logout error", get().user?.id, null, { 
        error: error.message 
      });
    }
  },
  
  setUser: (user) => set({ user }),
  
  deleteAccount: async () => {
    set({ loading: true, error: null });
    
    try {
      const userId = get().user?.id;
      if (!userId) {
        set({ error: "User not authenticated", loading: false });
        logError(LogCategory.AUTH, "Delete account failed - user not authenticated", null);
        return;
      }
      
      // Delete user's data
      const { error: deleteError } = await supabase
        .from('users_data')
        .delete()
        .eq('user_id', userId);
        
      if (deleteError) {
        console.error('Error deleting user data:', deleteError);
        logError(LogCategory.AUTH, "Failed to delete user data", userId, null, { 
          error: deleteError.message 
        });
      }
      
      // Delete the account
      const { error } = await supabase.auth.admin.deleteUser(userId);
      
      if (error) {
        set({ error: error.message, loading: false });
        logError(LogCategory.AUTH, "Failed to delete account", userId, null, { 
          error: error.message 
        });
        return;
      }
      
      // Sign out after successful deletion
      await supabase.auth.signOut();
      set({ user: null, session: null, loading: false });
      logInfo(LogCategory.AUTH, "Account deleted successfully", userId);
    } catch (error: any) {
      set({ error: error.message, loading: false });
      logError(LogCategory.AUTH, "Account deletion error", get().user?.id, null, { 
        error: error.message 
      });
    }
  },
  
  clearError: () => set({ error: null }),
}));