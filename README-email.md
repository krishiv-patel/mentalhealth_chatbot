# Email Report Functionality Guide

This guide explains how to set up and test the email report functionality in the MindfulAI Chat application.

## Overview

The MindfulAI Chat application includes the ability to export chat reports and send email notifications when reports are generated. This functionality requires:

1. The email server to be running on port 3000
2. Proper email configuration in the application

## Setup Instructions

### Starting the Email Server

The email server must be running for the email notifications to work:

```bash
# Start the email server from the project root
node server.js
```

You should see output similar to:
```
Email server listening on port 3000
Server started at: 2023-XX-XXXX:XX:XX.XXXZ
Ready to handle email requests at http://localhost:3000/api/send-email
Test endpoint available at http://localhost:3000/api/test
```

Keep this terminal window open while using the application.

### Testing Email Functionality

You can verify the email server is working by running the test scripts:

```bash
# Test the email server directly
node test-email-direct.js

# Test the email implementation
node test-email-module.js
```

Both scripts should output successful results if the email server is working correctly.

## Troubleshooting

### Email Notifications Not Being Sent

If email notifications are not being sent when reports are generated:

1. **Check if the email server is running:**
   ```bash
   # Check processes listening on port 3000
   netstat -ano | findstr :3000
   ```
   
   If no process is listening on port 3000, start the email server:
   ```bash
   node server.js
   ```

2. **Check the console logs:**
   - Open browser developer tools (F12)
   - Look for any errors related to email sending
   - Check for messages like "Attempting to send email to:", "Email server check failed:", etc.

3. **Verify email server connectivity:**
   - Visit http://localhost:3000/api/test in your browser
   - You should receive a JSON response: `{"success":true,"message":"Server is running correctly"}`

### Common Issues and Solutions

1. **"Failed to fetch" or "Connection refused" errors:**
   - The email server is not running. Start it with `node server.js`
   
2. **"CORS error" messages:**
   - The email server is running but has CORS issues. Verify the CORS settings in server.js

3. **Email server starts but crashes:**
   - Check for error messages in the server terminal
   - Verify Mailjet API keys are correct in server.js

## Email Technology Stack

- **Server:** Express.js
- **Email Provider:** Mailjet
- **Client Implementation:** Dynamic fetch requests

## Technical Implementation

The email notification is triggered in the `generateReport` function in `src/pages/Chat.tsx`. When a report is generated:

1. The function first checks if the user's email is available
2. It then imports the email module from `src/lib/email.ts`
3. The email module attempts to connect to the local email server
4. The server processes the request and sends the email via Mailjet

For debugging purposes, comprehensive logging has been added throughout this process. 