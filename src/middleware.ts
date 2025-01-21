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

  if (session?.id) {
    // Redirect from landing page and auth pages when logged in
    if (
      path === '/' ||
      path === '/login' ||
      path === '/signup' ||
      path === '/forgot-password'
    ) {
      // Check if user is verified and profile is complete
      if (session.isVerified && session.profileComplete) {
        return NextResponse.redirect(new URL('/dashboard', req.nextUrl));
      } else if (!session.isVerified) {
        return NextResponse.redirect(new URL('/verify', req.nextUrl));
      }
    }

    // Allow access to other public routes
    if (publicRoutes.some(route => path.startsWith(route))) {
      return NextResponse.next();
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
  return protectedRoutes.some(route => path.startsWith(route));
}

export const config = {
  matcher: [
    '/',
    '/login',
    '/signup',
    '/dashboard',
    '/account',
    '/verify',
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
