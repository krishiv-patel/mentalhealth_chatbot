import React, { useEffect, useState } from 'react';
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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingConversationId, setLoadingConversationId] = useState<string | null>(null);

  useEffect(() => {
    const loadConversations = async () => {
      setLoading(true);
      setError(null);
      try {
        await fetchConversations();
      } catch (err) {
        console.error('Error loading conversations:', err);
        setError('Failed to load conversations. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    loadConversations();
  }, [fetchConversations]);

  const handleOpenConversation = async (conversationId: string) => {
    try {
      setLoadingConversationId(conversationId);
      setError(null);
      
      await setCurrentConversation(conversationId);
      navigate('/chat');
    } catch (err) {
      console.error('Error opening conversation:', err);
      setError('Failed to open conversation. Please try again.');
    } finally {
      setLoadingConversationId(null);
    }
  };

  const handleEditTitle = async (conversationId: string, currentTitle: string) => {
    const newTitle = prompt('Edit conversation title:', currentTitle);
    if (newTitle && newTitle !== currentTitle) {
      try {
        await updateConversationTitle(conversationId, newTitle);
      } catch (err) {
        console.error('Error updating conversation title:', err);
        setError('Failed to update conversation title. Please try again.');
      }
    }
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-3xl font-semibold text-foreground/80">Conversation History</h2>
          {loading && (
            <div className="flex items-center text-muted">
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Loading...
            </div>
          )}
        </div>

        {error && (
          <div className="bg-destructive/10 text-destructive p-4 rounded-lg mb-4">
            <p>{error}</p>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => fetchConversations()}
              className="mt-2"
            >
              Try Again
            </Button>
          </div>
        )}

        <div className="bg-card/50 backdrop-blur-lg rounded-2xl shadow-xl overflow-hidden ring-1 ring-border">
          <div className="h-[600px] overflow-y-auto p-4 scroll-smooth space-y-4">
            {!loading && conversations.length === 0 ? (
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
                    className={`bg-background rounded-xl p-4 shadow-sm hover:shadow-md transition-all hover:-translate-y-1 border border-border cursor-pointer ${loadingConversationId === conversation.id ? 'opacity-70' : ''}`}
                    onClick={() => {
                      if (loadingConversationId === null) {
                        handleOpenConversation(conversation.id);
                      }
                    }}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="font-medium text-lg text-foreground">
                          {conversation.title}
                          {loadingConversationId === conversation.id && (
                            <span className="ml-2 inline-flex items-center">
                              <Loader2 className="w-3 h-3 animate-spin" />
                            </span>
                          )}
                        </h3>
                        <p className="text-sm text-muted">
                          {format(new Date(conversation.updatedAt), 'PPp')}
                        </p>
                      </div>
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditTitle(conversation.id, conversation.title);
                        }}
                        disabled={loadingConversationId !== null}
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
                        disabled={loadingConversationId !== null}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
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