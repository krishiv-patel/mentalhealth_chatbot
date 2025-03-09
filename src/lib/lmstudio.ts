import { Message } from '../types';

const LMSTUDIO_URL = 'http://localhost:1234/v1/chat/completions';

async function readFileContent(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      resolve(e.target?.result as string);
    };
    reader.onerror = (e) => {
      reject(new Error('Failed to read file'));
    };
    reader.readAsText(file);
  });
}

export async function* getChatCompletionStream(messages: Message[], file?: File) {
  try {
    let fileContent = '';
    if (file) {
      fileContent = await readFileContent(file);
    }

    const systemMessage = {
      role: 'system',
      content: `You are a helpful AI assistant that can analyze documents and chat with users. ${
        file ? 'Please analyze the following document content and provide insights or answer questions about it:\n\n' + fileContent : ''
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