import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { decrypt } from './lib/token';

const protectedRoutes = ['/dashboard', '/profile'];
const publicRoutes = ['/login', '/signup'];
const adminRoutes = ['/admin', '/admin/dashboard'];
const psychologistRoutes = ['/psychologist/dashboard', '/psychologist/profile'];
const verificationRoute = '/verify';

export default async function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;

  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('accessToken')?.value;

  // Decrypt the session from the cookie
  const session = sessionCookie ? await decrypt(sessionCookie) : null;

  // Allow access to psychologist registration page
  if (path === '/psychologist') {
    // If already logged in as psychologist, redirect to dashboard
    if (session?.role === 'psychologist') {
      return NextResponse.redirect(
        new URL('/psychologist/dashboard', req.nextUrl)
      );
    }
    return NextResponse.next();
  }

  // If user is already logged in and verified, redirect from public routes
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

  // Protected routes require authentication
  if (!session?.id && protectedRoutes.includes(path)) {
    return NextResponse.redirect(new URL('/login', req.nextUrl));
  }

  // Protect psychologist dashboard routes
  if (psychologistRoutes.some(route => path.startsWith(route))) {
    if (!session?.id) {
      return NextResponse.redirect(new URL('/login', req.nextUrl));
    }
    if (session.role !== 'psychologist') {
      return NextResponse.redirect(new URL('/dashboard', req.nextUrl));
    }
  }

  // Protect admin routes
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
    '/admin/:path*',
    '/psychologist/:path*',
    '/verify',
    '/',
  ],
};
