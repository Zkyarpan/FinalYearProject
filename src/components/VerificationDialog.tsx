'use client';

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogOverlay,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ArrowRight, Loader2, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import Loader from '@/components/common/Loader';
import SpinnerLoader from '@/components/SpinnerLoader';
import { useUserStore } from '@/store/userStore';
import { useRouter } from 'next/navigation';

const VerificationDialog = ({
  isOpen,
  onClose,
  email: propEmail,
  onVerificationComplete,
  isLoading: externalLoading,
}) => {
  const router = useRouter();
  const { setUser } = useUserStore();
  const [verificationCode, setVerificationCode] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [email, setEmail] = useState(propEmail);
  const [verificationStep, setVerificationStep] = useState('code'); // 'code' or 'pending'

  // Check for stored email on mount and refresh
  useEffect(() => {
    const storedEmail = localStorage.getItem('email');
    const storedToken = localStorage.getItem('verificationToken');

    if (storedEmail && storedToken) {
      setEmail(storedEmail);
    }
  }, []);

  // Prevent closing dialog if verification is pending
  const handleDialogClose = () => {
    const hasToken = localStorage.getItem('verificationToken');
    if (hasToken) {
      toast.error('Please complete the verification process');
      return;
    }
    onClose();
  };

  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setInterval(() => {
        setResendCooldown(prev => prev - 1);
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [resendCooldown]);

  const handleVerification = async e => {
    e.preventDefault();
    if (!verificationCode.trim()) {
      toast.error('Please enter the verification code');
      return;
    }

    setIsVerifying(true);
    try {
      const token = localStorage.getItem('verificationToken');
      if (!token) {
        throw new Error('Verification session expired');
      }

      const response = await fetch('/api/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          code: verificationCode.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.ErrorMessage?.[0]?.message || 'Verification failed'
        );
      }

      setUser({
        _id: data.Result.user.id,
        email: email,
        role: data.Result.user.role,
        isVerified: true,
        profileComplete: false,
        firstName: data.Result.user.firstName || null,
        lastName: data.Result.user.lastName || null,
        profileImage: null,
        isAuthenticated: true,
      });

      toast.success('Email verified successfully!');

      // For psychologists, show admin approval pending step
      if (data.Result.user.role === 'psychologist') {
        setVerificationStep('pending');
      } else {
        // For regular users, proceed as normal
        localStorage.removeItem('verificationToken');
        localStorage.removeItem('email');
        setIsRedirecting(true);

        setTimeout(() => {
          onVerificationComplete?.();
          router.push('/dashboard');
        }, 1500);
      }
    } catch (error) {
      if (error.message === 'Verification session expired') {
        toast.error('Session expired. Please sign up again.');
        router.push('/signup');
      } else {
        toast.error(
          error.message || 'Invalid verification code. Please try again.'
        );
      }
    } finally {
      setIsVerifying(false);
    }
  };

  const handleContinueToDashboard = () => {
    localStorage.removeItem('verificationToken');
    localStorage.removeItem('email');
    setIsRedirecting(true);

    setTimeout(() => {
      onVerificationComplete?.();
      router.push('/dashboard/pending');
    }, 1000);
  };

  const handleResendCode = async () => {
    const storedToken = localStorage.getItem('verificationToken');

    if (!storedToken) {
      toast.error('Session expired. Please sign up again.');
      router.push('/signup');
      return;
    }

    setIsResending(true);
    try {
      const response = await fetch('/api/resend', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${storedToken}`,
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to resend code');
      }

      toast.success('Verification code resent successfully');
      setResendCooldown(60);
    } catch (error) {
      if (error.message.includes('expired')) {
        localStorage.removeItem('verificationToken');
        localStorage.removeItem('email');
        router.push('/signup');
      }
      toast.error(error.message || 'Failed to resend verification code');
    } finally {
      setIsResending(false);
    }
  };

  if (isRedirecting) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm z-50">
        <div className="text-center">
          <SpinnerLoader isLoading={isRedirecting} />
        </div>
      </div>
    );
  }

  return (
    <>
      <Dialog open={isOpen} onOpenChange={handleDialogClose}>
        <DialogOverlay
          className="fixed inset-0 bg-black/30 backdrop-blur-[2px] z-50"
          onClick={e => {
            const hasToken = localStorage.getItem('verificationToken');
            if (hasToken) {
              e.preventDefault();
              e.stopPropagation();
              toast.error('Please complete the verification process');
            }
          }}
        />
        <DialogContent className="fixed left-[50%] top-[50%] translate-x-[-50%] translate-y-[-50%] w-full max-w-[380px] border bg-background p-6 shadow-md z-[51]">
          {verificationStep === 'code' ? (
            <>
              <DialogHeader className="mb-6">
                <DialogTitle className="text-lg font-semibold text-foreground text-center">
                  Verify your email
                </DialogTitle>
                <DialogDescription className="text-sm text-muted-foreground text-center">
                  A verification code was sent to{' '}
                  <span className="font-semibold">{email}</span>. If you don't
                  see it, check your spam folder.
                </DialogDescription>
              </DialogHeader>

              <form onSubmit={handleVerification} className="space-y-4">
                <div className="flex flex-col gap-1">
                  <label
                    htmlFor="code"
                    className="text-sm font-medium text-foreground"
                  >
                    Verification Code
                  </label>
                  <input
                    id="code"
                    type="text"
                    value={verificationCode}
                    onChange={e => setVerificationCode(e.target.value)}
                    maxLength={6}
                    className="block w-full rounded-md px-3 py-1.5 text-base text-[hsl(var(--foreground))] outline outline-1 -outline-offset-1 outline-[hsl(var(--border))] placeholder:text-[hsl(var(--muted-foreground))] outline-none focus-visible:ring-transparent sm:text-sm dark:bg-input"
                    placeholder="Enter 6-digit code"
                    required
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full mt-5 font-semibold shadow-md hover:shadow-lg transition-shadow flex items-center justify-center gap-2"
                  disabled={isVerifying || externalLoading}
                >
                  {isVerifying ? (
                    <Loader />
                  ) : (
                    <>
                      Verify and Continue
                      <ArrowRight className="ml-1 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </Button>
              </form>

              <div className="mt-4 text-center">
                <button
                  onClick={handleResendCode}
                  disabled={isResending || resendCooldown > 0}
                  className="text-xs text-primary font-inter hover:underline disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2 dark:text-foreground"
                >
                  {isResending ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Sending...
                    </>
                  ) : resendCooldown > 0 ? (
                    `Resend code in ${resendCooldown}s`
                  ) : (
                    'Resend code'
                  )}
                </button>
              </div>
            </>
          ) : (
            <>
              <DialogHeader className="mb-6">
                <div className="flex flex-col items-center justify-center">
                  <div className="w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mb-4">
                    <CheckCircle2 className="h-10 w-10 text-green-600 dark:text-green-400" />
                  </div>
                  <DialogTitle className="text-lg font-semibold text-foreground text-center">
                    Email Verified Successfully
                  </DialogTitle>
                </div>
                <DialogDescription className="text-sm text-muted-foreground text-center mt-2">
                  Thank you for verifying your email. Your application is now
                  pending admin approval. This typically takes 1-2 business
                  days.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-md">
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    Your account will need to be approved by an administrator
                    before you can start using the platform. You'll receive an
                    email when your account is approved.
                  </p>
                </div>

                <Button
                  className="w-full mt-2 font-semibold shadow-md hover:shadow-lg transition-shadow"
                  onClick={handleContinueToDashboard}
                >
                  Continue to Dashboard
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default VerificationDialog;
