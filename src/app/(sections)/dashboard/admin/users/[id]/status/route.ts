'use server';

import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/db/db';
import User from '@/models/User';
import { createSuccessResponse, createErrorResponse } from '@/lib/response';
import { withAuth } from '@/middleware/authMiddleware';
import { Types } from 'mongoose';

// Update user status (activate/deactivate)
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  return withAuth(
    async (req: NextRequest, token: any) => {
      try {
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

        await connectDB();
        const userId = params.id;

        // Validate ObjectId
        if (!Types.ObjectId.isValid(userId)) {
          return NextResponse.json(
            createErrorResponse(400, 'Invalid user ID format'),
            { status: 400 }
          );
        }

        // Don't allow deactivating the current admin
        if (userId === token.id) {
          return NextResponse.json(
            createErrorResponse(400, 'You cannot change your own status'),
            { status: 400 }
          );
        }

        const { isActive } = await req.json();

        if (isActive === undefined) {
          return NextResponse.json(
            createErrorResponse(400, 'isActive field is required'),
            { status: 400 }
          );
        }

        // Update user's active status
        const updatedUser = await User.findByIdAndUpdate(
          userId,
          { isActive },
          { new: true }
        );

        if (!updatedUser) {
          return NextResponse.json(createErrorResponse(404, 'User not found'), {
            status: 404,
          });
        }

        return NextResponse.json(
          createSuccessResponse(200, {
            message: `User ${isActive ? 'activated' : 'deactivated'} successfully`,
            user: {
              _id: updatedUser._id,
              email: updatedUser.email,
              role: updatedUser.role,
              isActive: updatedUser.isActive,
              isVerified: updatedUser.isVerified,
              createdAt: updatedUser.createdAt,
            },
          }),
          { status: 200 }
        );
      } catch (error: any) {
        console.error('Error updating user status:', error);
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
