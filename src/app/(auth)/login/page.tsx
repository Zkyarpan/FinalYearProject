import { Suspense } from 'react';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import LoginForm from './client';
import Loading from './loading';
import Link from 'next/link';

export default async function LoginPage() {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get('accessToken')?.value;

  if (accessToken) {
    redirect('/dashboard');
  }

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
          <Suspense fallback={<Loading />}>
            <LoginForm />
          </Suspense>
        </div>

        <p className="text-muted-foreground font-normal text-sm lg:mt-10 text-center mb-2">
          Don’t have a Mentality profile?{' '}
          <Link
            href="/signup"
            className="text-gray-600 dark:text-white/80 hover:underline font-semibold hover:text-black dark:hover:text-gray-100"
          >
            Create One!
          </Link>
        </p>
      </div>
    </main>
  );
}
