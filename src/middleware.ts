'use server';

import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { decrypt } from './lib/token';
import { getDashboardByRole } from './helpers/getDashboardByRole';

const protectedRoutes = [
  '/dashboard',
  '/dashboard/admin',
  '/dashboard/psychologist',
  '/account',
  '/appointments',
  '/settings/profile',
];

const publicRoutes = [
  '/login',
  '/signup',
  '/stories',
  '/services',
  '/psychologist',
  '/articles',
  '/resources',
  '/blogs',
];

const authFlowRoutes = {
  verification: '/verify',
  forgotPassword: '/forgot-password',
  passwordConfirmation: '/forgot-password/confirmation',
};

export default async function middleware(req: NextRequest) {
  try {
    const path = req.nextUrl.pathname;
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('accessToken')?.value;
    const resetToken = cookieStore.get('resetToken')?.value;
    const tempToken = cookieStore.get('tempToken')?.value;

    // Check if we're on the verification page
    if (path === '/verify') {
      // If we have tempToken, allow access
      if (tempToken) {
        return NextResponse.next();
      }

      // If we have sessionCookie but user isn't verified, allow access
      if (sessionCookie) {
        const session = await decrypt(sessionCookie);
        if (session && !session.isVerified) {
          return NextResponse.next();
        }
      }

      // Otherwise redirect to signup
      return NextResponse.redirect(new URL('/signup', req.nextUrl));
    }

    // Regular session handling
    const session = sessionCookie ? await decrypt(sessionCookie) : null;
    const resetSession = resetToken ? await decrypt(resetToken) : null;

    // Handle password reset flow
    if (path === authFlowRoutes.passwordConfirmation && !resetSession) {
      return NextResponse.redirect(
        new URL(authFlowRoutes.forgotPassword, req.nextUrl)
      );
    }

    if (path === authFlowRoutes.forgotPassword) {
      return NextResponse.next();
    }

    // Handle authenticated users
    if (session?.id) {
      const dashboardPath = getDashboardByRole(session.role || '');

      // If user isn't verified and trying to access protected routes
      if (!session.isVerified && isProtectedRoute(path)) {
        return NextResponse.redirect(new URL('/verify', req.nextUrl));
      }

      // Handle auth page access for logged-in users
      if (
        path === '/' ||
        path === '/login' ||
        path === '/signup' ||
        path === '/forgot-password'
      ) {
        if (!session.isVerified) {
          return NextResponse.redirect(new URL('/verify', req.nextUrl));
        }
        return NextResponse.redirect(new URL(dashboardPath, req.nextUrl));
      }

      // Handle dashboard routes
      if (path.startsWith('/dashboard')) {
        if (!session.isVerified) {
          return NextResponse.redirect(new URL('/verify', req.nextUrl));
        }

        if (session.role === 'user') {
          if (path === '/dashboard') {
            return NextResponse.next();
          }
          return NextResponse.redirect(new URL('/dashboard', req.nextUrl));
        } else {
          if (path === '/dashboard' || path !== dashboardPath) {
            return NextResponse.redirect(new URL(dashboardPath, req.nextUrl));
          }
        }
      }

      // Allow access to public routes
      if (publicRoutes.some(route => path.startsWith(route))) {
        return NextResponse.next();
      }

      return NextResponse.next();
    }

    // Handle non-authenticated users
    if (isProtectedRoute(path)) {
      const searchParams = new URLSearchParams();
      searchParams.set('from', path);
      return NextResponse.redirect(
        new URL(`/login?${searchParams.toString()}`, req.nextUrl)
      );
    }

    return NextResponse.next();
  } catch (error) {
    console.error('Middleware error:', error);
    // Don't redirect to login if we're on the verify page
    if (req.nextUrl.pathname === '/verify') {
      return NextResponse.next();
    }
    const response = NextResponse.redirect(new URL('/login', req.nextUrl));
    response.cookies.delete('accessToken');
    response.cookies.delete('resetToken');
    response.cookies.delete('tempToken');
    return response;
  }
}

function isProtectedRoute(path: string): boolean {
  return protectedRoutes.some(route => path.startsWith(route));
}

export const config = {
  matcher: [
    '/',
    '/login',
    '/signup',
    '/dashboard/:path*',
    '/account',
    '/verify',
    '/forgot-password',
    '/forgot-password/confirmation',
    '/settings/profile',
    '/stories/:path*',
    '/services/:path*',
    '/psychologist/:path*',
    '/articles/:path*',
    '/resources/:path*',
    '/blogs/:path*',
    '/appointments/:path*',
  ],
};
