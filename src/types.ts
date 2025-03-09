export interface Message {
    id: string;
    role: 'user' | 'assistant' | 'system';
    content: string;
    timestamp: string;
    conversation_id?: string;
    attachment?: {
      type: 'document';
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