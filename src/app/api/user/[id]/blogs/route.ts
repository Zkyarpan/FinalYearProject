'use server';

import { NextRequest, NextResponse } from 'next/server';
import { Types } from 'mongoose';
import connectDB from '@/db/db';
import Blog from '@/models/Blogs';
import User from '@/models/User';
import { createErrorResponse, createSuccessResponse } from '@/lib/response';

interface BlogResponse {
  _id: string;
  title: string;
  content: string;
  blogImage: string;
  category: string;
  tags: string[];
  readTime: number;
  publishDate: string;
  isOwner: boolean;
}

export async function GET(req: NextRequest) {
  try {
    await connectDB();

    // Extract the userId from the URL
    // URL pattern: /api/user/[userId]/blogs
    const segments = req.nextUrl.pathname.split('/');
    const userId = segments[segments.length - 2]; // The userId is the second-to-last segment

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

    // Get the user's blogs that are published
    const blogs = await Blog.find({
      author: userId,
      isPublished: true,
    })
      .sort({ publishDate: -1 })
      .lean();

    // Get the current user's ID for determining ownership
    const authHeader = req.headers.get('authorization');
    const currentUserId = authHeader ? authHeader.split(' ')[1] : null;

    // Format blogs for response
    const formattedBlogs: BlogResponse[] = blogs.map(blog => {
      const blogObj = blog as any;
      return {
        _id: blogObj._id.toString(),
        title: blogObj.title,
        content: blogObj.content,
        blogImage: blogObj.blogImage || '',
        category: blogObj.category,
        tags: Array.isArray(blogObj.tags) ? blogObj.tags : [],
        readTime: blogObj.readTime,
        publishDate: new Date(blogObj.publishDate).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        }),
        isOwner: currentUserId
          ? blogObj.author.toString() === currentUserId
          : false,
      };
    });

    return NextResponse.json(
      createSuccessResponse(200, {
        message: 'User blogs fetch successful',
        blogs: formattedBlogs,
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
