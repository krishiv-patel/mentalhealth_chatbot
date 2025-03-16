export interface Message {
    id: string;
    role: 'user' | 'assistant' | 'system';
    content: string;
    timestamp: string;
    conversation_id?: string;
    attachment?: {
      type: 'document' | 'image';
      name: string;
      url: string;
      size: number;
    };
}

export interface Conversation {
  id: string;
  title: string;
  updatedAt: string;
}

// Add global window interface extension
declare global {
  interface Window {
    stopGenerationSignal: boolean;
  }
}

// Initialize the stop signal in the window object
if (typeof window !== 'undefined') {
  window.stopGenerationSignal = false;
}