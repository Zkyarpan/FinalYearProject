'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { notFound } from 'next/navigation';
import Cookies from 'js-cookie';
import { useUserStore } from '@/store/userStore';

interface TokenPayload {
  id?: string;
  email?: string;
  role?: string;
  type?: string;
  isVerified?: boolean;
  profileComplete?: boolean;
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

const validRoutes = [...publicRoutes, '/dashboard', '/verify', '/'];

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { setUser } = useUserStore();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const currentPath = window.location.pathname;
        const token = Cookies.get('accessToken');

        // Check if the current path is valid
        const isValidPath = validRoutes.some(
          route =>
            currentPath === route ||
            (currentPath.startsWith(route + '/') && route !== '/')
        );

        if (!isValidPath) {
          notFound();
          return;
        }

        // Allow access to public routes regardless of authentication
        if (publicRoutes.includes(currentPath) || currentPath === '/') {
          setIsChecking(false);
          return;
        }

        // For auth pages, redirect if logged in
        if (
          token &&
          (currentPath === '/login' ||
            currentPath === '/signup' ||
            currentPath === '/forgot-password')
        ) {
          const response = await fetch('/api/auth/validate', {
            headers: {
              Authorization: `Bearer ${token}`,
            },
            credentials: 'include',
          });

          if (response.ok) {
            const userData: TokenPayload = await response.json();

            setUser({
              _id: userData.id!,
              email: userData.email!,
              role: userData.role!,
              isVerified: userData.isVerified!,
              profileComplete: userData.profileComplete || false,
              firstName: null,
              lastName: null,
              profileImage: null,
              isAuthenticated: true,
            });

            router.push('/dashboard');
            return;
          }
        }

        // For protected routes, check authentication
        if (!token) {
          router.push('/login');
          return;
        }

        // Validate token with backend
        const response = await fetch('/api/auth/validate', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          credentials: 'include',
        });

        if (!response.ok) {
          throw new Error('Invalid token');
        }

        const userData: TokenPayload = await response.json();

        setUser({
          _id: userData.id!,
          email: userData.email!,
          role: userData.role!,
          isVerified: userData.isVerified!,
          profileComplete: userData.profileComplete || false,
          firstName: null,
          lastName: null,
          profileImage: null,
          isAuthenticated: true,
        });

        // Handle routing based on verification status
        if (!userData.isVerified && currentPath !== '/verify') {
          router.push('/verify');
          return;
        }

        // Handle routing for authenticated users
        if (userData.isVerified && userData.profileComplete) {
          if (currentPath === '/login' || currentPath === '/signup') {
            router.push('/dashboard');
          }
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        Cookies.remove('accessToken');
        router.push('/login');
      } finally {
        setIsChecking(false);
      }
    };

    checkAuth();
  }, [router, setUser]);

  // Show nothing while checking authentication
  if (isChecking) {
    return null;
  }

  return <>{children}</>;
}
