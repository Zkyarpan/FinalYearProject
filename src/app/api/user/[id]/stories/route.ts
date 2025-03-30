'use server';

import { NextRequest, NextResponse } from 'next/server';
import { Types } from 'mongoose';
import connectDB from '@/db/db';
import User from '@/models/User';
import Profile from '@/models/Profile';
import Story from '@/models/Stories';
import { createErrorResponse, createSuccessResponse } from '@/lib/response';

export async function GET(req: NextRequest) {
  try {
    await connectDB();

    const segments = req.nextUrl.pathname.split('/');
    const userId = segments[segments.length - 2]; // The ID is the second-to-last segment

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

    // Check if the target user exists
    const user = await User.findById(userId).lean();
    if (!user) {
      return NextResponse.json(createErrorResponse(404, 'User not found'), {
        status: 404,
      });
    }

    // For story privacy:
    // 1. If viewing own profile, return all stories
    // 2. If viewing someone else's profile, return only published/public stories
    const query = {
      author: userId,
      ...(isOwnProfile ? {} : { isPublished: true, privacy: 'public' }),
    };

    // Add pagination support
    const page = parseInt(req.nextUrl.searchParams.get('page') || '1');
    const limit = parseInt(req.nextUrl.searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;

    // Fetch stories with pagination
    const stories = await Story.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    // Get total count for pagination
    const totalCount = await Story.countDocuments(query);

    // Format the response with pagination details
    return NextResponse.json(
      createSuccessResponse(200, {
        message: 'Stories retrieved successfully',
        stories: stories.map((story: any) => ({
          _id: story._id.toString(),
          title: story.title,
          content: story.content,
          coverImage: story.coverImage || '',
          excerpt: story.excerpt || story.content.substring(0, 100) + '...',
          tags: story.tags || [],
          category: story.category || 'General',
          createdAt: story.createdAt,
          updatedAt: story.updatedAt,
          isPublished: story.isPublished,
          isOwnStory: isOwnProfile,
          privacy: story.privacy || 'public',
          readTime:
            story.readTime || Math.ceil(story.content.split(' ').length / 200), // Rough estimate
        })),
        pagination: {
          page,
          limit,
          totalItems: totalCount,
          totalPages: Math.ceil(totalCount / limit),
          hasMore: page < Math.ceil(totalCount / limit),
        },
        isOwnProfile,
      }),
      { status: 200 }
    );
  } catch (error) {
    console.error('Server error:', error);

    if (error instanceof Error && error.name === 'CastError') {
      return NextResponse.json(
        createErrorResponse(400, 'Invalid identifier format'),
        { status: 400 }
      );
    }

    return NextResponse.json(
      createErrorResponse(500, 'Internal Server Error'),
      { status: 500 }
    );
  }
}
