import React, { useState } from 'react';
import { User, Pencil, Trash2, BrainCircuit, X, Image, Maximize, FileText, ArrowDown, RefreshCw, Music, Video, Loader2 } from 'lucide-react';
import { Button } from './ui/Button';
import { cn } from '../lib/utils';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { format } from 'date-fns';
import { CodeBlock } from './CodeBlock';
import { motion, AnimatePresence } from 'framer-motion';
import type { Message } from '../types';

// Define types for ReactMarkdown components props
interface MarkdownComponentProps {
  a: React.FC<{ href?: string; children: React.ReactNode }>;
  pre: React.FC<{ children: React.ReactNode }>;
  code: React.FC<{ inline?: boolean; className?: string; children: React.ReactNode }>;
  img: React.FC<{ src?: string; alt?: string }>;
}

interface ChatMessageProps {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string | Date;
  id: string;
  isTemporary?: boolean;
  isThinking?: boolean;
  onEdit?: (id: string, content: string) => void;
  onDelete?: (id: string) => void;
  className?: string;
  attachment?: {
    type?: string;
    name: string;
    url: string;
    size: number;
  };
  isLastAssistantMessage?: boolean;
  onRegenerate?: () => void;
}

// Add a ThinkingIndicator component
const ThinkingIndicator: React.FC = () => (
  <div className="flex items-center gap-4 py-2">
    <div className="flex items-center gap-2">
      <div className="animate-pulse">
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
      </div>
      <div className="text-sm text-muted-foreground">
        <span className="animate-pulse">Thinking</span>
        <span className="inline-flex">
          <span className="animate-[blink_1.4s_infinite]">.</span>
          <span className="animate-[blink_1.4s_0.2s_infinite]">.</span>
          <span className="animate-[blink_1.4s_0.4s_infinite]">.</span>
        </span>
      </div>
    </div>
  </div>
);

