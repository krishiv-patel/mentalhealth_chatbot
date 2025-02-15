import { Message } from '../types';

const LMSTUDIO_URL = 'http://localhost:1234/v1/chat/completions';

export async function getChatCompletion(messages: Message[]) {
  try {
    const response = await fetch(LMSTUDIO_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'qwen2.5-7b-instruct-1m',
        messages: messages.map(({ role, content }) => ({
          role,
          content,
        })),
        temperature: 0.7,
        max_tokens: -1,
        stream: false,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to get chat completion');
    }

    const data = await response.json();
    return data.choices[0].message.content;
  } catch (error) {
    console.error('Error getting chat completion:', error);
    throw error;
  }
}