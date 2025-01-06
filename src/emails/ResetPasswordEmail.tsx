import { Html, Head, Preview, Text, Section } from '@react-email/components';

interface ResetPasswordEmailProps {
  email: string;
  resetCode: string;
}

export default function ResetPasswordEmail({
  email,
  resetCode,
}: ResetPasswordEmailProps) {
  return (
    <Html lang="en" dir="ltr">
      <Head>
        <title>Your Password Reset Code</title>
      </Head>
      <Preview>Here's your password reset code: {resetCode}</Preview>
      <Section style={{ fontFamily: 'Arial, sans-serif', padding: '20px' }}>
        <Text style={{ fontSize: '16px', color: '#333' }}>Hello,</Text>
        <Text style={{ fontSize: '14px', color: '#333', margin: '10px 0' }}>
          You've requested to reset your password on Mentality. Use the
          verification code below to reset your password.
        </Text>
        <Text
          style={{
            fontSize: '24px',
            letterSpacing: '2px',
            textTransform: 'uppercase',
            color: '#333',
            textAlign: 'center',
            margin: '20px 0',
          }}
        >
          {resetCode}
        </Text>
        <Text
          style={{
            display: 'none',
            fontSize: '0px',
          }}
        >
          {email}
        </Text>
        <Text style={{ fontSize: '12px', color: '#999' }}>
          If you didn't request this, you can safely ignore this email.
        </Text>
      </Section>
    </Html>
  );
}
