'use server';

import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/db/db';
import Exercise from '@/models/Exercise';
import UserExerciseProgress from '@/models/UserExerciseProgress';
import { createSuccessResponse, createErrorResponse } from '@/lib/response';
import { withAuth } from '@/middleware/authMiddleware';

// Get exercise by ID
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();

    const exerciseId = params.id;
    const exercise = await Exercise.findById(exerciseId).lean();

    if (!exercise) {
      return NextResponse.json(createErrorResponse(404, 'Exercise not found'), {
        status: 404,
      });
    }

    return NextResponse.json(createSuccessResponse(200, { exercise }), {
      status: 200,
    });
  } catch (error: any) {
    console.error('Error fetching exercise:', error);
    return NextResponse.json(
      createErrorResponse(500, error.message || 'Internal Server Error'),
      { status: 500 }
    );
  }
}

// Update exercise
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  return withAuth(
    async (req: NextRequest, token: any) => {
      try {
        await connectDB();

        const exerciseId = params.id;
        const body = await req.json();

        const exercise = await Exercise.findById(exerciseId);

        if (!exercise) {
          return NextResponse.json(
            createErrorResponse(404, 'Exercise not found'),
            { status: 404 }
          );
        }

        // Only creator or admin can update
        if (
          token.role !== 'admin' &&
          (token.role !== 'psychologist' ||
            exercise.createdBy.toString() !== token.userId)
        ) {
          return NextResponse.json(
            createErrorResponse(403, 'Unauthorized to update this exercise'),
            { status: 403 }
          );
        }

        // Update fields
        const updatedExercise = await Exercise.findByIdAndUpdate(
          exerciseId,
          { ...body },
          { new: true }
        );

        return NextResponse.json(
          createSuccessResponse(200, {
            message: 'Exercise updated successfully',
            exercise: updatedExercise,
          }),
          { status: 200 }
        );
      } catch (error: any) {
        console.error('Error updating exercise:', error);
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

// Delete exercise
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  return withAuth(
    async (req: NextRequest, token: any) => {
      try {
        await connectDB();

        const exerciseId = params.id;
        const exercise = await Exercise.findById(exerciseId);

        if (!exercise) {
          return NextResponse.json(
            createErrorResponse(404, 'Exercise not found'),
            { status: 404 }
          );
        }

        // Only creator or admin can delete
        if (
          token.role !== 'admin' &&
          (token.role !== 'psychologist' ||
            exercise.createdBy.toString() !== token.userId)
        ) {
          return NextResponse.json(
            createErrorResponse(403, 'Unauthorized to delete this exercise'),
            { status: 403 }
          );
        }

        await Exercise.findByIdAndDelete(exerciseId);

        // Also delete all user progress for this exercise
        await UserExerciseProgress.deleteMany({ exercise: exerciseId });

        return NextResponse.json(
          createSuccessResponse(200, {
            message: 'Exercise deleted successfully',
          }),
          { status: 200 }
        );
      } catch (error: any) {
        console.error('Error deleting exercise:', error);
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
