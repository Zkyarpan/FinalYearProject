import React from 'react';
import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
  Button,
  Hr,
} from '@react-email/components';

interface AppointmentConfirmationEmailProps {
  patientName: string;
  date: string;
  startTime: string;
  endTime: string;
  duration: number;
  psychologistName: string;
  sessionFormat: string;
  sessionFee: number;
  loginUrl: string;
}

export default function AppointmentConfirmationEmail({
  patientName,
  date,
  startTime,
  endTime,
  duration,
  psychologistName,
  sessionFormat,
  sessionFee,
  loginUrl,
}: AppointmentConfirmationEmailProps) {
  // Format session format to be more readable
  const formattedFormat =
    sessionFormat === 'video'
      ? 'Video Call'
      : sessionFormat === 'in-person'
        ? 'In-Person'
        : sessionFormat.charAt(0).toUpperCase() + sessionFormat.slice(1);

  return (
    <Html>
      <Head />
      <Preview>Your Appointment is Confirmed!</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={heading}>Appointment Confirmed</Heading>

          <Section style={section}>
            <Text style={text}>Hello {patientName},</Text>
            <Text style={text}>
              Your appointment with <strong>{psychologistName}</strong> has been
              successfully booked and confirmed!
            </Text>

            <Section style={appointmentBox}>
              <Heading as="h2" style={appointmentHeading}>
                Appointment Details
              </Heading>

              <Section style={appointmentDetail}>
                <Text style={labelText}>Date:</Text>
                <Text style={valueText}>{date}</Text>
              </Section>

              <Section style={appointmentDetail}>
                <Text style={labelText}>Time:</Text>
                <Text style={valueText}>
                  {startTime} - {endTime} ({duration} minutes)
                </Text>
              </Section>

              <Section style={appointmentDetail}>
                <Text style={labelText}>Provider:</Text>
                <Text style={valueText}>{psychologistName}</Text>
              </Section>

              <Section style={appointmentDetail}>
                <Text style={labelText}>Format:</Text>
                <Text style={valueText}>{formattedFormat}</Text>
              </Section>

              <Section style={appointmentDetail}>
                <Text style={labelText}>Fee:</Text>
                <Text style={valueText}>${sessionFee.toFixed(2)}</Text>
              </Section>
            </Section>

            <Text style={text}>
              You can view your upcoming appointments and join your session when
              it's time from your dashboard.
            </Text>

            <Section style={{ textAlign: 'center', margin: '30px 0' }}>
              <Button style={button} href={loginUrl}>
                View My Appointments
              </Button>
            </Section>

            {sessionFormat === 'video' && (
              <Text style={noteText}>
                <strong>Note:</strong> For video sessions, please ensure you
                have a stable internet connection and join the session 5 minutes
                before the scheduled time. You will get a join button in your
                dashboard when it's time for your appointment.
              </Text>
            )}

            <Hr style={hr} />

            <Text style={text}>
              If you need to reschedule or cancel your appointment, please do so
              at least 24 hours in advance through your account dashboard or
              contact us directly.
            </Text>

            <Text style={footer}>
              Best regards,
              <br />
              The Mentality Team
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

// Updated styles to match the screenshot
const main = {
  backgroundColor: '#ffffff',
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
  padding: '20px 0',
};

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '20px',
  maxWidth: '600px',
};

const heading = {
  color: '#3b82f6',
  fontSize: '24px',
  fontWeight: '600',
  textAlign: 'center' as const,
  margin: '10px 0 30px',
};

const section = {
  margin: '20px 0',
};

const text = {
  color: '#333',
  fontSize: '16px',
  lineHeight: '24px',
  margin: '16px 0',
};

const noteText = {
  ...text,
  backgroundColor: '#f8fafc',
  padding: '12px',
  borderRadius: '6px',
  borderLeft: '4px solid #3b82f6',
};

const appointmentBox = {
  backgroundColor: '#f8fafc',
  padding: '20px',
  borderRadius: '6px',
  margin: '25px 0',
  border: '1px solid #e2e8f0',
};

const appointmentHeading = {
  fontSize: '18px',
  fontWeight: '600',
  color: '#3b82f6',
  margin: '0 0 16px',
};

const appointmentDetail = {
  display: 'flex',
  margin: '10px 0',
};

const labelText = {
  color: '#64748b',
  fontSize: '14px',
  fontWeight: '600',
  width: '100px',
  margin: '0',
};

const valueText = {
  color: '#334155',
  fontSize: '14px',
  flex: '1',
  margin: '0',
};

const button = {
  backgroundColor: '#3b82f6',
  borderRadius: '6px',
  color: '#fff',
  fontSize: '16px',
  fontWeight: '500',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '12px 30px',
  cursor: 'pointer',
};

const hr = {
  borderColor: '#e2e8f0',
  margin: '30px 0',
};

const footer = {
  ...text,
  color: '#64748b',
  fontSize: '14px',
  marginTop: '30px',
};
