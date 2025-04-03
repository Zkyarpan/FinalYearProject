'use server';

// app/api/exercises/recommendations/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/db/db';
import PsychologistRecommendation from '@/models/PsychologistRecommendation';
import { createSuccessResponse, createErrorResponse } from '@/lib/response';
import { withAuth } from '@/middleware/authMiddleware';

// Get specific recommendation details
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  return withAuth(
    async (req: NextRequest, token: any) => {
      try {
        await connectDB();

        const recommendationId = params.id;

        // Find the recommendation with populated fields
        const recommendation = await PsychologistRecommendation.findById(
          recommendationId
        )
          .populate('exercise')
          .populate('psychologist', 'email')
          .populate('patient', 'email')
          .lean();

        if (!recommendation) {
          return NextResponse.json(
            createErrorResponse(404, 'Recommendation not found'),
            { status: 404 }
          );
        }

        // Check authorization - only the patient or admin can view details
        if (
          token.role !== 'admin' &&
          (recommendation as any).patient.toString() !== token.userId
        ) {
          return NextResponse.json(
            createErrorResponse(
              403,
              'Unauthorized to view this recommendation'
            ),
            { status: 403 }
          );
        }

        return NextResponse.json(
          createSuccessResponse(200, { recommendation }),
          { status: 200 }
        );
      } catch (error: any) {
        console.error('Error fetching recommendation details:', error);
        return NextResponse.json(
          createErrorResponse(500, error.message || 'Internal Server Error'),
          { status: 500 }
        );
      }
    },
    req,
    ['user', 'psychologist', 'admin']
  );
}

// Update recommendation status (for patients)
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  return withAuth(
    async (req: NextRequest, token: any) => {
      try {
        await connectDB();

        const recommendationId = params.id;
        const { status } = await req.json();

        if (
          !['pending', 'viewed', 'started', 'completed', 'skipped'].includes(
            status
          )
        ) {
          return NextResponse.json(
            createErrorResponse(400, 'Invalid status value'),
            { status: 400 }
          );
        }

        // Find the recommendation
        const recommendation =
          await PsychologistRecommendation.findById(recommendationId);

        if (!recommendation) {
          return NextResponse.json(
            createErrorResponse(404, 'Recommendation not found'),
            { status: 404 }
          );
        }

        // Check authorization - only the patient or admin can update status
        if (
          token.role !== 'admin' &&
          recommendation.patient.toString() !== token.userId
        ) {
          return NextResponse.json(
            createErrorResponse(
              403,
              'Unauthorized to update this recommendation'
            ),
            { status: 403 }
          );
        }

        // Update the recommendation
        const updateData: any = { status };

        // If status is completed, also update isCompleted and completedAt
        if (status === 'completed') {
          updateData.isCompleted = true;
          updateData.completedAt = new Date();
        }

        const updatedRecommendation =
          await PsychologistRecommendation.findByIdAndUpdate(
            recommendationId,
            updateData,
            { new: true }
          );

        return NextResponse.json(
          createSuccessResponse(200, {
            message: 'Recommendation status updated successfully',
            recommendation: updatedRecommendation,
          }),
          { status: 200 }
        );
      } catch (error: any) {
        console.error('Error updating recommendation status:', error);
        return NextResponse.json(
          createErrorResponse(500, error.message || 'Internal Server Error'),
          { status: 500 }
        );
      }
    },
    req,
    ['user', 'admin']
  );
}

// Delete recommendation (for psychologists)
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  return withAuth(
    async (req: NextRequest, token: any) => {
      try {
        await connectDB();

        const recommendationId = params.id;

        // Find the recommendation
        const recommendation =
          await PsychologistRecommendation.findById(recommendationId);

        if (!recommendation) {
          return NextResponse.json(
            createErrorResponse(404, 'Recommendation not found'),
            { status: 404 }
          );
        }

        // Check authorization - only the psychologist who created it or admin can delete
        if (
          token.role !== 'admin' &&
          (token.role !== 'psychologist' ||
            recommendation.psychologist.toString() !== token.userId)
        ) {
          return NextResponse.json(
            createErrorResponse(
              403,
              'Unauthorized to delete this recommendation'
            ),
            { status: 403 }
          );
        }

        await PsychologistRecommendation.findByIdAndDelete(recommendationId);

        return NextResponse.json(
          createSuccessResponse(200, {
            message: 'Recommendation deleted successfully',
          }),
          { status: 200 }
        );
      } catch (error: any) {
        console.error('Error deleting recommendation:', error);
        return NextResponse.json(
          createErrorResponse(500, error.message || 'Internal Server Error'),
          { status: 500 }
        );
      }
    },
    req,
    ['psychologist', 'admin']
  );
}

// Update recommendation details (for psychologists)
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  return withAuth(
    async (req: NextRequest, token: any) => {
      try {
        await connectDB();

        const recommendationId = params.id;
        const { note, dueDate } = await req.json();

        // Find the recommendation
        const recommendation =
          await PsychologistRecommendation.findById(recommendationId);

        if (!recommendation) {
          return NextResponse.json(
            createErrorResponse(404, 'Recommendation not found'),
            { status: 404 }
          );
        }

        // Check authorization - only the psychologist who created it or admin can update
        if (
          token.role !== 'admin' &&
          (token.role !== 'psychologist' ||
            recommendation.psychologist.toString() !== token.userId)
        ) {
          return NextResponse.json(
            createErrorResponse(
              403,
              'Unauthorized to update this recommendation'
            ),
            { status: 403 }
          );
        }

        // Update fields
        const updateData: any = {};
        if (note !== undefined) updateData.note = note;
        if (dueDate !== undefined) updateData.dueDate = dueDate;

        const updatedRecommendation =
          await PsychologistRecommendation.findByIdAndUpdate(
            recommendationId,
            updateData,
            { new: true }
          );

        return NextResponse.json(
          createSuccessResponse(200, {
            message: 'Recommendation updated successfully',
            recommendation: updatedRecommendation,
          }),
          { status: 200 }
        );
      } catch (error: any) {
        console.error('Error updating recommendation:', error);
        return NextResponse.json(
          createErrorResponse(500, error.message || 'Internal Server Error'),
          { status: 500 }
        );
      }
    },
    req,
    ['psychologist', 'admin']
  );
}
