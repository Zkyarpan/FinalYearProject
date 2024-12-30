import nodemailer from "nodemailer";
import VerificationEmail from "@/emails/emailVerfication";
import { render } from "@react-email/render";
import { createSuccessResponse, createErrorResponse } from "@/lib/response";

export async function sendVerificationEmail(
  email: string,
  verifyCode: string
): Promise<any> {
  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER, 
        pass: process.env.EMAIL_PASS, 
      },
    });

    const emailHTML = await render(
      VerificationEmail({ email, otp: verifyCode })
    );

    const mailOptions = {
      from: "Mentality <teammentalityapp@gmail.com>", 
      to: email,
      subject: "Your Verification Code",
      html: emailHTML, 
    };

    await transporter.sendMail(mailOptions);

    return createSuccessResponse(200, "Verification email sent successfully.");
  } catch (error) {
    return createErrorResponse(500, "Failed to send verification email.");
  }
}
