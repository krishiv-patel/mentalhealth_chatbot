import { Message } from '../types';
import { extractTextFromFile } from './documentParser';

const LMSTUDIO_URL = 'http://localhost:1234/v1/chat/completions';

/**
 * Simple and robust function to read file content
 * Minimal complexity with maximum reliability
 */
async function readFileContent(file: File): Promise<string> {
  try {
    if (!file) {
      console.error('No file provided');
      throw new Error('No file provided');
    }

    console.log(`Reading file: ${file.name} (${file.type}, ${file.size} bytes)`);
    
    // Use our specialized document parser
    const result = await extractTextFromFile(file, file.name);
    const content = result.content;
    console.log(`Successfully processed file: ${file.name} (${content.length} chars)`);
    
    return content;
  } catch (error) {
    console.error(`Error reading file: ${file.name}`, error);
    return `[Error reading file: ${file.name}]`;
  }
}

/**
 * Convert a URL to base64 string for images
 */
async function urlToBase64(url: string): Promise<string> {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch URL: ${response.status} ${response.statusText}`);
    }
    
    const blob = await response.blob();
    
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result?.toString().split(',')[1] || '';
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error('Error converting URL to base64:', error);
    throw error;
  }
}

/**
 * Fetch and read document content from URL using specialized parsers
 */
async function fetchDocumentContent(url: string, name: string): Promise<string> {
  try {
    console.log(`Fetching document: ${name} from ${url}`);
    
    // Handle URL encoding for Supabase URLs
    const processedUrl = url.includes('%3A') ? decodeURIComponent(url) : url;
    console.log(`Processed URL: ${processedUrl}`);
    
    const response = await fetch(processedUrl, {
      method: 'GET',
      headers: {
        'Accept': 'text/plain, application/pdf, application/octet-stream, */*',
        'Cache-Control': 'no-cache',
      },
      mode: 'cors',
      credentials: 'omit',
    });
    
    if (!response.ok) {
      console.error(`Failed to fetch document: ${response.status} ${response.statusText}`);
      throw new Error(`Failed to fetch document: ${response.status} ${response.statusText}`);
    }
    
    // Get the document as a blob
    const blob = await response.blob();
    console.log(`Got document as blob: ${name} (${blob.size} bytes, type: ${blob.type})`);
    
    // Special handling for text files - try direct text extraction first
    if (name.toLowerCase().endsWith('.txt') || blob.type === 'text/plain') {
      try {
        console.log('Using direct text extraction for text file');
        const directText = await blob.text();
        console.log(`Direct text extraction successful: ${directText.length} chars`);
        
        // Print the first 100 chars of text content for debugging
        console.log(`Text content preview: "${directText.substring(0, 100)}${directText.length > 100 ? '...' : ''}"`);
        
        if (directText && directText.trim() !== '') {
          return directText;
        }
        console.log('Direct text extraction returned empty content, falling back to parser');
      } catch (textError) {
        console.error('Error during direct text extraction:', textError);
      }
    }
    
    // Parse the document content using the specialized document parser
    const result = await extractTextFromFile(blob, name);
    const content = result.content;
    
    console.log(`Document parser result: ${name} has ${content.length} chars`);
    // Print the first 100 chars of parsed content for debugging
    console.log(`Parsed content preview: "${content.substring(0, 100)}${content.length > 100 ? '...' : ''}"`);
    
    if (!content || content.trim() === '') {
      console.warn(`Empty content after parsing: ${name}`);
      return `[Document: ${name} - No readable content]`;
    }
    
    console.log(`Successfully parsed document: ${name} (${content.length} chars)`);
    return content;
  } catch (error) {
    console.error(`Error fetching document: ${name}`, error);
    return `[Error fetching document: ${name}. Please check browser console for details.]`;
  }
}

/**
 * Message interface for LLM interactions
 */
export interface LLMMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
  attachment?: {
    type: 'image' | 'document';
    name: string;
    url: string;
    size: number;
  };
}

/**
 * Options for completion requests
 */
export interface CompletionOptions {
  onResponse?: (chunk: string) => void;
  onFinish?: () => Promise<void> | void;
  onError?: (error: Error) => void;
}

/**
 * Helper function to build request body for LM Studio
 */
function buildRequestBody(processedMessages: LLMMessage[]) {
  return {
    model: 'gemma-3-4b-it',
    messages: [...processedMessages],
    stream: true,
  };
}

/**
 * Get a non-streaming chat completion from LM Studio
 */
export async function getChatCompletion(messages: LLMMessage[], files?: File | File[]) {
  try {
    let fileContent = '';
    
    // Process uploaded files
    if (files) {
      const filesArray = Array.isArray(files) ? files : [files];
      console.log(`Processing ${filesArray.length} uploaded files`);
      
      for (const file of filesArray) {
        if (file && file instanceof Blob) {
          try {
            const content = await readFileContent(file);
            fileContent += `[File: ${file.name}]\n\n${content}\n\n`;
          } catch (error) {
            console.error(`Error reading file: ${file.name}`, error);
            fileContent += `[Error reading file: ${file.name}]\n\n`;
          }
        }
      }
    }
    
    // Process message attachments
    const processedMessages = [...messages];
    
    for (let i = 0; i < processedMessages.length; i++) {
      const msg = processedMessages[i];
      
      if (msg.attachment) {
        console.log(`Processing message attachment: ${msg.attachment.type} - ${msg.attachment.name}`);
        
        if (msg.attachment.type === 'image') {
          try {
            // Convert image URL to base64
            const base64Image = await urlToBase64(msg.attachment.url);
            
            // For image attachments, use the proper multimodal format with base64
            processedMessages[i] = {
              ...msg,
              content: [
                { type: "text", text: msg.content },
                { 
                  type: "image_url", 
                  image_url: { 
                    url: `data:image/jpeg;base64,${base64Image}`
                  }
                }
              ] as any
            };
          } catch (error) {
            console.error(`Error processing image attachment: ${msg.attachment.name}`, error);
          }
        } else if (msg.attachment.type === 'document') {
          try {
            // Read document content
            console.log(`Processing document attachment: ${msg.attachment.name} (${msg.attachment.size} bytes)`);
            const documentContent = await fetchDocumentContent(msg.attachment.url, msg.attachment.name);
            
            // Verify we have content
            if (!documentContent || documentContent.trim() === '') {
              console.warn(`Empty content received for ${msg.attachment.name}`);
              fileContent += `[Document: ${msg.attachment.name} - Unable to read content]\n\n`;
              
              // Also update the user's message to indicate the issue
              processedMessages[i] = {
                ...msg,
                content: `${msg.content}\n\n[Unable to read content from ${msg.attachment.name}]`
              };
            } else {
              // Add document content to the overall context with clear formatting
              console.log(`Adding document content to context: ${msg.attachment.name} (${documentContent.length} chars)`);
              
              // Format differently for text files to preserve formatting
              if (msg.attachment.name.toLowerCase().endsWith('.txt')) {
                fileContent += `=== CONTENT OF TEXT FILE: ${msg.attachment.name} ===\n\n${documentContent}\n\n=== END OF TEXT FILE ===\n\n`;
                
                // For text files, directly include the content in the user's message
                processedMessages[i] = {
                  ...msg,
                  content: `${msg.content}\n\nContent of ${msg.attachment.name}:\n\n\`\`\`\n${documentContent}\n\`\`\``
                };
              } else {
                fileContent += `[Document: ${msg.attachment.name}]\n\n${documentContent}\n\n`;
                
                // For other files, summarize the content
                processedMessages[i] = {
                  ...msg,
                  content: `${msg.content}\n\n[Attached document: ${msg.attachment.name}, ${documentContent.length} characters]`
                };
              }
            }
          } catch (error) {
            console.error(`Error processing document attachment: ${msg.attachment.name}`, error);
            fileContent += `[Error processing document: ${msg.attachment.name}]\n\n`;
            
            // Update user message to indicate error
            processedMessages[i] = {
              ...msg,
              content: `${msg.content}\n\n[Error reading attachment: ${msg.attachment.name}]`
            };
          }
        }
      }
    }
    
    // Create system message with context about files/images

    
    // Add diagnostic logging
    console.log(`System message generated. Has file content: ${!!fileContent}`);
    if (fileContent) {
      console.log(`Total file content length: ${fileContent.length} chars`);
    }

    console.log('Sending request to LM Studio (non-streaming)');
    
    // Send request to LM Studio
    const requestBody = buildRequestBody(processedMessages);

    // Log request for debugging
    console.log('Request body:', JSON.stringify(requestBody, null, 2));

    const response = await fetch(LMSTUDIO_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data.choices[0]?.message?.content || '';
  } catch (error) {
    console.error('Error in getChatCompletion:', error);
    throw error;
  }
}

