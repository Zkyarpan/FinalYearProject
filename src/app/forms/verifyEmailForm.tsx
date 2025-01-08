'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowRight, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import Loader from '@/components/common/Loader';
// import SpinnerLoader from '@/components/SpinnerLoader';

const VerifyEmail = () => {
  const router = useRouter();
  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [storedEmail, setStoredEmail] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const email = localStorage.getItem('email') || '';
      setStoredEmail(email);
    }
  }, []);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (resendCooldown > 0) {
      timer = setInterval(() => {
        setResendCooldown(prev => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [resendCooldown]);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code) {
      toast.error('Please enter the verification code.');
      return;
    }
    setIsLoading(true);
    try {
      const response = await fetch('/api/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.message || 'Verification failed.');
        return;
      }

      toast.success('Verification successful! Redirecting to dashboard...');
      localStorage.removeItem('verificationToken');
      localStorage.removeItem('email');
      router.push('/dashboard');
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
        setIsResending(false);
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

  return (
    <>
      {/* <SpinnerLoader isLoading={isLoading} /> */}
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
              <Input
                id="code"
                type="text"
                value={code}
                onChange={e => setCode(e.target.value)}
                className="h-8 outline-none focus-visible:ring-transparent shadow-sm hover:shadow transition-shadow"
                required
              />
            </div>

            <Button
              type="submit"
              className={`w-full mt-5 font-semibold shadow-md hover:shadow-lg transition-shadow flex items-center justify-center gap-2 ${
                isLoading ? 'cursor-not-allowed opacity-75' : ''
              }`}
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
    </>
  );
};

export default VerifyEmail;
