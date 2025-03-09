import React, { useState } from 'react';
import { File, FileText, FileArchive, FileImage, Loader2, ExternalLink, X } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from './ui/Button';

interface DocumentPreviewProps {
  file: {
    name: string;
    url: string;
    size: number;
    type: string;
  };
  onRemove?: () => void;
}

export const DocumentPreview: React.FC<DocumentPreviewProps> = ({ file, onRemove }) => {
  const [loading, setLoading] = useState(true);
  const [previewError, setPreviewError] = useState(false);

  const fileExtension = file.name.split('.').pop()?.toLowerCase() || '';
  
  const getFileIcon = () => {
    if (fileExtension === 'pdf') return <FileText className="h-10 w-10 text-red-500" />;
    if (['doc', 'docx'].includes(fileExtension)) return <FileText className="h-10 w-10 text-blue-500" />;
    if (['jpg', 'jpeg', 'png', 'gif'].includes(fileExtension)) return <FileImage className="h-10 w-10 text-green-500" />;
    if (['zip', 'rar', '7z'].includes(fileExtension)) return <FileArchive className="h-10 w-10 text-yellow-500" />;
    return <File className="h-10 w-10 text-gray-500" />;
  };

  const fileSize = () => {
    if (file.size < 1024) return `${file.size} B`;
    if (file.size < 1024 * 1024) return `${Math.round(file.size / 1024)} KB`;
    return `${Math.round(file.size / (1024 * 1024))} MB`;
  };

  const isPdf = fileExtension === 'pdf';
  const isImage = ['jpg', 'jpeg', 'png', 'gif'].includes(fileExtension);
  const canPreview = isPdf || isImage;

  const handlePreviewLoad = () => {
    setLoading(false);
  };

  const handlePreviewError = () => {
    setPreviewError(true);
    setLoading(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="bg-card/60 backdrop-blur-sm border border-border/30 rounded-lg overflow-hidden shadow-md"
    >
      <div className="flex items-center p-3 bg-muted/30 border-b border-border/30">
        {getFileIcon()}
        <div className="ml-3 flex-1 truncate">
          <div className="text-sm font-medium truncate">{file.name}</div>
          <div className="text-xs text-muted-foreground">{fileSize()}</div>
        </div>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="ghost"
            className="h-8 w-8 p-0"
            onClick={() => window.open(file.url, '_blank')}
          >
            <ExternalLink className="h-4 w-4" />
          </Button>
          {onRemove && (
            <Button
              size="sm"
              variant="ghost"
              className="h-8 w-8 p-0"
              onClick={onRemove}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {canPreview && !previewError && (
        <div className="relative bg-muted/10 flex justify-center items-center" style={{ height: '180px' }}>
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center bg-muted/5">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          )}
          
          {isPdf && (
            <object
              data={file.url}
              type="application/pdf"
              width="100%"
              height="180"
              className={`${loading ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300`}
              onLoad={handlePreviewLoad}
              onError={handlePreviewError}
            >
              <p>Unable to display PDF</p>
            </object>
          )}
          
          {isImage && (
            <img
              src={file.url}
              alt={file.name}
              className={`max-h-full max-w-full object-contain ${loading ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300`}
              onLoad={handlePreviewLoad}
              onError={handlePreviewError}
            />
          )}
        </div>
      )}

      {(!canPreview || previewError) && (
        <div className="h-[180px] bg-muted/10 flex flex-col items-center justify-center p-4 text-center">
          <div className="mb-2">{getFileIcon()}</div>
          <p className="text-sm text-muted-foreground">
            {canPreview && previewError
              ? "Preview not available"
              : "This file type doesn't support preview"}
          </p>
        </div>
      )}
    </motion.div>
  );
}; 