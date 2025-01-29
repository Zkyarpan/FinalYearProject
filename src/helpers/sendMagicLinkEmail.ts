import nodemailer from 'nodemailer';
import { render } from '@react-email/render';
import { encrypt } from '@/lib/token'; // Ensure this function is defined to generate tokens
import MagicLinkEmail from '@/emails/MagicLinkEmail';

export async function sendVerificationEmail(
  email: string,
  magicLink: string
): Promise<{ success: boolean; message: string }> {
  try {
    // Generate the token
    const magicLinkToken = await encrypt({ email });
    const magicLink = `http://localhost:3000/verify?token=${magicLinkToken}`;

    // Setup the transporter
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const emailHTML = await render(
      MagicLinkEmail({ email, magicLink }) // Pass both email and magicLink to the email template
    );

    // Mail options
    const mailOptions = {
      from: 'Mentality <teammentalityapp@gmail.com>',
      to: email,
      subject: 'Activate Your Account',
      html: emailHTML,
    };

    // Send the email
    await transporter.sendMail(mailOptions);

    return { success: true, message: 'Magic link email sent successfully.' };
  } catch (error) {
    console.error('Error sending email:', error);
    return { success: false, message: 'Failed to send magic link email.' };
  }
}
