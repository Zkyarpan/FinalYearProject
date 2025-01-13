'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { notFound } from 'next/navigation';
import Cookies from 'js-cookie';

interface TokenPayload {
  id?: string;
  email?: string;
  role?: string;
  type?: string;
  isVerified?: boolean;
}

const publicRoutes = [
  '/login',
  '/signup',
  '/forgot-password',
  '/blogs',
  '/psychologist',
  '/resources',
  '/stories',
  '/services',
  '/articles',
];

const validRoutes = [
  ...publicRoutes,
  '/admin',
  '/admin/dashboard',
  '/psychologist/dashboard',
  '/dashboard',
  '/verify',
  '/',
];

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      const currentPath = window.location.pathname;

      const isValidPath = validRoutes.some(
        route =>
          currentPath === route ||
          (currentPath.startsWith(route + '/') && route !== '/')
      );

      if (!isValidPath) {
        notFound();
        return;
      }

      if (publicRoutes.includes(currentPath)) {
        return;
      }

      const token = Cookies.get('accessToken');
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
            if (!currentPath.startsWith('/admin')) {
              router.push('/admin/dashboard');
            }
            break;
          case 'psychologist':
            if (!currentPath.startsWith('/psychologist')) {
              router.push('/psychologist/dashboard');
            }
            break;
          default:
            if (!currentPath.startsWith('/dashboard')) {
              router.push('/dashboard');
            }
            break;
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        Cookies.remove('accessToken');
        router.push('/login');
      }
    };

    checkAuth();
  }, [router]);

  return <>{children}</>;
}




