import React, { useEffect } from 'react';
import { AuthForm } from './components/AuthForm';
import { Chat } from './pages/Chat';
import { useAuthStore } from './store/useAuthStore';
import { supabase } from './lib/supabase';

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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {user ? <Chat /> : <AuthForm />}
    </div>
  );
}

export default App;