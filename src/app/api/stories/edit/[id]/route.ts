'use server';

import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/db/db';
import Story from '@/models/Stories';
import { createErrorResponse, createSuccessResponse } from '@/lib/response';
import { withAuth } from '@/middleware/authMiddleware';
import { uploadToCloudinary, deleteFromCloudinary } from '@/utils/fileUpload';
import { cleanContent } from '@/utils/contentCleaner';

// GET route to retrieve story for editing
export async function GET(
  req: NextRequest,
  { params }
) {
  return withAuth(async (req: NextRequest, user: any) => {
    try {
      await connectDB();
      const storyId = await params.id;

      console.log(`Fetching story for edit: ${storyId} by user ${user.id}`);

      // Find the story and validate ownership
      const story = await Story.findById(storyId);

      if (!story) {
        return NextResponse.json(createErrorResponse(404, 'Story not found'), {
          status: 404,
        });
      }

      // Check if the user is the author
      if (story.author.toString() !== user.id) {
        return NextResponse.json(
          createErrorResponse(
            403,
            'You do not have permission to edit this story'
          ),
          { status: 403 }
        );
      }

      return NextResponse.json(
        createSuccessResponse(200, {
          message: 'Story fetched for editing',
          story,
        }),
        { status: 200 }
      );
    } catch (error) {
      console.error('Failed to fetch story for editing:', error);
      return NextResponse.json(
        createErrorResponse(500, 'Internal Server Error'),
        { status: 500 }
      );
    }
  }, req);
}

// PATCH route to update the story
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  return withAuth(async (req: NextRequest, user: any) => {
    try {
      await connectDB();
      const storyId = params.id;

      console.log(`Updating story: ${storyId} by user ${user.id}`);

      // Find the story and validate ownership
      const story = await Story.findById(storyId);

      if (!story) {
        return NextResponse.json(createErrorResponse(404, 'Story not found'), {
          status: 404,
        });
      }

      // Check if the user is the author
      if (story.author.toString() !== user.id) {
        return NextResponse.json(
          createErrorResponse(
            403,
            'You do not have permission to edit this story'
          ),
          { status: 403 }
        );
      }

      // Parse the form data
      const formData = await req.formData();
      const updateData: any = {};
      let imageFile: any = null;

      // Get fields data
      const fieldsStr = formData.get('fields');
      if (fieldsStr) {
        const fields = JSON.parse(String(fieldsStr));

        // Clean content if provided
        if (fields.content) {
          fields.content = cleanContent(fields.content);
        }

        Object.assign(updateData, fields);
      }

      // Handle image upload if provided
      const storyImage = formData.get('storyImage');
      if (storyImage instanceof Blob) {
        const timestamp = Date.now();
        imageFile = {
          buffer: Buffer.from(await storyImage.arrayBuffer()),
          filename: `story-${story._id}-${timestamp}`,
          mimetype: storyImage.type,
        };
      }

      if (imageFile) {
        try {
          // Delete the old image if it exists
          if (story.storyImage) {
            const publicIdMatch = story.storyImage.match(
              /photos\/story-images\/([^.]+)/
            );
            const oldPublicId = publicIdMatch ? publicIdMatch[1] : null;

            if (oldPublicId) {
              try {
                await deleteFromCloudinary(
                  `photos/story-images/${oldPublicId}`
                );
              } catch (deleteError) {
                console.error('Error deleting old image:', deleteError);
              }
            }
          }

          // Upload the new image
          const newImageUrl = await uploadToCloudinary({
            fileBuffer: imageFile.buffer,
            folder: 'photos/story-images',
            filename: imageFile.filename,
            mimetype: imageFile.mimetype,
          });

          updateData.storyImage = newImageUrl;
        } catch (uploadError) {
          console.error('Image upload error:', uploadError);
          return NextResponse.json(
            createErrorResponse(400, 'Failed to upload image'),
            { status: 400 }
          );
        }
      }

      console.log('Updating story with data:', {
        storyId: story._id,
        updateFields: Object.keys(updateData),
      });

      // Update the story
      const updatedStory = await Story.findByIdAndUpdate(
        story._id,
        {
          $set: {
            ...updateData,
            updatedAt: new Date(),
          },
        },
        { new: true, runValidators: true }
      ).exec();

      if (!updatedStory) {
        return NextResponse.json(
          createErrorResponse(404, 'Failed to update story'),
          { status: 404 }
        );
      }

      console.log('Story updated successfully:', updatedStory._id);

      return NextResponse.json(
        createSuccessResponse(200, {
          message: 'Story updated successfully',
          story: updatedStory,
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
  }, req);
}
