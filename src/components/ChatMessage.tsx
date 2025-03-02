import React from 'react';
import { Trash2, User, Bot, Info } from 'lucide-react';
import { Button } from './ui/Button';
import { motion } from 'framer-motion';
import { cn } from '../lib/utils';
import type { Message } from '../types';

interface ChatMessageProps extends Message {
  onDelete?: () => void;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({
  role,
  content,
  timestamp,
  id,
  onDelete,
}) => {
  const isUser = role === 'user';
  const isSystem = role === 'system';
  const isTemporary = id.startsWith('temp-');
  
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

  // Format the timestamp
  const formattedTime = new Date(timestamp).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <motion.div
      variants={messageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      whileHover="hover"
      className={cn(
        'flex mb-4',
        isUser ? 'justify-end' : 'justify-start'
      )}
    >
      <div
        className={cn(
          'max-w-[80%] rounded-2xl p-4 message-transition',
          isUser
            ? 'bg-gradient-to-br from-primary to-blue-600 text-white ml-auto shadow-lg hover:shadow-xl'
            : isSystem
            ? 'bg-gradient-to-br from-amber-500 to-amber-600 text-white'
            : 'bg-secondary/80 dark:bg-secondary/50 dark:text-white backdrop-blur-sm',
          isTemporary && 'opacity-70'
        )}
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
            ) : isSystem ? (
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                <Info className="h-5 w-5 text-white" />
              </div>
            ) : (
              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center animate-float">
                <Bot className="h-5 w-5 text-primary" />
              </div>
            )}
          </motion.div>
          <div className="flex-1">
            <div className="flex justify-between items-start gap-4">
              <div className="whitespace-pre-wrap break-words">
                {content}
                {isTemporary && (
                  <span className="ml-2 text-xs italic opacity-80">
                    Sending...
                  </span>
                )}
              </div>
              {onDelete && !isTemporary && (
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
            <div className="text-xs opacity-70 text-right">
              {formattedTime}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};