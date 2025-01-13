'use server';

import { decrypt } from '@/lib/token';
import { NextRequest, NextResponse } from 'next/server';
import { createErrorResponse } from '@/lib/response';

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer')) {
      return NextResponse.json({ error: 'No token provided' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    const decoded = await decrypt(token);

    if (!decoded) {
      return NextResponse.json(createErrorResponse(401, 'Invalid token'), {
        status: 401,
      });
    }

    return NextResponse.json({
      id: decoded.id,
      email: decoded.email,
      role: decoded.role,
      isVerified: decoded.isVerified,
    });
  } catch (error) {
    return NextResponse.json(createErrorResponse(401, 'Invalid token'), {
      status: 401,
    });
  }
}
