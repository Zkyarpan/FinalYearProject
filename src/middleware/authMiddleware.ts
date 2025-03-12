import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import jwt from 'jsonwebtoken';
import { createErrorResponse } from '@/lib/response';
import  connectDB  from '@/db/db';
import Psychologist from '@/models/Psychologist';

// Enhanced token payload type that maintains compatibility with existing code
export interface TokenPayload extends jwt.JwtPayload {
  id: string;
  role: string;
  email?: string;
}

export const getTokenFromRequest = (req: NextRequest) => {
  const token =
    req.cookies.get('accessToken')?.value ||
    req.headers.get('Authorization')?.replace('Bearer ', '');

  if (!token) return null;

  try {
    return jwt.verify(token, process.env.JWT_SECRET!) as TokenPayload;
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

    // For psychologists, check if they are approved (unless accessing pending dashboard)
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
        // Continue even if the check fails, to not block functionality
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

// Helper function to check if user is admin
export async function isAdmin(req: NextRequest): Promise<boolean> {
  try {
    const token = getTokenFromRequest(req) as TokenPayload;

    if (!token || token.role !== 'admin') {
      return false;
    }

    return true;
  } catch (error) {
    return false;
  }
}

// Higher-order function for admin-only routes that maintains compatibility with existing code
export function withAdminAuth(handler: Function) {
  return async (req: NextRequest) => {
    return withAuth(handler, req, ['admin']);
  };
}
