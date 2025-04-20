// Simple test script to verify our email sending functionality
import fetch from 'node-fetch';

const testEmail = async () => {
  try {
    console.log('Testing email sending...');
    
    const response = await fetch('http://localhost:3000/api/send-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: 'krishivpatel27@gmail.com', // Your email
        subject: 'Test Email from MindfulAI Chat',
        html: `
          <h2>Email Test Successful</h2>
          <p>This is a test email to verify the Mailjet integration is working correctly.</p>
          <p>If you received this, the email server is working!</p>
          <p>Timestamp: ${new Date().toISOString()}</p>
        `
      })
    });
    
    const data = await response.json();
    console.log('Response:', data);
    
    if (data.success) {
      console.log('✅ Email test successful!');
    } else {
      console.error('❌ Email test failed:', data.error);
    }
  } catch (error) {
    console.error('❌ Error testing email:', error);
  }
};

testEmail(); 