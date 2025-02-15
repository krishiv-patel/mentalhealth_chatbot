import React from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { Moon, Sun, LogOut, Brain } from 'lucide-react';
import { Button } from './ui/Button';
import { motion, AnimatePresence } from 'framer-motion';
import Profile from './Profile';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { signOut,user } = useAuthStore();
  const [darkMode, setDarkMode] = React.useState(
    window.matchMedia('(prefers-color-scheme: dark)').matches
  );

  React.useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20 transition-colors duration-500">
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.4 }}
        className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <motion.div 
              className="flex items-center space-x-3"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <motion.div
                animate={{ rotate: [0, 360] }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              >
                <Brain className="h-8 w-8 text-primary animate-bounce-in" />
              </motion.div>
              <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-blue-600 animate-fade-in">
                MindfulAI Chat
              </h1>
            </motion.div>
            <div className="flex items-center space-x-4">
              <AnimatePresence mode="wait">
                <motion.div
                  key={darkMode ? 'dark' : 'light'}
                  initial={{ opacity: 0, rotate: -180, scale: 0 }}
                  animate={{ opacity: 1, rotate: 0, scale: 1 }}
                  exit={{ opacity: 0, rotate: 180, scale: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setDarkMode(!darkMode)}
                    className="hover-lift"
                  >
                    {darkMode ? (
                      <Sun className="h-5 w-5 transition-transform duration-300 hover:rotate-90" />
                    ) : (
                      <Moon className="h-5 w-5 transition-transform duration-300 hover:rotate-90" />
                    )}
                  </Button>
                </motion.div>
              </AnimatePresence>
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={signOut}
                  className="hover-lift group"
                >
                  <LogOut className="h-5 w-5 transition-transform duration-300 group-hover:translate-x-1" />
                </Button>
              </motion.div>
              <Profile user={user}/>
            </div>
          </div>
        </div>
      </motion.header>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 animate-slide-up">
        {children}
      </main>
    </div>
  );
};