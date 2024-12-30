import nodemailer from "nodemailer";
import VerificationEmail from "@/emails/emailVerfication";
import { render } from "@react-email/render";

export async function sendVerificationEmail(
  email: string,
  verifyCode: string
): Promise<{ success: boolean; message: string }> {
  console.log("Attempting to send verification email...");
  console.log("Email:", email);
  console.log("Verification Code:", verifyCode);

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

    const info = await transporter.sendMail(mailOptions);
    console.log("Email sent: ", info.response);

    return { success: true, message: "Verification email sent successfully." };
  } catch (error) {
    console.error("Error sending email:", error);
    return { success: false, message: "Failed to send verification email." };
  }
}
