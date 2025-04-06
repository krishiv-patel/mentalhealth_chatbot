import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, Image as ImageIcon, File as FileIcon, X, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from './ui/Button';
import { File } from '../types/file';

interface FileUploaderProps {
  onFilesUploaded: (files: File[]) => void;
  maxFiles?: number;
  maxSize?: number; // in bytes
  acceptedFileTypes?: string[];
}

export const FileUploader: React.FC<FileUploaderProps> = ({
  onFilesUploaded,
  maxFiles = 10,
  maxSize = 20 * 1024 * 1024, // 20MB
  acceptedFileTypes = ['image/*', 'video/*'],
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onDrop = useCallback(
    async (acceptedFiles: globalThis.File[]) => {
      if (acceptedFiles.length === 0) return;

      setIsUploading(true);
      setError(null);

      try {
        const processedFiles: File[] = await Promise.all(
          acceptedFiles.map(async (file) => {
            // Convert the file to base64
            const base64Data = await readFileAsBase64(file);

            return {
              id: `file-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              name: file.name,
              size: file.size,
              type: file.type,
              mimeType: file.type,
              base64Data,
              lastModified: file.lastModified,
            };
          })
        );

        onFilesUploaded(processedFiles);
      } catch (err) {
        setError('Error processing files. Please try again.');
        console.error('File upload error:', err);
      } finally {
        setIsUploading(false);
      }
    },
    [onFilesUploaded]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    maxFiles,
    maxSize,
    accept: acceptedFileTypes.reduce((acc, type) => {
      acc[type] = [];
      return acc;
    }, {} as Record<string, string[]>),
    onDropRejected: (fileRejections) => {
      const errors = fileRejections.map((rejection) => {
        if (rejection.errors.find((e) => e.code === 'file-too-large')) {
          return `File "${rejection.file.name}" is too large. Maximum size is ${formatBytes(maxSize)}.`;
        }
        if (rejection.errors.find((e) => e.code === 'file-invalid-type')) {
          return `File "${rejection.file.name}" has an invalid type. Accepted types: ${acceptedFileTypes.join(', ')}.`;
        }
        return `File "${rejection.file.name}" was rejected: ${rejection.errors.map((e) => e.message).join(', ')}`;
      });
      setError(errors.join(' '));
    },
  });

  return (
    <div className="w-full">
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
          isDragActive
            ? 'border-primary bg-primary/5'
            : 'border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50'
        }`}
      >
        <input {...getInputProps()} />
        
        {isUploading ? (
          <div className="flex flex-col items-center justify-center py-4">
            <Loader2 className="h-8 w-8 text-primary animate-spin mb-2" />
            <p className="text-sm text-muted-foreground">Processing files...</p>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-4">
            <Upload className="h-8 w-8 text-muted-foreground mb-2" />
            <p className="text-sm font-medium mb-1">Drag & drop files here, or click to select files</p>
            <p className="text-xs text-muted-foreground">
              Supported formats: Images (JPG, PNG, WEBP), Videos (MP4, MOV, AVI)
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Maximum size: {formatBytes(maxSize)} | Maximum files: {maxFiles}
            </p>
          </div>
        )}
      </div>

      {error && (
        <div className="mt-2 p-2 bg-destructive/10 text-destructive rounded-md text-sm flex items-start">
          <AlertCircle className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0" />
          <p>{error}</p>
        </div>
      )}
    </div>
  );
};

// Helper function to read file as base64
const readFileAsBase64 = (file: globalThis.File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

// Helper function to format bytes to human-readable format
const formatBytes = (bytes: number, decimals: number = 2): string => {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}; 