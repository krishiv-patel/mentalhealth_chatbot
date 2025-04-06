import React, { useState, useRef } from 'react';
import { Layout } from '../components/Layout';
import { GeminiVisionService } from '../services/gemini-vision';
import { Button } from '../components/ui/Button';
import { FileUploader } from '../components/FileUploader';
import { Loader2, Image as ImageIcon, FileVideo, Youtube, Sparkles } from 'lucide-react';
import { File } from '../types/file';

interface TestResult {
  prompt: string;
  response: string;
  loading: boolean;
  error?: string;
}

export const GeminiVisionTest: React.FC = () => {
  const [files, setFiles] = useState<File[]>([]);
  const [prompt, setPrompt] = useState<string>('Describe what you see in these images in detail');
  const [results, setResults] = useState<TestResult[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [youtubeUrl, setYoutubeUrl] = useState<string>('');
  const geminiVisionService = useRef(new GeminiVisionService());

  const handleFileUpload = (uploadedFiles: File[]) => {
    setFiles([...files, ...uploadedFiles]);
  };

  const removeFile = (index: number) => {
    const newFiles = [...files];
    newFiles.splice(index, 1);
    setFiles(newFiles);
  };

  const analyzeMedia = async () => {
    if (!files.length && !youtubeUrl) {
      alert('Please upload at least one image or video or enter a YouTube URL');
      return;
    }

    const newResult: TestResult = {
      prompt,
      response: '',
      loading: true
    };
    
    setResults([...results, newResult]);
    setIsLoading(true);

    try {
      let response: string;
      
      // Handle YouTube URL
      if (youtubeUrl && geminiVisionService.current.isYouTubeUrl(youtubeUrl)) {
        // Add YouTube URL as a virtual file
        const youtubeFile = {
          name: 'youtube-video',
          size: 0,
          type: 'video/youtube',
          mimeType: 'video/youtube',
          path: youtubeUrl,
          base64Data: '',
        } as any;
        
        response = await geminiVisionService.current.analyzeMedia(prompt, [youtubeFile]);
      } else {
        // Handle regular files
        response = await geminiVisionService.current.analyzeMedia(prompt, files);
      }
      
      // Update the results with the response
      const updatedResults = [...results];
      updatedResults[updatedResults.length - 1] = {
        prompt,
        response,
        loading: false
      };
      
      setResults(updatedResults);
    } catch (error) {
      const updatedResults = [...results];
      updatedResults[updatedResults.length - 1] = {
        prompt,
        response: '',
        loading: false,
        error: error instanceof Error ? error.message : 'An unknown error occurred'
      };
      
      setResults(updatedResults);
    } finally {
      setIsLoading(false);
    }
  };

  const clearAll = () => {
    setFiles([]);
    setResults([]);
    setYoutubeUrl('');
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-6 max-w-6xl">
        <h1 className="text-3xl font-bold mb-6">Gemini Vision Capabilities Test</h1>
        
        <div className="mb-8 bg-card border rounded-lg p-6 shadow-sm">
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            <Sparkles className="mr-2 h-5 w-5 text-primary" />
            Test Gemini Vision API
          </h2>
          
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Prompt</label>
            <textarea
              className="w-full p-3 border rounded-md bg-background"
              rows={3}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Enter a prompt for Gemini Vision to analyze..."
            />
          </div>
          
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">YouTube URL (optional)</label>
            <div className="flex gap-2">
              <input
                type="text"
                className="flex-1 p-3 border rounded-md bg-background"
                value={youtubeUrl}
                onChange={(e) => setYoutubeUrl(e.target.value)}
                placeholder="https://www.youtube.com/watch?v=..."
              />
              <Button
                variant="outline"
                disabled={!youtubeUrl || !geminiVisionService.current.isYouTubeUrl(youtubeUrl)}
                onClick={() => setYoutubeUrl('')}
              >
                Clear
              </Button>
            </div>
            {youtubeUrl && !geminiVisionService.current.isYouTubeUrl(youtubeUrl) && (
              <p className="text-destructive text-sm mt-1">Please enter a valid YouTube URL</p>
            )}
          </div>
          
          <div className="mb-6">
            <label className="block text-sm font-medium mb-2">
              Upload Media {files.length > 0 && `(${files.length} files)`}
            </label>
            
            <div className="grid gap-4">
              <FileUploader onFilesUploaded={handleFileUpload} />
              
              {files.length > 0 && (
                <div className="mt-2 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                  {files.map((file, index) => (
                    <div key={index} className="relative border rounded-md overflow-hidden group">
                      {file.type.startsWith('image/') ? (
                        <div className="aspect-square relative">
                          <img
                            src={file.base64Data}
                            alt={file.name}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 bg-black/70 transition-opacity">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-white"
                              onClick={() => removeFile(index)}
                            >
                              Remove
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="p-4 bg-black/10 dark:bg-white/10 aspect-square flex flex-col items-center justify-center">
                          <FileVideo className="h-12 w-12 mb-2 text-muted-foreground" />
                          <div className="text-sm truncate w-full text-center">{file.name}</div>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="mt-2"
                            onClick={() => removeFile(index)}
                          >
                            Remove
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          
          <div className="flex gap-3">
            <Button
              onClick={analyzeMedia}
              disabled={isLoading || (files.length === 0 && !youtubeUrl)}
              className="flex items-center"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> 
                  Processing...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Analyze with Gemini Vision
                </>
              )}
            </Button>
            
            <Button
              variant="outline"
              onClick={clearAll}
              disabled={isLoading}
            >
              Clear All
            </Button>
          </div>
        </div>
        
        {results.length > 0 && (
          <div className="mt-8">
            <h2 className="text-xl font-semibold mb-4">Results</h2>
            
            <div className="space-y-4">
              {results.map((result, index) => (
                <div key={index} className="border rounded-lg overflow-hidden bg-card">
                  <div className="p-4 border-b bg-muted/30">
                    <h3 className="font-medium text-sm">Prompt:</h3>
                    <p className="text-sm mt-1">{result.prompt}</p>
                  </div>
                  
                  <div className="p-4">
                    {result.loading ? (
                      <div className="flex items-center justify-center p-6">
                        <Loader2 className="animate-spin h-6 w-6 mr-2 text-primary" />
                        <span>Analyzing with Gemini...</span>
                      </div>
                    ) : result.error ? (
                      <div className="p-4 text-destructive">
                        <h3 className="font-medium text-sm mb-1">Error:</h3>
                        <p className="text-sm">{result.error}</p>
                      </div>
                    ) : (
                      <div>
                        <h3 className="font-medium text-sm mb-1">Response:</h3>
                        <div className="mt-2 bg-muted/30 p-4 rounded-md whitespace-pre-wrap">
                          {result.response}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}; 