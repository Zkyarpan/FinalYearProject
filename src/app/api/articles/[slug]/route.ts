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

interface ArticleDocument {
  _id: Types.ObjectId;
  title: string;
  content: string;
  articleImage: string;
  category: string;
  tags: string[];
  readTime: number;
  publishDate: Date;
  author: Types.ObjectId;
  authorType: 'user' | 'psychologist';
}

export async function GET(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    await connectDB();

    const slug = params.slug;

    if (!slug) {
      return NextResponse.json(
        createErrorResponse(400, 'Article identifier is required'),
        { status: 400 }
      );
    }

    let article: ArticleDocument | null = null;

    // Check if the slug is a valid MongoDB ObjectId
    const isValidObjectId = /^[0-9a-fA-F]{24}$/.test(slug);

    if (isValidObjectId) {
      // If it's a valid ObjectId, find the article directly by ID
      article = (await Article.findById(slug).lean()) as ArticleDocument | null;
    }

    // If not found by ID, try to find by slug (processed title)
    if (!article) {
      const normalizedSearchString = decodeURIComponent(slug)
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

      article = (await Article.findOne({
        $or: searchQueries,
      }).lean()) as ArticleDocument | null;
    }

    if (!article) {
      console.log('Article not found for identifier:', slug);
      return NextResponse.json(createErrorResponse(404, 'Article not found'), {
        status: 404,
      });
    }

    // Default author information
    let authorName = 'Unknown';
    let authorAvatar = DEFAULT_AVATAR;
    let authorId = article.author.toString();

    try {
      // Get author information based on authorType
      if (article.authorType === 'user') {
        // Get user profile
        const profile = (await Profile.findOne({
          user: article.author,
        }).lean()) as IProfile | null;

        const user = (await User.findById(article.author)
          .select('email')
          .lean()) as IUser | null;

        if (profile) {
          // Now TypeScript knows profile has firstName and lastName
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
    const publishDate = new Date(article.publishDate).toISOString();

    const formattedArticle = {
      _id: article._id.toString(),
      title: article.title,
      content: article.content,
      articleImage: article.articleImage || '',
      category: article.category,
      tags: article.tags || [],
      readTime: article.readTime,
      author: {
        _id: authorId,
        name: authorName,
        avatar: authorAvatar,
      },
      publishDate: publishDate,
      isOwner: isOwner,
    };

    return NextResponse.json(
      createSuccessResponse(200, {
        message: 'Article fetch successful',
        article: formattedArticle,
      }),
      { status: 200 }
    );
  } catch (error) {
    console.error('Server error:', error);

    if (error instanceof Error && error.name === 'CastError') {
      return NextResponse.json(
        createErrorResponse(400, 'Invalid article identifier format'),
        { status: 400 }
      );
    }

    return NextResponse.json(
      createErrorResponse(500, 'Internal Server Error'),
      { status: 500 }
    );
  }
}
