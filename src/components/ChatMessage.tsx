import React, { useState } from 'react';
import { User, Pencil, Trash2, BrainCircuit, X, Image, Maximize } from 'lucide-react';
import { Button } from './ui/Button';
import { cn } from '../lib/utils';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { format } from 'date-fns';
import { CodeBlock } from './CodeBlock';
import { motion, AnimatePresence } from 'framer-motion';
import type { Message } from '../types';
import type { Components } from 'react-markdown/lib/ast-to-react';

interface ChatMessageProps {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string | Date;
  id: string;
  isTemporary?: boolean;
  onEdit?: (id: string, content: string) => void;
  onDelete?: (id: string) => void;
  className?: string;
  attachment?: {
    name: string;
    url: string;
    size: number;
    type: string;
  };
}

// Define types for ReactMarkdown components props
interface LinkProps {
  href?: string;
  children: React.ReactNode;
}

interface CodeProps {
  inline?: boolean;
  className?: string;
  children: React.ReactNode;
}

interface ImageProps {
  src?: string;
  alt?: string;
}

interface PreProps {
  children: React.ReactNode;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({
  role,
  content,
  timestamp,
  id,
  isTemporary = false,
  onEdit,
  onDelete,
  className = '',
  attachment
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(content);
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const [lightboxFileName, setLightboxFileName] = useState<string>('');
  
  const handleEdit = () => {
    setIsEditing(true);
    setEditedContent(content);
  };
  
  const handleSaveEdit = () => {
    if (onEdit) {
      onEdit(id, editedContent);
    }
    setIsEditing(false);
  };
  
  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditedContent(content);
  };
  
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Escape') {
      handleCancelEdit();
    } else if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      handleSaveEdit();
    }
  };

  const openLightbox = (url: string, name: string) => {
    setLightboxImage(url);
    setLightboxFileName(name);
  };

  const closeLightbox = () => {
    setLightboxImage(null);
    setLightboxFileName('');
  };

  // Check if content contains image URLs
  const hasImageUrls = content.match(/!\[.*?\]\((.*?)\)/g);
  const isAttachmentImage = attachment?.type.startsWith('image/');

  return (
    <div 
      className={cn(
        "flex items-start gap-3 mb-6 group relative",
        role === "user" ? "flex-row" : "flex-row",
        isTemporary ? "opacity-70" : "",
        className
      )}
    >
      {/* Lightbox Modal */}
      <AnimatePresence>
        {lightboxImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
            onClick={closeLightbox}
          >
            <div className="absolute top-4 right-4 flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="text-white bg-black/20 hover:bg-black/40 rounded-full h-8 w-8 p-0"
                onClick={(e) => {
                  e.stopPropagation();
                  const link = document.createElement('a');
                  link.href = lightboxImage;
                  link.download = lightboxFileName;
                  link.click();
                }}
              >
                <Image className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="text-white bg-black/20 hover:bg-black/40 rounded-full h-8 w-8 p-0"
                onClick={closeLightbox}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <motion.div 
              className="w-full max-w-4xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="overflow-auto max-h-[80vh] rounded-lg">
                <img 
                  src={lightboxImage} 
                  alt={lightboxFileName} 
                  className="w-full h-auto object-contain"
                />
              </div>
              <div className="text-center text-white/70 mt-2 text-sm">
                {lightboxFileName}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div 
        className={cn(
          "rounded-full p-2 flex items-center justify-center",
          role === "user" 
            ? "bg-primary text-primary-foreground" 
            : "bg-muted text-muted-foreground"
        )}
      >
        {role === "user" ? (
          <User className="h-5 w-5" />
        ) : (
          <BrainCircuit className="h-5 w-5" />
        )}
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <div className="font-medium">
            {role === "user" ? "You" : "Mental Health Assistant"}
          </div>
          <div className="text-xs text-muted-foreground">
            {format(typeof timestamp === 'string' ? new Date(timestamp) : timestamp, "h:mm a")}
          </div>
        </div>
        
        {isEditing ? (
          <div className="relative">
            <textarea
              value={editedContent}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setEditedContent(e.target.value)}
              className="w-full resize-none p-3 min-h-[100px] pr-12 focus:ring-1 focus:ring-primary/50 border rounded-md bg-background"
              ref={textareaRef}
              onKeyDown={handleKeyDown}
            />
            <div className="absolute bottom-2 right-2 flex items-center gap-2">
              <Button 
                size="sm" 
                variant="ghost"
                onClick={handleCancelEdit}
                className="h-8 rounded-md px-3 hover:bg-muted/70"
              >
                Cancel
              </Button>
              <Button 
                size="sm"
                onClick={handleSaveEdit}
                className="h-8 rounded-md px-3 hover:bg-primary/90"
              >
                Save
              </Button>
            </div>
          </div>
        ) : (
          <div className={cn(
            "prose prose-sm dark:prose-invert max-w-none",
            role === "assistant" && "prose-p:leading-relaxed prose-pre:my-3 prose-pre:bg-card prose-pre:border"
          )}>
            {/* Display attached image with lightbox support */}
            {isAttachmentImage && attachment && (
              <div 
                className="relative group mb-1 inline-block cursor-pointer"
                onClick={() => openLightbox(attachment.url, attachment.name)}
              >
                <img 
                  src={attachment.url} 
                  alt={attachment.name} 
                  className="max-h-[150px] max-w-full object-contain rounded-md border border-border/50"
                />
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="bg-black/40 p-1.5 rounded-full">
                    <Maximize className="h-4 w-4 text-white" />
                  </div>
                </div>
                <div className="absolute bottom-0 left-0 right-0 bg-black/60 py-0.5 px-1 text-[10px] text-white/90 truncate">
                  {attachment.name}
                </div>
              </div>
            )}
            
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                a: ({ href, children }) => (
                  <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary underline hover:no-underline"
                  >
                    {children}
                  </a>
                ),
                pre: ({ children }) => <div className="not-prose">{children}</div>,
                code: ({ inline, className, children }) => {
                  const match = /language-(\w+)/.exec(className || "");
                  if (inline) {
                    return <code className="bg-muted px-1 py-0.5 rounded text-sm font-mono">{children}</code>;
                  }
                  return (
                    <CodeBlock
                      language={match ? match[1] : "text"}
                      code={String(children).replace(/\n$/, "")}
                    />
                  );
                },
                img: ({ src, alt }) => {
                  if (!src) return null;
                  return (
                    <div className="relative group cursor-pointer inline-block" onClick={() => openLightbox(src || '', alt || 'Image')}>
                      <img
                        src={src}
                        alt={alt || 'Image'}
                        className="max-h-[150px] max-w-full object-contain rounded-md my-1 border border-border/50"
                      />
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="bg-black/40 p-1.5 rounded-full">
                          <Maximize className="h-4 w-4 text-white" />
                        </div>
                      </div>
                      {alt && alt !== 'Image' && (
                        <div className="absolute bottom-0 left-0 right-0 bg-black/60 py-0.5 px-1 text-[10px] text-white/90 truncate">
                          {alt}
                        </div>
                      )}
                    </div>
                  );
                }
              } as Components}
            >
              {content}
            </ReactMarkdown>
          </div>
        )}
      </div>
      
      {!isEditing && role === "user" && (
        <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -right-2 top-2 flex flex-col gap-1">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 rounded-full hover:bg-muted/70 bg-card/80 shadow-md p-0"
            onClick={() => setIsEditing(true)}
          >
            <Pencil className="h-3.5 w-3.5" />
          </Button>
        </div>
      )}
      
      {role !== "user" && onDelete && !isTemporary && !isEditing && (
        <div className="flex items-center justify-end mt-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onDelete(id)}
            className="h-6 w-6 p-0 rounded-full text-muted-foreground hover:text-destructive hover:bg-destructive/10"
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      )}
    </div>
  );
};