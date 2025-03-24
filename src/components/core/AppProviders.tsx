'use client';

import { ReactNode } from 'react';
import { StripeProvider } from '@/providers/stripe-provider';
import { SocketProvider } from '@/contexts/SocketContext';
import { NotificationProvider } from '@/contexts/NotificationContext';
import { VideoCallProvider } from '@/contexts/VideoCallContext';
import { ChatProvider } from '@/contexts/ChatContext';
import { usePathname } from 'next/navigation';

interface AppProvidersProps {
  children: ReactNode;
}

export default function AppProviders({ children }: AppProvidersProps) {
  const pathname = usePathname();

  // Add checks for all routes that need specific providers
  const needsVideoCall =
    pathname?.includes('/call') ||
    pathname?.includes('/appointment') ||
    pathname?.includes('/session') ||
    pathname?.includes('/inbox') ||
    pathname?.includes('/psychologist/appointments'); // Add appointments path

  const needsChat =
    pathname?.includes('/message') ||
    pathname?.includes('/chat') ||
    pathname?.includes('/conversation') ||
    pathname?.includes('/inbox');

  // Use NotificationProvider for all routes - it's lightweight enough to include everywhere
  // This ensures we don't get the "useNotifications must be used within a NotificationProvider" error
  return (
    <StripeProvider>
      <SocketProvider>
        <NotificationProvider>
          {needsVideoCall ? (
            <VideoCallProvider>
              {needsChat ? <ChatProvider>{children}</ChatProvider> : children}
            </VideoCallProvider>
          ) : needsChat ? (
            <ChatProvider>{children}</ChatProvider>
          ) : (
            children
          )}
        </NotificationProvider>
      </SocketProvider>
    </StripeProvider>
  );
}
