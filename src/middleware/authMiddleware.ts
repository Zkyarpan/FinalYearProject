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

    // Log token information for debugging
    console.log('Token information:', {
      id: tokenPayload.id,
      role: tokenPayload.role,
      url: req.nextUrl.pathname,
    });

    // FIX: Correctly handle user dashboard access for all authenticated users
    if (req.nextUrl.pathname === '/api/dashboard/user' && token) {
      // Allow access to user dashboard regardless of role
      const normalizedToken = {
        ...tokenPayload,
        _id: tokenPayload.id, // Add _id field for backward compatibility
      };
      return handler(req, normalizedToken);
    }

    // Check if the user's role is included in the allowed roles for this route
    if (!allowedRoles.includes(userRole)) {
      // FIX: Improved error messages that clearly state which roles are allowed
      const allowedRolesText = allowedRoles.join(', ');
      const errorMessage = `Access denied. This area is restricted to ${allowedRolesText} only.`;

      return NextResponse.json(createErrorResponse(403, errorMessage), {
        status: 403,
      });
    }

    // Additional check for psychologists to ensure they're approved
    if (
      userRole === 'psychologist' &&
      !req.nextUrl.pathname.includes('/dashboard/pending') &&
      !req.nextUrl.pathname.includes('/api/psychologist/status') &&
      !req.nextUrl.pathname.includes('/api/dashboard/user') // FIX: Allow psychologists to access user dashboard
    ) {
      try {
        await connectDB();
        const psychologist = await Psychologist.findOne({
          $or: [{ userId: tokenPayload.id }, { _id: tokenPayload.id }],
        }).select('approvalStatus');

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

    // FIX: Create a normalized token object that has both id and _id properties
    const normalizedToken = {
      ...tokenPayload,
      _id: tokenPayload.id, // Add _id field for backward compatibility
    };

    return handler(req, normalizedToken);
  } catch (error) {
    console.error('Auth error:', error);
    return NextResponse.json(
      createErrorResponse(401, 'Authentication failed'),
      { status: 401 }
    );
  }
}
