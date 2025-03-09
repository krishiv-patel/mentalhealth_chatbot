import React, { useEffect, useState } from 'react';
import { ChatMessage } from '../components/ChatMessage';
import { ChatInput } from '../components/ChatInput';
import { Layout } from '../components/Layout';
import { useChatStore } from '../store/useChatStore';
import { useProfileStore } from '../store/useProfileStore';
import { Button } from '../components/ui/Button';
import { Trash2, Loader2, Plus, AlertCircle, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';

export const Chat: React.FC = () => {
  const { 
    messages, 
    addMessage, 
    deleteMessage, 
    clearHistory, 
    fetchMessages, 
    loading, 
    startNewConversation, 
    currentConversationId,
    error,
    clearError
  } = useChatStore();
  const { profile, fetchProfile } = useProfileStore();
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUser = async () => {
      const { data, error } = await supabase.auth.getUser();
      if (error) {
        console.error('Error fetching user:', error);
      } else {
        setUserEmail(data.user?.email?.split('@')[0] || null);
      }
    };
    fetchUser();
    fetchMessages();
    fetchProfile();
  }, [fetchMessages, fetchProfile]);

  const handleSend = async (content: string, file?: File) => {
    try {
      await addMessage({ role: 'user', content }, file);
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  const handleNewChat = () => {
    startNewConversation();
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-3xl font-semibold text-foreground/80">
            <motion.span
              initial={{ x: -200, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.8, ease: 'easeOut' }}>
              {getGreeting()} {profile && profile.first_name && profile.last_name 
                ? `${profile.first_name} ${profile.last_name}` 
                : userEmail || 'User'}!
            </motion.span>
          </h2>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleNewChat}
              className="flex items-center gap-2 hover-lift"
            >
              <Plus className="h-4 w-4" />
              New Chat
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={clearHistory}
              className="flex items-center gap-2 hover-lift"
            >
              <Trash2 className="h-4 w-4" />
              Clear All History
            </Button>
          </div>
        </div>
        
        {error && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-destructive/10 text-destructive mb-4 p-3 rounded-lg flex items-center justify-between"
          >
            <div className="flex items-center">
              <AlertCircle className="h-4 w-4 mr-2" />
              <span>{error}</span>
            </div>
            <Button 
              size="sm" 
              variant="ghost" 
              onClick={clearError}
              className="h-6 w-6 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </motion.div>
        )}
        
        <div className="bg-card/50 backdrop-blur-lg rounded-2xl shadow-xl overflow-hidden ring-1 ring-border">
          <div className="h-[600px] overflow-y-auto p-4 scroll-smooth">
            <AnimatePresence initial={false}>
              {messages.length === 0 && !currentConversationId ? (
                <div className="flex flex-col items-center justify-center h-96 text-center p-6">
                  <h3 className="text-xl font-medium mb-2">Start a new conversation</h3>
                  <p className="text-muted mb-4">Type a message or upload a document to begin chatting.</p>
                </div>
              ) : (
                messages.map((message) => (
                  <ChatMessage
                    key={message.id}
                    {...message}
                    onDelete={
                      message.role === 'user'
                        ? () => deleteMessage(message.id)
                        : undefined
                    }
                  />
                ))
              )}
            </AnimatePresence>
            
            {loading && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex justify-center py-4"
              >
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </motion.div>
            )}
          </div>
          <ChatInput onSend={handleSend} disabled={loading} />
        </div>
      </div>
    </Layout>
  );
};