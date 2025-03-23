import React from 'react';
import FileUploadTest from '../app/components/FileUploadTest';

export const TestUpload: React.FC = () => {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8 text-center">Document Parser Test Page</h1>
      <FileUploadTest />
    </div>
  );
}; 