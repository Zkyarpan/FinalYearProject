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

        // This route should be accessible by any authenticated user
        // Get user data based on the token
        const userId = token.id || token._id;

        // Fetch relevant user data
        const user = await User.findById(userId).lean();

        if (!user) {
          return NextResponse.json(createErrorResponse(404, 'User not found'), {
            status: 404,
          });
        }

        // Fetch profile data
        const profile = await Profile.findOne({ user: userId }).lean();

        // Create mock dashboard data for now (replace with actual data fetching)
        const dashboardData = {
          metrics: {
            profileCompletion: profile ? 80 : 20,
            totalBlogs: 0,
            publishedBlogs: 0,
            draftBlogs: 0,
            totalStories: 0,
            publishedStories: 0,
            totalAppointments: 0,
            upcomingAppointments: 0,
            completedAppointments: 0,
            activeConversations: 0,
          },
          wellnessData: {
            wellnessScore: 75,
            moodData: [
              { date: 'Mon', value: 70 },
              { date: 'Tue', value: 65 },
              { date: 'Wed', value: 75 },
              { date: 'Thu', value: 80 },
              { date: 'Fri', value: 85 },
            ],
            sleepData: [],
            mindfulnessData: [],
            stressLevel: 25,
            insights: [
              {
                title: 'Mood',
                value: 'Good',
                change: '+5%',
                status: 'improved',
              },
              {
                title: 'Sleep',
                value: '7h',
                change: '0%',
                status: 'stable',
              },
              {
                title: 'Focus',
                value: 'Med',
                change: '+10%',
                status: 'improved',
              },
            ],
          },
          recentActivities: [],
          nearestAppointments: [],
          recentConversations: [],
        };

        return NextResponse.json(createSuccessResponse(200, dashboardData), {
          status: 200,
        });
      } catch (error: any) {
        console.error('Error fetching dashboard data:', error);
        return NextResponse.json(
          createErrorResponse(500, error.message || 'Internal Server Error'),
          { status: 500 }
        );
      }
    },
    req,
    ['user', 'psychologist', 'admin'] // Allow all authenticated user types
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
