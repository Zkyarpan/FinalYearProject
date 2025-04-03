'use server';

import { NextRequest, NextResponse } from 'next/server';
import { Types } from 'mongoose';
import connectDB from '@/db/db';
import User from '@/models/User';
import Profile from '@/models/Profile';
import Blog from '@/models/Blogs';
import Story from '@/models/Stories';
import { createErrorResponse, createSuccessResponse } from '@/lib/response';

interface UserProfileResponse {
  _id: string;
  userId: string;
  firstName: string;
  lastName: string;
  image: string;
  address?: string;
  phone: string;
  age: number;
  gender?: string;
  preferredCommunication: string;
  struggles: string[];
  briefBio: string;
  profileCompleted: boolean;
  createdAt: string;
  updatedAt: string;
  hasStories: boolean; // Flag to indicate if user has stories
  metricsOverview: {
    blogCount: number;
    commentCount: number;
    storiesCount: number;
    lastActive: string;
  };
}

export async function GET(req: NextRequest) {
  try {
    await connectDB();

    const userId = req.nextUrl.pathname.split('/').pop();

    if (!userId) {
      return NextResponse.json(
        createErrorResponse(400, 'User identifier is required'),
        { status: 400 }
      );
    }

    // Check if the userId is a valid ObjectId
    const isValidObjectId = /^[0-9a-fA-F]{24}$/.test(userId);

    if (!isValidObjectId) {
      return NextResponse.json(
        createErrorResponse(400, 'Invalid user identifier format'),
        { status: 400 }
      );
    }

    // Get the authenticated user (if available)
    const authHeader = req.headers.get('authorization');
    const currentUserId = authHeader ? authHeader.split(' ')[1] : null;
    const isOwnProfile = currentUserId === userId;

    // Get the user
    const user = await User.findById(userId).lean();

    if (!user) {
      return NextResponse.json(createErrorResponse(404, 'User not found'), {
        status: 404,
      });
    }

    // Get the user's profile
    const profileDoc = await Profile.findOne({ user: userId }).lean();

    if (!profileDoc) {
      return NextResponse.json(
        createErrorResponse(404, 'User profile not found'),
        { status: 404 }
      );
    }

    // Convert Mongoose document to a plain object that's safe to access
    const profile = profileDoc as any;
    const userId_str = (user as any)._id.toString();

    // Check if user has stories (only count them here, don't fetch them all)
    const storiesCount = await Story.countDocuments({ author: userId });

    // Get user metrics
    const blogCount = await Blog.countDocuments({
      author: userId,
      isPublished: true,
    });

    // Get comment count (assuming you have a Comment model or a comments field in blogs)
    let commentCount = 0;
    try {
      // This will depend on your data model. Using a placeholder approach here
      // commentCount = await Comment.countDocuments({ user: userId });

      // Alternative: count comments on user's blogs
      const blogs = await Blog.find({ author: userId }).lean();
      commentCount = blogs.reduce((total, blog) => {
        return total + (blog.comments?.length || 0);
      }, 0);
    } catch (err) {
      console.error('Error fetching comment count:', err);
      // Continue despite error in getting comment count
    }

    // Get last activity timestamp
    // This could be last login, last post, etc.
    const lastActive =
      (user as any).lastLogin || profile.updatedAt || profile.createdAt;

    // Format the response
    const formattedProfile: UserProfileResponse = {
      _id: profile._id.toString(),
      userId: userId_str,
      firstName: profile.firstName,
      lastName: profile.lastName,
      image: profile.image || '/default-avatar.jpg',
      address: profile.address,
      phone: profile.phone,
      age: profile.age,
      gender: profile.gender,
      preferredCommunication: profile.preferredCommunication,
      struggles: Array.isArray(profile.struggles) ? profile.struggles : [],
      briefBio: profile.briefBio,
      profileCompleted: profile.profileCompleted,
      createdAt: new Date(profile.createdAt).toISOString(),
      updatedAt: new Date(profile.updatedAt).toISOString(),
      hasStories: storiesCount > 0,
      metricsOverview: {
        blogCount,
        commentCount,
        storiesCount,
        lastActive: new Date(lastActive).toISOString(),
      },
    };

    return NextResponse.json(
      createSuccessResponse(200, {
        message: 'User profile fetch successful',
        profile: formattedProfile,
      }),
      { status: 200 }
    );
  } catch (error) {
    console.error('Server error:', error);

    if (error instanceof Error && error.name === 'CastError') {
      return NextResponse.json(
        createErrorResponse(400, 'Invalid user identifier format'),
        { status: 400 }
      );
    }

    return NextResponse.json(
      createErrorResponse(500, 'Internal Server Error'),
      { status: 500 }
    );
  }
}
