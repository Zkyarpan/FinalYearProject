'use server';

import { NextResponse } from 'next/server';
import connectDB from '@/db/db';
import Blog from '@/models/Blogs';
import { createErrorResponse, createSuccessResponse } from '@/lib/response';

export async function GET() {
  try {
    await connectDB();
    // const blogs = await Blog.find({}).sort({ publishDate: -1 });
    const blogs = await Blog.find({ isPublished: true })
      .populate('author', 'name avatar') // Populate author details
      .sort({ publishDate: -1 })
      .lean();

    const formattedBlogs = blogs.map((blog: any) => ({
      _id: blog._id.toString(),
      title: blog.title,
      content: blog.content,
      blogImage: blog.blogImage,
      author: {
        name: blog.author.name || 'Anonymous',
        avatar: blog.author.avatar || '/default-avatar.jpg',
      },
      publishDate: new Date(blog.publishDate).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }),
    }));

    return NextResponse.json(
      createSuccessResponse(201, {
        message: 'Blog Fetch Successful',
        blogsData: formattedBlogs,
      }),
      { status: 201 }
    );
  } catch (error) {
    console.error('Failed to fetch blogs:', error);
    return NextResponse.json(
      createErrorResponse(500, 'Internal Server Error'),
      {
        status: 500,
      }
    );
  }
}
