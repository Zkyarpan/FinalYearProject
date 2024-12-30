import {
  Html,
  Head,
  Preview,
  Text,
  Section,
} from "@react-email/components";

interface VerificationEmailProps {
  email: string; // Email is added but hidden in the email body
  otp: string;
}

export default function VerificationEmail({ email, otp }: VerificationEmailProps) {
  return (
    <Html lang="en" dir="ltr">
      <Head>
        <title>Your Verification Code</title>
      </Head>
      <Preview>Here&apos;s your verification code: {otp}</Preview>
      <Section style={{ fontFamily: "Arial, sans-serif", padding: "20px" }}>
        <Text style={{ fontSize: "16px", color: "#333" }}>
          Hey there 👋,
        </Text>
        <Text style={{ fontSize: "14px", color: "#333", margin: "10px 0" }}>
          Here&apos;s a 6-digit verification code for verifying your email address on Mentality.
        </Text>
        <Text
          style={{
            fontSize: "24px",
            letterSpacing: "2px",
            textTransform: "uppercase",
            color: "#333",
            textAlign: "center",
            margin: "20px 0",
          }}
        >
          {otp}
        </Text>
        {/* Hidden email to avoid rendering but still included */}
        <Text
          style={{
            display: "none",
            fontSize: "0px",
          }}
        >
          {email}
        </Text>
        <Text style={{ fontSize: "12px", color: "#999" }}>
          If you didn&apos;t request this code, you can safely ignore this email.
        </Text>
      </Section>
    </Html>
  );
}
