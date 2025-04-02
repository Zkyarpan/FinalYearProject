import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import connectDB from '@/db/db';
import { createSuccessResponse, createErrorResponse } from '@/lib/response';
import { withAuth } from '@/middleware/authMiddleware';
import Setting from '@/models/Setting';

export async function PUT(req: NextRequest) {
  return withAuth(
    async (req: NextRequest, token: any) => {
      try {
        await connectDB();

        // Check if user is admin
        if (token.role !== 'admin') {
          return NextResponse.json(
            createErrorResponse(
              403,
              'Access denied. Admin privileges required.'
            ),
            { status: 403 }
          );
        }

        // Get request data
        const data = await req.json();

        // Update or create email settings
        await Setting.findOneAndUpdate(
          { category: 'email' },
          {
            category: 'email',
            settings: data,
            updatedBy: token.userId,
          },
          { upsert: true, new: true }
        );

        return NextResponse.json(
          createSuccessResponse(200, {
            message: 'Email settings updated successfully',
          }),
          { status: 200 }
        );
      } catch (error: any) {
        console.error('Error updating email settings:', error);
        return NextResponse.json(
          createErrorResponse(500, error.message || 'Internal Server Error'),
          { status: 500 }
        );
      }
    },
    req,
    ['admin'] // Only allow admins
  );
}
