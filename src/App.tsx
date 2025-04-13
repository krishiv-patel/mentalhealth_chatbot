import React, { useEffect, useState } from 'react';
import { AuthForm } from './components/AuthForm';
import { Chat } from './pages/Chat';
import { History } from './pages/History';
import { HomePage } from './pages/HomePage';
import { About } from './pages/About';
import { Resources } from './pages/Resources';
import { TestUpload } from './pages/TestUpload';
import { BucketTest } from './pages/BucketTest';
import { AdminLogs } from './pages/AdminLogs';
import { UserLogs } from './pages/UserLogs';
import { GeminiVisionTest } from './pages/GeminiVisionTest';
import { useAuthStore } from './store/useAuthStore';
import { useChatStore } from './store/useChatStore';
import { supabase } from './lib/supabase';
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { ThemeProvider } from './components/ThemeProvider';
import { Toaster } from './components/ui/Toaster';
import { logInfo, logError, LogCategory } from './lib/logging';
import ModelsPage from './pages/Models';

// Route observer component to handle navigation events
const RouteObserver = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { fetchConversations, setCurrentConversation } = useChatStore();
  const { initializeEncryption, isEncryptionInitialized } = useChatStore();
  const { user } = useAuthStore();
  
  useEffect(() => {
    // Only proceed if user is authenticated
    if (!user) return;
    
    const handleNavigation = async () => {
      // Initialize encryption on navigation to chat pages if needed
      if ((location.pathname === '/chat' || location.pathname.startsWith('/chat/')) && !isEncryptionInitialized) {
        await initializeEncryption();
      }
      
      // Extract conversation ID from URL if present
      const chatIdMatch = location.pathname.match(/^\/chat\/(.+)$/);
      const conversationId = chatIdMatch ? chatIdMatch[1] : null;
      
      // Refresh conversations data when navigating to chat or history pages
      if (location.pathname === '/chat' || location.pathname.startsWith('/chat/') || location.pathname === '/history') {
        try {
          await fetchConversations();
          
          // If we have a conversation ID in the URL, set it as current
          if (conversationId) {
            await setCurrentConversation(conversationId);
          }
        } catch (error) {
          console.error('Error loading conversation data:', error);
        }
      }
      
      // Log page navigation events
      logInfo(
        LogCategory.SYSTEM, 
        `Navigated to ${location.pathname}`, 
        user.id
      );
    };
    
    handleNavigation();
    
  }, [location.pathname, fetchConversations, initializeEncryption, isEncryptionInitialized, user, setCurrentConversation]);
  
  return null;
};

function App() {
  const { user, setUser } = useAuthStore();
  const { initializeEncryption, isEncryptionInitialized, fetchConversations } = useChatStore();
  const [isLoading, setIsLoading] = useState(true);
  const [authInitialized, setAuthInitialized] = useState(false);

  // Handle authentication and initialize encryption
  useEffect(() => {
    const initAuth = async () => {
      if (authInitialized) return; // Prevent multiple initializations
      
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
        
        setAuthInitialized(true);
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
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const newUser = session?.user ?? null;
      setUser(newUser);
      
      // Initialize encryption when user logs in
      if (newUser && !isEncryptionInitialized) {
        await initializeEncryption();
        logInfo(LogCategory.AUTH, "Auth state changed - user logged in", newUser.id);
      }
      
      if (!newUser) {
        logInfo(LogCategory.AUTH, "Auth state changed - user logged out", null);
      }
      
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [setUser, initializeEncryption, isEncryptionInitialized, authInitialized]);

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
            <Route path="/vision-test" element={<GeminiVisionTest />} />
            <Route path="/bucket-test" element={<BucketTest />} />
            <Route path="/models" element={<ModelsPage />} />
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
              <Route path="/chat/:id" element={<Chat />} />
              <Route path="/history" element={<History />} />
              <Route path="/logs" element={<UserLogs />} />
              <Route path="/admin/logs" element={<AdminLogs />} />
              <Route path="/models" element={<ModelsPage />} />
              <Route path="/login" element={<Navigate to="/" replace />} />
              <Route path="/test-upload" element={<TestUpload />} />
              <Route path="/vision-test" element={<GeminiVisionTest />} />
              <Route path="/bucket-test" element={<BucketTest />} />
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