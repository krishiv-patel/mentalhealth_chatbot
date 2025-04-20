import express from 'express';
import cors from 'cors';
const app = express();
const port = 3000;
import Mailjet from 'node-mailjet';

app.use(cors()); // Enable CORS for all routes
app.use(express.json()); // Parse JSON request bodies

// Configure Mailjet client
const mailjet = Mailjet.apiConnect(
  '46a94a235fb5f39a73f55d4c8a1c8e6f', // API Key
  'ad8c3ff879b3d7f925f685b1ec51cf80'  // Secret Key
);

// Simple test endpoint to verify server is accessible
app.get('/api/test', (req, res) => {
  console.log('Test endpoint hit at:', new Date().toISOString());
  res.json({ success: true, message: 'Server is running correctly' });
});

// Create a POST endpoint for sending emails
app.post('/api/send-email', async (req, res) => {
  console.log('===== SERVER RECEIVED EMAIL REQUEST =====');
  console.log('Request received timestamp:', new Date().toISOString());
  
  try {
    // Validate required fields
    const { to, subject, html } = req.body;
    
    if (!to || !subject || !html) {
      console.error('Missing required fields in request:', req.body);
      return res.status(400).json({ 
        success: false, 
        error: 'Missing required fields: to, subject, and html are all required' 
      });
    }
    
    console.log('Email recipient:', to);
    console.log('Email subject:', subject);
    console.log('Email content length:', html?.length || 0, 'characters');
    
    console.log('Sending email via Mailjet API...');
    
    const request = mailjet.post('send', { version: 'v3.1' }).request({
      Messages: [
        {
          From: {
            Email: 'krishivpatel27@gmail.com',
            Name: 'MindfulAI Chat'
          },
          To: [
            {
              Email: to,
              Name: to.split('@')[0]
            }
          ],
          Subject: subject,
          HTMLPart: html
        }
      ]
    });
    
    const response = await request;
    const data = response.body;
    
    console.log('===== EMAIL SENT SUCCESSFULLY =====');
    console.log('Mailjet response data:', data);
    res.json({ success: true, data });
  } catch (error) {
    console.error('===== SERVER EMAIL SENDING FAILED =====');
    console.error('Email sending failed:', error);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    
    // Return a more descriptive error object
    res.status(500).json({ 
      success: false, 
      error: error.message,
      details: {
        name: error.name,
        code: error.code || 'UNKNOWN_ERROR',
        statusCode: error.statusCode || 500
      }
    });
  }
});

// Handle 404 errors
app.use((req, res) => {
  console.log('404 - Not Found:', req.method, req.originalUrl);
  res.status(404).json({ success: false, error: 'Endpoint not found' });
});

// Handle server errors
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ success: false, error: 'Internal server error', details: err.message });
});

app.listen(port, () => {
  console.log(`Email server listening on port ${port}`);
  console.log(`Server started at: ${new Date().toISOString()}`);
  console.log(`Ready to handle email requests at http://localhost:${port}/api/send-email`);
  console.log(`Test endpoint available at http://localhost:${port}/api/test`);
});