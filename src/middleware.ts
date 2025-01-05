import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { decrypt } from './lib/token';

const protectedRoutes = ['/dashboard', '/profile'];
const publicRoutes = ['/login', '/signup'];
const adminRoutes = ['/admin', '/admin/dashboard'];
const psychologistRoutes = ['/psychologist', '/psychologist/dashboard'];
const verificationRoute = '/verify';

export default async function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;

  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('accessToken')?.value;

  // Decrypt the session from the cookie
  const session = sessionCookie ? await decrypt(sessionCookie) : null;

  // If user is already logged in and verified, redirect from public routes
  if (session?.isVerified && publicRoutes.includes(path)) {
    return NextResponse.redirect(new URL('/dashboard', req.nextUrl));
  }

  // Handle verification route
  if (path === verificationRoute) {
    // Allow access to verify page if there's no session
    if (!session) {
      return NextResponse.next();
    }
    // Redirect verified users away from verify page
    if (session.isVerified) {
      return NextResponse.redirect(new URL('/dashboard', req.nextUrl));
    }
  }

  // Protected routes require authentication
  if (!session?.id && protectedRoutes.includes(path)) {
    return NextResponse.redirect(new URL('/login', req.nextUrl));
  }

  // Role-based redirections
  if (session?.role === 'psychologist' && !path.startsWith('/psychologist')) {
    return NextResponse.redirect(
      new URL('/psychologist/dashboard', req.nextUrl)
    );
  }

  if (session?.role === 'admin' && !path.startsWith('/admin')) {
    return NextResponse.redirect(new URL('/admin/dashboard', req.nextUrl));
  }

  // Prevent access to role-specific routes
  if (
    psychologistRoutes.some(route => path.startsWith(route)) &&
    session?.role !== 'psychologist'
  ) {
    return NextResponse.redirect(new URL('/dashboard', req.nextUrl));
  }

  if (
    adminRoutes.some(route => path.startsWith(route)) &&
    session?.role !== 'admin'
  ) {
    return NextResponse.redirect(new URL('/dashboard', req.nextUrl));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/login',
    '/signup',
    '/dashboard',
    '/profile',
    '/admin/:path*',
    '/verify',
    '/psychologist/:path*',
    '/',
  ],
};
