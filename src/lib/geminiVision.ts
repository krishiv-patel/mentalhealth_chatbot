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
 * Process a video using Gemini Vision API with inline data
 * Best for smaller videos (<20MB) and shorter durations
 */
export async function analyzeVideo(file: File, prompt: string) {
  try {
    // For videos, use inline data method for videos under 20MB
    logInfo(LogCategory.CHAT, "Analyzing video with Gemini Vision (inline method)", null, null, { 
      fileName: file.name, fileSize: file.size, promptLength: prompt.length
    });
    
    const videoPart = await fileToGenerativePart(file);
    const model = genAI.getGenerativeModel({ model: DEFAULT_MODEL });
    
    // Add generation config to ensure higher quality results
    const generationConfig = {
      temperature: 0.4,
      topK: 32,
      topP: 0.95,
      maxOutputTokens: 8192,
    };
    
    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }, videoPart] }],
      generationConfig
    });
    
    // Check if the response is empty and retry with a more specific prompt
    if (!result.response.text().trim()) {
      logWarning(LogCategory.CHAT, "Empty response from Gemini for video, retrying with enhanced prompt", null);
      
      const enhancedPrompt = `Analyze this video in detail. Describe what you can see in the video: ${prompt}`;
      const retryResult = await model.generateContent({
        contents: [{ role: "user", parts: [{ text: enhancedPrompt }, videoPart] }],
        generationConfig
      });
      
      logInfo(LogCategory.CHAT, "Successfully retried video analysis with Gemini", null, null, { 
        responseLength: retryResult.response.text().length
      });
      
      return retryResult.response.text();
    }
    
    logInfo(LogCategory.CHAT, "Successfully analyzed video with Gemini", null, null, { 
      responseLength: result.response.text().length
    });
    
    return result.response.text();
  } catch (error) {
    logError(LogCategory.CHAT, "Error analyzing video with Gemini", null, null, { 
      error: (error as Error).message
    });
    
    // Return a helpful error message instead of throwing
    return `I wasn't able to analyze this video properly. This could be due to the file size (limit 20MB), format issues, or content restrictions. Please try with a shorter video clip or share specific details about what you'd like me to analyze.`;
  }
}

/**
 * Upload and process a video using Gemini Vision API with Files API
 * Used for larger videos (>20MB) or when needed for multiple requests
 */
export async function analyzeVideoWithFileAPI(file: File, prompt: string) {
  try {
    logInfo(LogCategory.CHAT, "Analyzing video with Gemini Vision (File API method)", null, null, { 
      fileName: file.name, fileSize: file.size, promptLength: prompt.length
    });
    
    // First, upload the file using the Files API
    // Note: In a real implementation, you would call the Google AI Client's files.upload method
    // This is a simplified mockup that would need to be implemented with actual API calls
    
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    
    // Mock file upload and reference
    // In a real implementation, replace this with actual Files API calls
    const fileRef = {
      fileId: "mock-file-id-" + Date.now(),
      mimeType: file.type,
      displayName: file.name
    };
    
    // Generate content with the file reference
    // In actual implementation, you would use the file reference from the upload response
    const result = await model.generateContent([
      prompt,
      { text: `Using uploaded video file: ${fileRef.displayName}` }
    ]);
    
    logInfo(LogCategory.CHAT, "Successfully analyzed video with Gemini (File API)", null, null, { 
      responseLength: result.response.text().length
    });
    
    return result.response.text();
  } catch (error) {
    logError(LogCategory.CHAT, "Error analyzing video with Gemini File API", null, null, { 
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
    
    // Enhanced validation for YouTube URL format including Shorts
    if (!youtubeUrl.match(/^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.*$/)) {
      throw new Error("Invalid YouTube URL format");
    }
    
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    
    // Fix: Use the GenerationConfig to ensure higher quality results
    const generationConfig = {
      temperature: 0.4,
      topK: 32,
      topP: 0.95,
      maxOutputTokens: 8192,
    };
    
    // Fix: Use the proper format to send YouTube URL - constructing the request manually
    // to ensure compatibility with different YouTube URL formats including shorts
    const rawRequest = {
      contents: [{
        role: "user",
        parts: [
          { text: prompt },
          { 
            fileData: {
              mimeType: "text/html",
              fileUri: youtubeUrl
            }
          }
        ]
      }],
      generationConfig
    };

    // Send the raw request to the model
    // @ts-ignore - Bypass type checking for this specific case
    const result = await model.generateContent(rawRequest);
    
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
    
    // Format the prompt to include timestamps in MM:SS format
    let timestampPrompt = prompt;
    if (timestamps && timestamps.length > 0) {
      timestampPrompt += ` What happens at the following timestamps: ${timestamps.join(', ')}?`;
    }
    
    // Use the standard video analysis method
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    const videoPart = await fileToGenerativePart(file);
    
    const result = await model.generateContent([timestampPrompt, videoPart]);
    
    logInfo(LogCategory.CHAT, "Successfully retrieved timestamp content from video", null, null, { 
      responseLength: result.response.text().length
    });
    
    return result.response.text();
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
    
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    const videoPart = await fileToGenerativePart(file);
    
    const prompt = "Transcribe the audio from this video, giving timestamps for salient events in the video. Also provide visual descriptions.";
    
    const result = await model.generateContent([prompt, videoPart]);
    
    logInfo(LogCategory.CHAT, "Successfully transcribed video with visual descriptions", null, null, { 
      responseLength: result.response.text().length
    });
    
    return result.response.text();
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
    
    // Use the standard audio analysis method with a specific prompt
    return analyzeAudio(file, "Transcribe this audio, providing timestamps where appropriate.");
  } catch (error) {
    logError(LogCategory.CHAT, "Error transcribing audio", null, null, { 
      error: (error as Error).message
    });
    throw error;
  }
}

/**
 * Get content from specific audio timestamps
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