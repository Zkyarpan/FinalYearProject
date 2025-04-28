'use server';

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import connectDB from '@/db/db';
import UserAssessment from '@/models/UserAssessment';
import { createSuccessResponse, createErrorResponse } from '@/lib/response';
import { withAuth } from '@/middleware/authMiddleware';
import mongoose from 'mongoose';

interface Params {
  params: {
    id: string;
  };
}

export async function GET(req: NextRequest, { params }: Params) {
  return withAuth(async (req: NextRequest, token: any) => {
    try {
      const { id } = params;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return NextResponse.json(
          createErrorResponse(400, 'Invalid assessment result ID'),
          { status: 400 }
        );
      }

      await connectDB();

      // Get the user assessment
      const userAssessment = await UserAssessment.findById(id)
        .populate('assessmentId', 'title description categories')
        .lean<{ userId: mongoose.Types.ObjectId }>();

      if (!userAssessment) {
        return NextResponse.json(
          createErrorResponse(404, 'Assessment result not found'),
          { status: 404 }
        );
      }

      // Check if user has permission to view this result
      if (
        userAssessment.userId.toString() !== token.id &&
        !['admin', 'psychologist'].includes(token.role)
      ) {
        return NextResponse.json(
          createErrorResponse(
            403,
            'You do not have permission to view this result'
          ),
          { status: 403 }
        );
      }

      // If psychologist, check if this is their patient (in a real app)
      if (
        token.role === 'psychologist' &&
        userAssessment.userId.toString() !== token.id
      ) {
        // In a real app, check if the assessment belongs to a patient of this psychologist
        // For now, we'll just allow it
      }

      return NextResponse.json(
        createSuccessResponse(200, { result: userAssessment }),
        { status: 200 }
      );
    } catch (error: any) {
      console.error('Error fetching assessment result:', error);
      return NextResponse.json(
        createErrorResponse(500, error.message || 'Internal Server Error'),
        { status: 500 }
      );
    }
  }, req);
}
