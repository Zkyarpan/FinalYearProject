'use server';

import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/db/db';
import Resource from '@/models/Resource';
import User from '@/models/User';
import Profile from '@/models/Profile';
import Psychologist from '@/models/Psychologist';
import { createErrorResponse, createSuccessResponse } from '@/lib/response';
import { DEFAULT_AVATAR } from '@/constants';
import { Types } from 'mongoose';
import {
  withAuth,
  TokenPayload,
  getTokenFromRequest,
} from '@/middleware/authMiddleware';

// Define interfaces for better type safety
interface IProfile {
  user: Types.ObjectId;
  firstName: string;
  lastName: string;
  image: string;
}

interface IUser {
  _id: Types.ObjectId;
  email: string;
}

interface IPsychologist {
  _id: Types.ObjectId;
  name: string;
  avatar: string;
}

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    console.log('Fetching resources');

    // Try to get the authenticated user token, but continue even if not authenticated
    let user: TokenPayload | null = null;
    try {
      const token = getTokenFromRequest(req);
      if (token) {
        user = token as TokenPayload;
        console.log('User authenticated:', user.id, user.role);
      }
    } catch (error) {
      console.log('No authenticated user, continuing as public access');
    }

    // Get query parameters
    const url = new URL(req.url);
    const category = url.searchParams.get('category');
    const difficulty = url.searchParams.get('difficulty');
    const authorId = url.searchParams.get('author');
    const limit = parseInt(url.searchParams.get('limit') || '10');
    const page = parseInt(url.searchParams.get('page') || '1');
    const skip = (page - 1) * limit;
    const search = url.searchParams.get('search');
    const tag = url.searchParams.get('tag');

    // Build query
    const query: any = {};
    if (category) {
      query.category = category;
    }
    if (tag) {
      query.tags = { $in: [tag] };
    }
    if (difficulty) {
      query.difficultyLevel = difficulty;
    }
    if (authorId) {
      query.author = authorId;
    }

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } },
      ];
    }

    // Only show published resources for non-authenticated users
    if (!user) {
      query.isPublished = true;
    }

    // Explicitly include mediaUrls and other fields in the query
    const resources = await Resource.find(query)
      .select(
        'title description content category difficultyLevel duration steps tags mediaUrls resourceImage publishDate author authorType viewCount isPublished'
      )
      .sort({ publishDate: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    console.log(`Found ${resources.length} resources`);

    // Get total count for pagination
    const totalCount = await Resource.countDocuments(query);

    // Get author details for all resources
    const populatedResources = await Promise.all(
      resources.map(async (resource: any) => {
        let authorName = 'Unknown';
        let authorAvatar = DEFAULT_AVATAR;
        let authorId = resource.author.toString();

        try {
          if (resource.authorType === 'user') {
            // Get user profile
            const profile = (await Profile.findOne({
              user: resource.author,
            }).lean()) as IProfile | null;

            const userData = (await User.findById(resource.author)
              .select('email')
              .lean()) as IUser | null;

            if (profile) {
              authorName =
                `${profile.firstName} ${profile.lastName}`.trim() || 'User';
              authorAvatar = profile.image || DEFAULT_AVATAR;
            } else if (userData) {
              // Fallback to email if profile not found
              authorName = userData.email
                ? userData.email.split('@')[0]
                : 'User';
            }
          } else if (resource.authorType === 'psychologist') {
            // Get psychologist details
            const psychologist = (await Psychologist.findById(
              resource.author
            ).lean()) as IPsychologist | null;

            if (psychologist) {
              authorName = psychologist.name || 'Psychologist';
              authorAvatar = psychologist.avatar || DEFAULT_AVATAR;
            }
          }
        } catch (error) {
          console.error('Error fetching author details:', error);
        }

        // Check if the current user is the owner
        const isOwner = user ? authorId === user.id : false;

        // Format date
        const publishDate = new Date(resource.publishDate).toLocaleDateString(
          'en-US',
          {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          }
        );

        // Ensure mediaUrls is properly formatted and included
        const mediaUrls = Array.isArray(resource.mediaUrls)
          ? resource.mediaUrls.map(media => ({
              type: media.type,
              url: media.url,
              ...(media.title ? { title: media.title } : {}),
            }))
          : [];

        if (mediaUrls.length > 0) {
          console.log(
            `Resource ${resource._id} has ${mediaUrls.length} media items`
          );
        }

        return {
          ...resource,
          _id: resource._id.toString(),
          author: {
            _id: authorId,
            name: authorName,
            avatar: authorAvatar,
          },
          publishDate,
          isOwner,
          mediaUrls, // Explicitly include mediaUrls in the response
        };
      })
    );

    return NextResponse.json(
      createSuccessResponse(200, {
        resources: populatedResources,
        pagination: {
          total: totalCount,
          page,
          limit,
          pages: Math.ceil(totalCount / limit),
        },
      }),
      { status: 200 }
    );
  } catch (error) {
    console.error('Failed to fetch resources:', error);
    return NextResponse.json(
      createErrorResponse(500, 'Internal Server Error'),
      {
        status: 500,
      }
    );
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  return withAuth(
    async (req: NextRequest, user: TokenPayload) => {
      try {
        await connectDB();

        const { id } = params;
        if (!id) {
          return NextResponse.json(
            createErrorResponse(400, 'Resource ID is required'),
            { status: 400 }
          );
        }

        // Find the resource
        const resource = await Resource.findById(id);
        if (!resource) {
          return NextResponse.json(
            createErrorResponse(404, 'Resource not found'),
            { status: 404 }
          );
        }

        // Check ownership (users can only update their own resources, admins can update any)
        if (resource.author.toString() !== user.id && user.role !== 'admin') {
          return NextResponse.json(
            createErrorResponse(
              403,
              'You do not have permission to update this resource'
            ),
            { status: 403 }
          );
        }

        // Get update data from request body
        const body = await req.json();

        // Fields that cannot be updated
        delete body._id;
        delete body.author;
        delete body.authorType;
        delete body.publishDate;
        delete body.viewCount;
        delete body.createdAt;

        // Handle mediaUrls update
        if (body.mediaUrls && Array.isArray(body.mediaUrls)) {
          // Validate each media URL entry
          body.mediaUrls = body.mediaUrls.filter(
            media =>
              media &&
              typeof media === 'object' &&
              media.url &&
              media.type &&
              (media.type === 'audio' || media.type === 'video')
          );

          console.log(
            `Updating resource with ${body.mediaUrls.length} media items`
          );
        }

        // Update resource
        const updatedResource = await Resource.findByIdAndUpdate(
          id,
          { $set: body },
          { new: true, runValidators: true }
        );

        return NextResponse.json(
          createSuccessResponse(200, {
            message: 'Resource updated successfully',
            resource: {
              _id: updatedResource._id,
              title: updatedResource.title,
              slug: updatedResource.slug,
              mediaUrls: updatedResource.mediaUrls, // Include mediaUrls in the response
            },
          }),
          { status: 200 }
        );
      } catch (error: any) {
        console.error('Failed to update resource:', error);

        return NextResponse.json(
          createErrorResponse(500, 'Internal Server Error'),
          { status: 500 }
        );
      }
    },
    req,
    ['user', 'psychologist', 'admin']
  ); // All authenticated users can attempt to update, ownership is checked inside
}
