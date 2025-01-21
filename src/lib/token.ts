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
  hashedPassword?: string;
  profileComplete?: boolean;
  exp?: number;
  iat?: number;
};

export async function encrypt(
  payload: TokenPayload,
  expiresIn: string = '24h'
): Promise<string> {
  try {
    // Clean undefined values from payload
    const cleanPayload = Object.fromEntries(
      Object.entries(payload).filter(([_, v]) => v !== undefined)
    );

    const token = await new SignJWT(cleanPayload)
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime(expiresIn)
      .sign(key);

    return token;
  } catch (error) {
    console.error('Token encryption error:', error);
    throw new Error('Failed to create token');
  }
}

export async function decrypt(token: string): Promise<TokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, key, {
      algorithms: ['HS256'],
    });

    return payload as TokenPayload;
  } catch (error) {
    console.error('Token decryption error:', error);
    return null;
  }
}

export async function setSessionCookie(token: string, expires: Date) {
  try {
    const response = NextResponse.next();
    response.cookies.set('session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax', // Changed to 'lax' for better compatibility
      expires,
      path: '/', // Added path for consistency
    });
    return response;
  } catch (error) {
    console.error('Error setting session cookie:', error);
    throw new Error('Failed to set session cookie');
  }
}

export async function clearSessionCookie() {
  try {
    const response = NextResponse.next();
    response.cookies.set('session', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      expires: new Date(0),
      path: '/',
    });
    return response;
  } catch (error) {
    console.error('Error clearing session cookie:', error);
    throw new Error('Failed to clear session cookie');
  }
}

// Added utility functions that might be useful

export async function validateToken(token: string): Promise<boolean> {
  try {
    const payload = await decrypt(token);
    if (!payload) return false;

    const now = Math.floor(Date.now() / 1000);
    return payload.exp ? payload.exp > now : false;
  } catch {
    return false;
  }
}

export async function getTokenExpirationDate(
  expiresIn: string = '24h'
): Promise<Date> {
  const now = new Date();
  const duration = expiresIn.match(/^(\d+)([hdm])$/);

  if (!duration) {
    throw new Error(
      'Invalid expiration format. Use format like "24h", "30m", "7d"'
    );
  }

  const [_, amount, unit] = duration;
  const value = parseInt(amount);

  switch (unit) {
    case 'h':
      return new Date(now.getTime() + value * 60 * 60 * 1000);
    case 'd':
      return new Date(now.getTime() + value * 24 * 60 * 60 * 1000);
    case 'm':
      return new Date(now.getTime() + value * 60 * 1000);
    default:
      return new Date(now.getTime() + 24 * 60 * 60 * 1000); // Default 24 hours
  }
}
