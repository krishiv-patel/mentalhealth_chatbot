export interface Message {
    id: string;
    role: 'user' | 'assistant' | 'system';
    content: string;
    timestamp: string;
    conversation_id?: string;
  }

export interface Conversation {
  id: string;
  title: string;
  updatedAt: string;
}