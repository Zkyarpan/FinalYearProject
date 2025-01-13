'use server';

import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const response = NextResponse.json({
    success: true,
    message: 'Logged out successfully',
  });

  
  response.cookies.set('accessToken', '', {
    expires: new Date(0),
    path: '/',
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'lax',
  });

  response.cookies.set('refreshToken', '', {
    expires: new Date(0),
    path: '/',
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'lax',
  });

  return response;
}
