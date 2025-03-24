'use server';

import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/db/db';
import Story from '@/models/Stories';
import { deleteFromCloudinary } from '@/utils/fileUpload';
import { createErrorResponse, createSuccessResponse } from '@/lib/response';
import { withAuth } from '@/middleware/authMiddleware';

export async function DELETE(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  return withAuth(async (req: NextRequest, user: any) => {
    try {
      await connectDB();
      const storyId = params.slug;

      console.log('DELETE request for story ID:', storyId);
      console.log('User attempting delete:', user.id);

      if (!storyId) {
        return NextResponse.json(
          createErrorResponse(400, 'Story ID is required'),
          { status: 400 }
        );
      }

      // Find the story
      const story = await Story.findById(storyId);

      if (!story) {
        console.log('Story not found with ID:', storyId);
        return NextResponse.json(createErrorResponse(404, 'Story not found'), {
          status: 404,
        });
      }

      // Debug ownership check
      console.log('Story ownership check:', {
        storyId,
        storyAuthorId: story.author.toString(),
        userId: user.id,
        isMatch: story.author.toString() === user.id,
      });

      // Check if the user is the author of the story
      if (story.author.toString() !== user.id) {
        return NextResponse.json(
          createErrorResponse(403, 'Not authorized to delete this story'),
          { status: 403 }
        );
      }

      // Delete story image from Cloudinary if it exists
      if (story.storyImage) {
        const publicIdMatch = story.storyImage.match(
          /photos\/story-images\/([^.]+)/
        );
        const publicId = publicIdMatch ? publicIdMatch[1] : null;

        if (publicId) {
          try {
            await deleteFromCloudinary(`photos/story-images/${publicId}`);
            console.log(
              'Successfully deleted image from Cloudinary:',
              publicId
            );
          } catch (deleteError) {
            console.error('Error deleting image from Cloudinary:', deleteError);
            // Continue deleting the story even if image deletion fails
          }
        }
      }

      // Delete the story from the database
      await Story.findByIdAndDelete(storyId);

      console.log('Story deleted successfully:', storyId);

      return NextResponse.json(
        createSuccessResponse(200, {
          message: 'Story deleted successfully',
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
