'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { z } from 'zod';
import Loader from '@/components/common/Loader';
// import SpinnerLoader from '@/components/SpinnerLoader';

const forgotPasswordSchema = z.object({
  email: z.string().email('Please enter a valid email address.'),
});

const ForgotPasswordForm = () => {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validationResult = forgotPasswordSchema.safeParse({ email });

    if (!validationResult.success) {
      toast.error(validationResult.error.errors[0].message);
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        const errorMessage =
          data.ErrorMessage?.[0]?.message || 'Failed to reset password';
        toast.error(errorMessage);
        setIsLoading(false);
        return;
      }

      toast.success('Verification code sent! Check your inbox.');
      router.push('/forgot-password/confirmation');
    } catch (error) {
      console.error('Error sending reset email:', error);
      toast.error('Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* <SpinnerLoader isLoading={isLoading} /> */}
      <div className="min-h-screen flex items-center justify-center px-4 -mt-5">
        <div className="w-full max-w-[380px] rounded-2xl border px-6 py-10">
          <div className="mb-6 text-center">
            <h1 className="text-lg font-semibold text-foreground mb-2">
              Forgot Password
            </h1>
            <p className="text-xs text-muted-foreground">
              We will send an email with a verification code. If you don't see
              it, please check your spam folder.
            </p>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="flex flex-col gap-1">
              <label
                htmlFor="email"
                className="text-sm font-semibold text-foreground"
              >
                Email
              </label>

              <Input
                type="email"
                id="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@youremail.com"
                className="h-8 outline-none focus-visible:ring-transparent shadow-sm hover:shadow transition-shadow"
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
                  Next{' '}
                  <ArrowRight className="ml-1 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </Button>
          </form>
        </div>
      </div>
      <div className="-mt-20 text-center text-sm">
        <span className="text-muted-foreground">Remember password? </span>
        <Link
          href="/login"
          className="text-foreground hover:underline font-medium"
        >
          Log In
        </Link>
      </div>
    </>
  );
};

export default ForgotPasswordForm;
