'use server';

import { NextRequest, NextResponse } from 'next/server';
import { Types } from 'mongoose';
import connectDB from '@/db/db';
import Blog from '@/models/Blogs';
import { createErrorResponse, createSuccessResponse } from '@/lib/response';
import { deleteFromCloudinary } from '@/utils/fileUpload';

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();

    if (!Types.ObjectId.isValid(params.id)) {
      return NextResponse.json(
        createErrorResponse(400, 'Invalid blog ID format'),
        { status: 400 }
      );
    }

    const authHeader = req.headers.get('authorization');
    const userId = authHeader ? authHeader.split(' ')[1] : null;

    if (!userId) {
      return NextResponse.json(
        createErrorResponse(401, 'Authentication required'),
        { status: 401 }
      );
    }

    const blog = await Blog.findById(params.id).select('blogImage author');

    if (!blog) {
      return NextResponse.json(createErrorResponse(404, 'Blog not found'), {
        status: 404,
      });
    }

    if (blog.author.toString() !== userId) {
      return NextResponse.json(
        createErrorResponse(403, 'Not authorized to delete this blog'),
        { status: 403 }
      );
    }

    if (blog.blogImage) {
      const publicIdMatch = blog.blogImage.match(
        /photos\/blog-images\/([^.]+)/
      );
      if (publicIdMatch?.[1]) {
        try {
          await deleteFromCloudinary(`photos/blog-images/${publicIdMatch[1]}`);
          console.log('Blog image deleted from Cloudinary');
        } catch (error) {
          console.error('Failed to delete image from Cloudinary:', error);
        }
      }
    }

    await Blog.findByIdAndDelete(params.id);

    return NextResponse.json(
      createSuccessResponse(200, {
        message: 'Blog deleted successfully',
        blogId: params.id,
      })
    );
  } catch (error) {
    console.error('Delete operation failed:', error);
    return NextResponse.json(
      createErrorResponse(500, 'Failed to delete blog'),
      { status: 500 }
    );
  }
}
