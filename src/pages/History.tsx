import React, { useEffect } from 'react';
import { Layout } from '../components/Layout';
import { useChatStore } from '../store/useChatStore';
import { format } from 'date-fns';
import { Trash2, MessageSquare, Edit, Loader2 } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

export const History: React.FC = () => {
  const { 
    conversations, 
    fetchConversations, 
    setCurrentConversation, 
    deleteConversation,
    updateConversationTitle
  } = useChatStore();
  const navigate = useNavigate();

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  const handleOpenConversation = async (conversationId: string) => {
    await setCurrentConversation(conversationId);
    navigate('/chat');
  };

  const handleEditTitle = async (conversationId: string, currentTitle: string) => {
    const newTitle = prompt('Edit conversation title:', currentTitle);
    if (newTitle && newTitle !== currentTitle) {
      await updateConversationTitle(conversationId, newTitle);
    }
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-3xl font-semibold text-foreground/80">Conversation History</h2>
        </div>

        <div className="bg-card/50 backdrop-blur-lg rounded-2xl shadow-xl overflow-hidden ring-1 ring-border">
          <div className="h-[600px] overflow-y-auto p-4 scroll-smooth space-y-4">
            {conversations.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center p-6">
                <MessageSquare className="h-16 w-16 text-muted mb-4" />
                <h3 className="text-xl font-medium mb-2">No conversations yet</h3>
                <p className="text-muted mb-4">Your conversation history will appear here.</p>
                <Button 
                  onClick={() => navigate('/chat')}
                  className="hover-lift"
                >
                  Start a new conversation
                </Button>
              </div>
            ) : (
              <AnimatePresence initial={false}>
                {conversations.map((conversation) => (
                  <motion.div
                    key={conversation.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.2 }}
                    className="bg-background rounded-xl p-4 shadow-sm hover:shadow-md transition-all hover:-translate-y-1 border border-border cursor-pointer"
                    onClick={() => handleOpenConversation(conversation.id)}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="font-medium text-lg text-foreground">{conversation.title}</h3>
                        <p className="text-sm text-muted">
                          {format(new Date(conversation.updatedAt), 'PPp')}
                        </p>
                      </div>
                      <div className="flex space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditTitle(conversation.id, conversation.title);
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (confirm('Are you sure you want to delete this conversation?')) {
                              deleteConversation(conversation.id);
                            }
                          }}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}; 