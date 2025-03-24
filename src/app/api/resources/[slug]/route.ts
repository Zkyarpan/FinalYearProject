'use server';

import { NextRequest, NextResponse } from 'next/server';
import { Types } from 'mongoose';
import connectDB from '@/db/db';
import Resource from '@/models/Resource';
import User from '@/models/User';
import Profile from '@/models/Profile';
import Psychologist from '@/models/Psychologist';
import { createErrorResponse, createSuccessResponse } from '@/lib/response';
import { DEFAULT_AVATAR } from '@/constants';
import { uploadToCloudinary } from '@/utils/fileUpload';

// Define interface types that match the shape after lean()
interface UserLean {
  _id: Types.ObjectId;
  email?: string;
  role?: string;
}

interface ProfileLean {
  _id: Types.ObjectId;
  user: Types.ObjectId;
  firstName?: string;
  lastName?: string;
  image?: string;
}

interface PsychologistLean {
  _id: Types.ObjectId;
  name?: string;
  avatar?: string;
}

interface ResourceDocument {
  _id: Types.ObjectId;
  title: string;
  description: string;
  content: string;
  resourceImage: string;
  category: string;
  tags: string[];
  mediaUrls: {
    type: 'audio' | 'video';
    url: string;
    title?: string;
  }[];
  duration: number;
  difficultyLevel: string;
  steps: string[];
  author: Types.ObjectId;
  authorType: string;
  publishDate: Date;
  isPublished: boolean;
  viewCount: number;
  slug?: string;
}

