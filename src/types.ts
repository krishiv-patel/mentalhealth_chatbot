export interface Message {
    id: string;
    role: 'user' | 'assistant' | 'system';
    content: string;
    timestamp: string;
    conversation_id?: string;
    attachment?: {
      type: 'document' | 'image' | 'audio' | 'video';
      name: string;
      url: string;
      size: number;
    };
    // Encryption fields
    isEncrypted: boolean;
    encryptedContent?: string;
    nonce?: string;
}

// Interface for encrypted message data
export interface EncryptedData {
  encryptedData: string;
  nonce: string;
}

export interface Conversation {
  id: string;
  title: string;
  updatedAt: string;
  // Add public key for the conversation
  publicKey?: string;
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