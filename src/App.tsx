import React, { useEffect } from 'react';
import { AuthForm } from './components/AuthForm';
import { Chat } from './pages/Chat';
import { History } from './pages/History';
import { useAuthStore } from './store/useAuthStore';
import { supabase } from './lib/supabase';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

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

  if (!user) {
    return <AuthForm />;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <BrowserRouter>
        <Routes>
          <Route path="/chat" element={<Chat />} />
          <Route path="/history" element={<History />} />
          <Route path="*" element={<Navigate to="/chat" replace />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;