/**
 * Get a streaming chat completion from LM Studio
 */
export async function* getChatCompletionStream(messages: LLMMessage[], options?: CompletionOptions | File | File[]) {
  // Determine if second parameter is files or options
  let files: File | File[] | undefined;
  let completionOptions: CompletionOptions | undefined;
  
  if (options) {
    if ((options as File).name || Array.isArray(options)) {
      files = options as (File | File[]);
    } else {
      completionOptions = options as CompletionOptions;
    }
  }
  
  // Flag to stop generation
  window.stopGenerationSignal = false;
  
  try {
    let fileContent = '';
    
    // Process uploaded files
    if (files) {
      const filesArray = Array.isArray(files) ? files : [files];
      console.log(`Processing ${filesArray.length} uploaded files for streaming`);
      
      for (const file of filesArray) {
        if (file && file instanceof Blob) {
          try {
            const content = await readFileContent(file);
            fileContent += `[File: ${file.name}]\n\n${content}\n\n`;
          } catch (error) {
            console.error(`Error reading file: ${file.name}`, error);
            fileContent += `[Error reading file: ${file.name}]\n\n`;
          }
        }
      }
    }
    
    // Process message attachments
    const processedMessages = [...messages];
    
    for (let i = 0; i < processedMessages.length; i++) {
      const msg = processedMessages[i];
      
      if (msg.attachment) {
        console.log(`Processing message attachment for streaming: ${msg.attachment.type} - ${msg.attachment.name}`);
        
        if (msg.attachment.type === 'image') {
          try {
            // Convert image URL to base64
            const base64Image = await urlToBase64(msg.attachment.url);
            
            // For image attachments, use the proper multimodal format with base64
            processedMessages[i] = {
              ...msg,
              content: [
                { type: "text", text: msg.content },
                { 
                  type: "image_url", 
                  image_url: { 
                    url: `data:image/jpeg;base64,${base64Image}`
                  }
                }
              ] as any
            };
          } catch (error) {
            console.error(`Error processing image attachment: ${msg.attachment.name}`, error);
          }
        } else if (msg.attachment.type === 'document') {
          try {
            // Read document content
            console.log(`Processing document attachment: ${msg.attachment.name} (${msg.attachment.size} bytes)`);
            const documentContent = await fetchDocumentContent(msg.attachment.url, msg.attachment.name);
            
            // Verify we have content
            if (!documentContent || documentContent.trim() === '') {
              console.warn(`Empty content received for ${msg.attachment.name}`);
              fileContent += `[Document: ${msg.attachment.name} - Unable to read content]\n\n`;
              
              // Also update the user's message to indicate the issue
              processedMessages[i] = {
                ...msg,
                content: `${msg.content}\n\n[Unable to read content from ${msg.attachment.name}]`
              };
            } else {
              // Add document content to the overall context with clear formatting
              console.log(`Adding document content to context: ${msg.attachment.name} (${documentContent.length} chars)`);
              
              // Format differently for text files to preserve formatting
              if (msg.attachment.name.toLowerCase().endsWith('.txt')) {
                fileContent += `=== CONTENT OF TEXT FILE: ${msg.attachment.name} ===\n\n${documentContent}\n\n=== END OF TEXT FILE ===\n\n`;
                
                // For text files, directly include the content in the user's message
                processedMessages[i] = {
                  ...msg,
                  content: `${msg.content}\n\nContent of ${msg.attachment.name}:\n\n\`\`\`\n${documentContent}\n\`\`\``
                };
              } else {
                fileContent += `[Document: ${msg.attachment.name}]\n\n${documentContent}\n\n`;
                
                // For other files, summarize the content
                processedMessages[i] = {
                  ...msg,
                  content: `${msg.content}\n\n[Attached document: ${msg.attachment.name}, ${documentContent.length} characters]`
                };
              }
            }
          } catch (error) {
            console.error(`Error processing document attachment: ${msg.attachment.name}`, error);
            fileContent += `[Error processing document: ${msg.attachment.name}]\n\n`;
            
            // Update user message to indicate error
            processedMessages[i] = {
              ...msg,
              content: `${msg.content}\n\n[Error reading attachment: ${msg.attachment.name}]`
            };
          }
        }
      }
    }
    
    // Create system message with context about files/images
    
    // Add diagnostic logging
    console.log(`System message generated for streaming. Has file content: ${!!fileContent}`);
    if (fileContent) {
      console.log(`Total file content length for streaming: ${fileContent.length} chars`);
    }

    console.log('Sending request to LM Studio (streaming)');
    
    // Send request to LM Studio
    const requestBody = buildRequestBody(processedMessages);

    // Log request for debugging
    console.log('Streaming request body:', JSON.stringify(requestBody, null, 2));

    const response = await fetch(LMSTUDIO_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }

    if (!response.body) {
      throw new Error('No response body received');
    }

    // Read streaming response
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      // Check if generation should be stopped
      if (window.stopGenerationSignal) {
        break;
      }
      
      const { value, done } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.trim() === '') continue;
        
        // Check for the [DONE] message which indicates the stream is complete
        if (line.trim() === 'data: [DONE]') {
          if (completionOptions?.onFinish) {
            await completionOptions.onFinish();
          }
          continue;
        }

        try {
          const data = JSON.parse(line.replace(/^data: /, ''));
          const content = data.choices[0]?.delta?.content || '';
          
          if (content) {
            if (completionOptions?.onResponse) {
              completionOptions.onResponse(content);
            }
            yield content;
          }
        } catch (e) {
          console.warn('Failed to parse stream line:', line);
        }
      }
    }

    // Process any remaining buffer content
    if (buffer) {
      // Check if the buffer contains the DONE message
      if (buffer.trim() === 'data: [DONE]') {
        if (completionOptions?.onFinish) {
          await completionOptions.onFinish();
        }
      } else {
        try {
          const data = JSON.parse(buffer.replace(/^data: /, ''));
          const content = data.choices[0]?.delta?.content || '';
          
          if (content) {
            if (completionOptions?.onResponse) {
              completionOptions.onResponse(content);
            }
            yield content;
          }
        } catch (e) {
          console.warn('Failed to parse remaining buffer:', buffer);
        }
      }
    }
    
    // Call onFinish callback if not already called by the [DONE] message handler
    if (completionOptions?.onFinish) {
      await completionOptions.onFinish();
    }
  } catch (error) {
    if (completionOptions?.onError) {
      completionOptions.onError(error as Error);
    }
    console.error('Error in getChatCompletionStream:', error);
    throw error;
  }
}

// Add this to the global Window interface
declare global {
  interface Window {
    stopGenerationSignal: boolean;
  }
}