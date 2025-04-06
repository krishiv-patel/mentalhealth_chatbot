export interface File {
  id?: string;
  name: string;
  size: number;
  type: string;
  mimeType: string;
  base64Data: string;
  lastModified?: number;
} 