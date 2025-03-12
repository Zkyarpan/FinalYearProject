'use server';

import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/db/db';
import Psychologist from '@/models/Psychologist';
import { createSuccessResponse, createErrorResponse } from '@/lib/response';
import { withAuth } from '@/middleware/authMiddleware';

export async function GET(req: NextRequest) {
  return withAuth(
    async (req: NextRequest, token: any) => {
      try {
        await connectDB();

        // Find the psychologist
        const psychologist = await Psychologist.findById(token.id).select(
          'approvalStatus adminFeedback isVerified'
        );

        if (!psychologist) {
          return NextResponse.json(
            createErrorResponse(404, 'Psychologist not found'),
            { status: 404 }
          );
        }

        if (!psychologist.isVerified) {
          return NextResponse.json(
            createErrorResponse(400, 'Email not verified'),
            { status: 400 }
          );
        }

        return NextResponse.json(
          createSuccessResponse(200, {
            approvalStatus: psychologist.approvalStatus,
            adminFeedback: psychologist.adminFeedback || '',
          }),
          { status: 200 }
        );
      } catch (error: any) {
        console.error('Error fetching psychologist status:', error);
        return NextResponse.json(
          createErrorResponse(500, error.message || 'Internal Server Error'),
          { status: 500 }
        );
      }
    },
    req,
    ['psychologist']
  );
}
