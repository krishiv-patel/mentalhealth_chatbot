import React from 'react';
import { Trash2, User, Bot, Info, FileText, Download } from 'lucide-react';
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
  attachment
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
        'flex gap-3 p-4 rounded-lg',
        isUser ? 'bg-primary/10' : 'bg-muted/50',
        isTemporary && 'opacity-50'
      )}
    >
      <div className="flex-shrink-0">
        {isUser ? (
          <User className="h-6 w-6" />
        ) : isSystem ? (
          <Info className="h-6 w-6" />
        ) : (
          <Bot className="h-6 w-6" />
        )}
      </div>
      <div className="flex-1 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">
            {isUser ? 'You' : isSystem ? 'System' : 'Assistant'}
          </span>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">{timestamp}</span>
            {onDelete && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onDelete}
                className="opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
        <div className="space-y-2">
          <p className="text-sm leading-relaxed">{content}</p>
          {attachment && (
            <div className="flex items-center gap-2 p-2 bg-background/50 rounded-lg">
              <FileText className="h-5 w-5 text-muted-foreground" />
              <span className="text-sm truncate flex-1">
                {attachment.name} ({Math.round(attachment.size / 1024)}KB)
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => window.open(attachment.url, '_blank')}
                className="ml-2"
              >
                <Download className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};