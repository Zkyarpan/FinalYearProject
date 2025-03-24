'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowRight, Loader2, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import Loader from '@/components/common/Loader';
import SpinnerLoader from '@/components/SpinnerLoader';
import { useUserStore } from '@/store/userStore';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';

const VerifyEmail = () => {
  const { setUser } = useUserStore();
  const router = useRouter();
  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [storedEmail, setStoredEmail] = useState('');
  const [isRedirecting, setIsRedirecting] = useState(false);

  // New state for approval pending dialog
  const [showApprovalPendingDialog, setShowApprovalPendingDialog] =
    useState(false);

  useEffect(() => {
    const checkVerificationState = () => {
      const token = localStorage.getItem('verificationToken');
      const email = localStorage.getItem('email');

      if (!token || !email) {
        router.push('/signup');
        return;
      }

      setStoredEmail(email);
    };

    checkVerificationState();
  }, [router]);

  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setInterval(() => {
        setResendCooldown(prev => prev - 1);
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [resendCooldown]);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code) {
      toast.error('Please enter the verification code.');
      return;
    }
    setIsLoading(true);

    try {
      const token = localStorage.getItem('verificationToken');
      const response = await fetch('/api/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ code }),
      });

      const data = await response.json();

      if (!response.ok) {
        const errorMessage =
          data.ErrorMessage?.[0]?.message || 'Verification failed.';
        toast.error(errorMessage);

        // If the error indicates expired session, redirect to signup
        if (errorMessage.toLowerCase().includes('expired')) {
          localStorage.removeItem('verificationToken');
          localStorage.removeItem('email');
          router.push('/signup');
        }
        return;
      }

      // Store user data in context
      const userData = {
        _id: data.Result.user.id,
        email: storedEmail,
        role: data.Result.user.role,
        isVerified: true,
        profileComplete: false,
        firstName: null,
        lastName: null,
        profileImage: null,
        isAuthenticated: true,
        approvalStatus: data.Result.user.approvalStatus || 'pending',
      };

      setUser(userData);

      // Remove verification data from localStorage
      localStorage.removeItem('verificationToken');
      localStorage.removeItem('email');

      // Check if user is a psychologist with pending approval
      if (
        data.Result.user.role === 'psychologist' &&
        data.Result.user.approvalStatus === 'pending'
      ) {
        toast.success('Email verification successful!');
        setShowApprovalPendingDialog(true);
      } else {
        // For regular users or approved psychologists, proceed as before
        toast.success('Verification successful!');
        setIsRedirecting(true);

        // Redirect based on user role
        setTimeout(() => {
          const redirectPath =
            data.Result.user.role === 'psychologist'
              ? '/dashboard/psychologist'
              : '/dashboard';
          router.push(redirectPath);
        }, 500);
      }
    } catch (error) {
      console.error('Verification error:', error);
      toast.error('Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    const storedToken = localStorage.getItem('verificationToken');
    const storedEmail = localStorage.getItem('email');

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
        body: JSON.stringify({ email: storedEmail }),
      });

      const data = await response.json();
      if (!response.ok) {
        const message = data.message || 'Failed to resend verification code.';
        toast.error(message);

        if (message.toLowerCase().includes('expired')) {
          localStorage.removeItem('verificationToken');
          localStorage.removeItem('email');
          router.push('/signup');
        }
        return;
      }

      toast.success('Verification code resent successfully!');
      setResendCooldown(60);
    } catch (error) {
      console.error('Resend error:', error);
      toast.error('Something went wrong. Please try again.');
    } finally {
      setIsResending(false);
    }
  };

  const handleCloseApprovalDialog = () => {
    setShowApprovalPendingDialog(false);
    router.push('/login');
  };

  return (
    <>
      {isRedirecting && <SpinnerLoader isLoading={isRedirecting} />}
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="w-full max-w-[380px] rounded-2xl border px-6 py-10 shadow-md">
          <div className="mb-6 text-center">
            <h1 className="text-lg font-semibold text-foreground mb-2">
              Verify your email
            </h1>
            <p className="text-sm text-muted-foreground">
              A verification code was sent to{' '}
              <span className="font-semibold">{storedEmail}</span>. If you
              don&apos;t see it, check your spam folder.
            </p>
          </div>

          <form onSubmit={handleVerify}>
            <div className="flex flex-col gap-1 mb-4">
              <label
                htmlFor="code"
                className="text-sm font-medium text-foreground"
              >
                Verification Code
              </label>
              <input
                id="code"
                type="text"
                value={code}
                onChange={e => setCode(e.target.value)}
                maxLength={6}
                placeholder="Enter 6-digit code"
                className="block w-full rounded-md px-3 py-1.5 text-base text-[hsl(var(--foreground))] outline outline-1 -outline-offset-1 outline-[hsl(var(--border))] placeholder:text-[hsl(var(--muted-foreground))] outline-none focus-visible:ring-transparent sm:text-sm dark:bg-input"
                required
              />
            </div>

            <Button
              type="submit"
              className="w-full mt-5 font-semibold shadow-md hover:shadow-lg transition-shadow flex items-center justify-center gap-2"
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader />
              ) : (
                <>
                  Verify and Continue{' '}
                  <ArrowRight className="ml-1 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </Button>
          </form>

          <div className="mt-4 text-center">
            <button
              onClick={handleResend}
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
        </div>
      </div>

      {/* Approval Pending Dialog */}
      <Dialog
        open={showApprovalPendingDialog}
        onOpenChange={setShowApprovalPendingDialog}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center flex items-center justify-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              Email Verified Successfully
            </DialogTitle>
            <DialogDescription className="text-center">
              Your email has been verified, but your account requires approval
              from an administrator before you can access the platform.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col space-y-4 py-4 px-2">
            <div className="bg-yellow-50 dark:bg-input p-4 rounded-md">
              <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-300">
                What happens next?
              </h3>
              <p className="mt-2 text-sm text-yellow-700 dark:text-yellow-200">
                1. Our team will review your credentials and information
              </p>
              <p className="mt-1 text-sm text-yellow-700 dark:text-yellow-200">
                2. You will receive an email when your account has been approved
              </p>
              <p className="mt-1 text-sm text-yellow-700 dark:text-yellow-200">
                3. Once approved, you can log in and start using the platform
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleCloseApprovalDialog} className="w-full">
              Return to Login
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default VerifyEmail;
