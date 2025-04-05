'use server';

import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/db/db';
import Resource from '@/models/Resource';
import User from '@/models/User';
import Profile from '@/models/Profile';
import Psychologist from '@/models/Psychologist';
import { createErrorResponse, createSuccessResponse } from '@/lib/response';
import { DEFAULT_AVATAR } from '@/constants';
import {
  withAuth,
  TokenPayload,
  getTokenFromRequest,
} from '@/middleware/authMiddleware';

// This is the dynamic route handler for resource detail
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log('✅ Using existing MongoDB connection');
    await connectDB();

    // Get the resource ID from context.params
    const resourceId = params.id;

    console.log('Fetching resource with ID:', resourceId);

    // Try to find the resource
    const resource: any = await Resource.findById(resourceId).lean();

    // If resource not found, return 404
    if (!resource) {
      console.log(`Resource not found for ID: ${resourceId}`);
      return NextResponse.json(createErrorResponse(404, 'Resource not found'), {
        status: 404,
      });
    }

    // Try to authenticate user, but continue even if not authenticated
    let user: TokenPayload | null = null;
    try {
      const token = getTokenFromRequest(request);
      if (token) {
        user = token as TokenPayload;
        console.log('User authenticated:', user.id, user.role);
      }
    } catch (error) {
      console.log('No authenticated user, continuing as public access');
    }

    // Increment view count only if resource found (put this before fetching author details)
    await Resource.findByIdAndUpdate(resourceId, { $inc: { viewCount: 1 } });

    // Get author details
    let authorName = 'Unknown';
    let authorAvatar = DEFAULT_AVATAR;
    let authorId = resource.author.toString();

    try {
      if (resource.authorType === 'user') {
        // Get user profile
        interface IProfile {
          firstName?: string;
          lastName?: string;
          image?: string;
        }

        const profile = (await Profile.findOne({
          user: resource.author,
        }).lean()) as IProfile;

        if (profile) {
          authorName =
            `${profile.firstName || ''} ${profile.lastName || ''}`.trim() ||
            'User';
          authorAvatar = profile.image || DEFAULT_AVATAR;
        } else {
          // Fallback to email if profile not found
          interface IUser {
            email?: string;
          }
          const userData = (await User.findById(resource.author)
            .select('email')
            .lean()) as IUser;
          if (userData) {
            authorName = userData.email ? userData.email.split('@')[0] : 'User';
          }
        }
      } else if (resource.authorType === 'psychologist') {
        // Get psychologist details
        interface IPsychologist {
          name?: string;
          avatar?: string;
        }
        const psychologist = (await Psychologist.findById(
          resource.author
        ).lean()) as IPsychologist;
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

    // Ensure mediaUrls is properly formatted
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

    // Return the formatted resource with author details
    return NextResponse.json(
      createSuccessResponse(200, {
        ...resource,
        _id: resource._id.toString(),
        author: {
          _id: authorId,
          name: authorName,
          avatar: authorAvatar,
        },
        publishDate,
        isOwner,
        mediaUrls,
      }),
      { status: 200 }
    );
  } catch (error) {
    console.error('Failed to fetch resource:', error);
    return NextResponse.json(
      createErrorResponse(500, 'Internal Server Error'),
      { status: 500 }
    );
  }
}
