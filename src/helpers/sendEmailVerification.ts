import { resend } from "@/lib/resend";
import VerificationEmail from "@/emails/emailVerfication";

export async function sendVerificationEmail(
  email: string,
  verifyCode: string
): Promise<{ success: boolean; message: string }> {
  try {
    await resend.emails.send({
      from: "Mentality <onboarding@resend.dev>",
      to: email,
      subject: "Your Verification Code",
      react: VerificationEmail({ email, otp: verifyCode }),
    });
    return { success: true, message: "Verification email sent successfully." };
  } catch (emailError) {
    return { success: false, message: "Failed to send verification email." };
  }
}
