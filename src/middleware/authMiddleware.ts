'use server';

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import jwt from 'jsonwebtoken';
import { createErrorResponse } from '@/lib/response';

export const getTokenFromRequest = (req: NextRequest) => {
  const token = req.cookies.get('accessToken')?.value;

  if (!token) return null;

  try {
    return jwt.verify(token, process.env.JWT_SECRET!);
  } catch {
    return null;
  }
};

export async function withAuth(
  handler: Function,
  req: NextRequest,
  allowedRoles?: string[]
) {
  try {
    const token = getTokenFromRequest(req);

    if (!token) {
      return NextResponse.json(
        createErrorResponse(401, 'Authentication required'),
        { status: 401 }
      );
    }

    // Check role if specified
    if (
      allowedRoles &&
      typeof token !== 'string' &&
      !allowedRoles.includes((token as jwt.JwtPayload).role)
    ) {
      return NextResponse.json(
        createErrorResponse(403, 'Not authorized for this operation'),
        { status: 403 }
      );
    }

    // Add user to request for use in handler
    return handler(req, token);
  } catch (error) {
    return NextResponse.json(
      createErrorResponse(401, 'Authentication failed'),
      { status: 401 }
    );
  }
}
