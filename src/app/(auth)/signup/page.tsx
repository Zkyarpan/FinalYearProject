import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { Suspense } from 'react';
import SignupPageClient from './client';
import Loading from './loading';

export default async function SignupPage() {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get('accessToken')?.value;

  if (accessToken) {
    redirect('/dashboard');
  }

  return (
    <Suspense fallback={<Loading />}>
      <SignupPageClient />
    </Suspense>
  );
}
