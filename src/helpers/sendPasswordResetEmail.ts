import nodemailer from 'nodemailer';
import ResetPasswordEmail from '@/emails/ResetPasswordEmail';
import { render } from '@react-email/render';

export async function sendPasswordResetEmail(
  email: string,
  resetCode: string
): Promise<{ success: boolean; message: string }> {
  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const emailHTML = await render(ResetPasswordEmail({ email, resetCode }));

    const mailOptions = {
      from: 'Mentality <teammentalityapp@gmail.com>',
      to: email,
      subject: 'Reset Your Password',
      html: emailHTML,
    };

    await transporter.sendMail(mailOptions);

    return {
      success: true,
      message: 'Password reset email sent successfully.',
    };
  } catch (error) {
    console.error('Error sending password reset email:', error);
    return { success: false, message: 'Failed to send password reset email.' };
  }
}
