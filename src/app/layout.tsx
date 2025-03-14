import type { Metadata } from 'next';
import { Inter, Instrument_Serif } from 'next/font/google';
import './globals.css';
import NavbarWrapper from '@/components/NavbarWrapper';
import FooterWrapper from '@/components/FooterWrapper';
import { Toaster } from 'sonner';
import { ThemeProviders } from '@/providers/ThemeProviders';
import NextTopLoader from 'nextjs-toploader';
import { StripeProvider } from '@/providers/stripe-provider';
import { SocketProvider } from '@/contexts/SocketContext';
import { ChatProvider } from '../contexts/ChatContext';
import { VideoCallProvider } from '@/contexts/VideoCallContext';
import { NotificationProvider } from '@/contexts/NotificationContext';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  weight: ['100', '400', '500', '600', '700', '900'],
});

const instrumentSerif = Instrument_Serif({
  subsets: ['latin'],
  variable: '--font-instrument-serif',
  weight: '400',
});

export const metadata: Metadata = {
  title: {
    template: '%s',
    default: 'Mentality',
  },
  description: 'Mental health and support platform',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning={true}>
      <body
        className={`${inter.variable} ${instrumentSerif.variable} antialiased`}
        suppressHydrationWarning={true}
      >
        <ThemeProviders>
          <NextTopLoader
            color="#0466C8"
            initialPosition={0.08}
            crawlSpeed={200}
            height={3}
            crawl={true}
            showSpinner={true}
            easing="ease"
            speed={200}
            shadow="0 0 10px #2299DD,0 0 5px #2299DD"
            template='<div class="bar" role="bar"><div class="peg"></div></div> 
  <div class="spinner" role="spinner"><div class="spinner-icon"></div></div>'
            zIndex={9999}
            showAtBottom={false}
          />
          <Toaster position="bottom-right" richColors />
          <NavbarWrapper />
          <StripeProvider>
            <SocketProvider>
              <NotificationProvider>
                <VideoCallProvider>
                  <ChatProvider>{children}</ChatProvider>
                </VideoCallProvider>
              </NotificationProvider>
            </SocketProvider>
          </StripeProvider>
          <FooterWrapper />
        </ThemeProviders>
      </body>
    </html>
  );
}
