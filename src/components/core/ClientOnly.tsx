'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import { useState, useEffect } from 'react';

// Dynamically import providers - only load when needed
const StripeProvider = dynamic(
  () => import('@/providers/stripe-provider').then(mod => mod.StripeProvider),
  {
    ssr: false,
  }
);

const SocketProvider = dynamic(
  () => import('@/contexts/SocketContext').then(mod => mod.SocketProvider),
  {
    ssr: false,
  }
);

const NotificationProvider = dynamic(
  () =>
    import('@/contexts/NotificationContext').then(
      mod => mod.NotificationProvider
    ),
  {
    ssr: false,
  }
);

const VideoCallProvider = dynamic(
  () =>
    import('@/contexts/VideoCallContext').then(mod => mod.VideoCallProvider),
  {
    ssr: false,
  }
);

const ChatProvider = dynamic(
  () => import('@/contexts/ChatContext').then(mod => mod.ChatProvider),
  {
    ssr: false,
  }
);

// Dynamically import layout components
const NavbarWrapper = dynamic(() => import('@/components/NavbarWrapper'), {
  ssr: true,
});

const FooterWrapper = dynamic(() => import('@/components/FooterWrapper'), {
  ssr: false,
});

export default function ClientProviders({
  children,
}: {
  children: React.ReactNode;
}) {
  const [mounted, setMounted] = useState(false);

  // Only mount client components after hydration
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <>
        <nav className="h-16 border-b"></nav>
        <main>{children}</main>
      </>
    );
  }

  return (
    <>
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
    </>
  );
}
