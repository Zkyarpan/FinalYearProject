'use server';

import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/db/db';
import Blog from '@/models/Blogs';
import { uploadToCloudinary, deleteFromCloudinary } from '@/utils/fileUpload';
import Busboy from 'busboy';
import { createErrorResponse, createSuccessResponse } from '@/lib/response';

interface ParsedForm {
  fields: { [key: string]: string };
  blogImageFile?: {
    buffer: Buffer;
    filename: string;
    mimetype: string;
  };
}

async function parseForm(req: NextRequest): Promise<ParsedForm> {
  return new Promise((resolve, reject) => {
    const busboy = Busboy({
      headers: Object.fromEntries(req.headers.entries()),
    });
    const fields = {};
    let blogImageFile;

    busboy.on('field', (fieldname, val) => {
      fields[fieldname] = val;
    });

    busboy.on(
      'file',
      (
        fieldname: string,
        file: NodeJS.ReadableStream,
        filename: string,
        encoding: string,
        mimetype: string
      ) => {
        if (fieldname === 'blogImage') {
          const chunks: Buffer[] = [];
          file.on('data', (chunk: Buffer) => chunks.push(chunk));
          file.on('end', () => {
            blogImageFile = {
              buffer: Buffer.concat(chunks),
              filename,
              mimetype,
            };
          });
        }
      }
    );

    busboy.on('finish', () => {
      resolve({ fields, blogImageFile });
    });

    busboy.on('error', error => reject(error));

    if (req.body) {
      const reader = req.body.getReader();
      const stream = new ReadableStream({
        start(controller) {
          function push() {
            reader.read().then(({ done, value }) => {
              if (done) {
                controller.close();
                return;
              }
              controller.enqueue(value);
              push();
            });
          }
          push();
        },
      });

      const nodeStream = require('stream').Readable.from(stream);
      nodeStream.pipe(busboy);
    } else {
      reject(new Error('Request body is null'));
    }
  });
}

export async function PATCH(req: NextRequest) {
  try {
    await connectDB();

    const blogId = req.nextUrl.searchParams.get('id');

    if (!blogId) {
      return NextResponse.json(createErrorResponse(400, 'Invalid blog ID'), {
        status: 400,
      });
    }

    const { fields, blogImageFile } = await parseForm(req);
    const blog = await Blog.findById(blogId);
    if (!blog) {
      return NextResponse.json(createErrorResponse(404, 'Blog not found'), {
        status: 404,
      });
    }

    // Update provided fields
    Object.entries(fields).forEach(([key, value]) => {
      blog[key] = value;
    });

    // Handle image update if provided
    if (blogImageFile) {
      if (blog.blogImage) {
        const oldPublicId = blog.blogImage.split('/').pop()?.split('.')[0];
        if (oldPublicId) {
          await deleteFromCloudinary(oldPublicId);
        }
      }

      const blogImageUrl = await uploadToCloudinary({
        fileBuffer: blogImageFile.buffer,
        folder: 'photos/blog-images',
        filename: blogImageFile.filename,
        mimetype: blogImageFile.mimetype,
      });
      blog.blogImage = blogImageUrl;
    }

    await blog.save();

    return NextResponse.json(
      createSuccessResponse(200, {
        message: 'Blog updated successfully',
        blog_id: blog._id,
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

export async function GET(
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
      return NextResponse.json(createErrorResponse(401, 'Blog not found'), {
        status: 401,
      });
    }
    return NextResponse.json(
      createSuccessResponse(201, {
        message: 'Blog Fetch Successful',
        selectedBlog: blog,
      }),
      { status: 201 }
    );
  } catch (error) {
    console.error('Failed to fetch blog:', error);
    return NextResponse.json(
      createErrorResponse(500, 'Internal Server Error'),
      {
        status: 500,
      }
    );
  }
}
