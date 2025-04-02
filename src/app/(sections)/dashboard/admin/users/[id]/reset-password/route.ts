'use server'

import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/db/db';
import User from '@/models/User';
import { createSuccessResponse, createErrorResponse } from '@/lib/response';
import { withAuth } from '@/middleware/authMiddleware';
import { Types } from 'mongoose';
import { randomBytes } from 'crypto';
import { hash } from 'bcryptjs';

// Reset user password
export async function POST(
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

        // Find user
        const user = await User.findById(userId);

        if (!user) {
          return NextResponse.json(createErrorResponse(404, 'User not found'), {
            status: 404,
          });
        }

        // Generate a temporary password
        const tempPassword = randomBytes(8).toString('hex');

        // Hash the temporary password
        const hashedPassword = await hash(tempPassword, 10);

        // Update user with new password
        user.password = hashedPassword;

        // Add a verification code (can be used for password reset flow)
        user.verificationCode = randomBytes(32).toString('hex');
        user.verificationCodeExpiry = new Date(
          Date.now() + 24 * 60 * 60 * 1000
        ); // 24 hours

        await user.save();

        // In a real app, send an email with the temporary password
        // and/or a password reset link using the verification code
        console.log(
          `Password reset for ${user.email}. Temporary password: ${tempPassword}`
        );

        // For security, don't return the temporary password in the response
        // In a real app, this would be sent via email
        return NextResponse.json(
          createSuccessResponse(200, {
            message: 'Password reset email sent successfully',
            // Include a note for development
            note: 'In development: Temporary password would be emailed to the user',
          }),
          { status: 200 }
        );
      } catch (error: any) {
        console.error('Error resetting user password:', error);
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
