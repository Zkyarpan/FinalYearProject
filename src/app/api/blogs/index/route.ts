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
      .sort({ publishDate: -1 })
      .lean();

    if (!blogs || blogs.length === 0) {
      return NextResponse.json(createSuccessResponse(200, { blogs: [] }));
    }

    const authorIds = blogs
      .map(blog => blog.author)
      .filter((id): id is string => !!id);

    const profiles = await Profile.find({
      user: { $in: authorIds },
    })
      .select('user firstName lastName image')
      .lean();

    const profileMap = new Map(
      profiles.map(profile => [profile.user.toString(), profile])
    );

    const formattedBlogs = blogs.map((blog: any) => {
      const authorId = blog.author?.toString();
      const authorProfile = authorId ? profileMap.get(authorId) : null;

      return {
        _id: blog._id.toString(),
        title: blog.title || 'Untitled',
        content: blog.content || '',
        blogImage: blog.blogImage || '/default-blog-image.jpg',
        category: blog.category || 'Uncategorized',
        tags: Array.isArray(blog.tags) ? blog.tags : [],
        readTime: blog.readTime || '1 min read',
        author: {
          _id: authorId || '',
          name: authorProfile
            ? `${authorProfile.firstName} ${authorProfile.lastName}`
            : 'Anonymous Author',
          avatar: authorProfile?.image || '/default-avatar.jpg',
        },
        publishDate: blog.publishDate
          ? new Date(blog.publishDate).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })
          : 'Date not available',
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
