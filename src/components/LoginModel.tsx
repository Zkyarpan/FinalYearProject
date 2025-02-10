'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { ArrowRight, X } from 'lucide-react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Loader from '@/components/common/Loader';
import SpinnerLoader from '@/components/SpinnerLoader';
import { useUserStore } from '@/store/userStore';

const VALID_REDIRECT_PATHS = [
  '/blogs/create',
  '/stories/create',
  '/articles/create',
  '/appointments/',
];

const LoginModal = ({ isOpen, onClose }) => {
  const { setUser } = useUserStore();
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [emailError, setEmailError] = useState('');

  if (!isOpen) return null;

  const handleSuccessfulLogin = userData => {
    setIsLoading(false);
    setIsRedirecting(true);
    onClose();

    const redirectPath = localStorage.getItem('redirectAfterLogin');
    localStorage.removeItem('redirectAfterLogin');

    setTimeout(() => {
      if (redirectPath && VALID_REDIRECT_PATHS.includes(redirectPath)) {
        router.push(redirectPath);
      } else {
        switch (userData.role) {
          case 'admin':
            router.push('/admin/dashboard');
            break;
          case 'psychologist':
            router.push('/psychologist/dashboard');
            break;
          default:
            router.push('/dashboard');
        }
      }
    }, 500);
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setEmailError('');

    if (!email) {
      setEmailError('Email cannot be kept empty');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        const errorMessage = data.ErrorMessage?.[0]?.message || 'Login failed';
        toast.error(errorMessage);
        setIsLoading(false);
        return;
      }

      if (data.Result?.accessToken) {
        const userData = data.Result.user_data;

        setUser({
          _id: userData.id,
          email: userData.email,
          role: userData.role,
          isVerified: userData.isVerified,
          profileComplete: userData.profileComplete,
          firstName: userData.firstName || null,
          lastName: userData.lastName || null,
          profileImage: userData.profileImage || null,
        });

        toast.success('Login successful!');
        handleSuccessfulLogin(userData);
      }
    } catch (err) {
      console.error('Login error:', err);
      toast.error('Something went wrong. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <>
      {isRedirecting && <SpinnerLoader isLoading={isRedirecting} />}
      <div className="fixed inset-0 z-[100]">
        <div className="absolute inset-0 bg-black/50 backdrop-blur-[8px] -mt-10" />
        <div className="fixed inset-0 overflow-y-auto">
          <div className="min-h-full flex items-center justify-center p-4">
            <div className="relative bg-background w-full max-w-[380px] rounded-2xl border">
              <button
                onClick={onClose}
                className="absolute right-4 top-4 text-muted-foreground hover:text-foreground transition-colors duration-200 rounded-lg p-1 hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <X className="h-4 w-4" />
              </button>

              <div className="px-6 py-10">
                <h2 className="text-5xl font-instrument text-center mb-6">
                  Log in
                </h2>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-1">
                    <Label
                      htmlFor="email"
                      className="text-sm font-semibold text-foreground"
                    >
                      Email
                    </Label>
                    <input
                      id="email"
                      type="email"
                      value={email}
                      onChange={e => {
                        setEmail(e.target.value);
                        setEmailError('');
                      }}
                      className="block w-full rounded-md px-3 py-1.5 text-base text-foreground outline outline-1 -outline-offset-1 outline-[hsl(var(--border))] placeholder:text-muted-foreground outline-none focus-visible:ring-transparent sm:text-sm dark:bg-input"
                    />
                    {emailError && (
                      <p className="text-destructive text-xs mt-1">
                        {emailError}
                      </p>
                    )}
                  </div>

                  <div className="space-y-1">
                    <Label
                      htmlFor="password"
                      className="text-sm font-semibold text-foreground"
                    >
                      Password
                    </Label>
                    <div className="relative">
                      <input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        className="block w-full rounded-md px-3 py-1.5 text-base text-foreground outline outline-1 -outline-offset-1 outline-[hsl(var(--border))] placeholder:text-muted-foreground outline-none focus-visible:ring-transparent sm:text-sm dark:bg-input"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-0 top-0 h-8 w-8 text-foreground/50 hover:text-foreground hover:bg-transparent focus:bg-transparent active:bg-transparent transition-none"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
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
                            />
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
                            />
                          </svg>
                        )}
                      </Button>
                    </div>
                  </div>

                  <div className="text-right">
                    <Link
                      href="/forgot-password"
                      className="text-xs text-muted-foreground hover:text-foreground hover:underline font-semibold"
                    >
                      Forgot Password?
                    </Link>
                  </div>

                  <Button
                    type="submit"
                    className="w-full mt-2 font-semibold rounded-2xl shadow-md hover:shadow-lg transition-shadow flex items-center justify-center gap-2"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <Loader />
                    ) : (
                      <>
                        Login <ArrowRight className="ml-2 h-4 w-4" />
                      </>
                    )}
                  </Button>
                </form>

                <p className="text-center text-xs text-muted-foreground mt-4">
                  Don't have a Mentality profile?{' '}
                  <Link
                    href="/signup"
                    className="text-foreground hover:underline font-semibold"
                  >
                    Create One!
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default LoginModal;
