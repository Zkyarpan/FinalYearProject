'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { notFound } from 'next/navigation';
import Cookies from 'js-cookie';
import { useUserStore } from '@/store/userStore';
import { getDashboardByRole } from '@/helpers/getDashboardByRole';

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

        const isValidPath = validRoutes.some(
          route =>
            currentPath === route ||
            (currentPath.startsWith(route + '/') && route !== '/')
        );

        if (!isValidPath) {
          notFound();
          return;
        }

        if (publicRoutes.includes(currentPath) || currentPath === '/') {
          setIsChecking(false);
          return;
        }

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
            const dashboardPath = getDashboardByRole(userData.role!);

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

            router.push(dashboardPath);
            return;
          }
        }

        if (!token) {
          router.push('/login');
          return;
        }

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
        const dashboardPath = getDashboardByRole(userData.role!);

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

        if (!userData.isVerified && currentPath !== '/verify') {
          router.push('/verify');
          return;
        }

        if (userData.isVerified && userData.profileComplete) {
          if (currentPath === '/login' || currentPath === '/signup') {
            router.push(dashboardPath);
            return;
          }

          if (currentPath === '/dashboard') {
            router.push(dashboardPath);
            return;
          }

          if (currentPath.startsWith('/dashboard/')) {
            const userDashboard = getDashboardByRole(userData.role!);
            if (currentPath !== userDashboard) {
              router.push(userDashboard);
              return;
            }
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

  if (isChecking) {
    return null;
  }

  return <>{children}</>;
}
