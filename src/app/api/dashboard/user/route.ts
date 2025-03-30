'use server';

import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/db/db';
import User from '@/models/User';
import Profile from '@/models/Profile';
import Psychologist from '@/models/Psychologist';
import { createSuccessResponse, createErrorResponse } from '@/lib/response';
import { withAuth } from '@/middleware/authMiddleware';
import { Types } from 'mongoose';

interface MongoUser {
  _id: Types.ObjectId;
  email: string;
  role: string;
  isActive: boolean;
  isVerified: boolean;
  createdAt: Date;
  firstName?: string;
  lastName?: string;
  // Add other fields as needed
}

export async function GET(req: NextRequest) {
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

        // Parse query parameters
        const searchParams = req.nextUrl.searchParams;
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '10');
        const search = searchParams.get('search') || '';
        const role = searchParams.get('role') || 'all';
        const status = searchParams.get('status') || 'all';

        // Build query
        const query: any = {};

        // Add search condition
        if (search) {
          query.$or = [{ email: { $regex: search, $options: 'i' } }];
        }

        // Add role filter
        if (role && role !== 'all') {
          query.role = role;
        }

        // Add status filter
        if (status && status !== 'all') {
          query.isActive = status === 'active';
        }

        // Calculate pagination
        const skip = (page - 1) * limit;

        // Get total count for pagination
        const totalUsers = await User.countDocuments(query);
        const totalPages = Math.ceil(totalUsers / limit);

        // Get users with pagination
        const users = await User.find(query)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .lean<MongoUser[]>();

        // Get profiles and psychologist data
        const userIds = users.map(user => user._id);

        const [profiles, psychologists] = await Promise.all([
          Profile.find({ user: { $in: userIds } }).lean(),
          Psychologist.find({ userId: { $in: userIds } }).lean(),
        ]);

        // Create a map for quick lookups
        const profileMap = new Map();
        profiles.forEach(profile => {
          profileMap.set(profile.user.toString(), profile);
        });

        const psychologistMap = new Map();
        psychologists.forEach(psych => {
          if (psych.userId) {
            psychologistMap.set(psych.userId.toString(), psych);
          } else if (psych.email) {
            // Try to find by email if userId is not available
            const matchingUser = users.find(
              user => user.email === psych.email
            ) as MongoUser | undefined;

            if (matchingUser) {
              // Now TypeScript knows matchingUser._id exists
              psychologistMap.set(matchingUser._id.toString(), psych);
            }
          }
        });

        // Enhance user data with profile and psychologist information
        const enhancedUsers = users.map(user => {
          const userId = user._id.toString();
          const profile = profileMap.get(userId);
          const psychologist = psychologistMap.get(userId);

          // Set display name based on available data
          let displayName = '';

          if (profile && profile.firstName && profile.lastName) {
            displayName = `${profile.firstName} ${profile.lastName}`;
            user.firstName = profile.firstName;
            user.lastName = profile.lastName;
          } else if (psychologist) {
            if (psychologist.firstName && psychologist.lastName) {
              displayName = `${psychologist.firstName} ${psychologist.lastName}`;
              user.firstName = psychologist.firstName;
              user.lastName = psychologist.lastName;
            } else if (psychologist.fullName) {
              displayName = psychologist.fullName;
            }
          }

          if (!displayName) {
            // Extract name from email as fallback
            displayName = user.email.split('@')[0];
          }

          return {
            ...user,
            displayName,
            profileData: profile || null,
            psychologistData: psychologist || null,
            profileImage: profile?.image || null,
            psychologistImage: psychologist?.profilePhotoUrl || null,
          };
        });

        return NextResponse.json(
          createSuccessResponse(200, {
            users: enhancedUsers,
            totalUsers,
            totalPages,
            currentPage: page,
          }),
          { status: 200 }
        );
      } catch (error: any) {
        console.error('Error fetching users:', error);
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

// Handle specific user operations
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
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

        const userId = params.id;
        const { isActive } = await req.json();

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
            user: updatedUser,
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

// Handle user deletion
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
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

        const userId = params.id;

        // Find and delete the user
        const deletedUser = await User.findByIdAndDelete(userId);

        if (!deletedUser) {
          return NextResponse.json(createErrorResponse(404, 'User not found'), {
            status: 404,
          });
        }

        // Also clean up related data (optional, can be adjusted based on business logic)
        await Profile.deleteOne({ user: userId });

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

// Handle psychologist approval/rejection
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
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

        const userId = params.id;
        const { action, feedback } = await req.json();

        // First get the user to check if they're a psychologist
        const user = await User.findById(userId);

        if (!user) {
          return NextResponse.json(createErrorResponse(404, 'User not found'), {
            status: 404,
          });
        }

        if (user.role !== 'psychologist') {
          return NextResponse.json(
            createErrorResponse(400, 'User is not a psychologist'),
            { status: 400 }
          );
        }

        // Find and update the psychologist record
        let psychologist = await Psychologist.findOne({ userId });

        if (!psychologist) {
          // Try to find by email if userId is not available
          const psychByEmail = await Psychologist.findOne({
            email: user.email,
          });

          if (!psychByEmail) {
            return NextResponse.json(
              createErrorResponse(404, 'Psychologist record not found'),
              { status: 404 }
            );
          }

          // Update the record with the userId for future lookups
          psychByEmail.userId = new Types.ObjectId(userId);
          psychologist = psychByEmail;
        }

        // Update approval status
        psychologist.approvalStatus =
          action === 'approve' ? 'approved' : 'rejected';
        psychologist.adminFeedback = feedback || '';

        if (action === 'approve') {
          psychologist.approvedAt = new Date();
        } else {
          psychologist.rejectedAt = new Date();
        }

        await psychologist.save();

        return NextResponse.json(
          createSuccessResponse(200, {
            message: `Psychologist ${action === 'approve' ? 'approved' : 'rejected'} successfully`,
            psychologist,
          }),
          { status: 200 }
        );
      } catch (error: any) {
        console.error('Error updating psychologist approval:', error);
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
