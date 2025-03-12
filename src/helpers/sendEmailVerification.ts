'use server';

import nodemailer from 'nodemailer';
import EmailVerfication from '@/emails/emailVerfication';
import ApprovalEmail from '@/emails/ApprovalEmail';
import RejectionEmail from '@/emails/RejectionEmail';
import { render } from '@react-email/render';

// Create a reusable transporter
const getTransporter = () => {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
};

export async function sendVerificationEmail(
  email: string,
  verifyCode: string
): Promise<{ success: boolean; message: string }> {
  try {
    const transporter = getTransporter();

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

/**
 * Send an approval email to a psychologist
 * @param email Recipient's email address
 * @param firstName Psychologist's first name
 * @param lastName Psychologist's last name
 * @returns Promise with success status and message
 */
export async function sendApprovalEmail(
  email: string,
  firstName: string,
  lastName: string
): Promise<{ success: boolean; message: string }> {
  try {
    const transporter = getTransporter();

    const emailHTML = await render(
      ApprovalEmail({ email, firstName, lastName })
    );

    const mailOptions = {
      from: 'Mentality <teammentalityapp@gmail.com>',
      to: email,
      subject: 'Your Professional Account Has Been Approved',
      html: emailHTML,
    };

    await transporter.sendMail(mailOptions);

    return { success: true, message: 'Approval email sent successfully.' };
  } catch (error) {
    console.error('Error sending approval email:', error);
    return { success: false, message: 'Failed to send approval email.' };
  }
}

/**
 * Send a rejection email to a psychologist with feedback
 * @param email Recipient's email address
 * @param firstName Psychologist's first name
 * @param lastName Psychologist's last name
 * @param feedback Admin feedback explaining the rejection reason
 * @returns Promise with success status and message
 */
export async function sendRejectionEmail(
  email: string,
  firstName: string,
  lastName: string,
  feedback: string
): Promise<{ success: boolean; message: string }> {
  try {
    const transporter = getTransporter();

    const emailHTML = await render(
      RejectionEmail({ email, firstName, lastName, feedback })
    );

    const mailOptions = {
      from: 'Mentality <teammentalityapp@gmail.com>',
      to: email,
      subject: 'Your Professional Account Application Status',
      html: emailHTML,
    };

    await transporter.sendMail(mailOptions);

    return { success: true, message: 'Rejection email sent successfully.' };
  } catch (error) {
    console.error('Error sending rejection email:', error);
    return { success: false, message: 'Failed to send rejection email.' };
  }
}
