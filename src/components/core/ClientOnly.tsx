'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import { useState, useEffect } from 'react';

// Dynamically import providers with error boundaries
const StripeProvider = dynamic(
  () => import('@/providers/stripe-provider').then(mod => mod.StripeProvider),
  {
    ssr: false,
    loading: () => <div className="h-0"></div>,
  }
);

// Import socket with error handling - crucial
const SocketProvider = dynamic(
  () => import('@/contexts/SocketContext').then(mod => mod.SocketProvider),
  {
    ssr: false,
    loading: () => <div className="h-0"></div>,
  }
);

const NotificationProvider = dynamic(
  () =>
    import('@/contexts/NotificationContext').then(
      mod => mod.NotificationProvider
    ),
  {
    ssr: false,
    loading: () => <div className="h-0"></div>,
  }
);

const VideoCallProvider = dynamic(
  () =>
    import('@/contexts/VideoCallContext').then(mod => mod.VideoCallProvider),
  {
    ssr: false,
    loading: () => <div className="h-0"></div>,
  }
);

const ChatProvider = dynamic(
  () => import('@/contexts/ChatContext').then(mod => mod.ChatProvider),
  {
    ssr: false,
    loading: () => <div className="h-0"></div>,
  }
);

// Dynamically import layout components
const NavbarWrapper = dynamic(() => import('@/components/NavbarWrapper'), {
  ssr: true,
});

const FooterWrapper = dynamic(() => import('@/components/FooterWrapper'), {
  ssr: false,
});

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

// Error boundary component to prevent provider crashes from breaking the app
class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Provider error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      // Render fallback UI - just keep the app running
      return this.props.fallback || this.props.children;
    }

    return this.props.children;
  }
}

export default function ClientProviders({
  children,
}: {
  children: React.ReactNode;
}) {
  const [mounted, setMounted] = useState(false);

  // Only mount client components after hydration
  useEffect(() => {
    setMounted(true);

    // Setup global error handler for unhandled socket errors
    const originalOnError = window.onerror;
    window.onerror = function (message, source, lineno, colno, error) {
      // Log any websocket errors but prevent app crash
      if (
        message &&
        ((typeof message === 'string' && message.includes('websocket')) ||
          source?.includes('socket'))
      ) {
        console.error('Caught websocket error:', message);
        // Prevent default error handling
        return true;
      }

      // Otherwise use default handler
      if (originalOnError) {
        return originalOnError(message, source, lineno, colno, error);
      }
      return false;
    };

    return () => {
      window.onerror = originalOnError;
    };
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
      <ErrorBoundary fallback={<>{children}</>}>
        <StripeProvider>
          <ErrorBoundary
            fallback={
              <>
                <div className="hidden">Socket connection failed</div>
                {children}
              </>
            }
          >
            <SocketProvider>
              <ErrorBoundary
                fallback={
                  <>
                    <div className="hidden">Notification system failed</div>
                    {children}
                  </>
                }
              >
                <NotificationProvider>
                  <ErrorBoundary>
                    <VideoCallProvider>
                      <ErrorBoundary>
                        <ChatProvider>{children}</ChatProvider>
                      </ErrorBoundary>
                    </VideoCallProvider>
                  </ErrorBoundary>
                </NotificationProvider>
              </ErrorBoundary>
            </SocketProvider>
          </ErrorBoundary>
        </StripeProvider>
      </ErrorBoundary>
      <FooterWrapper />
    </>
  );
}
