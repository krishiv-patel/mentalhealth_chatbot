import React, { useEffect } from 'react';
import { ChatMessage } from '../components/ChatMessage';
import { ChatInput } from '../components/ChatInput';
import { Layout } from '../components/Layout';
import { useChatStore } from '../store/useChatStore';
import { useProfileStore } from '../store/useProfileStore';
import { Button } from '../components/ui/Button';
import { Trash2, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const Chat: React.FC = () => {
  const { messages, addMessage, deleteMessage, clearHistory, fetchMessages, loading } =
    useChatStore();
  const { profile, fetchProfile } = useProfileStore();

  useEffect(() => {
    fetchMessages();
    fetchProfile();
  }, [fetchMessages, fetchProfile]);

  const handleSend = async (content: string) => {
    try {
      await addMessage({ role: 'user', content });
    } catch (error) {
      console.error('Error sending message:', error);
      // You might want to show an error message to the user here
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
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
              {getGreeting()} {profile?.username || 'User'}!
            </motion.span>
          </h2>
          <Button
            variant="destructive"
            size="sm"
            onClick={clearHistory}
            className="flex items-center gap-2 hover-lift"
          >
            <Trash2 className="h-4 w-4" />
            Clear History
          </Button>
        </div>
        
        <div className="bg-card/50 backdrop-blur-lg rounded-2xl shadow-xl overflow-hidden ring-1 ring-border">
          <div className="h-[600px] overflow-y-auto p-4 scroll-smooth">
            <AnimatePresence initial={false}>
              {messages.map((message) => (
                <ChatMessage
                  key={message.id}
                  {...message}
                  onDelete={
                    message.role === 'user'
                      ? () => deleteMessage(message.id)
                      : undefined
                  }
                />
              ))}
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