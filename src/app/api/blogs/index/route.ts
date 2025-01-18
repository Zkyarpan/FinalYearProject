'use server';

import { NextResponse } from 'next/server';
import connectDB from '@/db/db';
import Blog from '@/models/Blogs';
import Profile from '@/models/Profile';
import { createErrorResponse, createSuccessResponse } from '@/lib/response';

export async function GET() {
  try {
    await connectDB();

    const blogs = await Blog.find()
      .select(
        'title content blogImage author category tags publishDate readTime'
      )
      .populate('author', 'username')
      .sort({ publishDate: -1 })
      .lean();

    if (!blogs || blogs.length === 0) {
      return NextResponse.json(createSuccessResponse(200, { blogs: [] }));
    }

    const authorIds = blogs.map(blog => blog.author?._id).filter(Boolean);

    const profiles = await Profile.find({
      user: { $in: authorIds },
    }).lean();

    const profileMap = new Map(
      profiles.map(profile => [profile.user.toString(), profile])
    );

    const formattedBlogs = blogs.map((blog: any) => {
      const authorId = blog.author?._id.toString();
      const authorProfile = profileMap.get(authorId);

      return {
        _id: blog._id.toString(),
        title: blog.title,
        content: blog.content,
        blogImage: blog.blogImage,
        category: blog.category,
        tags: blog.tags,
        readTime: blog.readTime,
        author: {
          name: authorProfile
            ? `${authorProfile.firstName} ${authorProfile.lastName}`
            : blog.author.username || 'Anonymous',
          avatar: authorProfile?.image || '/default-avatar.jpg',
        },
        publishDate: new Date(blog.publishDate).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        }),
      };
    });

    return NextResponse.json(
      createSuccessResponse(200, { blogs: formattedBlogs })
    );
  } catch (error) {
    console.error('Failed to fetch blogs:', error);
    return NextResponse.json(createErrorResponse(500, 'Failed to fetch blogs'));
  }
}
