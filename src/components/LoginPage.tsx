'use client';

import dynamic from 'next/dynamic';
import Link from 'next/link';

const LoginForm = dynamic(() => import('@/app/forms/loginForm'));

const LoginPage = () => {
  return (
    <main className="pt-14 -mt-10">
      <div className="min-h-[calc(100vh-80px)] flex flex-col items-center justify-center px-4">
        <div className="text-center mb-10 space-y-2">
          <h1 className="text-3xl main-font font-bold text-[hsl(var(--foreground))]">
            Welcome back!
          </h1>
          <h2 className="text-3xl main-font font-extrabold text-[hsl(var(--foreground))]">
            Login to your account.
          </h2>
        </div>
        <div className="w-full max-w-md">
          <LoginForm />
        </div>

        <p className="text-muted-foreground font-normal text-sm lg:mt-10 text-center mb-2">
          Don’t have a Mentality profile?{' '}
          <Link
            href="/signup"
            className="text-gray-600 dark:text-white/50 hover:underline font-semibold hover:text-black dark:hover:text-gray-100"
          >
            Create One!
          </Link>
        </p>
      </div>
    </main>
  );
};

export default LoginPage;
