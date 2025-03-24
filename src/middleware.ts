'use server';

import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { decrypt } from './lib/token';
import { getDashboardByRole } from './helpers/getDashboardByRole';

const protectedRoutes = [
  '/dashboard',
  '/dashboard/admin',
  '/dashboard/psychologist',
  '/account/psychologist',
  '/account/admin',
  '/account',
  '/appointments',
  '/settings/profile',
  '/inbox',
  '/sessions',
  '/notifications',
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
  '/appointments',
  '/inbox',
  '/verify',
];

const authFlowRoutes = {
  verification: '/verify',
  forgotPassword: '/forgot-password',
  passwordConfirmation: '/forgot-password/confirmation',
};

// Role-based permissions for dashboard access
const rolePermissions = {
  admin: [
    '/dashboard/admin',
    '/dashboard/psychologist',
    '/dashboard/admin/users',
    '/dashboard/admin/articles',
    '/dashboard/admin/blogs',
    '/dashboard/admin/settings',
  ],
  psychologist: [
    '/dashboard/psychologist',
    '/psychologist/patients',
    '/psychologist/availability',
    '/psychologist/appointments',
    '/psychologist/articles',
    '/psychologist/blog',
  ],
  user: ['/dashboard'],
};

export default async function middleware(req: NextRequest) {
  try {
    const path = req.nextUrl.pathname;
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('accessToken')?.value;
    const resetToken = cookieStore.get('resetToken')?.value;
    const tempToken = cookieStore.get('tempToken')?.value;

    // Get any redirect-from query params from login
    const fromPath = req.nextUrl.searchParams.get('from');

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
      const userRole = session.role || 'user';
      const dashboardPath = getDashboardByRole(userRole);
      const allowedPaths = rolePermissions[userRole] || ['/dashboard'];

      // If user isn't verified and trying to access protected routes
      if (!session.isVerified && isProtectedRoute(path)) {
        return NextResponse.redirect(new URL('/verify', req.nextUrl));
      }

      // Handle auth page access for logged-in users (login, signup, forgot-password)
      if (
        path === '/' ||
        path === '/login' ||
        path === '/signup' ||
        path === '/forgot-password'
      ) {
        if (!session.isVerified) {
          return NextResponse.redirect(new URL('/verify', req.nextUrl));
        }

        // If there's a 'from' param and it's a valid path, redirect there
        if (
          fromPath &&
          (isProtectedRoute(fromPath) ||
            publicRoutes.some(route => fromPath.startsWith(route)))
        ) {
          return NextResponse.redirect(new URL(fromPath, req.nextUrl));
        }

        return NextResponse.redirect(new URL(dashboardPath, req.nextUrl));
      }

      // Handle dashboard routes - with improved role-based access
      if (path.startsWith('/dashboard')) {
        if (!session.isVerified) {
          return NextResponse.redirect(new URL('/verify', req.nextUrl));
        }

        // For base dashboard path, redirect to appropriate dashboard by role
        if (path === '/dashboard' && dashboardPath !== '/dashboard') {
          return NextResponse.redirect(new URL(dashboardPath, req.nextUrl));
        }

        // For dashboard paths, check if the user can access based on their role
        if (path.startsWith('/dashboard/')) {
          // Allow admin to access all dashboard paths
          if (userRole === 'admin') {
            return NextResponse.next();
          }

          // For non-admin users, check permission based on role
          const hasAccess = allowedPaths.some(
            allowedPath =>
              path === allowedPath || path.startsWith(allowedPath + '/')
          );

          if (!hasAccess) {
            return NextResponse.redirect(new URL(dashboardPath, req.nextUrl));
          }
        }
      }

      // For all other valid routes, just allow access
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
  return protectedRoutes.some(
    route => path === route || path.startsWith(route + '/')
  );
}

export const config = {
  matcher: [
    '/',
    '/login',
    '/signup',
    '/dashboard/:path*',
    '/account/:path*',
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
    '/inbox',
    '/sessions',
    '/notifications',
  ],
};
