'use client';

import React, { ReactNode, useEffect } from 'react';
import { StripeProvider } from '@/providers/stripe-provider';
import { SocketProvider } from '@/contexts/SocketContext'; // Use your improved socket context
import { NotificationProvider } from '@/contexts/NotificationContext';
import { VideoCallProvider } from '@/contexts/VideoCallContext';
import { ChatProvider } from '@/contexts/ChatContext';
import { usePathname } from 'next/navigation';
import { toast } from 'sonner';
import dynamic from 'next/dynamic';

// Only load the debugger in development and make it client-side only
const SocketDebugger =
  process.env.NODE_ENV === 'development'
    ? dynamic(() => import('@/contexts/SocketDebugger'), { ssr: false })
    : () => null;

// Error boundary with improved error handling
interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  errorInfo: any;
}

class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log error but filter out common non-critical errors
    const errorMessage = error?.message || 'Unknown error';

    // Ignore navigation abort errors
    if (
      errorMessage.includes('aborted') ||
      errorMessage.includes('navigation') ||
      errorMessage.includes('unmounted')
    ) {
      console.log('Non-critical error suppressed:', errorMessage);
      return;
    }

    console.error('Provider error:', error, errorInfo);
    this.setState({ errorInfo });

    // Only show toast for real errors
    try {
      toast.error('Connection issue detected', {
        description: 'Some features may be limited. Please try refreshing.',
        duration: 5000,
      });
    } catch (e) {
      // Ignore toast errors
    }
  }

  render() {
    if (this.state.hasError) {
      // Render fallback UI but keep children intact
      return this.props.fallback || this.props.children;
    }

    return this.props.children;
  }
}

interface AppProvidersProps {
  children: ReactNode;
}

export default function AppProviders({ children }: AppProvidersProps) {
  const pathname = usePathname();

  // Set up global error handler
  useEffect(() => {
    // Setup global error handler for websocket errors
    const originalOnError = window.onerror;
    window.onerror = function (message, source, lineno, colno, error) {
      // Log any websocket errors but prevent app crash
      if (
        message &&
        ((typeof message === 'string' &&
          (message.includes('websocket') ||
            message.includes('socket') ||
            message.includes('timeout') ||
            message.includes('connection'))) ||
          (source && source.includes('socket')))
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

    // Add unhandledrejection handler for socket promises
    const originalUnhandledRejection = window.onunhandledrejection;
    window.onunhandledrejection = function (event) {
      if (
        event.reason &&
        typeof event.reason.message === 'string' &&
        (event.reason.message.includes('socket') ||
          event.reason.message.includes('websocket') ||
          event.reason.message.includes('connection') ||
          event.reason.message.includes('timeout'))
      ) {
        console.error('Caught unhandled promise rejection:', event.reason);
        event.preventDefault();
        return true;
      }

      if (originalUnhandledRejection) {
        return originalUnhandledRejection.call(window, event);
      }
    };

    return () => {
      window.onerror = originalOnError;
      window.onunhandledrejection = originalUnhandledRejection;
    };
  }, []);

  // Add checks for all routes that need specific providers
  const needsVideoCall =
    pathname?.includes('/call') ||
    pathname?.includes('/appointment') ||
    pathname?.includes('/session') ||
    pathname?.includes('/inbox') ||
    pathname?.includes('/psychologist/appointments');

  const needsChat =
    pathname?.includes('/message') ||
    pathname?.includes('/chat') ||
    pathname?.includes('/conversation') ||
    pathname?.includes('/inbox');

  // Create a more resilient provider structure
  return (
    <>
      <ErrorBoundary fallback={<>{children}</>}>
        <StripeProvider>
          <ErrorBoundary fallback={<>{children}</>}>
            <SocketProvider>
              {/* Socket Debugger - only visible in development */}
              {process.env.NODE_ENV === 'development' && <SocketDebugger />}

              <ErrorBoundary fallback={<>{children}</>}>
                <NotificationProvider>
                  {needsVideoCall ? (
                    <ErrorBoundary fallback={<>{children}</>}>
                      <VideoCallProvider>
                        {needsChat ? (
                          <ErrorBoundary fallback={<>{children}</>}>
                            <ChatProvider>{children}</ChatProvider>
                          </ErrorBoundary>
                        ) : (
                          children
                        )}
                      </VideoCallProvider>
                    </ErrorBoundary>
                  ) : needsChat ? (
                    <ErrorBoundary fallback={<>{children}</>}>
                      <ChatProvider>{children}</ChatProvider>
                    </ErrorBoundary>
                  ) : (
                    children
                  )}
                </NotificationProvider>
              </ErrorBoundary>
            </SocketProvider>
          </ErrorBoundary>
        </StripeProvider>
      </ErrorBoundary>
    </>
  );
}
