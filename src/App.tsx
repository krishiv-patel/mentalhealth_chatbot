import React, { useEffect, useState } from 'react';
import { AuthForm } from './components/AuthForm';
import { Chat } from './pages/Chat';
import { History } from './pages/History';
import { HomePage } from './pages/HomePage';
import { About } from './pages/About';
import { Resources } from './pages/Resources';
import { TestUpload } from './pages/TestUpload';
import { AdminLogs } from './pages/AdminLogs';
import { UserLogs } from './pages/UserLogs';
import { useAuthStore } from './store/useAuthStore';
import { useChatStore } from './store/useChatStore';
import { supabase } from './lib/supabase';
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { ThemeProvider } from './components/ThemeProvider';
import { Toaster } from './components/ui/Toaster';
import { logInfo, logError, LogCategory } from './lib/logging';

// Route observer component to handle navigation events
const RouteObserver = () => {
  const location = useLocation();
  const { fetchConversations } = useChatStore();
  const { initializeEncryption, isEncryptionInitialized } = useChatStore();
  const { user } = useAuthStore();
  
  useEffect(() => {
    // Initialize encryption on navigation to chat
    if (location.pathname === '/chat' && !isEncryptionInitialized) {
      initializeEncryption();
    }
    
    // Refresh conversations data when navigating to chat or history pages
    if (location.pathname === '/chat' || location.pathname === '/history') {
      fetchConversations();
    }
    
    // Log page navigation events
    if (user) {
      logInfo(
        LogCategory.SYSTEM, 
        `Navigated to ${location.pathname}`, 
        user.id
      );
    }
  }, [location.pathname, fetchConversations, initializeEncryption, isEncryptionInitialized, user]);
  
  return null;
};

function App() {
  const { user, setUser } = useAuthStore();
  const { initializeEncryption, isEncryptionInitialized } = useChatStore();
  const [isLoading, setIsLoading] = useState(true);

  // Handle authentication and initialize encryption
  useEffect(() => {
    const initAuth = async () => {
      setIsLoading(true);
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const newUser = session?.user ?? null;
        setUser(newUser);
        
        // Initialize encryption if user is logged in
        if (newUser && !isEncryptionInitialized) {
          await initializeEncryption();
        }
        
        if (newUser) {
          logInfo(LogCategory.AUTH, "Session restored", newUser.id);
        }
      } catch (error: any) {
        console.error("Auth initialization error:", error);
        logError(LogCategory.AUTH, "Auth initialization error", null, null, { error: error.message });
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      const newUser = session?.user ?? null;
      setUser(newUser);
      
      // Initialize encryption when user logs in
      if (newUser && !isEncryptionInitialized) {
        initializeEncryption();
        logInfo(LogCategory.AUTH, "Auth state changed - user logged in", newUser.id);
      }
      
      if (!newUser) {
        logInfo(LogCategory.AUTH, "Auth state changed - user logged out", null);
      }
      
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [setUser, initializeEncryption, isEncryptionInitialized]);

  // Show loading indicator while auth state is being determined
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <ThemeProvider defaultTheme="dark" storageKey="app-theme">
      <BrowserRouter>
        {!user ? (
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/about" element={<About />} />
            <Route path="/resources" element={<Resources />} />
            <Route path="/login" element={<AuthForm />} />
            <Route path="/test-upload" element={<TestUpload />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        ) : (
          <>
            <RouteObserver />
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/about" element={<About />} />
              <Route path="/resources" element={<Resources />} />
              <Route path="/chat" element={<Chat />} />
              <Route path="/history" element={<History />} />
              <Route path="/logs" element={<UserLogs />} />
              <Route path="/admin/logs" element={<AdminLogs />} />
              <Route path="/login" element={<Navigate to="/" replace />} />
              <Route path="/test-upload" element={<TestUpload />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </>
        )}
        <Toaster />
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;