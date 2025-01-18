import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { decrypt } from './lib/token';

const protectedRoutes = ['/dashboard', '/account', '/settings/profile'];

const publicRoutes = [
  '/login',
  '/signup',
  '/stories',
  '/services',
  '/psychologists',
  '/articles',
  '/resources',
  '/blogs',
];

const adminRoutes = ['/admin', '/admin/dashboard'];
const psychologistRoutes = ['/psychologist/dashboard', '/psychologist/profile'];
const authFlowRoutes = {
  verification: '/verify',
  forgotPassword: '/forgot-password',
  passwordConfirmation: '/forgot-password/confirmation',
};

export default async function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;

  // Authentication token handling
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('accessToken')?.value;
  const resetToken = cookieStore.get('resetToken')?.value;
  const tempToken = cookieStore.get('tempToken')?.value;

  // Session management
  const session = sessionCookie ? await decrypt(sessionCookie) : null;
  const resetSession = resetToken ? await decrypt(resetToken) : null;

  // Handle authentication flow routes
  if (path === authFlowRoutes.passwordConfirmation && !resetSession) {
    return NextResponse.redirect(
      new URL(authFlowRoutes.forgotPassword, req.nextUrl)
    );
  }

  if (path === authFlowRoutes.verification && !tempToken) {
    return NextResponse.redirect(new URL('/signup', req.nextUrl));
  }

  if (path === authFlowRoutes.forgotPassword) {
    return NextResponse.next();
  }

  // Allow public access to certain routes
  if (publicRoutes.some(route => path.startsWith(route)) || path === '/') {
    return NextResponse.next();
  }

  // Authenticated user handling
  if (session?.id) {
    // Role-based route protection
    if (psychologistRoutes.some(route => path.startsWith(route))) {
      if (session.role !== 'psychologist') {
        return NextResponse.redirect(new URL('/dashboard', req.nextUrl));
      }
    }

    if (adminRoutes.some(route => path.startsWith(route))) {
      if (session.role !== 'admin') {
        return NextResponse.redirect(new URL('/dashboard', req.nextUrl));
      }
    }

    return NextResponse.next();
  }

  // Check if attempting to access protected route
  if (isProtectedRoute(path)) {
    const searchParams = new URLSearchParams();
    searchParams.set('from', path);
    return NextResponse.redirect(
      new URL(`/login?${searchParams.toString()}`, req.nextUrl)
    );
  }

  return NextResponse.next();
}

function isProtectedRoute(path: string): boolean {
  return (
    protectedRoutes.some(route => path.startsWith(route)) ||
    adminRoutes.some(route => path.startsWith(route)) ||
    psychologistRoutes.some(route => path.startsWith(route))
  );
}

export const config = {
  matcher: [
    '/',
    '/login',
    '/signup',
    '/dashboard',
    '/account',
    '/verify',
    '/admin/:path*',
    '/psychologist/:path*',
    '/forgot-password',
    '/forgot-password/confirmation',
    '/settings/profile',
    '/stories/:path*',
    '/services/:path*',
    '/psychologists/:path*',
    '/articles/:path*',
    '/resources/:path*',
    '/blogs/:path*',
  ],
};
