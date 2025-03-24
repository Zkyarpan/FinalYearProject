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
  const [approvalStatus, setApprovalStatus] = useState('pending');

  useEffect(() => {
    const alertElement = document.querySelector('[role="alert"]');
    if (alertElement) {
      console.log('Found static alert, removing it');
      alertElement.remove();
    }
  }, []);

  const handleSubmit = async e => {
    e.preventDefault();

    // Remove any existing alerts
    const alertElement = document.querySelector('[role="alert"]');
    if (alertElement) {
      alertElement.remove();
    }

    // Validate form
    const result = loginSchema.safeParse({ email, password });
    if (!result.success) {
      toast.error(result.error.errors[0].message);
      return;
    }

    setIsLoading(true);

    try {
      console.log('Submitting login with:', email);

      const response = await fetch('/api/login', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();
      console.log('Login response:', response.status, data);

      // Handle approval required (403 status)
      if (response.status === 403) {
        // Get message from server response
        const message =
          data.ErrorMessage?.[0]?.message ||
          'Your account requires approval before you can log in.';

        // Determine if rejected or pending based on message content
        if (message.toLowerCase().includes('rejected')) {
          setApprovalStatus('rejected');
          setDialogIcon('error');
          setDialogTitle('Account Access Denied');
        } else {
          setApprovalStatus('pending');
          setDialogIcon('warning');
          setDialogTitle('Account Approval Required');

          // Special case for psychologist verification
          if (message.toLowerCase().includes('psychologist')) {
            setDialogIcon('info');
            setDialogTitle('Psychologist Verification Required');
          }
        }

        // Set dialog content
        setApprovalMessage(message);

        // Force dialog to open
        setTimeout(() => {
          console.log('Opening dialog with message:', message);
          setShowApprovalDialog(true);
        }, 100);

        setIsLoading(false);
        return;
      }

      // Handle other errors
      if (!response.ok) {
        toast.error(data.ErrorMessage?.[0]?.message || 'Login failed');
        setIsLoading(false);
        return;
      }

      // Handle successful login
      if (data.Result?.accessToken) {
        // Process successful login
        const userData = data.Result.user_data;
        setUser(userData);
        toast.success('Login successful!');
        setIsRedirecting(true);

        setTimeout(() => {
          router.push(
            userData.role === 'admin'
              ? '/dashboard/admin'
              : userData.role === 'psychologist'
              ? '/dashboard/psychologist'
              : '/dashboard'
          );
        }, 500);
      } else {
        toast.error('Login failed');
        setIsLoading(false);
      }
    } catch (err) {
      console.error('Login error:', err);
      toast.error('Something went wrong');
      setIsLoading(false);
    }
  };

  // Get the appropriate icon based on dialog type
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

  // Function to close dialog
  const closeDialog = () => {
    setShowApprovalDialog(false);
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

      {/* Account Approval Dialog */}
      <Dialog open={showApprovalDialog} onOpenChange={setShowApprovalDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center flex items-center justify-center gap-2 ,main-font">
              {getDialogIcon()}
              {dialogTitle}
            </DialogTitle>
          </DialogHeader>
          <div className="py-4 px-2">
            {/* Message Box */}
            <div
              className={`${
                dialogIcon === 'error'
                  ? 'bg-red-50 dark:bg-input border dark:border-[#333333]'
                  : dialogIcon === 'info'
                  ? 'bg-blue-50 dark:bg-input  border dark:border-[#333333]'
                  : dialogIcon === 'success'
                  ? 'bg-green-50 dark:bg-input border dark:border-[#333333]'
                  : 'bg-yellow-50 dark:bg-input border dark:border-[#333333]'
              } p-4 rounded-md`}
            >
              <p className="text-xs">{approvalMessage}</p>
              <p
                className={`mt-3 text-xs ${
                  dialogIcon === 'error'
                    ? 'text-red-700 dark:text-red-200'
                    : dialogIcon === 'info'
                    ? 'text-blue-700 dark:text-blue-200'
                    : dialogIcon === 'success'
                    ? 'text-green-700 dark:text-green-200'
                    : 'text-yellow-700 dark:text-red-500'
                }`}
              >
                {approvalStatus === 'rejected'
                  ? 'Your account application has been reviewed and has not been approved.'
                  : 'Please check your email for updates on your account status.'}
              </p>
            </div>

            {/* What Happens Next Section */}
            <div className="mt-4 p-4 dark:bg-input border dark:border-[#333333] rounded-md">
              <h4 className="text-sm font-medium">
                {approvalStatus === 'rejected'
                  ? 'Options Available'
                  : 'What happens next?'}
              </h4>

              {approvalStatus === 'rejected' ? (
                // Content for rejected accounts
                <ol className="mt-2 space-y-1 text-sm  list-decimal pl-4">
                  <li>
                    You can contact our support team for more information about
                    why your account was rejected
                  </li>
                  <li>
                    You may reapply with corrected information if applicable
                  </li>
                  <li>
                    If you believe this is an error, please reach out to our
                    support team
                  </li>
                </ol>
              ) : dialogTitle.includes('Psychologist') ? (
                // Content for pending psychologist accounts
                <ol className="mt-2 space-y-1 text-sm list-decimal pl-4">
                  <li>
                    Our team will verify your credentials and professional
                    qualifications
                  </li>
                  <li>
                    You'll receive an email once your psychologist account is
                    approved
                  </li>
                  <li>
                    After approval, you can log in and set up your availability
                    and profile
                  </li>
                </ol>
              ) : (
                // Content for standard pending accounts
                <ol className="mt-2 space-y-1 text-xs list-decimal pl-4">
                  <li>
                    Our administrators will review your account information
                  </li>
                  <li>You'll receive an email once your account is approved</li>
                  <li>
                    After approval, you can log in and access the platform
                  </li>
                </ol>
              )}
            </div>

            {/* Additional Support Information */}
            {approvalStatus === 'rejected' && (
              <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-900/20 rounded-md">
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Contact Support
                </h4>
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                  Email: team@mentality.com
                  <br />
                  Hours: Monday-Friday, 9am-5pm EST
                </p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button onClick={closeDialog} className="w-full">
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
