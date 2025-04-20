export const sendEmailNotification = async (to: string, subject: string, html: string) => {
    try {
      console.log('===== EMAIL NOTIFICATION START =====');
      console.log('Attempting to send email to:', to);
      console.log('Email subject:', subject);
      
      // Try first with localhost
      const serverUrls = [
        'http://localhost:3000/api/send-email',
        'http://127.0.0.1:3000/api/send-email'
      ];
      
      let success = false;
      let lastError = null;
      let serverCheckSuccess = false;
      
      // First check if the email server is actually running
      try {
        console.log('Checking if email server is running...');
        // Use AbortController instead of AbortSignal.timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);
        
        const testResponse = await fetch('http://localhost:3000/api/test', {
          method: 'GET',
          signal: controller.signal
        });
        
        clearTimeout(timeoutId); // Clear the timeout if fetch completes
        
        if (testResponse.ok) {
          const testData = await testResponse.json();
          console.log('Email server status check:', testData);
          serverCheckSuccess = true;
        } else {
          console.error('Email server is not responding correctly:', testResponse.status);
        }
      } catch (checkError: any) {
        console.error('Email server check failed:', checkError.message);
        console.error('Server might not be running. Please start the email server with "node server.js"');
      }
      
      if (!serverCheckSuccess) {
        console.warn('Warning: Email server does not appear to be running. Will still attempt to send email.');
      }
      
      // Try each server URL until one works
      for (const serverUrl of serverUrls) {
        if (success) break;
        
        try {
          console.log(`Trying server at: ${serverUrl}`);
          
          // Use AbortController instead of AbortSignal.timeout
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 10000);
          
          const response = await fetch(serverUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              to,
              subject,
              html
            }),
            signal: controller.signal
          });
          
          clearTimeout(timeoutId); // Clear the timeout if fetch completes
          
          console.log('Server response status:', response.status);
          
          // Handle non-OK responses
          if (!response.ok) {
            const errorText = await response.text();
            console.error(`Server returned error ${response.status}:`, errorText);
            lastError = new Error(`Server returned status ${response.status}: ${errorText}`);
            continue;
          }
          
          const data = await response.json();
          console.log('Server response body:', data);
          
          if (data.success) {
            console.log('Email sent successfully through:', serverUrl);
            console.log('===== EMAIL NOTIFICATION COMPLETE =====');
            success = true;
            return data;
          } else {
            lastError = new Error(`Failed to send email: ${data.error}`);
            console.error('Server reported failure:', data.error);
          }
        } catch (error: any) {
          console.error(`Error connecting to ${serverUrl}:`, error.message);
          console.error('Full error:', error);
          lastError = error;
          // Continue to the next server URL
        }
      }
      
      // If we reach here, all server URLs failed
      if (lastError) {
        console.error('All server URLs failed');
        console.error('Last error:', lastError);
        throw lastError;
      }
      
      throw new Error('Failed to send email: Unknown error');
    } catch (error: any) {
      console.error('===== EMAIL NOTIFICATION FAILED =====');
      console.error('Failed to send email notification:', error);
      console.error('Error name:', error?.name || 'Unknown error');
      console.error('Error message:', error?.message || 'No error message');
      console.error('Full error details:', JSON.stringify(error, null, 2));
      
      // Return a partial success so the UI doesn't get stuck
      return { success: false, error: error?.message || 'Email service unavailable' };
    }
  };