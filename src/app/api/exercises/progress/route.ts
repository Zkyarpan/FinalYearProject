'use server';

import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/db/db';
import UserExerciseProgress from '@/models/UserExerciseProgress';
import Exercise from '@/models/Exercise';
import { createSuccessResponse, createErrorResponse } from '@/lib/response';
import { withAuth } from '@/middleware/authMiddleware';

// Get user's progress for all exercises
export async function GET(req: NextRequest) {
  return withAuth(
    async (req: NextRequest, token: any) => {
      try {
        await connectDB();

        const userId = token.userId;

        // Fetch user's progress for all exercises
        const progress = await UserExerciseProgress.find({ user: userId })
          .populate('exercise')
          .lean();

        return NextResponse.json(createSuccessResponse(200, { progress }), {
          status: 200,
        });
      } catch (error: any) {
        console.error('Error fetching user progress:', error);
        return NextResponse.json(
          createErrorResponse(500, error.message || 'Internal Server Error'),
          { status: 500 }
        );
      }
    },
    req,
    ['user', 'admin', 'psychologist']
  );
}

// Update or create user's progress for an exercise
export async function POST(req: NextRequest) {
  return withAuth(
    async (req: NextRequest, token: any) => {
      try {
        await connectDB();

        const userId = token.userId;
        const { exerciseId, isCompleted, progress, isLiked, notes } =
          await req.json();

        if (!exerciseId) {
          return NextResponse.json(
            createErrorResponse(400, 'Exercise ID is required'),
            { status: 400 }
          );
        }

        // Check if exercise exists
        const exerciseExists = await Exercise.exists({ _id: exerciseId });
        if (!exerciseExists) {
          return NextResponse.json(
            createErrorResponse(404, 'Exercise not found'),
            { status: 404 }
          );
        }

        // Update or create progress
        const updateData: any = {};
        if (isCompleted !== undefined) updateData.isCompleted = isCompleted;
        if (progress !== undefined) updateData.progress = progress;
        if (isLiked !== undefined) updateData.isLiked = isLiked;
        if (notes !== undefined) updateData.notes = notes;

        // Mark as completed if needed
        if (isCompleted) {
          updateData.lastCompletedAt = new Date();
          updateData.$inc = { timesCompleted: 1 };
        }

        const userProgress = await UserExerciseProgress.findOneAndUpdate(
          { user: userId, exercise: exerciseId },
          {
            ...updateData,
            $setOnInsert: { user: userId, exercise: exerciseId },
          },
          { upsert: true, new: true }
        );

        // Update exercise completion count
        if (isCompleted) {
          await Exercise.findByIdAndUpdate(exerciseId, {
            $inc: { completions: 1 },
          });
        }

        // Update exercise likes count
        if (isLiked !== undefined) {
          const previousProgress = await UserExerciseProgress.findOne({
            user: userId,
            exercise: exerciseId,
          });

          if (!previousProgress || previousProgress.isLiked !== isLiked) {
            await Exercise.findByIdAndUpdate(exerciseId, {
              $inc: { likes: isLiked ? 1 : -1 },
            });
          }
        }

        return NextResponse.json(
          createSuccessResponse(200, {
            message: 'Progress updated successfully',
            progress: userProgress,
          }),
          { status: 200 }
        );
      } catch (error: any) {
        console.error('Error updating progress:', error);
        return NextResponse.json(
          createErrorResponse(500, error.message || 'Internal Server Error'),
          { status: 500 }
        );
      }
    },
    req,
    ['user', 'admin', 'psychologist']
  );
}
