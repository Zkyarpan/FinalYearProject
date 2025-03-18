'use server';

import { NextResponse } from 'next/server';
import connectDB from '@/db/db';
import Story from '@/models/Stories';
import Profile from '@/models/Profile';
import { createErrorResponse, createSuccessResponse } from '@/lib/response';

export async function GET() {
  try {
    await connectDB();

    const stories = await Story.find()
      .select(
        'title content storyImage author category tags publishDate readTime'
      )
      .sort({ publishDate: -1 })
      .lean();

    if (!stories || stories.length === 0) {
      return NextResponse.json(createSuccessResponse(200, { stories: [] }));
    }

    const authorIds = stories.map(story => story.author).filter(id => !!id);

    const profiles = await Profile.find({
      user: { $in: authorIds },
    })
      .select('user firstName lastName image')
      .lean();

    const profileMap = new Map(
      profiles.map(profile => [profile.user.toString(), profile])
    );

    interface StoryDocument {
      _id: any;
      title?: string;
      content?: string;
      storyImage?: string;
      author?: any;
      category?: string;
      tags?: string[];
      readTime?: string;
      publishDate?: Date;
      __v?: number;
    }

    const formattedStories = stories.map((story: StoryDocument) => {
      const authorId = story.author?.toString();
      const authorProfile = authorId ? profileMap.get(authorId) : null;

      return {
        _id: story._id.toString(),
        title: story.title || 'Untitled',
        content: story.content || '',
        storyImage: story.storyImage || '/default-story-image.jpg',
        category: story.category || 'Uncategorized',
        tags: Array.isArray(story.tags) ? story.tags : [],
        readTime: story.readTime || '1 min read',
        author: {
          _id: authorId || '',
          name: authorProfile
            ? `${authorProfile.firstName} ${authorProfile.lastName}`
            : 'Anonymous Author',
          avatar: authorProfile?.image || '/default-avatar.jpg',
        },
        publishDate: story.publishDate
          ? new Date(story.publishDate).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })
          : 'Date not available',
      };
    });

    return NextResponse.json(
      createSuccessResponse(200, { stories: formattedStories })
    );
  } catch (error) {
    console.error('Failed to fetch stories:', error);
    return NextResponse.json(
      createErrorResponse(500, 'Failed to fetch stories')
    );
  }
}
