'use server';

import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/db/db';
import User from '@/models/User';
import Profile from '@/models/Profile';
import Psychologist from '@/models/Psychologist';
import { createSuccessResponse, createErrorResponse } from '@/lib/response';
import { withAuth } from '@/middleware/authMiddleware';
import { Types } from 'mongoose';

// We'll use the lean() result types which are plain objects, not full Document instances
type UserLean = {
  _id: Types.ObjectId | string;
  email: string;
  role: 'admin' | 'psychologist' | 'user';
  isActive: boolean;
  createdAt: Date | string;
  updatedAt: Date | string;
  isVerified: boolean;
  // Other potential fields
  [key: string]: any;
};

type ProfileLean = {
  _id: Types.ObjectId | string;
  user: Types.ObjectId | string;
  firstName: string;
  lastName: string;
  image: string;
  address?: string;
  phone?: string;
  age?: number;
  gender?: string;
  briefBio?: string;
  // Other fields
  [key: string]: any;
};

type PsychologistLean = {
  _id: Types.ObjectId | string;
  email: string;
  firstName: string;
  lastName: string;
  fullName: string;
  approvalStatus: 'pending' | 'approved' | 'rejected';
  profilePhotoUrl?: string;
  // Other fields
  [key: string]: any;
};

export async function GET(req: NextRequest) {
  return withAuth(
    async (req: NextRequest, token: any) => {
      try {
        await connectDB();

        // Parse query parameters
        const url = new URL(req.url);
        const page = parseInt(url.searchParams.get('page') || '1');
        const limit = parseInt(url.searchParams.get('limit') || '10');
        const search = url.searchParams.get('search') || '';
        const role = url.searchParams.get('role') || '';
        const status = url.searchParams.get('status') || '';

        // Calculate pagination
        const skip = (page - 1) * limit;

        // Build search query
        let query: any = {};

        // Role filter
        if (role && role !== 'all') {
          query.role = role;
        }

        // Status filter
        if (status === 'active') {
          query.isActive = true;
        } else if (status === 'inactive') {
          query.isActive = false;
        }

        // Search filter (email only since firstName/lastName are in Profile)
        if (search) {
          query.email = { $regex: search, $options: 'i' };
        }

        // Fetch users with pagination
        const [users, totalUsers] = await Promise.all([
          User.find(query)
            .select('email role isActive createdAt')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean(),
          User.countDocuments(query),
        ]);

        // Get user IDs
        const userIds = users.map(user => user._id);

        // Fetch profiles for these users
        const profiles = await Profile.find({ user: { $in: userIds } })
          .select('user firstName lastName image phone age gender briefBio')
          .lean();

        // Create a map of user ID to profile
        const profileMap = profiles.reduce(
          (map, profile) => {
            map[profile.user.toString()] = profile as unknown as ProfileLean;
            return map;
          },
          {} as Record<string, ProfileLean>
        );

        // Fetch psychologist details for users with role='psychologist'
        const psychologistEmails = users
          .filter(user => user.role === 'psychologist')
          .map(user => user.email);

        const psychologists = await Psychologist.find({
          email: { $in: psychologistEmails },
        })
          .select(
            'email firstName lastName fullName approvalStatus profilePhotoUrl'
          )
          .lean();

        // Create a map of email to psychologist details
        const psychologistMap = psychologists.reduce(
          (map, psych) => {
            map[psych.email] = psych as unknown as PsychologistLean;
            return map;
          },
          {} as Record<string, PsychologistLean>
        );

        // Merge user data with profile and psychologist data
        const enrichedUsers = users.map((user: any) => {
          const profile = profileMap[user._id.toString()];
          const psychologist =
            user.role === 'psychologist' ? psychologistMap[user.email] : null;

          // Format exactly like the current response structure
          return {
            _id: user._id,
            email: user.email,
            role: user.role,
            isActive: user.isActive,
            createdAt: user.createdAt,
            profileData: profile || null,
            psychologistData: psychologist || null,
            displayName: profile
              ? `${profile.firstName} ${profile.lastName}`
              : psychologist?.fullName || 'undefined undefined',
            profileImage: profile?.image || null,
            psychologistImage: psychologist?.profilePhotoUrl || null,
          };
        });

        // Calculate total pages
        const totalPages = Math.ceil(totalUsers / limit);

        return NextResponse.json(
          createSuccessResponse(200, {
            users: enrichedUsers,
            currentPage: page,
            totalPages,
            totalUsers,
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
    ['admin']
  );
}

// Handle user status updates
export async function PATCH(req: NextRequest) {
  return withAuth(
    async (req: NextRequest, token: any) => {
      try {
        await connectDB();

        const { userId, isActive } = await req.json();

        if (!userId) {
          return NextResponse.json(
            createErrorResponse(400, 'User ID is required'),
            { status: 400 }
          );
        }

        const user = await User.findByIdAndUpdate(
          userId,
          { isActive: isActive },
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
