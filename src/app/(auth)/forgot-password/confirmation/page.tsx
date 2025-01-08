'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { z } from 'zod';
import Loader from '@/components/common/Loader';
// import SpinnerLoader from '@/components/SpinnerLoader';

// Zod schema for validation
const confirmationSchema = z
  .object({
    verificationCode: z.string().min(6, 'Verification code must be 6 digits.'),
    newPassword: z.string().min(8, 'Password must be at least 8 characters.'),
    confirmPassword: z.string(),
  })
  .refine(data => data.newPassword === data.confirmPassword, {
    message: 'Passwords do not match!',
    path: ['confirmPassword'],
  });

export default function Confirmation() {
  const router = useRouter();
  const [verificationCode, setVerificationCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validationResult = confirmationSchema.safeParse({
      verificationCode,
      newPassword,
      confirmPassword,
    });

    if (!validationResult.success) {
      toast.error(validationResult.error.errors[0].message);
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/forgot-password/confirmation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ verificationCode, newPassword }),
      });

      const data = await response.json();

      if (!data.IsSuccess) {
        const errorMessage =
          data.ErrorMessage?.[0]?.message || 'Something went wrong.';
        toast.error(errorMessage);
        return;
      }

      toast.success('Password reset successfully! Please log in.');
      router.push('/login');
    } catch (error) {
      toast.error('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* <SpinnerLoader isLoading={isLoading}/> */}
      <div className="min-h-screen flex items-center justify-center px-4 -mt-10">
        <div className="w-full max-w-[380px] rounded-2xl border px-6 py-10">
          <div className="mb-6 text-center">
            <h1 className="text-lg font-semibold text-foreground mb-2">
              Reset Your Password
            </h1>
            <p className="text-xs text-muted-foreground">
              Please enter the verification code sent to your email and set a
              new password.
            </p>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="flex flex-col gap-1">
              <Label
                htmlFor="code"
                className="text-sm font-semibold text-foreground"
              >
                Verification Code
              </Label>
              <Input
                type="text"
                id="code"
                value={verificationCode}
                onChange={e => setVerificationCode(e.target.value)}
                placeholder="Enter verification code"
                className="h-8 outline-none focus-visible:ring-transparent shadow-sm hover:shadow transition-shadow"
              />
            </div>

            <div className="space-y-1 mt-4">
              <Label
                htmlFor="password"
                className="text-sm font-semibold text-foreground"
              >
                New Password
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showNewPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  placeholder="At least 8 characters"
                  className="h-8 outline-none focus-visible:ring-transparent shadow-sm hover:shadow transition-shadow"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-8 w-8 text-foreground hover:text-foreground/70 hover:bg-transparent focus:bg-transparent active:bg-transparent transition-none"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                >
                  {showNewPassword ? (
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M3 7c3.6 7.8 14.4 7.8 18 0m-3.22 3.982L21 15.4m-9-2.55v4.35m-5.78-6.218L3 15.4"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        vectorEffect="non-scaling-stroke"
                      ></path>
                    </svg>
                  ) : (
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M3 12.85c3.6-7.8 14.4-7.8 18 0m-9 4.2a2.4 2.4 0 110-4.801 2.4 2.4 0 010 4.801z"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        vectorEffect="non-scaling-stroke"
                      ></path>
                    </svg>
                  )}
                </Button>
              </div>
            </div>

            <div className="space-y-1 mt-4">
              <Label
                htmlFor="confirmPassword"
                className="text-sm font-semibold text-foreground"
              >
                Confirm Password
              </Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  className="h-8 outline-none focus-visible:ring-transparent shadow-sm hover:shadow transition-shadow"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-8 w-8 text-foreground hover:text-foreground/70 hover:bg-transparent focus:bg-transparent active:bg-transparent transition-none"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? (
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M3 7c3.6 7.8 14.4 7.8 18 0m-3.22 3.982L21 15.4m-9-2.55v4.35m-5.78-6.218L3 15.4"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        vectorEffect="non-scaling-stroke"
                      ></path>
                    </svg>
                  ) : (
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M3 12.85c3.6-7.8 14.4-7.8 18 0m-9 4.2a2.4 2.4 0 110-4.801 2.4 2.4 0 010 4.801z"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        vectorEffect="non-scaling-stroke"
                      ></path>
                    </svg>
                  )}
                </Button>
              </div>
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
      <div className="-mt-10 text-center text-sm">
        <span className="text-muted-foreground">Entered wrong email? </span>
        <Link
          href="/forgot-password"
          className="text-foreground hover:underline font-medium"
        >
          Go Back
        </Link>
      </div>
      {/* </SpinnerLoader> */}
    </>
  );
}
