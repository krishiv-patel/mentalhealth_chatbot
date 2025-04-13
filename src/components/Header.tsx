import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from './ui/Button';
import { 
  MessageSquare, 
  Heart, 
  Brain, 
  ArrowRight, 
  HeartPulse,
  BookOpen,
  Users,
  Sun,
  Moon,
  Menu,
  X,
  History as HistoryIcon,
  FileText,
  Sparkles,
  Zap
} from 'lucide-react';
import { useTheme } from './ThemeProvider';
import { useProfileStore } from '../store/useProfileStore';
import { useAuthStore } from '../store/useAuthStore';

export const Header: React.FC = () => {
  const { profile } = useProfileStore();
  const { user, signOut } = useAuthStore();
  const { theme, setTheme } = useTheme();
  const location = useLocation();
  const [profileMenuOpen, setProfileMenuOpen] = React.useState(false);
  
  // Close profile menu when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.profile-menu-container')) {
        setProfileMenuOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Toggle theme function
  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto py-3">
        <div className="flex items-center justify-between">
          {/* Logo and Brand */}
          <div className="flex items-center gap-2">
            <Link to="/" className="group flex items-center gap-2">
              <motion.div
                initial={{ rotate: 0 }}
                animate={{ rotate: 360 }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                className="relative"
              >
                <Brain className="h-8 w-8 text-primary group-hover:text-rose-500 transition-colors duration-300" />
                <motion.div
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: [0, 1, 0], scale: [0.5, 1.5, 0.5] }}
                  transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                  className="absolute -top-1 -right-1"
                >
                  <Heart className="h-4 w-4 text-rose-500 fill-rose-500" />
                </motion.div>
              </motion.div>
              <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-rose-500">
                MindfulAI Chat
              </h1>
            </Link>
          </div>
          
          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-6">
            <Link 
              to="/about" 
              className={`text-sm font-medium hover:text-primary transition-colors ${
                location.pathname === '/about' ? 'text-primary' : 'text-muted-foreground'
              }`}
            >
              About
            </Link>
            <Link 
              to="/resources" 
              className={`text-sm font-medium hover:text-primary transition-colors ${
                location.pathname === '/resources' ? 'text-primary' : 'text-muted-foreground'
              }`}
            >
              Resources
            </Link>
            <Link 
              to="/vision-test" 
              className={`text-sm font-medium hover:text-primary transition-colors flex items-center gap-1 ${
                location.pathname === '/vision-test' ? 'text-primary' : 'text-muted-foreground'
              }`}
            >
              <Sparkles className="h-3.5 w-3.5" />
              Vision Test
            </Link>
            <Link 
              to="/models" 
              className={`text-sm font-medium hover:text-primary transition-colors flex items-center gap-1 ${
                location.pathname === '/models' ? 'text-primary' : 'text-muted-foreground'
              }`}
            >
              <Zap className="h-3.5 w-3.5" />
              AI Models
            </Link>
            {user && (
              <Link 
                to="/history" 
                className={`text-sm font-medium hover:text-primary transition-colors ${
                  location.pathname === '/history' ? 'text-primary' : 'text-muted-foreground'
                }`}
              >
                History
              </Link>
            )}
          </div>
          
          {/* Right Side Controls */}
          <div className="flex items-center gap-2">
            {/* Theme Switcher */}
            <AnimatePresence mode="wait">
              <motion.button
                key={theme}
                onClick={toggleTheme}
                className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-muted transition-colors text-foreground/70 hover:text-foreground"
                whileTap={{ scale: 0.9 }}
                initial={{ opacity: 0, rotate: -180, scale: 0.5 }}
                animate={{ opacity: 1, rotate: 0, scale: 1 }}
                exit={{ opacity: 0, rotate: 180, scale: 0.5 }}
                transition={{ duration: 0.2 }}
              >
                {theme === 'dark' ? (
                  <Sun className="h-[18px] w-[18px]" />
                ) : (
                  <Moon className="h-[18px] w-[18px]" />
                )}
              </motion.button>
            </AnimatePresence>
            
            {/* User Profile or Sign In */}
            {user ? (
              <div className="profile-menu-container relative" onClick={() => setProfileMenuOpen(!profileMenuOpen)}>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="w-8 h-8 rounded-full bg-gradient-to-br from-rose-400 to-indigo-500 flex items-center justify-center overflow-hidden cursor-pointer ring-2 ring-background"
                >
                  {profile?.avatar_url ? (
                    <img 
                      src={profile.avatar_url} 
                      alt={profile?.first_name || 'User'} 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-xs font-medium text-white">
                      {profile?.first_name ? profile.first_name.charAt(0).toUpperCase() : user.email ? user.email.charAt(0).toUpperCase() : 'U'}
                    </span>
                  )}
                </motion.button>
                
                {/* Profile Dropdown Menu */}
                <AnimatePresence>
                  {profileMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      transition={{ duration: 0.1 }}
                      className="absolute right-0 mt-2 w-48 bg-popover rounded-lg shadow-lg ring-1 ring-black/5 overflow-hidden z-50"
                    >
                      <div className="p-2">
                        <div className="px-4 py-2 text-xs text-muted-foreground">
                          {profile?.first_name ? `${profile.first_name} ${profile.last_name || ''}` : user.email}
                        </div>
                        <Link to="/chat" className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-muted/50 transition-colors">
                          <MessageSquare className="h-4 w-4" />
                          <span>Chat</span>
                        </Link>
                        <Link to="/history" className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-muted/50 transition-colors">
                          <HistoryIcon className="h-4 w-4" />
                          <span>History</span>
                        </Link>
                        <Link to="/logs" className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-muted/50 transition-colors">
                          <FileText className="h-4 w-4" />
                          <span>Activity Logs</span>
                        </Link>
                        <div className="border-t border-border/20 mt-1">
                          <button 
                            onClick={signOut}
                            className="flex items-center gap-2 px-4 py-2 text-sm text-destructive/80 hover:bg-destructive/10 w-full text-left transition-colors"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
                            <span>Sign Out</span>
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <Link to="/login">
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button className="gap-2 bg-gradient-to-r from-rose-500 to-indigo-500 text-white rounded-full px-4">
                    <span>Sign In</span>
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </motion.div>
              </Link>
            )}

            {/* Mobile Menu Toggle */}
            <div className="md:hidden">
              <motion.button
                whileTap={{ scale: 0.9 }}
                className="w-9 h-9 flex items-center justify-center rounded-full text-foreground/70 hover:text-foreground hover:bg-muted transition-colors"
                onClick={() => {
                  // Add state for mobile menu toggle
                  const mobileMenuOpen = document.body.classList.contains('mobile-menu-open');
                  if (mobileMenuOpen) {
                    document.body.classList.remove('mobile-menu-open');
                  } else {
                    document.body.classList.add('mobile-menu-open');
                  }
                }}
              >
                <Menu className="h-5 w-5" />
              </motion.button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Menu (Fullscreen Overlay) */}
      <div className="mobile-menu fixed inset-0 bg-background/95 backdrop-blur-sm z-50 p-4 flex-col items-center justify-center gap-8 hidden md:hidden mobile-menu-open:flex">
        <button 
          className="absolute top-4 right-4 w-9 h-9 flex items-center justify-center rounded-full text-foreground/70 hover:text-foreground hover:bg-muted transition-colors"
          onClick={() => document.body.classList.remove('mobile-menu-open')}
        >
          <X className="h-5 w-5" />
        </button>
        
        <div className="flex flex-col items-center gap-2 mb-8">
          <HeartPulse className="h-12 w-12 text-rose-500" />
          <span className="font-bold text-2xl bg-clip-text text-transparent bg-gradient-to-r from-rose-500 to-indigo-500">
            MindfulAI
          </span>
        </div>
        
        <div className="flex flex-col items-center gap-6 w-full">
          <Link 
            to="/about" 
            className="text-lg font-medium w-full text-center py-3 hover:bg-muted rounded-lg transition-colors"
            onClick={() => document.body.classList.remove('mobile-menu-open')}
          >
            About
          </Link>
          <Link 
            to="/resources" 
            className="text-lg font-medium w-full text-center py-3 hover:bg-muted rounded-lg transition-colors"
            onClick={() => document.body.classList.remove('mobile-menu-open')}
          >
            Resources
          </Link>
          <Link 
            to="/vision-test" 
            className="text-lg font-medium w-full text-center py-3 hover:bg-muted rounded-lg transition-colors flex items-center justify-center gap-2"
            onClick={() => document.body.classList.remove('mobile-menu-open')}
          >
            <Sparkles className="h-4 w-4" />
            Vision Test
          </Link>
          <Link 
            to="/models" 
            className="text-lg font-medium w-full text-center py-3 hover:bg-muted rounded-lg transition-colors flex items-center justify-center gap-2"
            onClick={() => document.body.classList.remove('mobile-menu-open')}
          >
            <Zap className="h-4 w-4" />
            AI Models
          </Link>
          {user && (
            <Link 
              to="/history" 
              className="text-lg font-medium w-full text-center py-3 hover:bg-muted rounded-lg transition-colors"
              onClick={() => document.body.classList.remove('mobile-menu-open')}
            >
              History
            </Link>
          )}
          {user && (
            <Link 
              to="/logs" 
              className="text-lg font-medium w-full text-center py-3 hover:bg-muted rounded-lg transition-colors"
              onClick={() => document.body.classList.remove('mobile-menu-open')}
            >
              Activity Logs
            </Link>
          )}
          <Link 
            to={user ? "/chat" : "/login"} 
            className="text-lg font-medium w-full text-center py-3 mt-4 rounded-lg bg-gradient-to-r from-rose-500 to-indigo-500 text-white"
            onClick={() => document.body.classList.remove('mobile-menu-open')}
          >
            {user ? "Start Chatting" : "Sign In"}
          </Link>
        </div>
      </div>

      {/* Mobile menu styles */}
      <style>
        {`
        body.mobile-menu-open {
          overflow: hidden;
        }
        .mobile-menu-open\\:flex {
          display: none;
        }
        body.mobile-menu-open .mobile-menu-open\\:flex {
          display: flex;
        }
        `}
      </style>
    </header>
  );
}; 