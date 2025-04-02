'use server';

import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/db/db';
import User from '@/models/User';
import Profile from '@/models/Profile';
import { createSuccessResponse, createErrorResponse } from '@/lib/response';
import { withAuth } from '@/middleware/authMiddleware';
import { Types } from 'mongoose';

// Get user by ID
export async function GET(
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
        const user = await User.findById(userId).lean();

        if (!user) {
          return NextResponse.json(createErrorResponse(404, 'User not found'), {
            status: 404,
          });
        }

        // Fetch profile
        const profile = await Profile.findOne({ user: userId }).lean();

        // Return user with profile
        return NextResponse.json(
          createSuccessResponse(200, {
            user: {
              ...user,
              profile: profile || null,
            },
          }),
          { status: 200 }
        );
      } catch (error: any) {
        console.error('Error fetching user:', error);
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

// Update user
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

        const { email, role, isActive, firstName, lastName } = await req.json();

        // Create update object
        const updateData: any = {};
        if (email) updateData.email = email;
        if (role) updateData.role = role;
        if (isActive !== undefined) updateData.isActive = isActive;

        // Update user
        const user = await User.findByIdAndUpdate(userId, updateData, {
          new: true,
        }).lean();

        if (!user) {
          return NextResponse.json(createErrorResponse(404, 'User not found'), {
            status: 404,
          });
        }

        // Update profile if needed
        let profile: any = null;
        if (firstName || lastName) {
          profile = await Profile.findOne({ user: userId });

          if (profile) {
            // Update existing profile
            if (firstName) profile.firstName = firstName;
            if (lastName) profile.lastName = lastName;
            await profile.save();
          } else if (firstName && lastName) {
            // Create new profile if both first and last name provided
            profile = await Profile.create({
              user: userId,
              firstName,
              lastName,
              image: '/default-avatar.jpg',
              phone: '',
              age: 0,
              emergencyContact: '',
              emergencyPhone: '',
              therapyHistory: 'no',
              preferredCommunication: 'video',
              struggles: [],
              briefBio: '',
              profileCompleted: false,
            });
          }
        }

        return NextResponse.json(
          createSuccessResponse(200, {
            message: 'User updated successfully',
            user: {
              ...user,
              profile: profile
                ? {
                    firstName: profile.firstName,
                    lastName: profile.lastName,
                    // Include other profile fields as needed
                  }
                : null,
            },
          }),
          { status: 200 }
        );
      } catch (error: any) {
        console.error('Error updating user:', error);
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

// Delete user
export async function DELETE(
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

        // Don't allow deleting the current admin
        if (userId === token.id) {
          return NextResponse.json(
            createErrorResponse(400, 'You cannot delete your own account'),
            { status: 400 }
          );
        }

        // Find and delete the user
        const deletedUser = await User.findByIdAndDelete(userId);

        if (!deletedUser) {
          return NextResponse.json(createErrorResponse(404, 'User not found'), {
            status: 404,
          });
        }

        // Also clean up related data
        await Profile.deleteOne({ user: userId });

        // Additional cleanup could be added here for other related models

        return NextResponse.json(
          createSuccessResponse(200, {
            message: 'User deleted successfully',
          }),
          { status: 200 }
        );
      } catch (error: any) {
        console.error('Error deleting user:', error);
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
