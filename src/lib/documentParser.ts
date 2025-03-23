/**
 * Document Parser Utility
 * Provides utilities for parsing various document formats
 */

// Constants for PDF.js CDN
const PDF_JS_URL = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
const PDF_WORKER_URL = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
const MAMMOTH_URL = 'https://cdnjs.cloudflare.com/ajax/libs/mammoth/1.6.0/mammoth.browser.min.js';

// Define interfaces for PDF.js
interface PdfjsLib {
  getDocument: (source: any) => { promise: Promise<PdfjsDocument> };
  GlobalWorkerOptions?: {
    workerSrc: string;
  };
}

interface PdfjsDocument {
  numPages: number;
  getPage: (pageNum: number) => Promise<PdfjsPage>;
  getMetadata?: () => Promise<any>;
}

interface PdfjsPage {
  getTextContent: () => Promise<{
    items: Array<{
      str: string;
    }>;
  }>;
}

// Interface for Mammoth.js
interface Mammoth {
  convertToHtml: (file: ArrayBuffer) => Promise<{ value: string }>;
}

// Document metadata interface
export interface DocumentMetadata {
  fileType: string;
  fileName: string;
  fileSize: number;
  totalWords: number;
  totalCharacters: number;
  totalParagraphs: number;
  creationDate?: string;
  modificationDate?: string;
  author?: string;
  title?: string;
  subject?: string;
  keywords?: string[];
  pageCount?: number;
  language?: string;
  isEncrypted?: boolean;
  properties?: Record<string, any>;
}

// Text analysis interface
export interface TextAnalysis {
  wordFrequency: Record<string, number>;
  topWords: Array<{word: string, count: number}>;
  averageWordLength: number;
  longestWord: string;
  readingTimeMinutes: number;
  sentenceCount: number;
  averageSentenceLength: number;
}

// Parsed document result interface
export interface ParsedDocument {
  content: string;
  metadata: DocumentMetadata;
  analysis: TextAnalysis;
}

// Global declaration to extend Window
declare global {
  interface Window {
    pdfjsLib?: PdfjsLib;
    mammoth?: Mammoth;
  }
}

/**
 * Dynamically load a script from URL
 */
function loadScript(url: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = url;
    script.onload = () => resolve();
    script.onerror = (error) => reject(new Error(`Failed to load script: ${url}: ${error}`));
    document.head.appendChild(script);
  });
}

/**
 * Load PDF.js library
 */
async function loadPdfJs(): Promise<PdfjsLib> {
  if (window.pdfjsLib) {
    return window.pdfjsLib;
  }

  try {
    await loadScript(PDF_JS_URL);
    
    if (!window.pdfjsLib) {
      throw new Error('PDF.js failed to load properly');
    }
    
    // Set worker source - Use type assertion to safely access GlobalWorkerOptions
    const lib = window.pdfjsLib as any;
    if (lib && lib.GlobalWorkerOptions) {
      lib.GlobalWorkerOptions.workerSrc = PDF_WORKER_URL;
    } else {
      console.warn('PDF.js loaded but GlobalWorkerOptions not available');
    }
    
    return window.pdfjsLib;
  } catch (error) {
    console.error('Error loading PDF.js:', error);
    throw error;
  }
}

/**
 * Load Mammoth.js for DOCX parsing
 */
async function loadMammoth(): Promise<Mammoth> {
  if (window.mammoth) {
    return window.mammoth;
  }

  try {
    await loadScript(MAMMOTH_URL);
    
    if (!window.mammoth) {
      throw new Error('Mammoth.js failed to load properly');
    }
    
    return window.mammoth;
  } catch (error) {
    console.error('Error loading Mammoth.js:', error);
    throw error;
  }
}

/**
 * Extract metadata from PDF using PDF.js
 */
async function extractPdfMetadata(pdf: any): Promise<Partial<DocumentMetadata>> {
  try {
    if (pdf.getMetadata) {
      const metadata = await pdf.getMetadata();
      const info = metadata.info || {};
      const metadata_: Partial<DocumentMetadata> = {
        pageCount: pdf.numPages,
        author: info.Author,
        title: info.Title,
        subject: info.Subject,
        keywords: info.Keywords?.split(',').map((k: string) => k.trim()),
        creationDate: info.CreationDate,
        modificationDate: info.ModDate,
        isEncrypted: !!metadata.metadata?.encrypted,
        properties: {}
      };
      
      // Extract additional metadata properties
      if (metadata.metadata && metadata.metadata.getAll) {
        const properties: Record<string, any> = {};
        const metadataProps = metadata.metadata.getAll();
        for (const prop of metadataProps) {
          properties[prop.name] = prop.value;
        }
        metadata_.properties = properties;
      }
      
      return metadata_;
    }
    return {
      pageCount: pdf.numPages
    };
  } catch (error) {
    console.error('Error extracting PDF metadata:', error);
    return {
      pageCount: pdf.numPages
    };
  }
}

