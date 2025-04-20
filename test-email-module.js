// Test script using direct fetch to test our email functionality without TypeScript dependencies
import fetch from 'node-fetch';

const sendEmailTest = async (to, subject, html) => {
  console.log('===== EMAIL TEST START =====');
  console.log('Attempting to send email to:', to);
  console.log('Email subject:', subject);
  
  // Try server URLs
  const serverUrls = [
    'http://localhost:3000/api/send-email',
    'http://127.0.0.1:3000/api/send-email'
  ];
  
  let success = false;
  let lastError = null;
  
  // Try each server URL until one works
  for (const serverUrl of serverUrls) {
    if (success) break;
    
    try {
      console.log(`Trying server at: ${serverUrl}`);
      
      const response = await fetch(serverUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to,
          subject,
          html
        })
      });
      
      console.log('Server response status:', response.status);
      
      const data = await response.json();
      console.log('Server response body:', data);
      
      if (data.success) {
        console.log('Email sent successfully through:', serverUrl);
        console.log('===== EMAIL TEST COMPLETE =====');
        success = true;
        return data;
      } else {
        lastError = new Error(`Failed to send email: ${data.error}`);
        console.error('Server reported failure:', data.error);
      }
    } catch (error) {
      console.error(`Error connecting to ${serverUrl}:`, error.message);
      lastError = error;
      // Continue to the next server URL
    }
  }
  
  // If we reach here, all server URLs failed
  if (lastError) {
    console.error('All server URLs failed');
    throw lastError;
  }
  
  throw new Error('Failed to send email: Unknown error');
};

const testEmail = async () => {
  try {
    console.log('Testing email sending...');
    console.log('Timestamp:', new Date().toISOString());
    
    const result = await sendEmailTest(
      'krishivpatel27@gmail.com',
      'Email Module Implementation Test',
      `
        <h2>Email Implementation Test</h2>
        <p>This test uses the same code as our email.ts module, but implemented directly in JavaScript.</p>
        <p>If you received this, the email implementation is working correctly!</p>
        <p>Timestamp: ${new Date().toISOString()}</p>
      `
    );
    
    console.log('Email sending result:', result);
    console.log('✅ Email test successful!');
  } catch (error) {
    console.error('❌ Error testing email:', error);
    console.error('Error details:', error.message);
    console.error('Make sure the email server is running with "node server.js"');
  }
};

testEmail(); 