import { GoogleGenerativeAI } from "@google/generative-ai";
import { logInfo, logError, logWarning, LogCategory } from './logging';
import { DEFAULT_MODEL } from './constants';

const GEMINI_API_KEY = import.meta.env.VITE_GOOGLE_API_KEY || '';

// Initialize the AI with the API key
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

/**
 * Convert a file to a generative part with base64 encoding
 */
export async function fileToGenerativePart(file: File): Promise<any> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const base64Data = reader.result?.toString().split(',')[1] || '';
      resolve({
        inlineData: {
          data: base64Data,
          mimeType: file.type
        }
      });
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Process an image using Gemini Vision API
 */
export async function analyzeImage(file: File, prompt: string) {
  try {
    logInfo(LogCategory.CHAT, "Analyzing image with Gemini Vision", null, null, { 
      fileName: file.name, promptLength: prompt.length
    });
    
    const imagePart = await fileToGenerativePart(file);
    const model = genAI.getGenerativeModel({ model: DEFAULT_MODEL });
    
    const result = await model.generateContent([prompt, imagePart]);
    
    logInfo(LogCategory.CHAT, "Successfully analyzed image with Gemini", null, null, { 
      responseLength: result.response.text().length
    });
    
    return result.response.text();
  } catch (error) {
    logError(LogCategory.CHAT, "Error analyzing image with Gemini", null, null, { 
      error: (error as Error).message
    });
    throw error;
  }
}

/**
 * Process multiple images using Gemini Vision API
 */
export async function analyzeMultipleImages(files: File[], prompt: string) {
  try {
    logInfo(LogCategory.CHAT, "Analyzing multiple images with Gemini Vision", null, null, { 
      fileCount: files.length, promptLength: prompt.length
    });
    
    const imageParts = await Promise.all(files.map(file => fileToGenerativePart(file)));
    const model = genAI.getGenerativeModel({ model: DEFAULT_MODEL });
    
    const result = await model.generateContent([...imageParts, prompt]);
    
    logInfo(LogCategory.CHAT, "Successfully analyzed multiple images with Gemini", null, null, { 
      responseLength: result.response.text().length
    });
    
    return result.response.text();
  } catch (error) {
    logError(LogCategory.CHAT, "Error analyzing multiple images with Gemini", null, null, { 
      error: (error as Error).message
    });
    throw error;
  }
}

/**
 * Process a video using Gemini Vision API
 */
export async function analyzeVideo(file: File, prompt: string) {
  try {
    // For videos, use inline data method
    logInfo(LogCategory.CHAT, "Analyzing video with Gemini Vision", null, null, { 
      fileName: file.name, fileSize: file.size, promptLength: prompt.length
    });
    
    const videoPart = await fileToGenerativePart(file);
    const model = genAI.getGenerativeModel({ model: DEFAULT_MODEL });
    
    const result = await model.generateContent([prompt, videoPart]);
    
    logInfo(LogCategory.CHAT, "Successfully analyzed video with Gemini", null, null, { 
      responseLength: result.response.text().length
    });
    
    return result.response.text();
  } catch (error) {
    logError(LogCategory.CHAT, "Error analyzing video with Gemini", null, null, { 
      error: (error as Error).message
    });
    throw error;
  }
}

/**
 * Process YouTube video using Gemini Vision API
 */
export async function analyzeYouTubeVideo(youtubeUrl: string, prompt: string) {
  try {
    logInfo(LogCategory.CHAT, "Analyzing YouTube video with Gemini Vision", null, null, { 
      url: youtubeUrl, promptLength: prompt.length
    });
    
    // Validate YouTube URL format
    if (!youtubeUrl.match(/^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)/)) {
      throw new Error("Invalid YouTube URL format");
    }
    
    const model = genAI.getGenerativeModel({ model: DEFAULT_MODEL });
    const result = await model.generateContent([
      prompt,
      { text: `YouTube Video: ${youtubeUrl}` }
    ]);
    
    logInfo(LogCategory.CHAT, "Successfully analyzed YouTube video with Gemini", null, null, { 
      responseLength: result.response.text().length
    });
    
    return result.response.text();
  } catch (error) {
    logError(LogCategory.CHAT, "Error analyzing YouTube video with Gemini", null, null, { 
      error: (error as Error).message
    });
    throw error;
  }
}

/**
 * Get timestamp specific content from a video
 */
