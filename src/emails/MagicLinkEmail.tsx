import { Html, Head, Preview, Text, Section } from '@react-email/components';

type MagicLinkEmailProps = {
  email: string;
  magicLink: string;
};

export default function MagicLinkEmail({ magicLink }: MagicLinkEmailProps) {
  return (
    <Html lang="en" dir="ltr">
      <Head>
        <title>Activate Your Account</title>
      </Head>
      <Preview>Activate your account to get started!</Preview>
      <Section
        style={{
          fontFamily: 'Arial, sans-serif',
          padding: '20px',
          backgroundColor: '#f0f0f0',
          borderRadius: '8px',
        }}
      >
        <Text style={{ fontSize: '18px', color: '#333', fontWeight: 'bold' }}>
          Welcome to Mentality!
        </Text>
        <Text style={{ fontSize: '16px', color: '#555', margin: '10px 0' }}>
          You're almost there. Just one more step to get started with Mentality.
        </Text>
        <Text
          style={{
            fontSize: '16px',
            color: '#0056b3',
            textAlign: 'center',
            margin: '20px 0',
            padding: '15px 25px',
            backgroundColor: '#ffffff',
            borderRadius: '5px',
            boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
          }}
        >
          <a
            href={magicLink}
            style={{
              textDecoration: 'none',
              color: '#0056b3',
              fontWeight: 'bold',
            }}
          >
            Activate Your Account
          </a>
        </Text>
        <Text style={{ fontSize: '14px', color: '#999', textAlign: 'center' }}>
          If you did not request this email, you can safely ignore it.
        </Text>
      </Section>
    </Html>
  );
}
