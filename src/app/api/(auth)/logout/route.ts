'use server';

import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const response = NextResponse.json({
    success: true,
    message: 'Logged out successfully',
  });

  response.cookies.delete('accessToken');
  response.cookies.delete('refreshToken');

  return response;
}
