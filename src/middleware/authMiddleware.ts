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

    const tokenPayload = token as jwt.JwtPayload;
    const userRole = tokenPayload.role;

    if (!allowedRoles.includes(userRole)) {
      const roleMessages = {
        user: 'This area is restricted to psychologists only',
        psychologist: 'This area is restricted to users only',
        admin: 'This area is restricted to administrators only',
      };

      return NextResponse.json(
        createErrorResponse(
          403,
          roleMessages[userRole as keyof typeof roleMessages] || 'Access denied'
        ),
        { status: 403 }
      );
    }

    return handler(req, token);
  } catch (error) {
    return NextResponse.json(
      createErrorResponse(401, 'Authentication failed'),
      { status: 401 }
    );
  }
}
