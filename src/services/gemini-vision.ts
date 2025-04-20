import { FileWithPath } from 'react-dropzone';
import { File } from '../types/file';
import { 
  analyzeImage,
  analyzeMultipleImages, 
  analyzeVideo,
  analyzeVideoWithFileAPI,
  analyzeYouTubeVideo,
  getVideoTimestampContent,
  transcribeVideoWithVisualDescriptions,
  detectObjectsInImage
} from '../lib/geminiVision';
import { getEnvVariable } from '../lib/utils';

export interface GeminiVisionOptions {
  temperature?: number;
  topK?: number;
  topP?: number;
  maxOutputTokens?: number;
}

// Size threshold for using the Files API instead of inline data
const VIDEO_SIZE_THRESHOLD = 20 * 1024 * 1024; // 20MB

export class GeminiVisionService {
  private apiKey: string;

  constructor(options: GeminiVisionOptions = {}) {
    this.apiKey = getEnvVariable('GOOGLE_API_KEY') || '';
    if (!this.apiKey) {
      console.error('Gemini API key not found. Please set VITE_GOOGLE_API_KEY in your .env file.');
    }
  }

  /**
   * Analyze media files (images/videos) with the Gemini Vision API
   */
  async analyzeMedia(
    prompt: string,
    files: (File | FileWithPath)[],
    callbacks?: {
      onChunk?: (chunk: string) => void;
    }
  ): Promise<string> {
    if (!this.apiKey) {
      throw new Error('Gemini API key not found. Please set VITE_GOOGLE_API_KEY in your .env file.');
    }

    if (!files.length) {
      throw new Error('No files provided for vision analysis.');
    }

    console.log(`Analyzing ${files.length} media file(s) with Gemini Vision API`);
    
    try {
      let response = '';
      
      // Handle different file types and quantities
      if (files.length === 1) {
        const file = files[0];
        
        // Convert to standard Browser File if needed
        const standardFile = this.convertToStandardFile(file);
        
        // Check if it's a video
        if (standardFile.type.startsWith('video/')) {
          // Check video size to determine whether to use inline data or Files API
          if (standardFile.size > VIDEO_SIZE_THRESHOLD) {
            // For larger videos, use Files API method
            response = await analyzeVideoWithFileAPI(standardFile, prompt);
          } else {
            // For smaller videos, use inline data method
            response = await analyzeVideo(standardFile, prompt);
          }
        } 
        // Check if it's a YouTube URL
        else if ('path' in file && typeof file.path === 'string' && this.isYouTubeUrl(file.path)) {
          response = await analyzeYouTubeVideo(file.path, prompt);
        }
        // Otherwise, treat as image
        else {
          response = await analyzeImage(standardFile, prompt);
        }
      } 
      // Multiple files - handle as a group
      else {
        const standardFiles = files.map(file => this.convertToStandardFile(file));
        response = await analyzeMultipleImages(standardFiles, prompt);
      }
      
      // Handle streaming if callbacks are provided
      if (callbacks?.onChunk) {
        // For this simple integration, we'll just send the whole response
        // In a real streaming implementation, you'd process it chunk by chunk
        callbacks.onChunk(response);
      }

      console.log('Gemini Vision analysis completed successfully');
      return response;
    } catch (error: unknown) {
      console.error('Error analyzing media with Gemini Vision API:', error);
      throw error;
    }
  }

  /**
   * Convert any file type to standard Browser File
   */
  private convertToStandardFile(file: File | FileWithPath): globalThis.File {
    // If it's already a browser File, return it
    if (file instanceof globalThis.File) {
      return file;
    }
    
    // If it's our custom File type, convert it
    if ('base64Data' in file) {
      // Convert base64 to Blob
      const byteString = atob(file.base64Data.split(',')[1] || file.base64Data);
      const mimeType = file.mimeType;
      const ab = new ArrayBuffer(byteString.length);
      const ia = new Uint8Array(ab);
      
      for (let i = 0; i < byteString.length; i++) {
        ia[i] = byteString.charCodeAt(i);
      }
      
      const blob = new Blob([ab], { type: mimeType });
      return new globalThis.File([blob], file.name, { 
        type: mimeType,
        lastModified: file.lastModified || Date.now()
      });
    }
    
    // Fallback for other cases - create empty file (should rarely happen)
    return new globalThis.File([], 'unknown-file', { type: 'application/octet-stream' });
  }

  /**
   * Check if the provided URL is a YouTube video
   */
  isYouTubeUrl(url: string): boolean {
    // Enhanced regex to better handle various YouTube URL formats including Shorts
    return /https?:\/\/(www\.)?(youtube\.com\/(?:watch\?v=|shorts\/)|youtu\.be\/)[^\s&]+/.test(url);
  }

  /**
   * Extract video ID from YouTube URL
   */
  extractYouTubeVideoId(url: string): string | null {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  }
  
  /**
   * Detect objects in an image
   */
  async detectObjects(file: File | FileWithPath, objectQuery: string): Promise<string> {
    const standardFile = this.convertToStandardFile(file);
    return detectObjectsInImage(standardFile, objectQuery);
  }
  
  /**
   * Analyze video at specific timestamps
   */
  async analyzeVideoTimestamps(file: File | FileWithPath, timestamps: string[], prompt: string): Promise<string> {
    const standardFile = this.convertToStandardFile(file);
    return getVideoTimestampContent(standardFile, timestamps, prompt);
  }
  
  /**
   * Transcribe a video with visual descriptions
   */
  async transcribeVideo(file: File | FileWithPath): Promise<string> {
    const standardFile = this.convertToStandardFile(file);
    return transcribeVideoWithVisualDescriptions(standardFile);
  }
} 