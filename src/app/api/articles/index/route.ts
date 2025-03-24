'use server';

import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/db/db';
import Article from '@/models/Articles';
import User from '@/models/User';
import Profile from '@/models/Profile';
import Psychologist from '@/models/Psychologist';
import { createErrorResponse, createSuccessResponse } from '@/lib/response';
import { DEFAULT_AVATAR } from '@/constants';
import { Types } from 'mongoose';

// Define interfaces for better type safety
interface IProfile {
  user: Types.ObjectId;
  firstName: string;
  lastName: string;
  image: string;
  // other profile properties...
}

interface IUser {
  _id: Types.ObjectId;
  email: string;
  // other user properties...
}

interface IPsychologist {
  _id: Types.ObjectId;
  name: string;
  avatar: string;
  // other psychologist properties...
}

export async function GET(req: NextRequest) {
  try {
    await connectDB();

    // Get query parameters
    const url = new URL(req.url);
    const category = url.searchParams.get('category');
    const limit = parseInt(url.searchParams.get('limit') || '10');
    const page = parseInt(url.searchParams.get('page') || '1');
    const skip = (page - 1) * limit;

    // Build query
    const query: any = {};
    if (category) {
      query.category = category;
    }

    // Get articles with pagination
    const articles = await Article.find(query)
      .sort({ publishDate: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    // Get total count for pagination
    const totalCount = await Article.countDocuments(query);

    // Get author details for all articles
    const populatedArticles = await Promise.all(
      articles.map(async (article: any) => {
        let authorName = 'Unknown';
        let authorAvatar = DEFAULT_AVATAR;
        let authorId = article.author.toString();

        try {
          if (article.authorType === 'user') {
            // Get user profile
            const profile = (await Profile.findOne({
              user: article.author,
            }).lean()) as IProfile | null;

            const user = (await User.findById(article.author)
              .select('email')
              .lean()) as IUser | null;

            if (profile) {
              // Now TypeScript knows profile has firstName and lastName properties
              authorName =
                `${profile.firstName} ${profile.lastName}`.trim() || 'User';
              authorAvatar = profile.image || DEFAULT_AVATAR;
            } else if (user) {
              // Fallback to email if profile not found
              authorName = user.email ? user.email.split('@')[0] : 'User';
            }
          } else if (article.authorType === 'psychologist') {
            // Get psychologist details
            const psychologist = (await Psychologist.findById(
              article.author
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
        const authHeader = req.headers.get('authorization');
        const currentUserId = authHeader ? authHeader.split(' ')[1] : null;
        const isOwner = currentUserId ? authorId === currentUserId : false;

        // Format date
        const publishDate = new Date(article.publishDate).toLocaleDateString(
          'en-US',
          {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          }
        );

        return {
          ...article,
          _id: article._id.toString(),
          author: {
            _id: authorId,
            name: authorName,
            avatar: authorAvatar,
          },
          publishDate,
          isOwner,
        };
      })
    );

    return NextResponse.json(
      createSuccessResponse(200, {
        articles: populatedArticles,
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
    console.error('Failed to fetch articles:', error);
    return NextResponse.json(
      createErrorResponse(500, 'Internal Server Error'),
      {
        status: 500,
      }
    );
  }
}
