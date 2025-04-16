import type { Metadata } from 'next';
import { Inter, Instrument_Serif } from 'next/font/google';
import './globals.css';
import { Suspense, lazy } from 'react';
import { ThemeProviders } from '@/providers/ThemeProviders';
import CustomToaster from '@/components/CustomToaster';
import NextTopLoader from 'nextjs-toploader';

const ClientProviders = lazy(() => import('@/components/core/ClientOnly'));

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  weight: ['400', '700'],
  display: 'swap',
  preload: true,
});

const instrumentSerif = Instrument_Serif({
  subsets: ['latin'],
  variable: '--font-instrument-serif',
  weight: '400',
  display: 'swap',
  preload: true,
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
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${instrumentSerif.variable} antialiased`}
        suppressHydrationWarning
      >
        <ThemeProviders>
          <NextTopLoader color="#0466C8" showSpinner={false} height={2} />
          <CustomToaster /> 
          <Suspense fallback={<div className="min-h-screen"></div>}>
            <ClientProviders>{children}</ClientProviders>
          </Suspense>
        </ThemeProviders>
      </body>
    </html>
  );
}
