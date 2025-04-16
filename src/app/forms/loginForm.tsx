'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { ArrowRight, AlertCircle, CheckCircle, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { z } from 'zod';
import Loader from '@/components/common/Loader';
import { useUserStore } from '@/store/userStore';
import Link from 'next/link';
import SpinnerLoader from '@/components/SpinnerLoader';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';

// Create a global auth event name - VERY IMPORTANT
export const AUTH_SUCCESS_EVENT = 'mentality_auth_success';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address.'),
  password: z.string().min(1, 'Please enter a password.'),
});

export default function LoginForm() {
  const { setUser } = useUserStore();
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [showApprovalDialog, setShowApprovalDialog] = useState(false);
  const [approvalMessage, setApprovalMessage] = useState('');
  const [dialogTitle, setDialogTitle] = useState('Account Approval Required');
  const [dialogIcon, setDialogIcon] = useState('warning');

  // Handle submit function
  const handleSubmit = async e => {
    e.preventDefault();

    // Validate form
    const result = loginSchema.safeParse({ email, password });
    if (!result.success) {
      toast.error(result.error.errors[0].message);
      return;
    }

    setIsLoading(true);

    try {
      console.log('Attempting login...');
      const response = await fetch('/api/login', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();
      console.log('Login response:', response.status, data);

      // Direct check for 403 status - approval required
      if (response.status === 403) {
        // Handle approval required logic
        const message =
          data.ErrorMessage?.[0]?.message ||
          'Your account is pending approval by an administrator. Please check your email for updates.';

        // Configure dialog based on message content
        if (message.includes('rejected')) {
          setDialogIcon('error');
          setDialogTitle('Account Access Denied');
        } else if (message.toLowerCase().includes('psychologist')) {
          setDialogIcon('info');
          setDialogTitle('Psychologist Verification Required');
        } else {
          setDialogIcon('warning');
          setDialogTitle('Account Approval Required');
        }

        setApprovalMessage(message);
        setShowApprovalDialog(true);
        setIsLoading(false);
        return;
      }

      // Handle other error responses
      if (!response.ok) {
        const errorMessage = data.ErrorMessage?.[0]?.message || 'Login failed';
        toast.error(errorMessage);
        setIsLoading(false);
        return;
      }

      // Handle successful login
      if (data.Result?.accessToken) {
        const userData = data.Result.user_data;

        // Double-check approval status before proceeding
        if (userData.approvalStatus && userData.approvalStatus !== 'approved') {
          let message = 'Your account requires approval before you can log in.';
          let icon = 'warning';
          let title = 'Account Approval Required';

          if (userData.approvalStatus === 'rejected') {
            message =
              'Your account has been rejected. Please contact support for more information.';
            icon = 'error';
            title = 'Account Access Denied';
          } else if (userData.role === 'psychologist') {
            message =
              'Your psychologist credentials are pending verification. Our team will review your qualifications and approve your account shortly.';
            icon = 'info';
            title = 'Psychologist Verification Required';
          }

          setApprovalMessage(message);
          setDialogIcon(icon);
          setDialogTitle(title);
          setShowApprovalDialog(true);
          setIsLoading(false);
          return;
        }

        // Store auth token in localStorage (if available)
        try {
          localStorage.setItem('auth_token', data.Result.accessToken);
          localStorage.setItem('user_authenticated', 'true');
          localStorage.setItem('user_id', userData.id);
        } catch (err) {
          console.warn('Could not store auth data in localStorage:', err);
        }

        // Create user object and set in store
        const userObj = {
          _id: userData.id,
          id: userData.id, // Include both for compatibility
          email: userData.email,
          role: userData.role,
          isVerified: userData.isVerified,
          profileComplete: userData.profileComplete,
          firstName: userData.firstName || null,
          lastName: userData.lastName || null,
          profileImage: userData.profileImage || null,
          approvalStatus: userData.approvalStatus || 'approved',
          isAuthenticated: true, // Critical for auth checks
        };

        // Set user in store first before navigation
        console.log('Setting authenticated user in store:', userObj);
        setUser(userObj);

        // IMPORTANT: Wait a moment for state to update
        setTimeout(() => {
          // Dispatch authentication success event BEFORE navigation
          console.log('Dispatching auth success event');
          window.dispatchEvent(
            new CustomEvent(AUTH_SUCCESS_EVENT, {
              detail: {
                userId: userData.id,
                role: userData.role,
                timestamp: new Date().toISOString(),
              },
            })
          );

          // Show success toast
          toast.success('Login successful!');
          setIsRedirecting(true);

          // Delayed redirect to ensure auth state propagates
          setTimeout(() => {
            switch (userData.role) {
              case 'admin':
                router.push('/dashboard/admin');
                break;
              case 'psychologist':
                router.push('/dashboard/psychologist');
                break;
              default:
                router.push('/dashboard');
            }
          }, 500);
        }, 200);
      } else {
        toast.error('Login failed. Please check your credentials.');
        setIsLoading(false);
      }
    } catch (err) {
      console.error('Login error:', err);
      toast.error('Something went wrong. Please try again.');
      setIsLoading(false);
    }
  };

  // Get the appropriate icon component based on dialog type
  const getDialogIcon = () => {
    switch (dialogIcon) {
      case 'error':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'info':
        return <AlertCircle className="h-5 w-5 text-blue-500" />;
      case 'warning':
      default:
        return <AlertCircle className="h-5 w-5 text-yellow-500" />;
    }
  };

  return (
    <>
      {isRedirecting && <SpinnerLoader isLoading={isRedirecting} />}
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
                className="block w-full rounded-md px-3 py-1.5 text-base text-[hsl(var(--foreground))] outline outline-1 -outline-offset-1 outline-[hsl(var(--border))] placeholder:text-[hsl(var(--muted-foreground))] outline-none focus-visible:ring-transparent sm:text-sm dark:bg-input"
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
                  className="block w-full rounded-md px-3 py-1.5 text-base text-[hsl(var(--foreground))] outline outline-1 -outline-offset-1 outline-[hsl(var(--border))] placeholder:text-[hsl(var(--muted-foreground))] outline-none focus-visible:ring-transparent sm:text-sm dark:bg-input"
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
              <Link
                href="/forgot-password"
                className="text-xs text-gray-600 dark:text-white/50 hover:underline font-semibold hover:text-black dark:hover:text-gray-100"
              >
                Forgot Password?
              </Link>
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

      {/* Improved Approval Status Dialog */}
      <Dialog open={showApprovalDialog} onOpenChange={setShowApprovalDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center flex items-center justify-center gap-2">
              {getDialogIcon()}
              {dialogTitle}
            </DialogTitle>
          </DialogHeader>
          <div className="py-4 px-2">
            <div
              className={`${
                dialogIcon === 'error'
                  ? 'bg-red-50 dark:bg-red-900/20'
                  : dialogIcon === 'info'
                    ? 'bg-blue-50 dark:bg-blue-900/20'
                    : dialogIcon === 'success'
                      ? 'bg-green-50 dark:bg-green-900/20'
                      : 'bg-yellow-50 dark:bg-yellow-900/20'
              } p-4 rounded-md`}
            >
              <p
                className={`text-sm ${
                  dialogIcon === 'error'
                    ? 'text-red-700 dark:text-red-200'
                    : dialogIcon === 'info'
                      ? 'text-blue-700 dark:text-blue-200'
                      : dialogIcon === 'success'
                        ? 'text-green-700 dark:text-green-200'
                        : 'text-yellow-700 dark:text-yellow-200'
                }`}
              >
                {approvalMessage}
              </p>
              <p
                className={`mt-3 text-sm ${
                  dialogIcon === 'error'
                    ? 'text-red-700 dark:text-red-200'
                    : dialogIcon === 'info'
                      ? 'text-blue-700 dark:text-blue-200'
                      : dialogIcon === 'success'
                        ? 'text-green-700 dark:text-green-200'
                        : 'text-yellow-700 dark:text-yellow-200'
                }`}
              >
                Please check your email for updates on your account status.
              </p>
            </div>
            <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-md">
              <h4 className="text-sm font-medium text-blue-700 dark:text-blue-300">
                What happens next?
              </h4>
              <ol className="mt-2 space-y-1 text-sm text-blue-600 dark:text-blue-200 list-decimal pl-4">
                {dialogIcon === 'error' ? (
                  <>
                    <li>
                      You can contact our support team for more information
                    </li>
                    <li>
                      You may reapply with corrected information if applicable
                    </li>
                  </>
                ) : (
                  <>
                    <li>
                      {dialogTitle.includes('Psychologist')
                        ? 'Our team will review your credentials and qualifications'
                        : 'Our administrators will review your account information'}
                    </li>
                    <li>
                      You'll receive an email once your account is{' '}
                      {dialogIcon === 'error' ? 'reviewed' : 'approved'}
                    </li>
                    <li>
                      After approval, you can log in and access the platform
                    </li>
                  </>
                )}
              </ol>
            </div>
          </div>
          <DialogFooter>
            <Button
              onClick={() => setShowApprovalDialog(false)}
              className="w-full"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
