import React, { useState, useRef, useEffect } from 'react';
import { Send, Paperclip, X, Image } from 'lucide-react';
import { Button } from './ui/Button';
import { motion, AnimatePresence } from 'framer-motion';

interface ChatInputProps {
  onSend: (message: string, file?: File) => void;
  disabled?: boolean;
}

export const ChatInput: React.FC<ChatInputProps> = ({ onSend, disabled }) => {
  const [message, setMessage] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [showAttachmentOptions, setShowAttachmentOptions] = useState(false);
  const [sendHovered, setSendHovered] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Resize textarea as content grows
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = '0px';
      const scrollHeight = textareaRef.current.scrollHeight;
      textareaRef.current.style.height = Math.min(scrollHeight, 150) + 'px';
    }
  }, [message]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() || selectedFile) {
      onSend(message, selectedFile || undefined);
      setMessage('');
      setSelectedFile(null);
      
      // Reset textarea height
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (message.trim() || selectedFile) {
        handleSubmit(e);
      }
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
        setShowAttachmentOptions(false);
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

  const promptPlaceholders = [
    "Type your message...",
    "Ask me anything...",
    "How can I help you today?",
    "Ask about document analysis..."
  ];

  const [placeholderIndex, setPlaceholderIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setPlaceholderIndex((prev) => (prev + 1) % promptPlaceholders.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div>
      <form onSubmit={handleSubmit} className="relative">
        <AnimatePresence>
          {selectedFile && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="mb-2 flex items-center gap-2 p-2 bg-card rounded-lg border"
            >
              <div className="w-2 h-full bg-primary rounded-full"></div>
              <span className="text-sm truncate flex-1">{selectedFile.name}</span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleRemoveFile}
                className="ml-auto h-7 w-7 p-0 rounded-full"
              >
                <X className="h-4 w-4" />
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
        
        <div className="flex items-end gap-2">
          <div className="relative flex-1">
            <div className={`rounded-lg border transition-all duration-300 bg-background focus-within:ring-2 focus-within:ring-primary/50 ${isFocused ? 'shadow-md scale-[1.01]' : 'shadow-sm'}`}>
              <textarea
                ref={textareaRef}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                onKeyDown={handleKeyDown}
                rows={1}
                placeholder={promptPlaceholders[placeholderIndex]}
                className="w-full rounded-lg p-3 resize-none text-foreground placeholder:text-muted-foreground focus:outline-none min-h-[44px] max-h-[150px] bg-transparent"
                disabled={disabled}
              />
              
              <div className="absolute right-2 bottom-1.5 flex items-center gap-1">
                <AnimatePresence mode="wait">
                  {!disabled && (
                    <div className="flex gap-1">
                      <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        transition={{ duration: 0.15 }}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                      >
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowAttachmentOptions(prev => !prev)}
                          className="rounded-full h-8 w-8 p-0 text-muted-foreground hover:text-foreground transition-colors duration-200"
                        >
                          <Paperclip className="h-4 w-4" />
                        </Button>
                      </motion.div>
                      
                      <AnimatePresence>
                        {showAttachmentOptions && (
                          <motion.div
                            initial={{ opacity: 0, scale: 0.8, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.8, y: 10 }}
                            className="absolute bottom-full right-0 mb-2 flex gap-1 bg-card border p-1 rounded-lg shadow-lg"
                          >
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => fileInputRef.current?.click()}
                              className="rounded-lg flex flex-col items-center p-2 h-auto text-xs font-normal"
                            >
                              <Paperclip className="h-4 w-4 mb-1" />
                              Document
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="rounded-lg flex flex-col items-center p-2 h-auto text-xs font-normal opacity-50"
                              disabled
                            >
                              <Image className="h-4 w-4 mb-1" />
                              Image
                            </Button>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
          
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            animate={
              message.trim() || selectedFile 
                ? { 
                    scale: [1, 1.05, 1],
                    transition: { 
                      duration: 0.2,
                      repeat: 0 
                    }
                  } 
                : {}
            }
          >
            <Button
              type="submit"
              disabled={disabled || (!message.trim() && !selectedFile)}
              onMouseEnter={() => setSendHovered(true)}
              onMouseLeave={() => setSendHovered(false)}
              className={`rounded-full w-10 h-10 p-0 ${
                message.trim() || selectedFile
                  ? 'bg-gradient-to-tr from-primary to-primary/90 text-white shadow-md hover:shadow-lg transition-all duration-300'
                  : 'bg-muted text-muted-foreground'
              }`}
            >
              <motion.div
                animate={{ 
                  x: sendHovered && (message.trim() || selectedFile) ? 2 : 0,
                  rotate: sendHovered && (message.trim() || selectedFile) ? 10 : 0
                }}
                transition={{ duration: 0.2 }}
              >
                <Send className="h-4 w-4" />
              </motion.div>
            </Button>
          </motion.div>
        </div>
        
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileSelect}
          className="hidden"
          accept=".pdf,.doc,.docx,.txt"
        />
      </form>
      
      <div className="flex justify-center mt-2">
        <p className="text-xs text-muted-foreground">
          Powered by <span className="font-medium text-primary">LMStudio</span> • 
          Files are processed locally
        </p>
      </div>
    </div>
  );
};