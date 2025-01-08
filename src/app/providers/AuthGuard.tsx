'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface TokenPayload {
  id?: string;
  email?: string;
  role?: string;
  type?: string;
  isVerified?: boolean;
}

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token');

      if (!token) {
        router.push('/login');
        return;
      }

      try {
        const response = await fetch('/api/auth/validate', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error('Invalid token');
        }

        const userData: TokenPayload = await response.json();

        if (!userData.isVerified) {
          router.push('/verify');
          return;
        }

        switch (userData.role) {
          case 'admin':
            if (!window.location.pathname.startsWith('/admin')) {
              router.push('/admin/dashboard');
            }
            break;
          case 'psychologist':
            if (!window.location.pathname.startsWith('/psychologist')) {
              router.push('/psychologist/dashboard');
            }
            break;
          default:
            if (!window.location.pathname.startsWith('/dashboard')) {
              router.push('/dashboard');
            }
            break;
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        localStorage.removeItem('token');
        router.push('/login');
      }
    };

    checkAuth();
  }, [router]);

  return <>{children}</>;
}
