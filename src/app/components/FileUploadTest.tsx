'use client';

import { useState, useRef } from 'react';
import { extractTextFromFile, ParsedDocument, DocumentMetadata, TextAnalysis } from '../../lib/documentParser';

export default function FileUploadTest() {
  const [parsedDocument, setParsedDocument] = useState<ParsedDocument | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [fileName, setFileName] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'content' | 'metadata' | 'analysis'>('content');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    setFileName(file.name);
    setError('');
    setParsedDocument(null);

    try {
      console.log(`Processing file: ${file.name} (${file.type}, ${file.size} bytes)`);
      const result = await extractTextFromFile(file, file.name);
      setParsedDocument(result);
    } catch (err) {
      console.error('Error processing file:', err);
      setError(`Failed to process file: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClear = () => {
    setParsedDocument(null);
    setFileName('');
    setError('');
    setActiveTab('content');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Render metadata in a structured format
  const renderMetadata = (metadata: DocumentMetadata) => {
    return (
      <div className="grid grid-cols-2 gap-3 text-sm">
        <div className="col-span-2 font-semibold text-base border-b pb-2 mb-2">File Information</div>
        
        <div className="font-medium">File Name:</div>
        <div>{metadata.fileName}</div>
        
        <div className="font-medium">File Type:</div>
        <div>{metadata.fileType}</div>
        
        <div className="font-medium">File Size:</div>
        <div>{formatFileSize(metadata.fileSize)}</div>
        
        {metadata.pageCount && (
          <>
            <div className="font-medium">Pages:</div>
            <div>{metadata.pageCount}</div>
          </>
        )}
        
        <div className="col-span-2 font-semibold text-base border-b pb-2 my-2">Document Properties</div>
        
        {metadata.title && (
          <>
            <div className="font-medium">Title:</div>
            <div>{metadata.title}</div>
          </>
        )}
        
        {metadata.author && (
          <>
            <div className="font-medium">Author:</div>
            <div>{metadata.author}</div>
          </>
        )}
        
        {metadata.subject && (
          <>
            <div className="font-medium">Subject:</div>
            <div>{metadata.subject}</div>
          </>
        )}
        
        {metadata.creationDate && (
          <>
            <div className="font-medium">Created:</div>
            <div>{formatPdfDate(metadata.creationDate)}</div>
          </>
        )}
        
        {metadata.modificationDate && (
          <>
            <div className="font-medium">Modified:</div>
            <div>{formatPdfDate(metadata.modificationDate)}</div>
          </>
        )}
        
        {metadata.keywords && metadata.keywords.length > 0 && (
          <>
            <div className="font-medium">Keywords:</div>
            <div>{metadata.keywords.join(', ')}</div>
          </>
        )}
        
        <div className="col-span-2 font-semibold text-base border-b pb-2 my-2">Content Statistics</div>
        
        <div className="font-medium">Total Words:</div>
        <div>{metadata.totalWords.toLocaleString()}</div>
        
        <div className="font-medium">Total Characters:</div>
        <div>{metadata.totalCharacters.toLocaleString()}</div>
        
        <div className="font-medium">Paragraphs:</div>
        <div>{metadata.totalParagraphs.toLocaleString()}</div>
      </div>
    );
  };

  // Render text analysis
  const renderAnalysis = (analysis: TextAnalysis) => {
    return (
      <div className="grid grid-cols-1 gap-6">
        <div>
          <h3 className="font-semibold text-base mb-3">Reading Statistics</h3>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="font-medium">Reading Time:</div>
            <div>{formatReadingTime(analysis.readingTimeMinutes)}</div>
            
            <div className="font-medium">Sentences:</div>
            <div>{analysis.sentenceCount.toLocaleString()}</div>
            
            <div className="font-medium">Avg. Sentence Length:</div>
            <div>{analysis.averageSentenceLength.toFixed(1)} words</div>
            
            <div className="font-medium">Avg. Word Length:</div>
            <div>{analysis.averageWordLength.toFixed(1)} characters</div>
            
            <div className="font-medium">Longest Word:</div>
            <div>{analysis.longestWord}</div>
          </div>
        </div>
        
        <div>
          <h3 className="font-semibold text-base mb-3">Most Frequent Words</h3>
          {analysis.topWords.length > 0 ? (
            <div className="grid grid-cols-2 gap-2">
              {analysis.topWords.map((item, index) => (
                <div key={index} className="flex justify-between py-1 px-2 rounded bg-gray-100">
                  <span className="font-medium">{item.word}</span>
                  <span className="text-gray-600">{item.count}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-gray-500">No word frequency data available</div>
          )}
        </div>
        
        <div>
          <h3 className="font-semibold text-base mb-3">Word Cloud Visualization</h3>
          <div className="p-4 bg-gray-100 rounded flex items-center justify-center min-h-[150px]">
            {analysis.topWords.length > 0 ? (
              <div className="flex flex-wrap gap-2 justify-center">
                {analysis.topWords.map((item, index) => {
                  // Calculate font size based on frequency (from 1 to 3em)
                  const maxCount = Math.max(...analysis.topWords.map(w => w.count));
                  const fontSize = 1 + (item.count / maxCount) * 2;
                  return (
                    <span 
                      key={index} 
                      style={{ 
                        fontSize: `${fontSize}em`,
                        opacity: 0.4 + (item.count / maxCount) * 0.6
                      }}
                      className="text-primary"
                    >
                      {item.word}
                    </span>
                  );
                })}
              </div>
            ) : (
              <span className="text-gray-500">Not enough data for word cloud</span>
            )}
          </div>
        </div>
      </div>
    );
  };

  // Format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // Format PDF date
  const formatPdfDate = (dateStr: string): string => {
    // Handle PDF date format like D:20200101235959+00'00'
    try {
      if (dateStr.startsWith('D:')) {
        const year = dateStr.substring(2, 6);
        const month = dateStr.substring(6, 8);
        const day = dateStr.substring(8, 10);
        const hour = dateStr.substring(10, 12) || '00';
        const minute = dateStr.substring(12, 14) || '00';
        const dateObj = new Date(`${year}-${month}-${day}T${hour}:${minute}:00`);
        return dateObj.toLocaleString();
      }
      return dateStr;
    } catch (e) {
      return dateStr;
    }
  };

  // Format reading time
  const formatReadingTime = (minutes: number): string => {
    if (minutes < 1) {
      return 'Less than 1 minute';
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = Math.round(minutes % 60);
    
    if (hours === 0) {
      return `${remainingMinutes} minute${remainingMinutes !== 1 ? 's' : ''}`;
    }
    
    return `${hours} hour${hours !== 1 ? 's' : ''} ${remainingMinutes} minute${remainingMinutes !== 1 ? 's' : ''}`;
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-4">Document Parser Test</h2>
      
      <div className="mb-6">
        <label className="block text-gray-700 text-sm font-bold mb-2">
          Upload a file to test our document parser
        </label>
        
        <div className="flex items-center gap-4">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="flex-1 p-2 border border-gray-300 rounded"
            accept=".txt,.pdf,.docx,.csv,.md,.json,.xml"
          />
          
          <button
            onClick={handleClear}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
          >
            Clear
          </button>
        </div>
      </div>
      
      {isLoading && (
        <div className="my-4 text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          <p className="mt-2">Processing {fileName}...</p>
        </div>
      )}
      
      {error && (
        <div className="my-4 p-4 bg-red-100 border-l-4 border-red-500 text-red-700">
          <p className="font-bold">Error</p>
          <p>{error}</p>
        </div>
      )}
      
      {parsedDocument && (
        <div className="mt-6">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-lg font-semibold">Document Analysis: {fileName}</h3>
            <div className="text-sm text-gray-500">
              {parsedDocument.metadata.totalWords.toLocaleString()} words, {parsedDocument.metadata.totalCharacters.toLocaleString()} characters
            </div>
          </div>
          
          {/* Tab navigation */}
          <div className="flex border-b mb-4">
            <button 
              className={`py-2 px-4 ${activeTab === 'content' ? 'border-b-2 border-blue-500 font-medium' : 'text-gray-500'}`}
              onClick={() => setActiveTab('content')}
            >
              Content
            </button>
            <button 
              className={`py-2 px-4 ${activeTab === 'metadata' ? 'border-b-2 border-blue-500 font-medium' : 'text-gray-500'}`}
              onClick={() => setActiveTab('metadata')}
            >
              Metadata
            </button>
            <button 
              className={`py-2 px-4 ${activeTab === 'analysis' ? 'border-b-2 border-blue-500 font-medium' : 'text-gray-500'}`}
              onClick={() => setActiveTab('analysis')}
            >
              Analysis
            </button>
          </div>
          
          {/* Tab content */}
          <div className="p-4 bg-gray-50 rounded border border-gray-200">
            {activeTab === 'content' && (
              <div className="whitespace-pre-wrap font-mono text-sm overflow-auto max-h-96">
                {parsedDocument.content}
              </div>
            )}
            
            {activeTab === 'metadata' && renderMetadata(parsedDocument.metadata)}
            
            {activeTab === 'analysis' && renderAnalysis(parsedDocument.analysis)}
          </div>
        </div>
      )}
    </div>
  );
} 