/**
 * Calculate text statistics and analysis
 */
function analyzeText(text: string): TextAnalysis {
  // Clean text
  const cleanText = text.toLowerCase().replace(/[^\w\s]/g, '');
  const words = cleanText.split(/\s+/).filter(w => w.length > 0);
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  
  // Word frequency
  const wordFrequency: Record<string, number> = {};
  let totalWordLength = 0;
  let longestWord = '';
  
  words.forEach(word => {
    wordFrequency[word] = (wordFrequency[word] || 0) + 1;
    totalWordLength += word.length;
    
    if (word.length > longestWord.length) {
      longestWord = word;
    }
  });
  
  // Get top words (excluding common stop words)
  const stopWords = new Set(['the', 'a', 'an', 'and', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were']);
  const topWords = Object.entries(wordFrequency)
    .filter(([word]) => !stopWords.has(word) && word.length > 2)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([word, count]) => ({ word, count }));
  
  // Calculate statistics
  const averageWordLength = words.length > 0 ? totalWordLength / words.length : 0;
  const readingTimeMinutes = words.length > 0 ? words.length / 200 : 0; // Assuming 200 WPM reading speed
  const sentenceCount = sentences.length;
  const averageSentenceLength = sentenceCount > 0 ? words.length / sentenceCount : 0;
  
  return {
    wordFrequency,
    topWords,
    averageWordLength,
    longestWord,
    readingTimeMinutes,
    sentenceCount,
    averageSentenceLength
  };
}

/**
 * Extract text from PDF using PDF.js
 */
async function extractPdfText(fileData: ArrayBuffer, fileName: string): Promise<ParsedDocument> {
  try {
    const pdfjsLib = await loadPdfJs();
    const loadingTask = pdfjsLib.getDocument(fileData);
    const pdf = await loadingTask.promise;
    
    // Extract text content
    let fullText = '';
    
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items
        .map((item: any) => item.str)
        .join(' ');
      
      fullText += pageText + '\n\n';
    }
    
    const content = fullText.trim();
    
    // Extract metadata
    const pdfMetadata = await extractPdfMetadata(pdf);
    
    // Create base metadata
    const metadata: DocumentMetadata = {
      fileType: 'application/pdf',
      fileName,
      fileSize: fileData.byteLength,
      totalWords: content.split(/\s+/).filter(Boolean).length,
      totalCharacters: content.length,
      totalParagraphs: content.split(/\n\s*\n/).filter(Boolean).length,
      ...pdfMetadata
    };
    
    // Analyze text
    const analysis = analyzeText(content);
    
    return {
      content,
      metadata,
      analysis
    };
  } catch (error) {
    console.error('Error extracting PDF text:', error);
    
    // Fall back to simpler extraction if PDF.js fails
    return {
      content: 'Failed to extract PDF text with PDF.js. Please try a different file format.',
      metadata: {
        fileType: 'application/pdf',
        fileName,
        fileSize: fileData.byteLength,
        totalWords: 0,
        totalCharacters: 0,
        totalParagraphs: 0
      },
      analysis: {
        wordFrequency: {},
        topWords: [],
        averageWordLength: 0,
        longestWord: '',
        readingTimeMinutes: 0,
        sentenceCount: 0,
        averageSentenceLength: 0
      }
    };
  }
}

/**
 * Extract text from DOCX file using Mammoth
 */
