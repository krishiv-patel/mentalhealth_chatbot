import React, { useEffect } from 'react';
import { ChatMessage } from '../components/ChatMessage';
import { ChatInput } from '../components/ChatInput';
import { Layout } from '../components/Layout';
import { useChatStore } from '../store/useChatStore';
import { Button } from '../components/ui/Button';
import { Trash2, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const Chat: React.FC = () => {
  const { messages, addMessage, deleteMessage, clearHistory, fetchMessages, loading } =
    useChatStore();

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  const handleSend = async (content: string) => {
    await addMessage({ role: 'user', content });
    // Simulate AI response - Replace with actual LM Studio API call
    setTimeout(() => {
      addMessage({
        role: 'assistant',
        content: 'This is a placeholder response. Integration with LM Studio API is required.',
      });
    }, 1000);
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-foreground/80">Your Conversation</h2>
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