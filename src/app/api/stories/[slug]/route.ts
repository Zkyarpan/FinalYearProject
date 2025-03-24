'use server';

import { NextRequest, NextResponse } from 'next/server';
import { Types } from 'mongoose';
import connectDB from '@/db/db';
import Story from '@/models/Stories';
import Profile from '@/models/Profile';
import User from '@/models/User';
import { createErrorResponse, createSuccessResponse } from '@/lib/response';
import { deleteFromCloudinary, uploadToCloudinary } from '@/utils/fileUpload';
import { cleanContent } from '@/utils/contentCleaner';

interface StoryDocument {
  _id: Types.ObjectId;
  title: string;
  content: string;
  storyImage: string;
  category: string;
  tags: string[];
  readTime: number;
  publishDate: Date;
  author: {
    _id: Types.ObjectId;
    username: string;
  };
}

interface FormattedStory {
  _id: string;
  title: string;
  content: string;
  storyImage: string;
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

    const storyId = req.nextUrl.pathname.split('/').pop();

    if (!storyId) {
      return NextResponse.json(
        createErrorResponse(400, 'Story identifier is required'),
        { status: 400 }
      );
    }

    let story: StoryDocument | null = null;

    const isValidObjectId = /^[0-9a-fA-F]{24}$/.test(storyId);

    if (isValidObjectId) {
      story = (await Story.findById(storyId)
        .populate({
          path: 'author',
          model: User,
          select: '_id email role',
        })
        .lean()) as StoryDocument | null;
    }

    if (!story) {
      const normalizedSearchString = decodeURIComponent(storyId)
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

      story = (await Story.findOne({
        $or: searchQueries,
        isPublished: true,
      })
        .populate({
          path: 'author',
          model: User,
          select: '_id email role',
        })
        .lean()) as StoryDocument | null;
    }

    if (!story) {
      console.log('Story not found for identifier:', storyId);
      return NextResponse.json(createErrorResponse(404, 'Story not found'), {
        status: 404,
      });
    }

    const profile = await Profile.findOne({
      user: story.author._id,
    }).lean();

    if (!profile || Array.isArray(profile)) {
      return NextResponse.json(
        createErrorResponse(404, 'Author profile not found'),
        { status: 404 }
      );
    }

    const authHeader = req.headers.get('authorization');
    const currentUserId = authHeader ? authHeader.split(' ')[1] : null;

    const formattedStory: FormattedStory = {
      _id: story._id.toString(),
      title: story.title,
      content: story.content,
      storyImage: story.storyImage || '',
      category: story.category,
      tags: story.tags || [],
      readTime: story.readTime,
      author: {
        _id: story.author._id.toString(),
        name: `${profile.firstName} ${profile.lastName}`,
        avatar: profile.image || '/default-avatar.jpg',
      },
      publishDate: new Date(story.publishDate).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }),
      isOwner: currentUserId
        ? story.author._id.toString() === currentUserId
        : false,
    };

    return NextResponse.json(
      createSuccessResponse(200, {
        message: 'Story fetch successful',
        story: formattedStory,
      }),
      { status: 200 }
    );
  } catch (error) {
    console.error('Server error:', error);

    if (error instanceof Error && error.name === 'CastError') {
      return NextResponse.json(
        createErrorResponse(400, 'Invalid story identifier format'),
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
    console.log('PATCH request for story ID:', params.slug);

    const story = await Story.findById(params.slug);

    if (!story) {
      console.log('Story not found with ID:', params.slug);
      return NextResponse.json(createErrorResponse(404, 'Story not found'), {
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
        if (story.storyImage) {
          const publicIdMatch = story.storyImage.match(
            /photos\/story-images\/([^.]+)/
          );
          const oldPublicId = publicIdMatch ? publicIdMatch[1] : null;

          if (oldPublicId) {
            try {
              await deleteFromCloudinary(`photos/story-images/${oldPublicId}`);
            } catch (deleteError) {
              console.error('Error deleting old image:', deleteError);
            }
          }
        }

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

    console.log('Updating story with cleaned data:', {
      storyId: story._id,
      updateFields: Object.keys(updateData),
    });

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
}
