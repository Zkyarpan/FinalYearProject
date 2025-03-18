'use server';

import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/db/db';
import Story from '@/models/Stories';
import { uploadToCloudinary } from '@/utils/fileUpload';
import { createErrorResponse, createSuccessResponse } from '@/lib/response';
import { withAuth } from '@/middleware/authMiddleware';
import calculateReadTime from '@/helpers/calculateReadTime';
import { cleanContent } from '@/utils/contentCleaner';

export async function POST(req: NextRequest) {
  return withAuth(async (req: NextRequest, user: any) => {
    try {
      await connectDB();

      // Debug the auth info from user
      console.log('Story Create - Auth Info:', {
        userId: user?.id,
        userRole: user?.role,
        headers: Object.fromEntries(req.headers.entries()),
      });

      const formData = await req.formData();
      const fieldsStr = formData.get('fields');

      if (!fieldsStr) {
        return NextResponse.json(
          createErrorResponse(400, 'Missing story data'),
          { status: 400 }
        );
      }

      const fields = JSON.parse(String(fieldsStr));
      const requiredFields = ['title', 'content', 'category'];

      const missingFields = requiredFields.filter(field => !fields[field]);
      if (missingFields.length > 0) {
        return NextResponse.json(
          createErrorResponse(
            400,
            `Missing required fields: ${missingFields.join(', ')}`
          ),
          { status: 400 }
        );
      }

      // Ensure we have a valid user ID
      if (!user || !user.id) {
        return NextResponse.json(
          createErrorResponse(401, 'Authentication required to create a story'),
          { status: 401 }
        );
      }

      const existingStory = await Story.findOne({
        title: fields.title,
        author: user.id,
      });

      if (existingStory) {
        return NextResponse.json(
          createErrorResponse(409, 'Story with the same title already exists'),
          { status: 409 }
        );
      }

      let storyImageUrl = '';
      let publicId = '';

      const storyImageFile = formData.get('storyImageFile');
      if (storyImageFile instanceof Blob) {
        try {
          const buffer = Buffer.from(await storyImageFile.arrayBuffer());
          const filename = `story-${Date.now()}`;
          const mimetype = storyImageFile.type;

          const uploadResult = await uploadToCloudinary({
            fileBuffer: buffer,
            folder: 'photos/story-images',
            filename,
            mimetype,
          });

          if (typeof uploadResult === 'string') {
            storyImageUrl = uploadResult;
            publicId = `photos/story-images/${
              uploadResult.split('/').pop()?.split('.')[0]
            }`;
          } else {
            const cloudinaryResult = uploadResult as any;
            storyImageUrl = cloudinaryResult.secure_url || cloudinaryResult.url;
            publicId =
              cloudinaryResult.public_id ||
              `photos/story-images/${
                cloudinaryResult.url?.split('/').pop()?.split('.')[0]
              }`;
          }
        } catch (error) {
          return NextResponse.json(
            createErrorResponse(500, 'Failed to upload image'),
            { status: 500 }
          );
        }
      }

      // Clean content if there's a helper for that
      let cleanedContent = fields.content;
      if (typeof cleanContent === 'function') {
        cleanedContent = cleanContent(fields.content);
      }

      // Create the story object with explicit author ID from authenticated user
      const newStory = new Story({
        ...fields,
        content: cleanedContent,
        author: user.id, // Set the author ID from the authenticated user
        storyImage: storyImageUrl,
        imagePublicId: publicId,
        readTime: calculateReadTime(fields.content),
        isPublished: true,
      });

      // Save and confirm author was set
      const savedStory = await newStory.save();
      console.log('Story created with author:', {
        storyId: savedStory._id,
        authorId: savedStory.author,
        expectedAuthorId: user.id,
      });

      return NextResponse.json(
        createSuccessResponse(201, {
          message: 'Story created successfully',
          story: {
            id: savedStory._id,
            title: savedStory.title,
            authorId: savedStory.author,
            readTime: savedStory.readTime,
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
