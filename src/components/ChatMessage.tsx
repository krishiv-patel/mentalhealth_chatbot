import React, { useState } from 'react';
import { User, Pencil, Trash2, BrainCircuit, X, Image, Maximize, FileText, ArrowDown, RefreshCw, Music, Video } from 'lucide-react';
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

export const ChatMessage: React.FC<ChatMessageProps> = ({
  role,
  content,
  timestamp,
  id,
  isTemporary = false,
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
                className="h-8 rounded-md px-3 bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                Send
              </Button>
            </div>
          </div>
        ) : (
          <div className={cn(
            "prose prose-sm dark:prose-invert max-w-none",
            role === "assistant" && "prose-p:leading-relaxed prose-pre:my-3 prose-pre:bg-card prose-pre:border"
          )}>
            {/* For normal text content */}
            {!attachment && (
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  a: ({ href, children }: { href?: string; children: React.ReactNode }) => (
                    <a
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary underline hover:no-underline"
                    >
                      {children}
                    </a>
                  ),
                  pre: ({ children }: { children: React.ReactNode }) => <div className="not-prose">{children}</div>,
                  code: ({ inline, className, children }: { inline?: boolean; className?: string; children: React.ReactNode }) => {
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
                  img: ({ src, alt }: { src?: string; alt?: string }) => {
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
                }}
              >
                {content}
              </ReactMarkdown>
            )}
            
            {/* For user with attachment */}
            {attachment && role === 'user' && (
              <>
                <div className="mb-2">{content}</div>
                {/* Image attachments */}
                {attachment.type === 'image' || (attachment.name && attachment.name.match(/\.(jpeg|jpg|gif|png|webp)$/i)) ? (
                  <div 
                    className="relative group inline-block cursor-pointer overflow-hidden rounded-md border border-border max-w-full mb-1"
                    onClick={() => openLightbox(attachment.url, attachment.name)}
                  >
                    <img 
                      src={attachment.url} 
                      alt={attachment.name} 
                      className="max-h-[120px] max-w-full object-contain"
                    />
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="bg-black/40 p-1.5 rounded-full">
                        <Maximize className="h-4 w-4 text-white" />
                      </div>
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 bg-black/60 py-0.5 px-1 text-xs text-white/90 truncate">
                      {attachment.name} ({formatFileSize(attachment.size)})
                    </div>
                  </div>
                ) : 
                /* Audio attachments */
                attachment.type === 'audio' || (attachment.name && attachment.name.match(/\.(mp3|wav|ogg|aac|flac|m4a)$/i)) ? (
                  <div className="mb-2 p-2 bg-muted/30 rounded-md border border-border/50">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="bg-blue-500/10 p-2 rounded-md">
                        <Music className="h-4 w-4 text-blue-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">{attachment.name}</div>
                        <div className="text-xs text-muted-foreground">{formatFileSize(attachment.size)}</div>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => {
                          const link = document.createElement('a');
                          link.href = attachment.url;
                          link.download = attachment.name;
                          link.click();
                        }}
                        className="h-7 w-7 p-0 rounded-full"
                      >
                        <ArrowDown className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                    <audio controls className="w-full mt-1">
                      <source src={attachment.url} type={`audio/${attachment.name.split('.').pop()}`} />
                      Your browser does not support the audio element.
                    </audio>
                  </div>
                ) :
                /* Video attachments */
                attachment.type === 'video' || (attachment.name && attachment.name.match(/\.(mp4|mov|avi|webm|mkv)$/i)) ? (
                  <div className="mb-2 p-2 bg-muted/30 rounded-md border border-border/50">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="bg-purple-500/10 p-2 rounded-md">
                        <Video className="h-4 w-4 text-purple-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">{attachment.name}</div>
                        <div className="text-xs text-muted-foreground">{formatFileSize(attachment.size)}</div>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => {
                          const link = document.createElement('a');
                          link.href = attachment.url;
                          link.download = attachment.name;
                          link.click();
                        }}
                        className="h-7 w-7 p-0 rounded-full"
                      >
                        <ArrowDown className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                    <video controls className="w-full max-h-[250px] mt-1 bg-black rounded">
                      <source src={attachment.url} type={`video/${attachment.name.split('.').pop()}`} />
                      Your browser does not support the video element.
                    </video>
                  </div>
                ) : (
                  <div 
                    className="flex items-center gap-2 p-2 bg-muted/30 rounded-md border border-border/50 text-sm hover:bg-muted/50 cursor-pointer"
                    onClick={() => {
                      window.open(attachment.url, '_blank');
                    }}
                  >
                    <div className="bg-primary/10 p-2 rounded-md">
                      <FileIcon type={attachment.type || attachment.name.split('.').pop() || ''} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{attachment.name}</div>
                      <div className="text-xs text-muted-foreground">{formatFileSize(attachment.size)}</div>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        const link = document.createElement('a');
                        link.href = attachment.url;
                        link.download = attachment.name;
                        link.click();
                      }}
                      className="h-7 w-7 p-0 rounded-full"
                    >
                      <ArrowDown className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                )}
              </>
            )}
            
            {/* For assistant with attachment */}
            {attachment && role === 'assistant' && (
              <>
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    a: ({ href, children }: { href?: string; children: React.ReactNode }) => (
                      <a
                        href={href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary underline hover:no-underline"
                      >
                        {children}
                      </a>
                    ),
                    pre: ({ children }: { children: React.ReactNode }) => <div className="not-prose">{children}</div>,
                    code: ({ inline, className, children }: { inline?: boolean; className?: string; children: React.ReactNode }) => {
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
                    }
                  }}
                >
                  {content}
                </ReactMarkdown>
                
                {/* Display attached image with lightbox support */}
                {(attachment.type === 'image' || (attachment.name && attachment.name.match(/\.(jpeg|jpg|gif|png|webp)$/i))) && (
                  <div className="mb-2 mt-1">
                    <div 
                      className="relative group inline-block cursor-pointer overflow-hidden rounded-md border border-border max-w-full"
                      onClick={() => openLightbox(attachment.url, attachment.name)}
                    >
                      <img 
                        src={attachment.url} 
                        alt={attachment.name} 
                        className="max-h-[150px] max-w-full object-contain"
                      />
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="bg-black/40 p-1.5 rounded-full">
                          <Maximize className="h-4 w-4 text-white" />
                        </div>
                      </div>
                      <div className="absolute bottom-0 left-0 right-0 bg-black/60 py-0.5 px-1 text-xs text-white/90 truncate">
                        {formatFileSize(attachment.size)}
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Audio attachment */}
                {(attachment.type === 'audio' || (attachment.name && attachment.name.match(/\.(mp3|wav|ogg|aac|flac|m4a)$/i))) && (
                  <div className="mb-2 p-2 bg-muted/30 rounded-md border border-border/50 mt-2">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="bg-blue-500/10 p-2 rounded-md">
                        <Music className="h-4 w-4 text-blue-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">{attachment.name}</div>
                        <div className="text-xs text-muted-foreground">{formatFileSize(attachment.size)}</div>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => {
                          const link = document.createElement('a');
                          link.href = attachment.url;
                          link.download = attachment.name;
                          link.click();
                        }}
                        className="h-7 w-7 p-0 rounded-full"
                      >
                        <ArrowDown className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                    <audio controls className="w-full mt-1">
                      <source src={attachment.url} type={`audio/${attachment.name.split('.').pop()}`} />
                      Your browser does not support the audio element.
                    </audio>
                  </div>
                )}
                
                {/* Video attachment */}
                {(attachment.type === 'video' || (attachment.name && attachment.name.match(/\.(mp4|mov|avi|webm|mkv)$/i))) && (
                  <div className="mb-2 p-2 bg-muted/30 rounded-md border border-border/50 mt-2">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="bg-purple-500/10 p-2 rounded-md">
                        <Video className="h-4 w-4 text-purple-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">{attachment.name}</div>
                        <div className="text-xs text-muted-foreground">{formatFileSize(attachment.size)}</div>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => {
                          const link = document.createElement('a');
                          link.href = attachment.url;
                          link.download = attachment.name;
                          link.click();
                        }}
                        className="h-7 w-7 p-0 rounded-full"
                      >
                        <ArrowDown className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                    <video controls className="w-full max-h-[250px] mt-1 bg-black rounded">
                      <source src={attachment.url} type={`video/${attachment.name.split('.').pop()}`} />
                      Your browser does not support the video element.
                    </video>
                  </div>
                )}
                
                {/* Show attachment for all other file types */}
                {!(
                  attachment.type === 'image' || (attachment.name && attachment.name.match(/\.(jpeg|jpg|gif|png|webp)$/i)) ||
                  attachment.type === 'audio' || (attachment.name && attachment.name.match(/\.(mp3|wav|ogg|aac|flac|m4a)$/i)) ||
                  attachment.type === 'video' || (attachment.name && attachment.name.match(/\.(mp4|mov|avi|webm|mkv)$/i))
                ) && (
                  <div className="mt-2 flex items-center gap-2 p-2 bg-muted/30 rounded-md border border-border/50 text-sm">
                    <div className="bg-primary/10 p-2 rounded-md">
                      <FileIcon type={attachment.type || attachment.name.split('.').pop() || ''} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{attachment.name}</div>
                      <div className="text-xs text-muted-foreground">{formatFileSize(attachment.size)}</div>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        const link = document.createElement('a');
                        link.href = attachment.url;
                        link.download = attachment.name;
                        link.click();
                      }}
                      className="h-7 w-7 p-0 rounded-full"
                    >
                      <ArrowDown className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
      
      {/* Message actions */}
      <AnimatePresence>
        {!isEditing && !isTemporary && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute right-0 top-1 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1"
          >
            {/* Regenerate button only for assistant messages and if it's the last one */}
            {role === 'assistant' && isLastAssistantMessage && onRegenerate && (
              <Button 
                size="sm" 
                variant="ghost"
                onClick={onRegenerate}
                className="h-7 w-7 p-0 rounded-full"
                title="Regenerate response"
              >
                <RefreshCw className="h-3.5 w-3.5" />
              </Button>
            )}
            
            {/* Edit button for user messages */}
            {onEdit && (
              <Button 
                size="sm" 
                variant="ghost"
                onClick={handleEdit}
                className="h-7 w-7 p-0 rounded-full"
              >
                <Pencil className="h-3.5 w-3.5" />
              </Button>
            )}
            {/* Delete button for user messages */}
            {onDelete && (
              <Button 
                size="sm" 
                variant="ghost"
                onClick={() => onDelete(id)}
                className="h-7 w-7 p-0 rounded-full"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// Helper function to format file size
function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' bytes';
  else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
  else return (bytes / 1048576).toFixed(1) + ' MB';
}

// Component to display appropriate file icon based on type
const FileIcon: React.FC<{type: string}> = ({ type }) => {
  const lowerType = type.toLowerCase();
  
  if (lowerType === 'audio' || lowerType.match(/^audio\//) || lowerType.match(/^(mp3|wav|ogg|aac|flac|m4a)$/)) {
    return <Music className="h-4 w-4 text-blue-500" />;
  } else if (lowerType === 'video' || lowerType.match(/^video\//) || lowerType.match(/^(mp4|mov|avi|webm|mkv)$/)) {
    return <Video className="h-4 w-4 text-purple-500" />;
  } else if (lowerType === 'image' || lowerType.match(/^image\//) || lowerType.match(/^(jpg|jpeg|png|gif|webp|svg)$/)) {
    return <Image className="h-4 w-4 text-emerald-500" />;
  } else {
    return <FileText className="h-4 w-4 text-primary" />;
  }
};