async function extractDocxText(fileData: ArrayBuffer, fileName: string): Promise<ParsedDocument> {
  try {
    const mammoth = await loadMammoth();
    const result = await mammoth.convertToHtml(fileData);
    
    // Convert HTML to plain text
    const div = document.createElement('div');
    div.innerHTML = result.value;
    const content = div.textContent || '';
    
    // Create metadata
    const metadata: DocumentMetadata = {
      fileType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      fileName,
      fileSize: fileData.byteLength,
      totalWords: content.split(/\s+/).filter(Boolean).length,
      totalCharacters: content.length,
      totalParagraphs: content.split(/\n\s*\n/).filter(Boolean).length
    };
    
    // Analyze text
    const analysis = analyzeText(content);
    
    return {
      content,
      metadata,
      analysis
    };
  } catch (error) {
    console.error('Error extracting DOCX text:', error);
    return {
      content: 'Failed to extract DOCX text. Please try a different file format.',
      metadata: {
        fileType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        fileName,
        fileSize: fileData.byteLength,
        totalWords: 0,
        totalCharacters: 0,
        totalParagraphs: 0
      },
      analysis: {
        wordFrequency: {},
        topWords: [],
        averageWordLength: 0,
        longestWord: '',
        readingTimeMinutes: 0,
        sentenceCount: 0,
        averageSentenceLength: 0
      }
    };
  }
}

/**
 * Parse CSV file to text
 */
function parseCsvText(text: string, fileName: string, fileSize: number): ParsedDocument {
  // Simple CSV parser - could be enhanced for more complex CSVs
  const lines = text.split('\n');
  let formattedText = '';
  
  lines.forEach(line => {
    // Handle quoted values
    let row = '';
    let inQuotes = false;
    let currValue = '';
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        row += currValue + '\t'; // Use tab as separator for readability
        currValue = '';
      } else {
        currValue += char;
      }
    }
    
    row += currValue;
    formattedText += row + '\n';
  });
  
  const content = formattedText.trim();
  
  // Create metadata
  const metadata: DocumentMetadata = {
    fileType: 'text/csv',
    fileName,
    fileSize,
    totalWords: content.split(/\s+/).filter(Boolean).length,
    totalCharacters: content.length,
    totalParagraphs: lines.length
  };
  
  // Analyze text
  const analysis = analyzeText(content);
  
  return {
    content,
    metadata,
    analysis
  };
}

/**
 * Process plain text files
 */
function processTextFile(text: string, fileName: string, fileSize: number, fileType: string): ParsedDocument {
  // Create metadata
  const metadata: DocumentMetadata = {
    fileType,
    fileName,
    fileSize,
    totalWords: text.split(/\s+/).filter(Boolean).length,
    totalCharacters: text.length,
    totalParagraphs: text.split(/\n\s*\n/).filter(Boolean).length
  };
  
  // Analyze text
  const analysis = analyzeText(text);
  
  return {
    content: text,
    metadata,
    analysis
  };
}

/**
 * Extract text from a file blob based on file type
 */
export async function extractTextFromFile(fileBlob: Blob, fileName: string): Promise<ParsedDocument> {
  try {
    console.log(`Extracting text from: ${fileName} (${fileBlob.type}, ${fileBlob.size} bytes)`);
    
    // Get file extension from the file name
    const extension = fileName.split('.').pop()?.toLowerCase() || '';
    const fileData = await fileBlob.arrayBuffer();
    
    // Process based on MIME type or extension
    if (fileBlob.type === 'application/pdf' || extension === 'pdf') {
      console.log('Processing PDF file');
      return await extractPdfText(fileData, fileName);
    } else if (fileBlob.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || 
               extension === 'docx') {
      console.log('Processing DOCX file');
      return await extractDocxText(fileData, fileName);
    } else if (fileBlob.type === 'text/csv' || extension === 'csv') {
      console.log('Processing CSV file');
      const text = await fileBlob.text();
      return parseCsvText(text, fileName, fileBlob.size);
    } else if (fileBlob.type.startsWith('text/') || 
              ['txt', 'md', 'js', 'ts', 'html', 'css', 'json', 'xml'].includes(extension)) {
      console.log('Processing text file');
      const text = await fileBlob.text();
      return processTextFile(text, fileName, fileBlob.size, fileBlob.type || `text/${extension}`);
    } else {
      // Try as plain text for other formats
      console.log('Unknown format, trying as text');
      const text = await fileBlob.text();
      return processTextFile(text, fileName, fileBlob.size, fileBlob.type || 'application/octet-stream');
    }
  } catch (error) {
    console.error(`Error extracting text from file: ${fileName}`, error);
    return {
      content: `[Error extracting text from ${fileName}]`,
      metadata: {
        fileType: 'unknown',
        fileName,
        fileSize: fileBlob.size,
        totalWords: 0,
        totalCharacters: 0,
        totalParagraphs: 0
      },
      analysis: {
        wordFrequency: {},
        topWords: [],
        averageWordLength: 0,
        longestWord: '',
        readingTimeMinutes: 0,
        sentenceCount: 0,
        averageSentenceLength: 0
      }
    };
  }
} 