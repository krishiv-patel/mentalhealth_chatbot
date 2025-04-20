import React, { useState, useRef, useEffect } from 'react';
import { Send, Paperclip, X, Image, Loader2, FileText, Square, FileImage, Plus, Maximize, MinusCircle, Eye, HelpCircle, Music, Mic, MicOff, Video } from 'lucide-react';
import { Button } from './ui/Button';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../lib/utils';

interface ChatInputProps {
  onSend: (message: string, files?: File[]) => void;
  onStopGeneration?: () => void;
  onAnalyzeWithVision?: (message: string, files: File[]) => void;
  disabled?: boolean;
  isGenerating?: boolean;
  apiMode?: 'lmstudio' | 'gemini';
}

interface FileWithPreview {
  file: File;
  previewUrl: string | null;
  id: string; // Unique ID for each file
}

export const ChatInput: React.FC<ChatInputProps> = ({ 
  onSend, 
  onStopGeneration, 
  onAnalyzeWithVision,
  disabled = false, 
  isGenerating = false,
  apiMode = 'lmstudio'
}) => {
  const [message, setMessage] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<FileWithPreview[]>([]);
  const [showAttachmentOptions, setShowAttachmentOptions] = useState(false);
  const [sendHovered, setSendHovered] = useState(false);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const [lightboxFileName, setLightboxFileName] = useState<string>('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const [fileUploading, setFileUploading] = useState(false);
  const [fileUploadingName, setFileUploadingName] = useState('');
  const [useVisionAnalysis, setUseVisionAnalysis] = useState(true);
  const [isListening, setIsListening] = useState(false);
  const [isSpeechSupported, setIsSpeechSupported] = useState(false);
  const [temporaryTranscript, setTemporaryTranscript] = useState('');
  
  // Simple check if the browser supports speech recognition
  useEffect(() => {
    setIsSpeechSupported(
      'webkitSpeechRecognition' in window || 
      'SpeechRecognition' in window
    );
  }, []);

  // Resize textarea as content grows
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = '0px';
      const scrollHeight = textareaRef.current.scrollHeight;
      textareaRef.current.style.height = Math.min(scrollHeight, 150) + 'px';
    }
  }, [message]);

  // Clean up the object URLs when component unmounts
  useEffect(() => {
    return () => {
      selectedFiles.forEach(fileObj => {
        if (fileObj.previewUrl) {
          URL.revokeObjectURL(fileObj.previewUrl);
        }
      });
    };
  }, [selectedFiles]);

  // Set vision to true whenever files are added
  useEffect(() => {
    if (selectedFiles.length > 0 && apiMode === 'gemini') {
      setUseVisionAnalysis(true);
    }
  }, [selectedFiles, apiMode]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isGenerating) {
      if (onStopGeneration) onStopGeneration();
      return;
    }
    
    if (message.trim() || selectedFiles.length > 0) {
      if (useVisionAnalysis && onAnalyzeWithVision && selectedFiles.length > 0 && apiMode === 'gemini') {
        // Use Vision API for analysis
        onAnalyzeWithVision(message, selectedFiles.map(f => f.file));
      } else {
        // Use regular chat
        onSend(message, selectedFiles.map(f => f.file));
      }
      
      setMessage('');
      
      // Clean up preview URLs before clearing files
      selectedFiles.forEach(fileObj => {
        if (fileObj.previewUrl) {
          URL.revokeObjectURL(fileObj.previewUrl);
        }
      });
      setSelectedFiles([]);
      // Keep vision set to true
      setUseVisionAnalysis(true);
      
      // Reset textarea height
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Send message with Enter (without Shift) or Ctrl+Enter
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey || (!e.shiftKey && !isFocused))) {
      e.preventDefault();
      
      if (isGenerating) {
        if (onStopGeneration) onStopGeneration();
      } else if (message.trim() || selectedFiles.length > 0) {
        handleSubmit(e);
      }
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    // Create new file objects for each selected file
    const newFiles: FileWithPreview[] = Array.from(files).map(file => {
      // Create preview URL for images
      const previewUrl = file.type.startsWith('image/') 
        ? URL.createObjectURL(file) 
        : null;
        
      return {
        file,
        previewUrl,
        id: `file-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      };
    });
    
    setSelectedFiles(prev => [...prev, ...newFiles]);
    setShowAttachmentOptions(false);
    
    // Reset the input value so the same file can be selected again
    e.target.value = '';
  };

  const handleRemoveFile = (id: string) => {
    setSelectedFiles(prev => {
      const fileToRemove = prev.find(f => f.id === id);
      if (fileToRemove?.previewUrl) {
        URL.revokeObjectURL(fileToRemove.previewUrl);
      }
      return prev.filter(f => f.id !== id);
    });
  };

  const clearAllFiles = () => {
    selectedFiles.forEach(fileObj => {
      if (fileObj.previewUrl) {
        URL.revokeObjectURL(fileObj.previewUrl);
      }
    });
    setSelectedFiles([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    if (imageInputRef.current) {
      imageInputRef.current.value = '';
    }
    if (audioInputRef.current) {
      audioInputRef.current.value = '';
    }
    if (videoInputRef.current) {
      videoInputRef.current.value = '';
    }
  };

  const handleImageClick = (previewUrl: string, fileName: string) => {
    setLightboxImage(previewUrl);
    setLightboxFileName(fileName);
  };

  const closeLightbox = () => {
    setLightboxImage(null);
    setLightboxFileName('');
  };

  // Speech recognition functionality
  const toggleSpeechRecognition = () => {
    if (isListening) {
      stopSpeechRecognition();
    } else {
      startSpeechRecognition();
    }
  };

  const startSpeechRecognition = () => {
    try {
      // Reset temporary transcript when starting a new recording
      setTemporaryTranscript('');
      
      // Use any to bypass TypeScript errors
      // This is a workaround for the Web Speech API which doesn't have full TypeScript support
      const SpeechRecognition = (window as any).SpeechRecognition || 
                               (window as any).webkitSpeechRecognition;
      
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = false; // Don't show interim results
        recognition.lang = 'en-US';  // You can make this configurable
        
        recognition.onstart = () => {
          setIsListening(true);
        };
        
        recognition.onresult = (event: any) => {
          // Handle speech recognition results
          let transcript = '';
          
          for (let i = 0; i < event.results.length; i++) {
            if (event.results[i][0].transcript) {
              transcript += event.results[i][0].transcript + ' ';
            }
          }
          
          if (transcript) {
            // Store in temporary transcript instead of directly in message
            setTemporaryTranscript(transcript.trim());
          }
        };
        
        recognition.onerror = (event: any) => {
          console.error('Speech recognition error', event.error);
          setIsListening(false);
          // If there's a usable transcript despite the error, apply it
          if (temporaryTranscript) {
            appendTranscriptToMessage(temporaryTranscript);
          }
        };
        
        recognition.onend = () => {
          setIsListening(false);
          // We don't automatically append the transcript here
          // It will be handled in stopSpeechRecognition
        };
        
        // Store the recognition instance in a global variable
        // so we can access it in the cleanup function
        (window as any).recognition = recognition;
        
        recognition.start();
      }
    } catch (error) {
      console.error('Error starting speech recognition:', error);
      setIsListening(false);
    }
  };

  const appendTranscriptToMessage = (transcript: string) => {
    if (!transcript) return;
    
    setMessage(prev => {
      // If we already had text, make sure there's a space
      return prev.trim().length > 0 ? `${prev.trim()} ${transcript}` : transcript;
    });
    
    // Focus the textarea and clear the temporary transcript
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
    setTemporaryTranscript('');
  };

  const stopSpeechRecognition = () => {
    try {
      if ((window as any).recognition) {
        (window as any).recognition.stop();
        
        // When stopping, append the temporary transcript to the message
        if (temporaryTranscript) {
          appendTranscriptToMessage(temporaryTranscript);
        }
        
        setIsListening(false);
      }
    } catch (error) {
      console.error('Error stopping speech recognition:', error);
      setIsListening(false);
      
      // Try to append transcript even if there was an error stopping
      if (temporaryTranscript) {
        appendTranscriptToMessage(temporaryTranscript);
      }
    }
  };

  // Clean up speech recognition on unmount
  useEffect(() => {
    return () => {
      if ((window as any).recognition) {
        try {
          (window as any).recognition.stop();
        } catch (error) {
          console.error('Error cleaning up speech recognition:', error);
        }
      }
    };
  }, []);

  const promptPlaceholders = [
    "Type your message...",
    "Ask me anything...",
    "How can I help you today?"
  ];

  const [placeholderIndex, setPlaceholderIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setPlaceholderIndex((prev) => (prev + 1) % promptPlaceholders.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  // Add a global key handler for Ctrl+Enter
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      // Close lightbox on Escape key
      if (e.key === 'Escape' && lightboxImage) {
        closeLightbox();
        return;
      }
      
      // Only handle Ctrl+Enter if we're not already in the textarea
      if (e.key === 'Enter' && (e.ctrlKey || e.metaKey) && 
          document.activeElement !== textareaRef.current) {
        if (isGenerating) {
          if (onStopGeneration) onStopGeneration();
        } else if (message.trim() || selectedFiles.length > 0) {
          handleSubmit(e as any);
        }
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [isGenerating, message, selectedFiles, onStopGeneration, lightboxImage]);

  const hasImages = selectedFiles.some(f => f.file.type.startsWith('image/'));

  const renderVisionToggle = () => {
    // Return null to hide the vision toggle completely
    return null;
  };

  const renderAttachmentOptions = () => {
    return (
      <div className="flex items-center space-x-2">
        {isSpeechSupported && (
          <button
            type="button"
            onClick={toggleSpeechRecognition}
            className={`p-1 rounded-full transition-colors ${
              isListening 
                ? 'text-red-500 animate-pulse bg-red-100 dark:bg-red-900/30' 
                : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800'
            }`}
            title={isListening ? "Stop recording" : "Start voice input"}
          >
            {isListening ? (
              <MicOff className="h-5 w-5" />
            ) : (
              <Mic className="h-5 w-5" />
            )}
          </button>
        )}
        <button
          type="button"
          className={`text-gray-500 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors ${showAttachmentOptions ? 'bg-gray-100 dark:bg-gray-800' : ''}`}
          onClick={() => setShowAttachmentOptions(!showAttachmentOptions)}
        >
          <Paperclip className="h-5 w-5" />
        </button>
      </div>
    );
  };

  const renderSubmitButton = () => {
    return (
      <Button
        type="submit"
        disabled={disabled || (!message.trim() && selectedFiles.length === 0)}
        variant="ghost"
        size="sm"
        className={cn(
          "rounded-full",
          isGenerating ? "bg-red-500 text-white hover:bg-red-600 hover:text-white" : "text-primary",
          (!message.trim() && selectedFiles.length === 0) ? "opacity-50 cursor-not-allowed" : "",
          sendHovered ? "bg-primary/10" : ""
        )}
        onMouseEnter={() => setSendHovered(true)}
        onMouseLeave={() => setSendHovered(false)}
      >
        {isGenerating ? (
          <Square className="h-5 w-5" />
        ) : (
          <Send className="h-5 w-5" />
        )}
      </Button>
    );
  };

  // Helper function to get file icon by type
  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith('image/')) {
      return <Image className="h-3 w-3 text-primary flex-shrink-0" />;
    } else if (fileType.startsWith('audio/')) {
      return <Music className="h-3 w-3 text-blue-500 flex-shrink-0" />;
    } else {
      return <FileText className="h-3 w-3 text-primary flex-shrink-0" />;
    }
  };

  return (
    <div className="relative">
      {/* Image Lightbox */}
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

      {fileUploading && (
        <div className="mb-3 p-2.5 bg-card border rounded-lg shadow-sm flex items-center justify-between">
          <div className="flex items-center">
            <Loader2 className="animate-spin h-4 w-4 mr-2 text-muted-foreground" />
            <span className="text-sm">Uploading {fileUploadingName}...</span>
          </div>
        </div>
      )}
      
      {selectedFiles.length > 0 && (
        <div className="mb-2 p-2 bg-card border rounded-lg shadow-sm">
          <div className="flex items-center justify-between mb-1">
            <div className="text-xs font-medium">
              {selectedFiles.length} {selectedFiles.length === 1 ? 'file' : 'files'} attached
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={clearAllFiles}
              className="h-6 px-2 text-xs hover:bg-destructive/10 hover:text-destructive"
            >
              <X className="h-3 w-3 mr-1" />
              Clear all
            </Button>
          </div>
          
          {hasImages ? (
            <div className="mt-1 grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-1">
              {selectedFiles.map((fileObj) => 
                fileObj.previewUrl ? (
                  <div 
                    key={`preview-${fileObj.id}`} 
                    className="relative rounded-md overflow-hidden border border-border/50 group aspect-square cursor-pointer"
                    onClick={() => handleImageClick(fileObj.previewUrl!, fileObj.file.name)}
                  >
                    <img 
                      src={fileObj.previewUrl} 
                      alt={fileObj.file.name}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveFile(fileObj.id);
                        }}
                        className="h-6 w-6 p-0 rounded-full bg-white/20 hover:bg-white/30 text-white"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 bg-black/60 py-0.5 px-1">
                      <div className="text-[10px] text-white/90 truncate">
                        {fileObj.file.name}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div 
                    key={`file-${fileObj.id}`} 
                    className="relative flex items-center rounded-md border border-border/50 p-1 gap-1 text-xs"
                  >
                    {getFileIcon(fileObj.file.type)}
                    <div className="flex-1 truncate">{fileObj.file.name}</div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveFile(fileObj.id)}
                      className="h-5 w-5 p-0 rounded-full hover:bg-destructive/10 hover:text-destructive flex-shrink-0"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                )
              )}
              <Button
                onClick={() => imageInputRef.current?.click()}
                variant="outline"
                className="flex flex-col items-center justify-center h-full aspect-square border-dashed border-2 rounded-md hover:bg-background/50"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <div className="flex flex-wrap gap-1 mt-1">
              {selectedFiles.map((fileObj) => (
                <div key={fileObj.id} className="flex items-center gap-1 py-0.5 px-2 rounded-full bg-background border text-xs">
                  {getFileIcon(fileObj.file.type)}
                  <span className="truncate max-w-[150px]">{fileObj.file.name}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveFile(fileObj.id)}
                    className="h-5 w-5 p-0 rounded-full hover:bg-destructive/10 hover:text-destructive flex-shrink-0 ml-1"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        <div className="relative">
          <textarea
            ref={textareaRef}
            className={cn(
              "w-full p-3.5 pr-16 rounded-xl border resize-none focus:ring-1 focus:ring-primary focus:outline-none",
              isGenerating ? "bg-muted/30" : "bg-background dark:bg-card",
              isListening ? "border-red-500 focus:ring-red-500" : ""
            )}
            placeholder={isListening ? "Listening..." : isGenerating ? "Generating response..." : promptPlaceholders[placeholderIndex]}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            onKeyDown={handleKeyDown}
            rows={1}
            disabled={disabled}
            style={{ 
              minHeight: isFocused ? "120px" : "", 
              maxHeight: "400px" 
            }}
          />
          
          <div className="absolute right-2 bottom-2 flex gap-1.5 items-center">
            {renderAttachmentOptions()}
            
            {renderSubmitButton()}
          </div>
        </div>
      </form>
      
      {showAttachmentOptions && !isGenerating && (
        <div className="absolute right-14 bottom-16 bg-card/90 backdrop-blur-sm border shadow-md rounded-lg p-3 z-10">
          <div className="flex flex-col gap-2.5">
            <Button 
              onClick={() => {
                fileInputRef.current?.click();
                setShowAttachmentOptions(false);
              }}
              variant="ghost"
              className="flex items-center justify-start gap-2 h-9 px-3 hover:bg-background"
            >
              <FileText className="h-4 w-4" />
              <span>File</span>
            </Button>
            <Button 
              onClick={() => {
                imageInputRef.current?.click();
                setShowAttachmentOptions(false);
              }}
              variant="ghost"
              className="flex items-center justify-start gap-2 h-9 px-3 hover:bg-background"
            >
              <Image className="h-4 w-4" />
              <span>Image</span>
            </Button>
            <Button 
              onClick={() => {
                audioInputRef.current?.click();
                setShowAttachmentOptions(false);
              }}
              variant="ghost"
              className="flex items-center justify-start gap-2 h-9 px-3 hover:bg-background"
            >
              <Music className="h-4 w-4" />
              <span>Audio</span>
            </Button>
            <Button 
              onClick={() => {
                videoInputRef.current?.click();
                setShowAttachmentOptions(false);
              }}
              variant="ghost"
              className="flex items-center justify-start gap-2 h-9 px-3 hover:bg-background"
            >
              <Video className="h-4 w-4" />
              <span>Video</span>
            </Button>
          </div>
        </div>
      )}
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        onChange={handleFileSelect}
        accept="*"
      />
      <input
        ref={imageInputRef}
        type="file"
        className="hidden"
        onChange={handleFileSelect}
        accept="image/*"
        multiple
      />
      <input
        ref={audioInputRef}
        type="file"
        className="hidden"
        onChange={handleFileSelect}
        accept="audio/*"
      />
      <input
        ref={videoInputRef}
        type="file"
        className="hidden"
        onChange={handleFileSelect}
        accept="video/*"
      />
    </div>
  );
};