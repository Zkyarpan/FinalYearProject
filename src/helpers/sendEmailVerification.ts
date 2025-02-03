'use server';

import nodemailer from 'nodemailer';
import EmailVerfication from '@/emails/emailVerfication';
import { render } from '@react-email/render';

export async function sendVerificationEmail(
  email: string,
  verifyCode: string
): Promise<{ success: boolean; message: string }> {
  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const emailHTML = await render(
      EmailVerfication({ email, otp: verifyCode })
    );

    const mailOptions = {
      from: 'Mentality <teammentalityapp@gmail.com>',
      to: email,
      subject: 'Your Verification Code',
      html: emailHTML,
    };

    await transporter.sendMail(mailOptions);

    return { success: true, message: 'Verification email sent successfully.' };
  } catch (error) {
    console.error('Error sending email:', error);
    return { success: false, message: 'Failed to send verification email.' };
  }
}
