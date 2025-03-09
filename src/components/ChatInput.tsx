import React, { useState, useRef } from 'react';
import { Send, Paperclip, X } from 'lucide-react';
import { Button } from './ui/Button';
import { motion } from 'framer-motion';

interface ChatInputProps {
  onSend: (message: string, file?: File) => void;
  disabled?: boolean;
}

export const ChatInput: React.FC<ChatInputProps> = ({ onSend, disabled }) => {
  const [message, setMessage] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() || selectedFile) {
      onSend(message, selectedFile || undefined);
      setMessage('');
      setSelectedFile(null);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Only allow document files
      if (file.type.includes('pdf') || 
          file.type.includes('document') || 
          file.type.includes('text')) {
        setSelectedFile(file);
      } else {
        alert('Please upload a document file (PDF, DOC, TXT, etc.)');
      }
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="glass-effect border-t p-4 sticky bottom-0"
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-2 max-w-4xl mx-auto">
        {selectedFile && (
          <div className="flex items-center gap-2 p-2 bg-background/50 rounded-lg">
            <span className="text-sm truncate">{selectedFile.name}</span>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleRemoveFile}
              className="ml-auto"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}
        <div className="flex gap-2">
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
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            className="hidden"
            accept=".pdf,.doc,.docx,.txt"
          />
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button
              type="button"
              variant="ghost"
              onClick={() => fileInputRef.current?.click()}
              disabled={disabled}
              className="hover-lift"
            >
              <Paperclip className="h-5 w-5" />
            </Button>
          </motion.div>
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button
              type="submit"
              disabled={disabled || (!message.trim() && !selectedFile)}
              className="hover-lift group"
            >
              <motion.div
                animate={{ x: message.trim() || selectedFile ? 5 : 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
              >
                <Send className="h-5 w-5 transition-transform duration-300 group-hover:translate-x-1" />
              </motion.div>
            </Button>
          </motion.div>
        </div>
      </form>
    </motion.div>
  );
};