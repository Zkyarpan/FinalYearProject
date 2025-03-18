import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import jwt from 'jsonwebtoken';
import { createErrorResponse } from '@/lib/response';
import connectDB from '@/db/db';
import Psychologist from '@/models/Psychologist';

export interface TokenPayload extends jwt.JwtPayload {
  id: string;
  role: string;
  email?: string;
}

export const getTokenFromRequest = (req: NextRequest) => {
  const tokenFromCookie = req.cookies.get('accessToken')?.value;

  const authHeader = req.headers.get('Authorization');
  const tokenFromHeader = authHeader?.startsWith('Bearer ')
    ? authHeader.replace('Bearer ', '')
    : authHeader;

  const token = tokenFromCookie || tokenFromHeader;
  if (!token) return null;

  try {
    if (token.includes('.') && token.length > 40) {
      return jwt.verify(token, process.env.JWT_SECRET!) as TokenPayload;
    } else if (/^[0-9a-fA-F]{24}$/.test(token)) {
      return {
        id: token,
        role: 'user', // Default role
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 3600,
      } as TokenPayload;
    }

    return null;
  } catch {
    return null;
  }
};

export async function withAuth(
  handler: Function,
  req: NextRequest,
  allowedRoles: string[] = ['user', 'psychologist', 'admin']
) {
  try {
    const token = getTokenFromRequest(req);

    if (!token) {
      return NextResponse.json(
        createErrorResponse(401, 'Authentication required'),
        { status: 401 }
      );
    }

    const tokenPayload = token as TokenPayload;
    const userRole = tokenPayload.role;

    if (!allowedRoles.includes(userRole)) {
      const roleMessages: Record<string, string> = {
        user: 'This area is restricted to psychologists only',
        psychologist: 'This area is restricted to users only',
        admin: 'This area is restricted to administrators only',
      };

      return NextResponse.json(
        createErrorResponse(403, roleMessages[userRole] || 'Access denied'),
        { status: 403 }
      );
    }

    if (
      userRole === 'psychologist' &&
      !req.nextUrl.pathname.includes('/dashboard/pending') &&
      !req.nextUrl.pathname.includes('/api/psychologist/status')
    ) {
      try {
        await connectDB();
        const psychologist = await Psychologist.findById(
          tokenPayload.id
        ).select('approvalStatus');

        if (psychologist && psychologist.approvalStatus !== 'approved') {
          return NextResponse.json(
            createErrorResponse(403, 'Your account has not been approved yet'),
            { status: 403 }
          );
        }
      } catch (err) {
        console.error('Error checking psychologist approval status:', err);
      }
    }

    return handler(req, tokenPayload);
  } catch (error) {
    console.error('Auth error:', error);
    return NextResponse.json(
      createErrorResponse(401, 'Authentication failed'),
      { status: 401 }
    );
  }
}
