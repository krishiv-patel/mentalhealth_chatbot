import React from 'react';
import { Trash2, User, Bot, Info } from 'lucide-react';
import { Button } from './ui/Button';
import { motion } from 'framer-motion';
import { cn } from '../lib/utils';
import type { Message } from '../types';
import { DocumentPreview } from './DocumentPreview';

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
      scale: 1.01,
      boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
      transition: {
        duration: 0.2
      }
    }
  };

  return (
    <motion.div
      key={id}
      initial="initial"
      animate="animate"
      exit="exit"
      whileHover={isUser ? "hover" : undefined}
      variants={messageVariants}
      layout
      className={cn(
        "flex gap-2 max-w-full",
        isUser ? "justify-end" : "justify-start"
      )}
    >
      {!isUser && (
        <div className={`flex-shrink-0 w-8 h-8 rounded-full ${isSystem ? 'bg-blue-500/20' : 'bg-gradient-to-br from-primary/20 to-rose-500/20'} flex items-center justify-center mt-1`}>
          {isSystem ? (
            <Info className="h-4 w-4 text-blue-500" />
          ) : (
            <Bot className="h-4 w-4 text-primary-foreground" />
          )}
        </div>
      )}
      
      <div
        className={cn(
          "relative group flex-1 overflow-hidden",
          isUser 
            ? "items-end" 
            : "items-start",
          isSystem
            ? "max-w-full"
            : "max-w-[85%]"
        )}
      >
        <motion.div 
          className={cn(
            "p-4 rounded-lg shadow-sm",
            isTemporary && "opacity-70",
            isUser 
              ? "bg-gradient-to-r from-primary/90 to-primary/80 text-primary-foreground rounded-tr-none" 
              : isSystem 
                ? "bg-blue-500/10 border border-blue-500/20"
                : "bg-card/80 backdrop-blur-sm border border-border/50 rounded-tl-none"
          )}
        >
          {attachment && (
            <div className="mb-3">
              <DocumentPreview 
                file={{
                  name: attachment.name,
                  url: attachment.url,
                  size: attachment.size,
                  type: attachment.type
                }}
              />
            </div>
          )}
          
          <div className="prose dark:prose-invert max-w-none">
            {content.split('\n').map((paragraph, i) => (
              <p key={i} className={paragraph.trim() === '' ? 'h-4' : ''}>{paragraph}</p>
            ))}
          </div>
        </motion.div>
        
        <div className="flex items-center justify-end mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {onDelete && !isTemporary && (
            <Button
              size="sm"
              variant="ghost"
              onClick={onDelete}
              className="h-6 w-6 p-0 rounded-full text-muted-foreground hover:text-destructive"
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          )}
          <span className="text-xs text-muted-foreground">
            {timestamp && new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
      </div>
      
      {isUser && (
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-primary/20 to-primary/30 flex items-center justify-center mt-1">
          <User className="h-4 w-4 text-primary" />
        </div>
      )}
    </motion.div>
  );
};