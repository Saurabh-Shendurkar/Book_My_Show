import * as React from 'react';
import {
  Html,
  Head,
  Preview,
  Body,
  Container,
  Section,
  Text,
  Button,
  Heading,
} from '@react-email/components';

interface VerifyUserEmailProps {
  firstName: string;
  verificationLink: string;
}

export const VerifyUserEmail: React.FC<VerifyUserEmailProps> = ({
  firstName,
  verificationLink,
}) => {
  return (
    <Html>
      <Head />
      <Preview>Verify your email address for Book My Show</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>Welcome to Book My Show, {firstName}!</Heading>
          <Text style={text}>
            We're excited to have you on board. Please verify your email address to
            complete your registration and start booking your favorite shows.
          </Text>
          <Section style={buttonContainer}>
            <Button style={button} href={verificationLink}>
              Verify Email Address
            </Button>
          </Section>
          <Text style={text}>
            If you didn't request this, you can safely ignore this email.
          </Text>
          <Text style={footer}>
            Best regards,<br />
            The Book My Show Team
          </Text>
        </Container>
      </Body>
    </Html>
  );
};

export default VerifyUserEmail;

const main = {
  backgroundColor: '#f6f9fc',
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '40px 20px',
  borderRadius: '8px',
  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
  maxWidth: '600px',
};

const h1 = {
  color: '#333',
  fontSize: '24px',
  fontWeight: '600',
  lineHeight: '1.2',
  margin: '0 0 20px',
};

const text = {
  color: '#555',
  fontSize: '16px',
  lineHeight: '24px',
  margin: '0 0 20px',
};

const buttonContainer = {
  textAlign: 'center' as const,
  margin: '30px 0',
};

const button = {
  backgroundColor: '#0070f3',
  borderRadius: '5px',
  color: '#fff',
  fontSize: '16px',
  fontWeight: 'bold',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '12px 24px',
};

const footer = {
  color: '#8898aa',
  fontSize: '14px',
  lineHeight: '24px',
  marginTop: '40px',
};
