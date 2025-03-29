'use server';

import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/db/db';
import User from '@/models/User';
import Profile from '@/models/Profile';
import Psychologist from '@/models/Psychologist';
import { createSuccessResponse, createErrorResponse } from '@/lib/response';
import { withAuth } from '@/middleware/authMiddleware';

// Define interfaces to match MongoDB models
interface UserDocument {
  _id: string;
  email: string;
  role: 'user' | 'admin' | 'psychologist';
  isActive: boolean;
  createdAt: string;
  [key: string]: any;
}

interface ProfileDocument {
  _id: string;
  user: string;
  firstName: string;
  lastName: string;
  image: string;
  phone?: string;
  age?: number;
  gender?: string;
  briefBio?: string;
  [key: string]: any;
}

interface PsychologistDocument {
  _id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  fullName?: string;
  approvalStatus?: 'pending' | 'approved' | 'rejected';
  profilePhotoUrl?: string;
  [key: string]: any;
}

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  return withAuth(
    async (req: NextRequest, token: any) => {
      try {
        await connectDB();

        const userId = params.id;

        // Get basic user data
        const user = await User.findById(userId)
          .select('email role isActive createdAt')
          .lean();

        if (!user) {
          return NextResponse.json(createErrorResponse(404, 'User not found'), {
            status: 404,
          });
        }

        // Type assertion to avoid TypeScript errors
        const typedUser = user as unknown as UserDocument;

        // Get profile data if exists
        const profile = await Profile.findOne({ user: userId }).lean();
        const typedProfile = profile as ProfileDocument | null;

        // If user is a psychologist, get psychologist data
        let psychologistData: any = null;
        if (typedUser.role === 'psychologist') {
          psychologistData = await Psychologist.findOne({
            email: typedUser.email,
          })
            .select(
              'email fullName country city streetAddress about ' +
                'licenseNumber licenseType profilePhotoUrl certificateOrLicenseUrl ' +
                'approvalStatus adminFeedback education specializations yearsOfExperience ' +
                'languages sessionDuration sessionFee sessionFormats acceptsInsurance ' +
                'insuranceProviders acceptingNewClients ageGroups'
            )
            .lean();
        }
        const typedPsychologistData =
          psychologistData as PsychologistDocument | null;

        // Build response object with careful null handling
        const enrichedUser = {
          _id: typedUser._id,
          email: typedUser.email,
          role: typedUser.role,
          isActive: typedUser.isActive,
          createdAt: typedUser.createdAt,
          profileData: typedProfile || null,
          psychologistData: typedPsychologistData || null,
          firstName:
            typedProfile?.firstName ||
            typedPsychologistData?.firstName ||
            'undefined',
          lastName:
            typedProfile?.lastName ||
            typedPsychologistData?.lastName ||
            'undefined',
          displayName: typedProfile
            ? `${typedProfile.firstName} ${typedProfile.lastName}`
            : typedPsychologistData?.fullName || 'undefined undefined',
          profileImage:
            typedProfile?.image ||
            typedPsychologistData?.profilePhotoUrl ||
            null,
        };

        return NextResponse.json(
          createSuccessResponse(200, { user: enrichedUser }),
          { status: 200 }
        );
      } catch (error: any) {
        console.error('Error fetching user details:', error);
        return NextResponse.json(
          createErrorResponse(500, error.message || 'Internal Server Error'),
          { status: 500 }
        );
      }
    },
    req,
    ['admin']
  );
}

// Handle status updates for a specific user
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  return withAuth(
    async (req: NextRequest, token: any) => {
      try {
        await connectDB();

        const userId = params.id;
        const { isActive } = await req.json();

        if (typeof isActive !== 'boolean') {
          return NextResponse.json(
            createErrorResponse(400, 'isActive must be a boolean value'),
            { status: 400 }
          );
        }

        const user = await User.findByIdAndUpdate(
          userId,
          { isActive },
          { new: true }
        ).select('email role isActive');

        if (!user) {
          return NextResponse.json(createErrorResponse(404, 'User not found'), {
            status: 404,
          });
        }

        return NextResponse.json(
          createSuccessResponse(200, {
            message: `User ${isActive ? 'activated' : 'deactivated'} successfully`,
            user,
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
    ['admin']
  );
}

// For psychologist approval
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  return withAuth(
    async (req: NextRequest, token: any) => {
      try {
        await connectDB();

        const userId = params.id;
        const { action, feedback } = await req.json();

        // Get the user to check if they're a psychologist and get their email
        const user = await User.findById(userId).select('email role');

        if (!user) {
          return NextResponse.json(createErrorResponse(404, 'User not found'), {
            status: 404,
          });
        }

        const typedUser = user as UserDocument;

        if (typedUser.role !== 'psychologist') {
          return NextResponse.json(
            createErrorResponse(400, 'User is not a psychologist'),
            { status: 400 }
          );
        }

        // Update psychologist approval status
        if (action === 'approve' || action === 'reject') {
          const updateData: any = {
            approvalStatus: action === 'approve' ? 'approved' : 'rejected',
            adminFeedback: feedback || undefined,
          };

          if (action === 'approve') {
            updateData.approvedAt = new Date();
          } else {
            updateData.rejectedAt = new Date();
          }

          const psychologist = await Psychologist.findOneAndUpdate(
            { email: typedUser.email },
            updateData,
            { new: true }
          ).select('email approvalStatus adminFeedback');

          if (!psychologist) {
            return NextResponse.json(
              createErrorResponse(404, 'Psychologist record not found'),
              { status: 404 }
            );
          }

          return NextResponse.json(
            createSuccessResponse(200, {
              message: `Psychologist ${action === 'approve' ? 'approved' : 'rejected'} successfully`,
              psychologist,
            }),
            { status: 200 }
          );
        } else {
          return NextResponse.json(
            createErrorResponse(
              400,
              'Invalid action. Must be "approve" or "reject"'
            ),
            { status: 400 }
          );
        }
      } catch (error: any) {
        console.error('Error processing psychologist action:', error);
        return NextResponse.json(
          createErrorResponse(500, error.message || 'Internal Server Error'),
          { status: 500 }
        );
      }
    },
    req,
    ['admin']
  );
}
