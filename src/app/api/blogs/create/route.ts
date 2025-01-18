'use server';

import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/db/db';
import Blog from '@/models/Blogs';
import { uploadToCloudinary } from '@/utils/fileUpload';
import Busboy from 'busboy';
import { createErrorResponse, createSuccessResponse } from '@/lib/response';
import { withAuth } from '@/middleware/authMiddleware';

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

    interface BlogImageFile {
      buffer: Buffer;
      filename: string;
      mimetype: string;
    }

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
            } as BlogImageFile;
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

export async function POST(req: NextRequest) {
  return withAuth(async (req: NextRequest, user: any) => {
    try {
      await connectDB();

      const { fields, blogImageFile } = await parseForm(req);
      const requiredFields = ['title', 'content', 'category', 'readTime'];

      const missingFields = requiredFields.filter(field => !fields[field]);
      if (missingFields.length > 0) {
        return NextResponse.json(
          createErrorResponse(400, `All fields are required}`),
          { status: 400 }
        );
      }

      const existingBlog = await Blog.findOne({
        title: fields.title,
        author: user.id,
      });

      if (existingBlog) {
        return NextResponse.json(
          createErrorResponse(409, 'Blog with the same title already exists'),
          { status: 409 }
        );
      }

      let blogImageUrl = '';
      let publicId = '';

      if (blogImageFile) {
        try {
          const uploadResult = await uploadToCloudinary({
            fileBuffer: blogImageFile.buffer,
            folder: 'photos/blog-images',
            filename: `blog-${Date.now()}`,
            mimetype: blogImageFile.mimetype,
          });

          // Since uploadResult can be a string or an object, handle both cases
          if (typeof uploadResult === 'string') {
            blogImageUrl = uploadResult;
            publicId = `photos/blog-images/${uploadResult.split('/').pop()?.split('.')[0]}`;
          } else {
            // Cast uploadResult to any to handle the Cloudinary response type
            const cloudinaryResult = uploadResult as any;
            blogImageUrl = cloudinaryResult.secure_url || cloudinaryResult.url;
            publicId =
              cloudinaryResult.public_id ||
              `photos/blog-images/${cloudinaryResult.url?.split('/').pop()?.split('.')[0]}`;
          }
        } catch (error) {
          return NextResponse.json(
            createErrorResponse(500, 'Failed to upload image'),
            { status: 500 }
          );
        }
      }

      const newBlog = new Blog({
        ...fields,
        author: user.id,
        blogImage: blogImageUrl,
        imagePublicId: publicId,
        isPublished: true,
      });

      await newBlog.save();

      return NextResponse.json(
        createSuccessResponse(201, {
          message: 'Blog created successfully',
          blog: {
            id: newBlog._id,
            title: newBlog.title,
          },
        }),
        { status: 201 }
      );
    } catch (error) {
      console.error('Server Error:', error);
      return NextResponse.json(
        createErrorResponse(500, 'Internal Server Error'),
        { status: 500 }
      );
    }
  }, req);
}