export async function getVideoTimestampContent(file: File, timestamps: string[], prompt: string) {
  try {
    logInfo(LogCategory.CHAT, "Getting timestamp specific content from video", null, null, { 
      fileName: file.name, timestamps, promptLength: prompt.length
    });
    
    // Format the prompt to include timestamps
    const timestampPrompt = `${prompt} Specifically focus on timestamps: ${timestamps.join(', ')}`;
    
    // Use the standard video analysis method
    return analyzeVideo(file, timestampPrompt);
  } catch (error) {
    logError(LogCategory.CHAT, "Error getting timestamp content from video", null, null, { 
      error: (error as Error).message
    });
    throw error;
  }
}

/**
 * Transcribe video with visual descriptions
 */
export async function transcribeVideoWithVisualDescriptions(file: File) {
  try {
    logInfo(LogCategory.CHAT, "Transcribing video with visual descriptions", null, null, { 
      fileName: file.name 
    });
    
    // Use the standard video analysis method with a specific prompt
    return analyzeVideo(file, "Transcribe the audio, giving timestamps. Also provide visual descriptions for each scene.");
  } catch (error) {
    logError(LogCategory.CHAT, "Error transcribing video with visual descriptions", null, null, { 
      error: (error as Error).message
    });
    throw error;
  }
}

/**
 * Detect objects in an image and return bounding boxes
 */
export async function detectObjectsInImage(file: File, objectQuery: string) {
  try {
    logInfo(LogCategory.CHAT, "Detecting objects in image with Gemini Vision", null, null, { 
      fileName: file.name, objectQuery
    });
    
    const imagePart = await fileToGenerativePart(file);
    const model = genAI.getGenerativeModel({ model: DEFAULT_MODEL });
    
    // Construct a prompt that asks for bounding box coordinates
    const prompt = `Detect ${objectQuery} in this image. Return the bounding box coordinates in the format [ymin, xmin, ymax, xmax]. The coordinates should be normalized between 0 and 1000.`;
    
    const result = await model.generateContent([prompt, imagePart]);
    const response = result.response.text();
    
    logInfo(LogCategory.CHAT, "Successfully detected objects in image", null, null, { 
      responseLength: response.length
    });
    
    return response;
  } catch (error) {
    logError(LogCategory.CHAT, "Error detecting objects in image", null, null, { 
      error: (error as Error).message
    });
    throw error;
  }
}

/**
 * Process an audio file using Gemini API
 */
export async function analyzeAudio(file: File, prompt: string) {
  try {
    logInfo(LogCategory.CHAT, "Analyzing audio with Gemini API", null, null, { 
      fileName: file.name, fileSize: file.size, promptLength: prompt.length
    });
    
    const audioPart = await fileToGenerativePart(file);
    const model = genAI.getGenerativeModel({ model: DEFAULT_MODEL });
    
    const result = await model.generateContent([prompt, audioPart]);
    
    logInfo(LogCategory.CHAT, "Successfully analyzed audio with Gemini", null, null, { 
      responseLength: result.response.text().length
    });
    
    return result.response.text();
  } catch (error) {
    logError(LogCategory.CHAT, "Error analyzing audio with Gemini", null, null, { 
      error: (error as Error).message
    });
    throw error;
  }
}

/**
 * Transcribe audio file with timestamps
 */
export async function transcribeAudio(file: File) {
  try {
    logInfo(LogCategory.CHAT, "Transcribing audio", null, null, { 
      fileName: file.name 
    });
    
    // Use the audio analysis function with a specific transcription prompt
    return analyzeAudio(file, "Generate a complete transcript of this audio file with timestamps.");
  } catch (error) {
    logError(LogCategory.CHAT, "Error transcribing audio", null, null, { 
      error: (error as Error).message
    });
    throw error;
  }
}

/**
 * Analyze audio with specific timestamp focus
 */
export async function getAudioTimestampContent(file: File, timestamps: string[], prompt: string) {
  try {
    logInfo(LogCategory.CHAT, "Getting timestamp specific content from audio", null, null, { 
      fileName: file.name, timestamps, promptLength: prompt.length
    });
    
    // Format the prompt to include timestamps
    const timestampPrompt = `${prompt} Specifically focus on timestamps: ${timestamps.join(', ')}`;
    
    // Use the standard audio analysis method
    return analyzeAudio(file, timestampPrompt);
  } catch (error) {
    logError(LogCategory.CHAT, "Error getting timestamp content from audio", null, null, { 
      error: (error as Error).message
    });
    throw error;
  }
} 