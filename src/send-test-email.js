import { Resend } from 'resend';

const resend = new Resend('re_GBHrCkuP_3i7jhFcmWbudszwCuQKwWLtu');

async function main() {
  try {
    console.log('Attempting to send email...');
    const data = await resend.emails.send({
      from: 'onboarding@resend.dev',
      to: 'krishivpatel27@gmail.com',
      subject: 'Hello from MindfulAI',
      html: '<p>This is a test email from your MindfulAI chatbot.</p><p>If you received this, the email functionality is working!</p>'
    });

    console.log('Email sent successfully:', data);
  } catch (error) {
    console.error('Error sending email:', error);
    console.error('Full error details:', JSON.stringify(error, null, 2));
  }
}

main(); 