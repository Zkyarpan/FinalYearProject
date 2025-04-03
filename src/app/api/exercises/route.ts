'use server';

import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/db/db';
import Exercise from '@/models/Exercise';
import { createSuccessResponse, createErrorResponse } from '@/lib/response';
import { withAuth } from '@/middleware/authMiddleware';

// Get all exercises
export async function GET(req: NextRequest) {
  try {
    await connectDB();

    // Parse query parameters
    const url = new URL(req.url);
    const type = url.searchParams.get('type');
    const difficulty = url.searchParams.get('difficulty');
    const duration = url.searchParams.get('duration');
    const isRecommended = url.searchParams.get('isRecommended');
    const limit = parseInt(url.searchParams.get('limit') || '10');
    const page = parseInt(url.searchParams.get('page') || '1');

    const query: any = { isPublished: true };

    // Apply filters
    if (type) query.type = type;
    if (difficulty) query.difficulty = difficulty;
    if (duration) {
      // Duration filter can be like "<=15", "15-30", ">30"
      if (duration.includes('-')) {
        const [min, max] = duration.split('-').map(Number);
        query.duration = { $gte: min, $lte: max };
      } else if (duration.startsWith('<=')) {
        query.duration = { $lte: parseInt(duration.substring(2)) };
      } else if (duration.startsWith('>')) {
        query.duration = { $gt: parseInt(duration.substring(1)) };
      }
    }
    if (isRecommended === 'true') query.isRecommended = true;

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Fetch exercises with pagination
    const exercises = await Exercise.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    // Get total count for pagination
    const totalExercises = await Exercise.countDocuments(query);

    return NextResponse.json(
      createSuccessResponse(200, {
        exercises,
        pagination: {
          total: totalExercises,
          page,
          limit,
          totalPages: Math.ceil(totalExercises / limit),
        },
      }),
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error fetching exercises:', error);
    return NextResponse.json(
      createErrorResponse(500, error.message || 'Internal Server Error'),
      { status: 500 }
    );
  }
}

// Create a new exercise
export async function POST(req: NextRequest) {
  return withAuth(
    async (req: NextRequest, token: any) => {
      try {
        await connectDB();

        const body = await req.json();
        const {
          title,
          description,
          type,
          duration,
          difficulty,
          mediaUrl,
          thumbnailUrl,
          instructions,
          benefits,
          isPublished,
          isRecommended,
          tags,
        } = body;

        // Validation
        if (
          !title ||
          !description ||
          !type ||
          !duration ||
          !difficulty ||
          !instructions ||
          !benefits
        ) {
          return NextResponse.json(
            createErrorResponse(400, 'Missing required fields'),
            { status: 400 }
          );
        }

        // Only admin and psychologist can create exercises
        if (token.role !== 'admin' && token.role !== 'psychologist') {
          return NextResponse.json(createErrorResponse(403, 'Unauthorized'), {
            status: 403,
          });
        }

        // Create new exercise
        const exercise = await Exercise.create({
          title,
          description,
          type,
          duration,
          difficulty,
          mediaUrl,
          thumbnailUrl,
          instructions: Array.isArray(instructions)
            ? instructions
            : [instructions],
          benefits: Array.isArray(benefits) ? benefits : [benefits],
          createdBy: token.userId,
          creatorRole: token.role,
          isPublished: isPublished !== undefined ? isPublished : true,
          isRecommended: isRecommended || false,
          tags: tags || [],
        });

        return NextResponse.json(
          createSuccessResponse(201, {
            message: 'Exercise created successfully',
            exercise,
          }),
          { status: 201 }
        );
      } catch (error: any) {
        console.error('Error creating exercise:', error);
        return NextResponse.json(
          createErrorResponse(500, error.message || 'Internal Server Error'),
          { status: 500 }
        );
      }
    },
    req,
    ['admin', 'psychologist']
  );
}
