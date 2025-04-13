import { sendEmailNotification } from './lib/email';

async function testEmail() {
  try {
    await sendEmailNotification(
      'krishivpatel27@gmail.com',
      'Test Email from MindfulAI',
      '<p>This is a test email to verify the email notification system.</p>'
    );
    console.log('Test email sent successfully');
  } catch (error) {
    console.error('Error sending test email:', error);
  }
}

testEmail(); 