import React from 'react';
import { Trash2, User, Bot } from 'lucide-react';
import { Button } from './ui/Button';
import { motion } from 'framer-motion';

interface ChatMessageProps {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  onDelete?: () => void;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({
  role,
  content,
  timestamp,
  onDelete,
}) => {
  const isUser = role === 'user';
  
  const messageVariants = {
    initial: { 
      opacity: 0,
      y: 20,
      scale: 0.95
    },
    animate: { 
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        type: "spring",
        stiffness: 260,
        damping: 20
      }
    },
    exit: { 
      opacity: 0,
      y: -20,
      transition: {
        duration: 0.2
      }
    },
    hover: {
      scale: 1.02,
      transition: {
        duration: 0.2
      }
    }
  };

  const iconVariants = {
    initial: { scale: 0 },
    animate: { 
      scale: 1,
      transition: {
        type: "spring",
        stiffness: 260,
        damping: 20,
        delay: 0.1
      }
    }
  };

  return (
    <motion.div
      variants={messageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      whileHover="hover"
      className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}
    >
      <div
        className={`max-w-[80%] rounded-2xl p-4 message-transition ${
          isUser
            ? 'bg-gradient-to-br from-primary to-blue-600 text-white ml-auto shadow-lg hover:shadow-xl'
            : 'bg-secondary/80 dark:bg-secondary/50 dark:text-white backdrop-blur-sm'
        } transform-gpu`}
      >
        <div className="flex items-start gap-3">
          <motion.div 
            variants={iconVariants}
            className={`flex-shrink-0 ${isUser ? 'order-last' : 'order-first'}`}
          >
            {isUser ? (
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center animate-pulse">
                <User className="h-5 w-5 text-white" />
              </div>
            ) : (
              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center animate-float">
                <Bot className="h-5 w-5 text-primary" />
              </div>
            )}
          </motion.div>
          <div className="flex-1">
            <p className="text-sm leading-relaxed">{content}</p>
            <span className="text-xs opacity-70 mt-2 block">
              {new Date(timestamp).toLocaleTimeString()}
            </span>
          </div>
          {isUser && onDelete && (
            <motion.div
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
            >
              <Button
                variant="ghost"
                size="sm"
                onClick={onDelete}
                className="text-white/80 hover:text-white hover:bg-white/20 transition-colors"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </motion.div>
          )}
        </div>
      </div>
    </motion.div>
  );
};