export async function GET(
  request: NextRequest,
  context: { params: { slug: string } }
) {
  try {
    await connectDB();

    // Get the slug from context.params properly
    const resourceId = context.params.slug;

    console.log('Fetching resource with identifier:', resourceId);

    if (!resourceId) {
      return NextResponse.json(
        createErrorResponse(400, 'Resource identifier is required'),
        { status: 400 }
      );
    }

    let resource: ResourceDocument | null = null;

    // Try to find by ID first if it looks like a MongoDB ObjectId
    const isValidObjectId = /^[0-9a-fA-F]{24}$/.test(resourceId);

    if (isValidObjectId) {
      resource = (await Resource.findById(
        resourceId
      ).lean()) as ResourceDocument | null;
    }

    // If not found by ID, try to find by slug
    if (!resource) {
      resource = (await Resource.findOne({
        slug: resourceId,
      }).lean()) as ResourceDocument | null;
    }

    // If still not found, try to find by normalized title (similar to slug)
    if (!resource) {
      const normalizedSearchString = decodeURIComponent(resourceId)
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

      resource = (await Resource.findOne({
        $or: searchQueries,
        isPublished: true,
      }).lean()) as ResourceDocument | null;
    }

    if (!resource) {
      console.log('Resource not found for identifier:', resourceId);
      return NextResponse.json(createErrorResponse(404, 'Resource not found'), {
        status: 404,
      });
    }

    console.log('Found resource:', {
      id: resource._id,
      title: resource.title,
      authorType: resource.authorType,
    });

    // Increment view count
    await Resource.findByIdAndUpdate(resource._id, {
      $inc: { viewCount: 1 },
    });

    // Get author details
    let authorName = 'Unknown';
    let authorAvatar = DEFAULT_AVATAR;
    const authorId = resource.author.toString();

    try {
      if (resource.authorType === 'user') {
        // Get user profile
        const profile = (await Profile.findOne({
          user: resource.author,
        }).lean()) as ProfileLean | null;

        if (profile) {
          authorName =
            `${profile.firstName || ''} ${profile.lastName || ''}`.trim() ||
            'User';
          authorAvatar = profile.image || DEFAULT_AVATAR;
        } else {
          // Fallback to email if profile not found
          const user = (await User.findById(resource.author)
            .select('email')
            .lean()) as UserLean | null;

          if (user && user.email) {
            authorName = user.email.split('@')[0];
          }
        }
      } else if (resource.authorType === 'psychologist') {
        // Get psychologist details
        const psychologist = (await Psychologist.findById(
          resource.author
        ).lean()) as PsychologistLean | null;

        if (psychologist) {
          authorName = psychologist.name || 'Psychologist';
          authorAvatar = psychologist.avatar || DEFAULT_AVATAR;
        }
      }
    } catch (error) {
      console.error('Error fetching author details:', error);
    }

    // Check if current user is the owner
    const authHeader = request.headers.get('authorization');
    const currentUserId = authHeader ? authHeader.split(' ')[1] : null;
    const isOwner = currentUserId ? authorId === currentUserId : false;

    // Format dates
    const publishDate = new Date(resource.publishDate).toLocaleDateString(
      'en-US',
      {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }
    );

    // Ensure mediaUrls, steps, and tags are arrays
    const mediaUrls = Array.isArray(resource.mediaUrls)
      ? resource.mediaUrls
      : [];
    const steps = Array.isArray(resource.steps) ? resource.steps : [];
    const tags = Array.isArray(resource.tags) ? resource.tags : [];

    const formattedResource = {
      ...resource,
      _id: resource._id.toString(),
      author: {
        _id: authorId,
        name: authorName,
        avatar: authorAvatar,
      },
      mediaUrls,
      steps,
      tags,
      publishDate,
      isOwner,
    };

    return NextResponse.json(
      createSuccessResponse(200, {
        message: 'Resource fetched successfully',
        resource: formattedResource,
      }),
      { status: 200 }
    );
  } catch (error) {
    console.error('Failed to fetch resource:', error);

    if (error instanceof Error && error.name === 'CastError') {
      return NextResponse.json(
        createErrorResponse(400, 'Invalid resource identifier format'),
        { status: 400 }
      );
    }

    return NextResponse.json(
      createErrorResponse(500, 'Internal Server Error'),
      {
        status: 500,
      }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  context: { params: { slug: string } }
) {
  try {
    await connectDB();
    const resourceId = context.params.slug;
    console.log('PATCH request for resource ID:', resourceId);

    const resource = await Resource.findById(resourceId);

    if (!resource) {
      console.log('Resource not found with ID:', resourceId);
      return NextResponse.json(createErrorResponse(404, 'Resource not found'), {
        status: 404,
      });
    }

    const formData = await request.formData();
    const updateData: Record<string, any> = {};

    const fieldsStr = formData.get('fields');
    if (fieldsStr && typeof fieldsStr === 'string') {
      try {
        const fields = JSON.parse(fieldsStr);
        Object.assign(updateData, fields);
      } catch (err) {
        console.error('Error parsing fields JSON:', err);
        return NextResponse.json(
          createErrorResponse(400, 'Invalid JSON in fields parameter'),
          { status: 400 }
        );
      }
    }

    const resourceImage = formData.get('resourceImage');
    if (resourceImage instanceof Blob) {
      try {
        const timestamp = Date.now();
        const imageFile = {
          buffer: Buffer.from(await resourceImage.arrayBuffer()),
          filename: `resource-${resource._id}-${timestamp}`,
          mimetype: resourceImage.type,
        };

        const imageUrl = await uploadToCloudinary({
          fileBuffer: imageFile.buffer,
          folder: 'photos/resource-images',
          filename: imageFile.filename,
          mimetype: imageFile.mimetype,
        });

        updateData.resourceImage = imageUrl;
        console.log('Image uploaded to Cloudinary:', imageUrl);
      } catch (uploadError) {
        console.error('Image upload error:', uploadError);
        return NextResponse.json(
          createErrorResponse(400, 'Failed to upload image'),
          { status: 400 }
        );
      }
    }

    console.log('Updating resource with data:', {
      resourceId: resource._id,
      updateFields: Object.keys(updateData),
    });

    const updatedResource = await Resource.findByIdAndUpdate(
      resource._id,
      {
        $set: {
          ...updateData,
          updatedAt: new Date(),
        },
      },
      { new: true, runValidators: true }
    ).exec();

    if (!updatedResource) {
      return NextResponse.json(
        createErrorResponse(404, 'Failed to update resource'),
        { status: 404 }
      );
    }

    console.log('Resource updated successfully:', updatedResource._id);

    return NextResponse.json(
      createSuccessResponse(200, {
        message: 'Resource updated successfully',
        resource: updatedResource,
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
