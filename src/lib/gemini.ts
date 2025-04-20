import { Message } from '../types';
import { extractTextFromFile } from './documentParser';
import { LLMMessage, CompletionOptions } from './lmstudio';
import { logInfo, logError, logWarning, LogCategory } from './logging';
import { GEMINI_MODELS, DEFAULT_MODEL } from './constants';

const GEMINI_API_KEY = 'AIzaSyDIwt9lsWFQ6SpiLIthO8m_EbB1RpLJsug';

// Import the GoogleGenAI package
import { GoogleGenAI, createUserContent, createPartFromUri } from "@google/genai";

// Initialize the AI with the API key
const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

/**
 * Get a streaming chat completion from Gemini API
 */
export async function getChatCompletionStreamGemini(
  messages: LLMMessage[],
  options?: CompletionOptions,
  files?: File | File[]
) {
  try {
    logInfo(LogCategory.CHAT, "Starting Gemini API call", null);
    
    // Process files if any
    let fileContent = '';
    if (files) {
      const filesArray = Array.isArray(files) ? files : [files];
      console.log(`Processing ${filesArray.length} uploaded files for Gemini`);
      logInfo(LogCategory.FILE, `Processing ${filesArray.length} files for Gemini`, null);
      
      for (const file of filesArray) {
        if (file && file instanceof Blob) {
          try {
            const content = await extractTextFromFile(file, file.name);
            fileContent += `[File: ${file.name}]\n\n${content.content}\n\n`;
            logInfo(LogCategory.FILE, `Successfully extracted content from file: ${file.name}`, null);
          } catch (error) {
            console.error(`Error reading file: ${file.name}`, error);
            fileContent += `[Error reading file: ${file.name}]\n\n`;
            logError(LogCategory.FILE, `Error reading file: ${file.name}`, null, null, { error: (error as Error).message });
          }
        }
      }
    }

    // Add system message first if it exists
    const systemMessage = messages.find(msg => msg.role === 'system');
    let systemInstructionText = systemMessage ? systemMessage.content : '';
    
    // Add default system instruction if none exists
    if (!systemInstructionText) {
      systemInstructionText = `You are MindfulAI, a mental health assistant that provides supportive conversation and helpful advice.
      
Important: You MUST remember information from the current conversation to maintain context. When the user asks about things they've mentioned before, refer back to that information.

For example, if they mention they like chocolate in an earlier message and later ask "What do I like?", you should answer "You mentioned that you like chocolate."

Always pay attention to all prior messages in the conversation to maintain a helpful and coherent dialogue.`;
    }

    // Prepare conversation messages
    const conversationHistory = [];
    
    for (const message of messages) {
      if (message.role === 'system') continue; // Skip system messages as they're handled separately
      
      // Process content including any attachments
      let messageContent = message.content;
      
      // Check if this is an encrypted message placeholder
      if (message.content.startsWith('[Encrypted') && message.role === 'assistant') {
        // Log warning about encrypted message
        logWarning(LogCategory.CHAT, "Encrypted assistant message detected in Gemini mode", null, null, {
          contentPreview: message.content.substring(0, 30)
        });
        
        // For assistant messages that have placeholder encryption text, 
        // use a generic response instead of the placeholder
        messageContent = "I'm here to help. What would you like to discuss?";
      } else if (message.content.startsWith('[Encrypted') && message.role === 'user') {
        // For user messages that are encrypted, let the user know we can't process encrypted content
        logWarning(LogCategory.CHAT, "Encrypted user message detected in Gemini mode", null);
        messageContent = "I'd like to chat about something.";
      }
      
      // Add file content to user messages if present
      if (message.role === 'user' && fileContent && fileContent.trim() !== '') {
        messageContent = `${messageContent}\n\n${fileContent}`;
        fileContent = ''; // Clear file content after adding it once
      }
      
      // Map 'assistant' role to 'model' for Gemini API
      const geminiRole = message.role === 'assistant' ? 'model' : message.role;
      
      conversationHistory.push({
        role: geminiRole,
        parts: [{ text: messageContent }]
      });
    }

    logInfo(LogCategory.CHAT, "Creating Gemini chat instance", null, null, { 
      systemInstructionLength: systemInstructionText.length,
      messagesCount: conversationHistory.length 
    });

    // Create a chat instance with history if there are messages
    try {
      const chat = ai.chats.create({
        model: DEFAULT_MODEL,
        history: conversationHistory
      });

      // Prepare the message with system instructions if needed
      const messageParams: any = {
        message: conversationHistory.length > 0 ? 
          conversationHistory[conversationHistory.length - 1].parts[0].text : 
          "Hello"
      };
      
      // Add system instructions if available
      if (systemInstructionText) {
        messageParams.systemInstructions = systemInstructionText;
      }

      logInfo(LogCategory.CHAT, "Sending message to Gemini", null, null, { 
        hasSystemInstructions: !!systemInstructionText,
        messageLength: messageParams.message.length
      });
      
      // Send the message and stream the response
      const streamResponse = await chat.sendMessageStream(messageParams);

      logInfo(LogCategory.CHAT, "Gemini stream response started", null);
      
      let fullText = '';
      
      // Process streaming response
      for await (const chunk of streamResponse) {
        // Check if generation should be stopped
        if ((window as any).stopGenerationSignal) {
          (window as any).stopGenerationSignal = false;
          logInfo(LogCategory.CHAT, "Gemini generation stopped by user", null);
          break;
        }
        
        // Ensure we have content from the chunk
        if (!chunk || (typeof chunk !== 'object')) {
          logWarning(LogCategory.CHAT, "Received empty or invalid chunk from Gemini", null);
          continue;
        }
        
        const chunkText = chunk.text || '';
        
        // Log if we get an empty chunk
        if (!chunkText) {
          logWarning(LogCategory.CHAT, "Received chunk with empty text from Gemini", null);
          continue;
        }
        
        fullText += chunkText;
        
        if (options?.onResponse) {
          logInfo(LogCategory.CHAT, "Received chunk from Gemini", null, null, { chunkLength: chunkText.length });
          try {
            options.onResponse(chunkText);
          } catch (callbackError) {
            logError(LogCategory.CHAT, "Error in onResponse callback", null, null, { 
              error: (callbackError as Error).message 
            });
          }
        }
      }
      
      logInfo(LogCategory.CHAT, "Gemini stream response completed", null, null, { responseLength: fullText.length });
      
      if (options?.onFinish) {
        await options.onFinish();
      }
      
      return fullText;
    } catch (chatError) {
      logError(LogCategory.CHAT, "Error creating Gemini chat or starting stream", null, null, {
        error: (chatError as Error).message
      });
      throw chatError;
    }
  } catch (error) {
    console.error('Error in Gemini API call:', error);
    logError(LogCategory.CHAT, "Error in Gemini API call", null, null, { error: (error as Error).message });
    
    if (options?.onError) {
      options.onError(error as Error);
    }
    
    throw error;
  }
}

// Function to use multimodal features with images
export async function processImageWithGemini(imageFile: File, prompt: string) {
  try {
    logInfo(LogCategory.FILE, "Uploading image for Gemini processing", null, null, { fileName: imageFile.name });
    
    // Upload the image file
    const image = await ai.files.upload({
      file: imageFile,
    });
    
    if (!image.uri) {
      throw new Error("Failed to get URI from uploaded image");
    }
    
    logInfo(LogCategory.CHAT, "Generating content with image in Gemini", null, null, { promptLength: prompt.length });
    
    // Generate content with the image and prompt
    const response = await ai.models.generateContent({
      model: DEFAULT_MODEL,
      contents: [
        createUserContent([
          prompt,
          createPartFromUri(image.uri, image.mimeType || 'image/jpeg'),
        ]),
      ],
    });
    
    logInfo(LogCategory.CHAT, "Received image processing response from Gemini", null, null, { responseLength: response.text?.length || 0 });
    
    return response.text;
  } catch (error) {
    console.error('Error processing image with Gemini:', error);
    logError(LogCategory.CHAT, "Error processing image with Gemini", null, null, { error: (error as Error).message });
    throw error;
  }
} 