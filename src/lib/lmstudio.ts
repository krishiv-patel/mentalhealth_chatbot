import { Message } from '../types';

const LMSTUDIO_URL = 'http://localhost:1234/v1/chat/completions';

async function readFileContent(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    // Check if file is valid
    if (!file || !(file instanceof Blob)) {
      console.error('Invalid file object:', file);
      resolve(''); // Return empty string instead of rejecting to prevent app crashes
      return;
    }

    // Handle different file types appropriately
    const reader = new FileReader();
    reader.onload = (e) => {
      resolve(e.target?.result as string);
    };
    reader.onerror = (e) => {
      console.error('FileReader error:', e);
      reject(new Error('Failed to read file'));
    };

    // For image files, we don't try to read text content but add a placeholder
    if (file.type.startsWith('image/')) {
      resolve(`[Image: ${file.name} (${Math.round(file.size/1024)} KB)]`);
      return;
    }
    
    // For binary files like PDFs or non-text documents, we might want a different approach
    if (file.type === 'application/pdf' || 
        file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
        file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') {
      resolve(`[Document: ${file.name} (${Math.round(file.size/1024)} KB) - Binary content]`);
      return;
    }
    
    // For text-based files, proceed with readAsText
    reader.readAsText(file);
  });
}

export async function* getChatCompletionStream(messages: Message[], files?: File | File[]) {
  try {
    let fileContent = '';
    
    // Handle single file or array of files
    if (files) {
      try {
        // Convert to array if it's a single file
        const filesArray = Array.isArray(files) ? files : [files];
        
        // Process each file and combine the content with a separator
        for (const file of filesArray) {
          if (file && file instanceof Blob) {
            const content = await readFileContent(file);
            fileContent += content + '\n\n';
          }
        }
      } catch (error) {
        console.error('Error reading files:', error);
        // Continue with empty file content
      }
    }

    const systemMessage = {
      role: 'system',
      content: `You are a helpful AI assistant that can analyze documents and chat with users. ${
        fileContent ? 'Please analyze the following document content and provide insights or answer questions about it:\n\n' + fileContent : ''
      }`
    };

    const response = await fetch(LMSTUDIO_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'qwen2.5-7b-instruct-1m',
        messages: [
          systemMessage,
          ...messages.map(({ role, content }) => ({
            role,
            content,
          })),
        ],
        temperature: 0.7,
        max_tokens: -1,
        stream: true,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to get chat completion');
    }

    if (!response.body) {
      throw new Error('No response body');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.trim() === '') continue;
        if (line.trim() === 'data: [DONE]') continue;

        try {
          const data = JSON.parse(line.replace(/^data: /, ''));
          const content = data.choices[0]?.delta?.content || '';
          if (content) {
            yield content;
          }
        } catch (e) {
          console.warn('Failed to parse line:', line);
        }
      }
    }

    if (buffer) {
      try {
        const data = JSON.parse(buffer.replace(/^data: /, ''));
        const content = data.choices[0]?.delta?.content || '';
        if (content) {
          yield content;
        }
      } catch (e) {
        console.warn('Failed to parse remaining buffer:', buffer);
      }
    }
  } catch (error) {
    console.error('Error getting chat completion:', error);
    throw error;
  }
}