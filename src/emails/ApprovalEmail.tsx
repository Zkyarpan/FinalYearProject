import {
  Html,
  Head,
  Preview,
  Text,
  Section,
  Button,
} from '@react-email/components';

interface ApprovalEmailProps {
  email: string;
  firstName: string;
  lastName: string;
}

export default function ApprovalEmail({
  email,
  firstName,
  lastName,
}: ApprovalEmailProps) {
  return (
    <Html lang="en" dir="ltr">
      <Head>
        <title>Your Professional Account Has Been Approved</title>
      </Head>
      <Preview>
        Congratulations! Your Mentality professional account has been approved.
      </Preview>
      <Section
        style={{
          fontFamily: 'Arial, sans-serif',
          padding: '20px',
          maxWidth: '600px',
          margin: '0 auto',
        }}
      >
        <Text style={{ fontSize: '16px', color: '#333' }}>
          Dear Dr. {firstName} {lastName},
        </Text>

        <Text style={{ fontSize: '14px', color: '#333', margin: '10px 0' }}>
          Congratulations! Your professional account has been{' '}
          <strong style={{ color: '#4CAF50' }}>approved</strong>.
        </Text>

        <Text style={{ fontSize: '14px', color: '#333', margin: '10px 0' }}>
          You can now log in to your dashboard and start using the platform to
          connect with clients and manage your practice.
        </Text>

        <Section style={{ textAlign: 'center', margin: '20px 0' }}>
          <Button
            href={`${
              process.env.NEXT_PUBLIC_APP_URL || 'https://mentality.app'
            }/login`}
            style={{
              backgroundColor: '#4CAF50',
              color: 'white',
              padding: '10px 20px',
              borderRadius: '4px',
              textDecoration: 'none',
              fontWeight: 'bold',
              display: 'inline-block',
            }}
          >
            Login to Your Account
          </Button>
        </Section>

        <Text style={{ fontSize: '14px', color: '#333', margin: '10px 0' }}>
          Thank you for joining our network of mental health professionals. We
          look forward to your valuable contribution to our community.
        </Text>

        <Text style={{ fontSize: '14px', color: '#333', margin: '10px 0' }}>
          Best regards,
          <br />
          The Mentality Team
        </Text>
      </Section>
    </Html>
  );
}
