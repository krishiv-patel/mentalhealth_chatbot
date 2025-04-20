// Test script to verify email server functionality
import fetch from 'node-fetch';

const testDirectEmail = async () => {
  try {
    console.log('Testing email sending direct to server...');
    console.log('Timestamp:', new Date().toISOString());
    
    // First test the test endpoint
    console.log('\nTesting /api/test endpoint:');
    const testResponse = await fetch('http://localhost:3000/api/test');
    const testData = await testResponse.json();
    console.log('Test endpoint response:', testData);
    
    if (!testData.success) {
      console.error('Test endpoint failed, email server might not be running correctly.');
      return;
    }
    
    console.log('\nTesting /api/send-email endpoint:');
    const emailResponse = await fetch('http://localhost:3000/api/send-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: 'krishivpatel27@gmail.com', // Your email
        subject: 'Email Server Test - Direct',
        html: `
          <h2>Email Test Successful</h2>
          <p>This is a direct test of the email server.</p>
          <p>If you received this, the email server is working!</p>
          <p>Timestamp: ${new Date().toISOString()}</p>
        `
      })
    });
    
    const emailData = await emailResponse.json();
    
    console.log('Email response status:', emailResponse.status);
    console.log('Email response headers:', Object.fromEntries([...emailResponse.headers]));
    console.log('Email response body:', emailData);
    
    if (emailData.success) {
      console.log('✅ Email test successful!');
    } else {
      console.error('❌ Email test failed:', emailData.error);
      if (emailData.details) {
        console.error('Error details:', emailData.details);
      }
    }
  } catch (error) {
    console.error('❌ Error testing email:', error);
    console.error('Error details:', error.message);
    console.error('Make sure the email server is running with "node server.js"');
  }
};

testDirectEmail(); 