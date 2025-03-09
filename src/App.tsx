import React, { useEffect } from 'react';
import { AuthForm } from './components/AuthForm';
import { Chat } from './pages/Chat';
import { History } from './pages/History';
import { HomePage } from './pages/HomePage';
import { About } from './pages/About';
import { Resources } from './pages/Resources';
import { useAuthStore } from './store/useAuthStore';
import { useChatStore } from './store/useChatStore';
import { supabase } from './lib/supabase';
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { ThemeProvider } from './components/ThemeProvider';
import { Toaster } from './components/ui/Toaster';

// Route observer component to handle navigation events
const RouteObserver = () => {
  const location = useLocation();
  const { fetchConversations } = useChatStore();
  
  useEffect(() => {
    // Refresh conversations data when navigating to chat or history pages
    if (location.pathname === '/chat' || location.pathname === '/history') {
      fetchConversations();
    }
  }, [location.pathname, fetchConversations]);
  
  return null;
};

function App() {
  const { user, setUser } = useAuthStore();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, [setUser]);

  return (
    <ThemeProvider defaultTheme="dark" storageKey="app-theme">
      <BrowserRouter>
        {!user ? (
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/about" element={<About />} />
            <Route path="/resources" element={<Resources />} />
            <Route path="/login" element={<AuthForm />} />
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
              <Route path="/login" element={<Navigate to="/" replace />} />
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