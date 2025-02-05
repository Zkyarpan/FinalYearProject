'use server';

import { NextRequest, NextResponse } from 'next/server';
import { Types } from 'mongoose';
import connectDB from '@/db/db';
import Blog from '@/models/Blogs';
import Profile from '@/models/Profile';
import User from '@/models/User';
import { createErrorResponse, createSuccessResponse } from '@/lib/response';
import { deleteFromCloudinary, uploadToCloudinary } from '@/utils/fileUpload';
import { cleanContent } from '@/utils/contentCleaner';

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

interface FormattedBlog {
  _id: string;
  title: string;
  content: string;
  blogImage: string;
  category: string;
  tags: string[];
  readTime: number;
  author: {
    _id: string;
    name: string;
    avatar: string;
  };
  publishDate: string;
  isOwner: boolean;
}

export async function GET(req: NextRequest) {
  try {
    await connectDB();

    const blogId = req.nextUrl.pathname.split('/').pop();

    if (!blogId) {
      return NextResponse.json(
        createErrorResponse(400, 'Blog identifier is required'),
        { status: 400 }
      );
    }

    let blog: BlogDocument | null = null;

    const isValidObjectId = /^[0-9a-fA-F]{24}$/.test(blogId);

    if (isValidObjectId) {
      blog = (await Blog.findById(blogId)
        .populate({
          path: 'author',
          model: User,
          select: '_id email role',
        })
        .lean()) as BlogDocument | null;
    }

    if (!blog) {
      const normalizedSearchString = decodeURIComponent(blogId)
        .replace(/-/g, ' ')
        .trim()
        .toLowerCase();

      const searchQueries = [
        {
          title: new RegExp(`^${normalizedSearchString}$`, 'i'),
        },
        {
          $and: normalizedSearchString.split(' ').map(word => ({
            title: new RegExp(word, 'i'),
          })),
        },
      ];

      blog = (await Blog.findOne({
        $or: searchQueries,
        isPublished: true,
      })
        .populate({
          path: 'author',
          model: User,
          select: '_id email role',
        })
        .lean()) as BlogDocument | null;
    }

    if (!blog) {
      console.log('Blog not found for identifier:', blogId);
      return NextResponse.json(
        createErrorResponse(404, 'Blog post not found'),
        { status: 404 }
      );
    }

    console.log('Found blog:', blog._id);

    const profile = await Profile.findOne({
      user: blog.author._id,
    }).lean();

    if (!profile || Array.isArray(profile)) {
      return NextResponse.json(
        createErrorResponse(404, 'Author profile not found'),
        { status: 404 }
      );
    }

    const authHeader = req.headers.get('authorization');
    const currentUserId = authHeader ? authHeader.split(' ')[1] : null;

    const formattedBlog: FormattedBlog = {
      _id: blog._id.toString(),
      title: blog.title,
      content: blog.content,
      blogImage: blog.blogImage || '',
      category: blog.category,
      tags: blog.tags || [],
      readTime: blog.readTime,
      author: {
        _id: blog.author._id.toString(),
        name: `${profile.firstName} ${profile.lastName}`,
        avatar: profile.image || '/default-avatar.jpg',
      },
      publishDate: new Date(blog.publishDate).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }),
      isOwner: currentUserId
        ? blog.author._id.toString() === currentUserId
        : false,
    };

    return NextResponse.json(
      createSuccessResponse(200, {
        message: 'Blog fetch successful',
        blog: formattedBlog,
      }),
      { status: 200 }
    );
  } catch (error) {
    console.error('Server error:', error);

    if (error instanceof Error && error.name === 'CastError') {
      return NextResponse.json(
        createErrorResponse(400, 'Invalid blog identifier format'),
        { status: 400 }
      );
    }

    return NextResponse.json(
      createErrorResponse(500, 'Internal Server Error'),
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    await connectDB();
    console.log('PATCH request for blog ID:', params.slug);

    const blog = await Blog.findById(params.slug);

    if (!blog) {
      console.log('Blog not found with ID:', params.slug);
      return NextResponse.json(createErrorResponse(404, 'Blog not found'), {
        status: 404,
      });
    }

    const formData = await req.formData();
    const updateData: any = {};
    let imageFile: any = null;

    const fieldsStr = formData.get('fields');
    if (fieldsStr) {
      const fields = JSON.parse(String(fieldsStr));

      if (fields.content) {
        fields.content = cleanContent(fields.content);
      }

      Object.assign(updateData, fields);
    }

    const blogImage = formData.get('blogImage');
    if (blogImage instanceof Blob) {
      const timestamp = Date.now();
      imageFile = {
        buffer: Buffer.from(await blogImage.arrayBuffer()),
        filename: `blog-${blog._id}-${timestamp}`,
        mimetype: blogImage.type,
      };
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

    console.log('Updating blog with cleaned data:', {
      blogId: blog._id,
      updateFields: Object.keys(updateData),
    });

    const updatedBlog = await Blog.findByIdAndUpdate(
      blog._id,
      {
        $set: {
          ...updateData,
          updatedAt: new Date(),
        },
      },
      { new: true, runValidators: true }
    ).exec();

    if (!updatedBlog) {
      return NextResponse.json(
        createErrorResponse(404, 'Failed to update blog'),
        { status: 404 }
      );
    }

    console.log('Blog updated successfully:', updatedBlog._id);

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
