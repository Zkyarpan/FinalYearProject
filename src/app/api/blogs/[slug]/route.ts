'use server';

import { NextRequest, NextResponse } from 'next/server';
import { Types } from 'mongoose';
import connectDB from '@/db/db';
import Blog from '@/models/Blogs';
import Profile from '@/models/Profile';
import { createErrorResponse, createSuccessResponse } from '@/lib/response';
import { deleteFromCloudinary, uploadToCloudinary } from '@/utils/fileUpload';

// Define interfaces for type safety
interface BlogDocument {
  _id: Types.ObjectId;
  title: string;
  content: string;
  blogImage: string;
  category: string;
  tags: string[];
  readTime: number;
  publishDate: Date;
  author: {
    _id: Types.ObjectId;
    username: string;
  };
}

interface ProfileDocument {
  firstName: string;
  lastName: string;
  image: string;
  user: Types.ObjectId;
}

interface FormattedBlog {
  _id: string;
  title: string;
  content: string;
  blogImage: string;
  category: string;
  tags: string[];
  readTime: number;
  author: {
    name: string;
    avatar: string;
  };
  publishDate: string;
}

export async function GET(req: NextRequest) {
  try {
    await connectDB();

    const slug = req.nextUrl.pathname.split('/').pop();

    if (!slug) {
      return NextResponse.json(
        createErrorResponse(400, 'Blog slug is required'),
        {
          status: 400,
        }
      );
    }

    const titleFromSlug = decodeURIComponent(slug).replace(/-/g, ' ');

    const blog = (await Blog.findOne({
      title: { $regex: new RegExp(`^${titleFromSlug}$`, 'i') },
    })
      .populate('author', 'username')
      .lean()) as BlogDocument | null;

    if (!blog) {
      return NextResponse.json(
        createErrorResponse(404, 'Blog post not found'),
        {
          status: 404,
        }
      );
    }

    const profile = (await Profile.findOne({
      user: blog.author._id,
    }).lean()) as ProfileDocument | null;

    const formattedBlog: FormattedBlog = {
      _id: blog._id.toString(),
      title: blog.title,
      content: blog.content,
      blogImage: blog.blogImage,
      category: blog.category,
      tags: blog.tags || [],
      readTime: blog.readTime,
      author: {
        name: profile
          ? `${profile.firstName} ${profile.lastName}`
          : blog.author.username || 'Anonymous',
        avatar: profile?.image || '/default-avatar.jpg',
      },
      publishDate: new Date(blog.publishDate).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }),
    };

    return NextResponse.json(
      createSuccessResponse(200, {
        message: 'Blog Fetch Successful',
        blog: formattedBlog,
      }),
      {
        status: 200,
      }
    );
  } catch (error) {
    return NextResponse.json(
      createErrorResponse(500, 'Internal Server Error'),
      {
        status: 500,
      }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    await connectDB();

    const titleFromSlug = await params.slug.replace(/-/g, ' ');
    const blog = await Blog.findOne({
      title: { $regex: new RegExp(`^${titleFromSlug}$`, 'i') },
    });

    if (!blog) {
      return NextResponse.json(createErrorResponse(404, 'Blog not found'), {
        status: 404,
      });
    }

    const formData = await req.formData();
    const updateData: any = {};
    let imageFile: any = null;

    for (const [key, value] of formData.entries()) {
      if (key === 'blogImage' && value instanceof Blob) {
        const timestamp = Date.now();
        imageFile = {
          buffer: Buffer.from(await value.arrayBuffer()),
          filename: `blog-${blog._id}-${timestamp}`,
          mimetype: value.type,
        };
      } else {
        updateData[key] = value;
      }
    }

    if (imageFile) {
      try {
        if (blog.blogImage) {
          const publicIdMatch = blog.blogImage.match(
            /photos\/blog-images\/([^.]+)/
          );
          const oldPublicId = publicIdMatch ? publicIdMatch[1] : null;

          if (oldPublicId) {
            try {
              await deleteFromCloudinary(`photos/blog-images/${oldPublicId}`);
            } catch (deleteError) {
              console.error('Error deleting old image:', deleteError);
            }
          }
        }

        const newImageUrl = await uploadToCloudinary({
          fileBuffer: imageFile.buffer,
          folder: 'photos/blog-images',
          filename: imageFile.filename,
          mimetype: imageFile.mimetype,
        });

        updateData.blogImage = newImageUrl;
      } catch (uploadError) {
        console.error('Image upload error:', uploadError);
        return NextResponse.json(
          createErrorResponse(400, 'Failed to upload image'),
          { status: 400 }
        );
      }
    }

    const updatedBlog = await Blog.findByIdAndUpdate(
      blog._id,
      { $set: { ...updateData, updatedAt: new Date() } },
      { new: true, runValidators: true }
    ).exec();

    if (!updatedBlog) {
      return NextResponse.json(
        createErrorResponse(404, 'Failed to update blog'),
        { status: 404 }
      );
    }

    return NextResponse.json(
      createSuccessResponse(200, {
        message: 'Blog updated successfully',
        blog: updatedBlog,
      }),
      { status: 200 }
    );
  } catch (error) {
    console.error('Server Error:', error);
    return NextResponse.json(
      createErrorResponse(500, 'Internal Server Error'),
      { status: 500 }
    );
  }
}
