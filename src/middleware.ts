import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { decrypt } from './lib/token';

const protectedRoutes = ['/dashboard', '/profile'];
const publicRoutes = ['/login', '/signup'];
const adminRoutes = ['/admin', '/admin/dashboard'];
const psychologistRoutes = ['/psychologist/dashboard', '/psychologist/profile'];
const verificationRoute = '/verify';
const passwordConfirmationRoute = '/forgot-password/confirmation';

export default async function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;

  // Retrieve cookies
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('accessToken')?.value;
  const resetToken = cookieStore.get('resetToken')?.value;
  const tempToken = cookieStore.get('tempToken')?.value;

  // Decrypt tokens if they exist
  const session = sessionCookie ? await decrypt(sessionCookie) : null;
  const resetSession = resetToken ? await decrypt(resetToken) : null;

  // Check if trying to access the verification page directly without a tempToken
  if (path === verificationRoute) {
    if (!tempToken) {
      return NextResponse.redirect(new URL('/signup', req.nextUrl));
    }
  }

  // Redirect to forgot-password if accessing confirmation without a reset token
  if (path === passwordConfirmationRoute && !resetSession) {
    return NextResponse.redirect(new URL('/forgot-password', req.nextUrl));
  }

  // Redirect psychologist to their dashboard
  if (path === '/psychologist') {
    if (session?.role === 'psychologist') {
      return NextResponse.redirect(
        new URL('/psychologist/dashboard', req.nextUrl)
      );
    }
    return NextResponse.next();
  }

  // Redirect based on role after login
  if (session?.id && publicRoutes.includes(path)) {
    if (session.role === 'psychologist') {
      return NextResponse.redirect(
        new URL('/psychologist/dashboard', req.nextUrl)
      );
    } else if (session.role === 'admin') {
      return NextResponse.redirect(new URL('/admin/dashboard', req.nextUrl));
    } else {
      return NextResponse.redirect(new URL('/dashboard', req.nextUrl));
    }
  }

  // Require login for protected routes
  if (!session?.id && protectedRoutes.includes(path)) {
    return NextResponse.redirect(new URL('/login', req.nextUrl));
  }

  // Check role for psychologist routes
  if (psychologistRoutes.some(route => path.startsWith(route))) {
    if (!session?.id) {
      return NextResponse.redirect(new URL('/login', req.nextUrl));
    }
    if (session.role !== 'psychologist') {
      return NextResponse.redirect(new URL('/dashboard', req.nextUrl));
    }
  }

  // Check role for admin routes
  if (adminRoutes.some(route => path.startsWith(route))) {
    if (!session?.id) {
      return NextResponse.redirect(new URL('/login', req.nextUrl));
    }
    if (session.role !== 'admin') {
      return NextResponse.redirect(new URL('/dashboard', req.nextUrl));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/login',
    '/signup',
    '/dashboard',
    '/profile',
    '/verify',
    '/admin/:path*',
    '/psychologist/:path*',
    '/forgot-password/confirmation',
    '/',
  ],
};