export const ChatMessage: React.FC<ChatMessageProps> = ({
  role,
  content,
  timestamp,
  id,
  isTemporary = false,
  isThinking = false,
  onEdit,
  onDelete,
  className = '',
  attachment,
  isLastAssistantMessage = false,
  onRegenerate
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
  const isAttachmentImage = attachment?.type?.startsWith('image/');

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
              autoFocus
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
                className="h-8 rounded-md px-3"
              >
                Save
              </Button>
            </div>
          </div>
        ) : (
          <div className="prose prose-zinc dark:prose-invert prose-p:leading-relaxed prose-pre:p-0 max-w-none break-words text-sm">
            {/* For thinking state or normal content */}
            {isThinking ? (
              <ThinkingIndicator />
            ) : !attachment ? (
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  // Define custom components for markdown rendering
                  a: ({ href, children }) => {
                    const isInternal = href && !href.startsWith('http');
                    return (
                      <a
                        href={href}
                        target={isInternal ? '_self' : '_blank'}
                        rel={!isInternal ? 'noopener noreferrer' : undefined}
                        className="text-primary hover:underline underline-offset-4"
                      >
                        {children}
                      </a>
                    );
                  },
                  pre: ({ children }) => {
                    return <div className="not-prose">{children}</div>;
                  },
                  code: ({ inline, className, children }) => {
                    if (inline) {
                      return (
                        <code className="px-1 py-0.5 rounded-sm bg-muted font-mono text-sm">
                          {children}
                        </code>
                      );
                    }
                    
                    const language = (className || '').replace(/language-/, '');
                    return (
                      <CodeBlock language={language || 'text'} value={String(children).replace(/\n$/, '')} />
                    );
                  },
                  img: ({ src, alt }) => {
                    if (!src) return null;
                    
                    return (
                      <div className="relative my-4 overflow-hidden rounded-lg border bg-card">
                        <div className="flex items-center justify-between px-4 py-2 border-b">
                          <div className="text-sm font-medium">{alt || 'Image'}</div>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 rounded-full"
                            onClick={() => openLightbox(src, alt || 'Image')}
                          >
                            <Maximize className="h-4 w-4" />
                          </Button>
                        </div>
                        <div className="p-4" onClick={() => openLightbox(src, alt || 'Image')}>
                          <img
                            src={src}
                            alt={alt || 'Image'}
                            className="rounded-lg cursor-pointer transition-all hover:scale-[1.02] hover:shadow-md max-h-[500px] object-contain"
                          />
                        </div>
                      </div>
                    );
                  }
                }}
              >
                {content}
              </ReactMarkdown>
            ) : (
              <div className="mt-4">
                {attachment.type === 'image' && (
                  <div className="relative rounded-lg overflow-hidden border bg-card">
                    <div className="flex items-center justify-between px-4 py-2 border-b">
                      <div className="flex items-center gap-2">
                        <Image className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium truncate">
                          {attachment.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 rounded-full"
                          onClick={() => openLightbox(attachment.url, attachment.name)}
                        >
                          <Maximize className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <div 
                      className="p-4 cursor-pointer"
                      onClick={() => openLightbox(attachment.url, attachment.name)}
                    >
                      <img
                        src={attachment.url}
                        alt={attachment.name}
                        className="rounded-lg w-full max-h-[400px] object-contain"
                      />
                    </div>
                  </div>
                )}
                
                {(attachment.type === 'document' || attachment.type === 'audio' || attachment.type === 'video') && (
                  <div className="border rounded-lg overflow-hidden bg-card">
                    <div className="flex items-center justify-between px-4 py-3 border-b">
                      <div className="flex items-center gap-2">
                        <FileIcon type={attachment.type} />
                        <span className="text-sm font-medium truncate">
                          {attachment.name}
                        </span>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {formatFileSize(attachment.size)}
                      </div>
                    </div>
                    <div className="p-4">
                      {attachment.type === 'audio' && (
                        <audio
                          controls
                          className="w-full"
                          src={attachment.url}
                        />
                      )}
                      {attachment.type === 'video' && (
                        <div className="flex justify-center items-center">
                          <video
                            controls
                            className="w-full max-w-[400px] max-h-[300px] rounded-lg"
                            src={attachment.url}
                          />
                        </div>
                      )}
                      {attachment.type === 'document' && (
                        <a
                          href={attachment.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 py-2 px-3 bg-muted rounded-md text-primary-foreground text-sm hover:bg-muted/80 transition-colors"
                        >
                          <FileText className="h-4 w-4" />
                          <span>View Document</span>
                        </a>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
            
            {/* Regenerate Button for the Last Assistant Message */}
            {isLastAssistantMessage && !isThinking && onRegenerate && (
              <div className="mt-4 flex justify-end">
                <Button
                  size="sm"
                  variant="outline"
                  className="flex items-center gap-1"
                  onClick={onRegenerate}
                >
                  <RefreshCw className="h-3 w-3" />
                  <span className="text-xs">Regenerate</span>
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* Button row - only show for user messages and when not in editing mode */}
      {(role === 'user' && !isEditing && (onEdit || onDelete)) && (
        <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute right-0 top-8 flex gap-1">
          {onEdit && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleEdit}
              className="h-8 w-8 p-0 rounded-full"
            >
              <Pencil className="h-4 w-4" />
            </Button>
          )}
          {onDelete && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDelete(id)}
              className="h-8 w-8 p-0 rounded-full text-destructive hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
  else if (bytes < 1073741824) return (bytes / 1048576).toFixed(1) + ' MB';
  else return (bytes / 1073741824).toFixed(1) + ' GB';
}

const FileIcon: React.FC<{type: string}> = ({ type }) => {
  switch (type) {
    case 'audio':
      return <Music className="h-4 w-4 text-blue-500" />;
    case 'video':
      return <Video className="h-4 w-4 text-red-500" />;
    default:
      return <FileText className="h-4 w-4 text-gray-500" />;
  }
};