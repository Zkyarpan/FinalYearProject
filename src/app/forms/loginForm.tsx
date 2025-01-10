'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import Loader from '@/components/common/Loader';
import { useUserStore } from '@/store/userStore';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address.'),
  password: z.string().min(1, 'Please enter a password.'),
});

const LoginForm = () => {
  const { setUser } = useUserStore();
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const result = loginSchema.safeParse({ email, password });

    if (!result.success) {
      toast.error(result.error.errors[0].message);
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
        // localStorage.setItem('accessToken', data.Result.accessToken);
        setUser({
          id: data.Result.user_data.id,
          email: data.Result.user_data.email,
          role: data.Result.user_data.role,
        });
      }

      toast.success('Login successful!');

      const userRole = data.Result?.user_data?.role;
      switch (userRole) {
        case 'admin':
          router.push('/admin/dashboard');
          break;
        case 'psychologist':
          router.push('/psychologist/dashboard');
          break;
        default:
          router.push('/dashboard');
      }
    } catch (err) {
      toast.error('Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* <SpinnerLoader isLoading={isLoading} /> */}
      <div className="w-full max-w-[380px] mx-auto">
        <div className="border px-6 py-10 rounded-2xl flex flex-col gap-6 sm:shadow-md">
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
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
                onChange={e => setEmail(e.target.value)}
                className="block w-full rounded-md  px-3 py-1.5 text-base text-[hsl(var(--foreground))] outline outline-1 -outline-offset-1 outline-[hsl(var(--border))] placeholder:text-[hsl(var(--muted-foreground))] outline-none focus-visible:ring-transparent sm:text-sm dark:bg-input"
              />
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
                  className="block w-full rounded-md  px-3 py-1.5 text-base text-[hsl(var(--foreground))] outline outline-1 -outline-offset-1 outline-[hsl(var(--border))] placeholder:text-[hsl(var(--muted-foreground))] outline-none focus-visible:ring-transparent sm:text-sm dark:bg-input"
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

            <div className="text-right">
              <a
                href="/forgot-password"
                className="text-xs text-gray-600 dark:text-white/50 hover:underline font-semibold hover:text-black dark:hover:text-gray-100"
              >
                Forgot Password?
              </a>
            </div>

            <Button
              type="submit"
              className={`w-full mt-2 font-semibold rounded-2xl shadow-md hover:shadow-lg transition-shadow flex items-center justify-center gap-2 ${
                isLoading ? 'cursor-not-allowed opacity-75' : ''
              }`}
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
        </div>
      </div>
    </>
  );
};

export default LoginForm;
