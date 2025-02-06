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
import { ArrowRight, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import Loader from '@/components/common/Loader';
import SpinnerLoader from '@/components/SpinnerLoader';
import { useUserStore } from '@/store/userStore';
import { useRouter } from 'next/navigation';

const VerificationDialog = ({
  isOpen,
  onClose,
  email,
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
      const response = await fetch('/api/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
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
        firstName: null,
        lastName: null,
        profileImage: null,
        isAuthenticated: true,
      });

      toast.success('Email verified successfully!');
      localStorage.removeItem('verificationToken');
      localStorage.removeItem('email');
      setIsRedirecting(true);

      setTimeout(() => {
        onVerificationComplete();
        router.push('/dashboard/psychologist');
      }, 1500);
    } catch (error) {
      toast.error(
        error.message || 'Invalid verification code. Please try again.'
      );
    } finally {
      setIsVerifying(false);
    }
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
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogOverlay className="fixed inset-0 bg-black/30 backdrop-blur-[2px] z-50" />
        <DialogContent className="fixed left-[50%] top-[50%] translate-x-[-50%] translate-y-[-50%] w-full max-w-[380px] border bg-background p-6 shadow-md z-[51]">
          <DialogHeader className="mb-6">
            <DialogTitle className="text-lg font-semibold text-foreground text-center">
              Verify your email
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground text-center">
              A verification code was sent to{' '}
              <span className="font-semibold">{email}</span>. If you don't see
              it, check your spam folder.
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
        </DialogContent>
      </Dialog>
    </>
  );
};

export default VerificationDialog;
