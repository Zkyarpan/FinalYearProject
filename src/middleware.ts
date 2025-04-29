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

    const fromPath = req.nextUrl.searchParams.get('from');

    if (path === '/verify') {
      if (tempToken) {
        return NextResponse.next();
      }
      if (sessionCookie) {
        const session = await decrypt(sessionCookie);
        if (session && !session.isVerified) {
          return NextResponse.next();
        }
      }

      return NextResponse.redirect(new URL('/signup', req.nextUrl));
    }

    const session = sessionCookie ? await decrypt(sessionCookie) : null;
    const resetSession = resetToken ? await decrypt(resetToken) : null;

    if (path === authFlowRoutes.passwordConfirmation && !resetSession) {
      return NextResponse.redirect(
        new URL(authFlowRoutes.forgotPassword, req.nextUrl)
      );
    }

    if (path === authFlowRoutes.forgotPassword) {
      return NextResponse.next();
    }

    if (session?.id) {
      const userRole = session.role || 'user';
      const dashboardPath = getDashboardByRole(userRole);
      const allowedPaths = rolePermissions[userRole] || ['/dashboard'];

      if (!session.isVerified && isProtectedRoute(path)) {
        return NextResponse.redirect(new URL('/verify', req.nextUrl));
      }

      if (
        path === '/' ||
        path === '/login' ||
        path === '/signup' ||
        path === '/forgot-password'
      ) {
        if (!session.isVerified) {
          return NextResponse.redirect(new URL('/verify', req.nextUrl));
        }

        if (
          fromPath &&
          (isProtectedRoute(fromPath) ||
            publicRoutes.some(route => fromPath.startsWith(route)))
        ) {
          return NextResponse.redirect(new URL(fromPath, req.nextUrl));
        }

        return NextResponse.redirect(new URL(dashboardPath, req.nextUrl));
      }

      if (path.startsWith('/dashboard')) {
        if (!session.isVerified) {
          return NextResponse.redirect(new URL('/verify', req.nextUrl));
        }

        if (path === '/dashboard' && dashboardPath !== '/dashboard') {
          return NextResponse.redirect(new URL(dashboardPath, req.nextUrl));
        }

        if (path.startsWith('/dashboard/')) {
          if (userRole === 'admin') {
            return NextResponse.next();
          }

          const hasAccess = allowedPaths.some(
            allowedPath =>
              path === allowedPath || path.startsWith(allowedPath + '/')
          );

          if (!hasAccess) {
            return NextResponse.redirect(new URL(dashboardPath, req.nextUrl));
          }
        }
      }

      return NextResponse.next();
    }

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
