import React, { useState } from 'react';
import { Send } from 'lucide-react';
import { Button } from './ui/Button';
import { motion } from 'framer-motion';

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
}

export const ChatInput: React.FC<ChatInputProps> = ({ onSend, disabled }) => {
  const [message, setMessage] = useState('');
  const [isFocused, setIsFocused] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim()) {
      onSend(message);
      setMessage('');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="glass-effect border-t p-4 sticky bottom-0"
    >
      <form onSubmit={handleSubmit} className="flex gap-2 max-w-4xl mx-auto">
        <div className="relative flex-1">
          <motion.div
            initial={false}
            animate={{
              scale: isFocused ? 1 : 0.98,
              boxShadow: isFocused
                ? '0 0 0 2px rgba(var(--primary), 0.3)'
                : '0 0 0 0 rgba(var(--primary), 0)',
            }}
            transition={{ duration: 0.2 }}
            className="rounded-lg overflow-hidden"
          >
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              placeholder="Type your message..."
              className="w-full rounded-lg border bg-background/50 p-3 text-foreground placeholder:text-muted-foreground focus:outline-none transition-all duration-200"
              disabled={disabled}
            />
          </motion.div>
        </div>
        <motion.div
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Button
            type="submit"
            disabled={disabled || !message.trim()}
            className="hover-lift group"
          >
            <motion.div
              animate={{ x: message.trim() ? 5 : 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
            >
              <Send className="h-5 w-5 transition-transform duration-300 group-hover:translate-x-1" />
            </motion.div>
          </Button>
        </motion.div>
      </form>
    </motion.div>
  );
};