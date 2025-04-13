import React, { useState, useEffect } from 'react';
import { Layout } from '../components/Layout';
import { Button } from '../components/ui/Button';
import { supabase } from '../lib/supabase';
import { Alert } from '../components/ui/Alert';
import { Input } from '../components/ui/Input';

export const BucketTest = () => {
  const [buckets, setBuckets] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [uploadResult, setUploadResult] = useState<any>(null);
  const [file, setFile] = useState<File | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const [directApiResult, setDirectApiResult] = useState<any>(null);

  useEffect(() => {
    fetchBuckets();
    testBucketAPI();
  }, []);

  const log = (message: string) => {
    setLogs(prev => [...prev, `${new Date().toISOString()}: ${message}`]);
  };

  const fetchBuckets = async () => {
    setError(null);
    setLoading(true);
    
    try {
      log('Fetching buckets...');
      const { data, error } = await supabase.storage.listBuckets();
      
      if (error) {
        log(`Error fetching buckets: ${error.message}`);
        setError(`Failed to fetch buckets: ${error.message}`);
      } else {
        log(`Found ${data.length} buckets: ${data.map((b: any) => b.name).join(', ')}`);
        setBuckets(data || []);
        
        // Check specifically for mentalhealth bucket
        const mentalhealthBucket = data?.find((bucket: any) => bucket.name === 'mentalhealth');
        if (mentalhealthBucket) {
          log('✅ mentalhealth bucket found in listBuckets response');
        } else {
          log('❌ mentalhealth bucket NOT found in listBuckets response');
        }
      }
    } catch (err: any) {
      log(`Exception fetching buckets: ${err.message}`);
      setError(`Exception: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const createMentalhealthBucket = async () => {
    setError(null);
    setSuccess(null);
    setLoading(true);
    
    try {
      log('Creating mentalhealth bucket...');
      const { data, error } = await supabase.storage.createBucket('mentalhealth', {
        public: false,
        allowedMimeTypes: ['image/png', 'image/jpeg', 'image/gif', 'application/pdf', 'text/plain', 'text/csv', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
        fileSizeLimit: 10 * 1024 * 1024, // 10MB
      });
      
      if (error) {
        if (error.message.includes('already exists')) {
          log('Bucket already exists');
          setSuccess('Bucket already exists');
        } else {
          log(`Error creating bucket: ${error.message}`);
          setError(`Failed to create bucket: ${error.message}`);
        }
      } else {
        log('Bucket created successfully');
        setSuccess('Bucket created successfully');
      }
      
      // Refresh the buckets list
      await fetchBuckets();
    } catch (err: any) {
      log(`Exception creating bucket: ${err.message}`);
      setError(`Exception: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const testBucketAPI = async () => {
    setDirectApiResult(null);
    log('Testing direct API calls...');
    
    try {
      // 1. Test public endpoint availability
      const apiUrl = import.meta.env.VITE_SUPABASE_URL || "Unknown URL";
      log(`Supabase URL: ${apiUrl}`);
      
      // 2. Test direct bucket access with a fixed path
      const testPath = `test-${Date.now()}.txt`;
      const testContent = new Blob(['Test content'], { type: 'text/plain' });
      
      // Step 1: Direct upload attempt
      log('Attempting direct upload to mentalhealth bucket...');
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('mentalhealth')
        .upload(testPath, testContent, { upsert: true });
        
      if (uploadError) {
        log(`❌ Direct upload failed: ${uploadError.message}`);
        
        // Check if this is a permission issue
        if (uploadError.message.includes('permission') || uploadError.message.includes('not authorized')) {
          log('This appears to be a permissions issue. Check your RLS policies.');
        }
        
        if (uploadError.message.includes('not found')) {
          log('This appears to be a bucket not found issue. The bucket may not exist.');
        }
      } else {
        log('✅ Direct upload successful');
        
        // Step 2: Try to get the URL
        const { data: urlData } = await supabase.storage
          .from('mentalhealth')
          .getPublicUrl(testPath);
          
        log(`✅ Public URL obtained: ${urlData.publicUrl}`);
        
        // Step 3: Cleanup - delete test file
        const { error: deleteError } = await supabase.storage
          .from('mentalhealth')
          .remove([testPath]);
          
        if (deleteError) {
          log(`❌ Delete failed: ${deleteError.message}`);
        } else {
          log('✅ Test file deleted successfully');
        }
      }
      
      // Test user info
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError) {
        log(`❌ Error getting user: ${userError.message}`);
      } else if (userData?.user) {
        log(`✅ Authenticated as: ${userData.user.email || userData.user.id}`);
      } else {
        log('❌ Not authenticated');
      }
      
      setDirectApiResult({
        supabaseUrl: apiUrl,
        user: userData?.user,
        uploadResult: uploadError ? { error: uploadError.message } : { success: true }
      });
    } catch (err: any) {
      log(`Exception in API test: ${err.message}`);
      setDirectApiResult({ error: err.message });
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0] || null;
    setFile(selectedFile);
    if (selectedFile) {
      log(`File selected: ${selectedFile.name} (${selectedFile.type}, ${selectedFile.size} bytes)`);
    } else {
      log('File selection canceled');
    }
  };

  const uploadFile = async () => {
    if (!file) {
      setError('Please select a file first');
      return;
    }
    
    setError(null);
    setSuccess(null);
    setLoading(true);
    setUploadResult(null);
    
    try {
      const filePath = `test-uploads/${Date.now()}-${file.name}`;
      log(`Uploading file: ${filePath}`);
      
      const { data, error } = await supabase.storage
        .from('mentalhealth')
        .upload(filePath, file, { upsert: true });
        
      if (error) {
        log(`❌ Upload failed: ${error.message}`);
        setError(`Failed to upload: ${error.message}`);
        setUploadResult({ error: error.message });
      } else {
        log('✅ Upload successful');
        
        // Get the public URL
        const { data: urlData } = await supabase.storage
          .from('mentalhealth')
          .getPublicUrl(filePath);
          
        setSuccess('File uploaded successfully');
        setUploadResult({
          success: true,
          path: filePath,
          publicUrl: urlData.publicUrl
        });
        log(`Public URL: ${urlData.publicUrl}`);
      }
    } catch (err: any) {
      log(`Exception uploading file: ${err.message}`);
      setError(`Exception: ${err.message}`);
      setUploadResult({ exception: err.message });
    } finally {
      setLoading(false);
    }
  };

  const getTroubleshootingInfo = () => {
    const troubleshootingSteps = [
      '1. Make sure the bucket "mentalhealth" exists in Supabase',
      '2. Ensure RLS policies allow the current user to upload files',
      '3. Check file size limits (default is 2MB unless configured)',
      '4. Verify the Supabase URL and anon key in environment variables',
      '5. Check if user authentication is required for uploads',
      '6. Ensure migration files have been applied correctly',
    ];
    return troubleshootingSteps;
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">Supabase Storage Bucket Test</h1>
        
        {error && (
          <Alert variant="destructive" className="mb-4">
            <p>{error}</p>
          </Alert>
        )}
        
        {success && (
          <Alert className="mb-4 bg-green-100 border-green-500 text-green-800">
            <p>{success}</p>
          </Alert>
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4">Available Buckets</h2>
            <Button onClick={fetchBuckets} disabled={loading} className="mb-4">
              {loading ? 'Loading...' : 'Refresh Buckets'}
            </Button>
            
            {buckets.length > 0 ? (
              <ul className="list-disc pl-5">
                {buckets.map((bucket) => (
                  <li key={bucket.id} className="mb-2">
                    <span className="font-medium">{bucket.name}</span>
                    {bucket.name === 'mentalhealth' && (
                      <span className="ml-2 text-green-600 font-bold">✓</span>
                    )}
                  </li>
                ))}
              </ul>
            ) : !loading ? (
              <p className="text-gray-500">No buckets found</p>
            ) : null}
            
            <div className="mt-6">
              <h3 className="text-lg font-medium mb-2">Create Mentalhealth Bucket</h3>
              <Button 
                onClick={createMentalhealthBucket} 
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Create Bucket
              </Button>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4">Upload Test</h2>
            <div className="mb-4">
              <Input 
                type="file"
                onChange={handleFileChange}
                disabled={loading}
              />
            </div>
            
            <Button 
              onClick={uploadFile} 
              disabled={loading || !file}
              className="bg-green-600 hover:bg-green-700"
            >
              Upload to Mentalhealth Bucket
            </Button>
            
            {uploadResult && (
              <div className="mt-4 p-4 bg-gray-100 rounded">
                <h3 className="font-semibold mb-2">Upload Result:</h3>
                <pre className="text-sm overflow-x-auto">
                  {JSON.stringify(uploadResult, null, 2)}
                </pre>
                {uploadResult.publicUrl && (
                  <div className="mt-2">
                    <a 
                      href={uploadResult.publicUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 underline"
                    >
                      View Uploaded File
                    </a>
                  </div>
                )}
              </div>
            )}
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-md md:col-span-2">
            <h2 className="text-xl font-semibold mb-4">Direct API Test Results</h2>
            <Button onClick={testBucketAPI} disabled={loading} className="mb-4">
              Run API Tests
            </Button>
            
            {directApiResult && (
              <div className="mt-4 p-4 bg-gray-100 rounded">
                <pre className="text-sm overflow-x-auto">
                  {JSON.stringify(directApiResult, null, 2)}
                </pre>
              </div>
            )}
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-md md:col-span-2">
            <h2 className="text-xl font-semibold mb-4">Troubleshooting</h2>
            <ul className="list-disc pl-5">
              {getTroubleshootingInfo().map((step, index) => (
                <li key={index} className="mb-2">{step}</li>
              ))}
            </ul>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-md md:col-span-2">
            <h2 className="text-xl font-semibold mb-4">Debug Logs</h2>
            <div className="bg-gray-100 p-4 rounded h-64 overflow-y-auto font-mono text-sm">
              {logs.map((log, index) => (
                <div key={index} className="mb-1">{log}</div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}; 