import {
  Html,
  Head,
  Preview,
  Text,
  Section,
  Button,
} from '@react-email/components';

interface RejectionEmailProps {
  email: string;
  firstName: string;
  lastName: string;
  feedback: string;
}

export default function RejectionEmail({
  email,
  firstName,
  lastName,
  feedback,
}: RejectionEmailProps) {
  return (
    <Html lang="en" dir="ltr">
      <Head>
        <title>Your Professional Account Application Status</title>
      </Head>
      <Preview>
        Important information about your Mentality professional account
        application
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
          Thank you for your interest in joining our platform. After careful
          review, we're unable to approve your professional account at this
          time.
        </Text>

        <Section
          style={{
            backgroundColor: '#f8f8f8',
            padding: '15px',
            borderLeft: '4px solid #e74c3c',
            margin: '20px 0',
          }}
        >
          <Text style={{ fontSize: '14px', color: '#333', margin: '0' }}>
            <strong>Feedback:</strong>
          </Text>
          <Text
            style={{ fontSize: '14px', color: '#333', margin: '5px 0 0 0' }}
          >
            {feedback}
          </Text>
        </Section>

        <Text style={{ fontSize: '14px', color: '#333', margin: '10px 0' }}>
          If you would like to address these concerns and reapply, please update
          your profile information accordingly.
        </Text>

        <Section style={{ textAlign: 'center', margin: '20px 0' }}>
          <Button
            href={`${
              process.env.NEXT_PUBLIC_APP_URL || 'https://mentality.app'
            }/login`}
            style={{
              backgroundColor: '#3B82F6',
              color: 'white',
              padding: '10px 20px',
              borderRadius: '4px',
              textDecoration: 'none',
              fontWeight: 'bold',
              display: 'inline-block',
            }}
          >
            Update Your Profile
          </Button>
        </Section>

        <Text style={{ fontSize: '14px', color: '#333', margin: '10px 0' }}>
          Best regards,
          <br />
          The Mentality Team
        </Text>
      </Section>
    </Html>
  );
}
