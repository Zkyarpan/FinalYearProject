import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import connectDB from '@/db/db';
import Assessment from '@/models/Assessment';
import { createSuccessResponse, createErrorResponse } from '@/lib/response';
import { withAuth } from '@/middleware/authMiddleware';
import mongoose from 'mongoose';

interface Params {
  params: {
    id: string;
  };
}

// Get a specific assessment by ID
export async function GET(req: NextRequest, { params }: Params) {
  try {
    const { id } = params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        createErrorResponse(400, 'Invalid assessment ID'),
        { status: 400 }
      );
    }

    await connectDB();

    const assessment = await Assessment.findById(id)
      .populate('createdBy', 'firstName lastName email')
      .lean();

    if (!assessment) {
      return NextResponse.json(
        createErrorResponse(404, 'Assessment not found'),
        { status: 404 }
      );
    }

    // For published assessments, no auth required
    return NextResponse.json(createSuccessResponse(200, { assessment }), {
      status: 200,
    });
  } catch (error: any) {
    console.error('Error fetching assessment:', error);
    return NextResponse.json(
      createErrorResponse(500, error.message || 'Internal Server Error'),
      { status: 500 }
    );
  }
}

// Update an assessment (only for creator, psychologists or admins)
export async function PUT(req: NextRequest, { params }: Params) {
  return withAuth(
    async (req: NextRequest, token: any) => {
      try {
        const { id } = params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
          return NextResponse.json(
            createErrorResponse(400, 'Invalid assessment ID'),
            { status: 400 }
          );
        }

        await connectDB();

        const assessment = await Assessment.findById(id);

        if (!assessment) {
          return NextResponse.json(
            createErrorResponse(404, 'Assessment not found'),
            { status: 404 }
          );
        }

        // Check if user has permission to update
        if (
          assessment.createdBy.toString() !== token.id &&
          !['admin'].includes(token.role)
        ) {
          return NextResponse.json(
            createErrorResponse(
              403,
              'You do not have permission to update this assessment'
            ),
            { status: 403 }
          );
        }

        const data = await req.json();

        // Update the assessment
        // Increment version if the assessment is published
        if (assessment.isPublished && !data.isPublished) {
          data.version = assessment.version + 1;
        }

        data.updatedAt = new Date();

        const updatedAssessment = await Assessment.findByIdAndUpdate(
          id,
          { $set: data },
          { new: true }
        );

        return NextResponse.json(
          createSuccessResponse(200, {
            message: 'Assessment updated successfully',
            assessment: updatedAssessment,
          }),
          { status: 200 }
        );
      } catch (error: any) {
        console.error('Error updating assessment:', error);
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

// Delete an assessment (only for creator or admins)
export async function DELETE(req: NextRequest, { params }: Params) {
  return withAuth(
    async (req: NextRequest, token: any) => {
      try {
        const { id } = params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
          return NextResponse.json(
            createErrorResponse(400, 'Invalid assessment ID'),
            { status: 400 }
          );
        }

        await connectDB();

        const assessment = await Assessment.findById(id);

        if (!assessment) {
          return NextResponse.json(
            createErrorResponse(404, 'Assessment not found'),
            { status: 404 }
          );
        }

        // Only creator or admin can delete
        if (
          assessment.createdBy.toString() !== token.id &&
          token.role !== 'admin'
        ) {
          return NextResponse.json(
            createErrorResponse(
              403,
              'You do not have permission to delete this assessment'
            ),
            { status: 403 }
          );
        }

        await Assessment.findByIdAndDelete(id);

        return NextResponse.json(
          createSuccessResponse(200, {
            message: 'Assessment deleted successfully',
          }),
          { status: 200 }
        );
      } catch (error: any) {
        console.error('Error deleting assessment:', error);
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
