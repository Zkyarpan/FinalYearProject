'use server';

import { SignJWT, jwtVerify } from 'jose';
import { NextResponse } from 'next/server';

const secretKey = process.env.JWT_SECRET;
if (!secretKey) throw new Error('JWT_SECRET is not defined');
const key = new TextEncoder().encode(secretKey);

type TokenPayload = {
  id?: string;
  email?: string;
  password?: string;
  role?: string;
  type?: string;
  isVerified?: boolean;
  exp?: number;
  iat?: number;
};

export async function encrypt(
  payload: TokenPayload,
  expiresIn: string = '10m'
) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(expiresIn)
    .sign(key);
}

export async function decrypt(token: string): Promise<TokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, key, { algorithms: ['HS256'] });
    return payload as TokenPayload;
  } catch (error) {
    return null;
  }
}

export async function setSessionCookie(session: string, expires: Date) {
  const response = NextResponse.next();
  response.cookies.set('session', session, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    expires,
  });
  return response;
}

export async function clearSessionCookie() {
  const response = NextResponse.next();
  response.cookies.set('session', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    expires: new Date(0),
    path: '/',
  });
  return response;
}
