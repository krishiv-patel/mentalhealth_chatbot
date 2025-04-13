import { Resend } from 'resend';

const RESEND_API_KEY = 're_GBHrCkuP_3i7jhFcmWbudszwCuQKwWLtu';
const resend = new Resend(RESEND_API_KEY);

export const sendEmailNotification = async (to: string, subject: string, html: string) => {
  try {
    console.log('Attempting to send email to:', to);
    console.log('Using Resend API key:', RESEND_API_KEY);
    
    const { data, error } = await resend.emails.send({
      from: 'onboarding@resend.dev',
      to,
      subject,
      html,
    });

    if (error) {
      console.error('Resend API error:', error);
      throw new Error(`Failed to send email: ${error.message}`);
    }

    console.log('Email sent successfully:', data);
    return data;
  } catch (error) {
    console.error('Failed to send email notification:', error);
    // Log the full error object for debugging
    console.error('Full error details:', JSON.stringify(error, null, 2));
    throw error;
  }
}; 