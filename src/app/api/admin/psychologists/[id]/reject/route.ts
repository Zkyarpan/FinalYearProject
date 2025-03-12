'use server';

import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/db/db';
import Psychologist from '@/models/Psychologist';
import { createSuccessResponse, createErrorResponse } from '@/lib/response';
import { withAuth } from '@/middleware/authMiddleware';
import { sendRejectionEmail } from '@/helpers/sendEmailVerification';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  return withAuth(
    async (req: NextRequest, token: any) => {
      try {
        await connectDB();

        const { id } = params;
        const { feedback } = await req.json();

        if (!feedback || feedback.trim() === '') {
          return NextResponse.json(
            createErrorResponse(400, 'Feedback is required for rejection'),
            { status: 400 }
          );
        }

        // Find psychologist
        const psychologist = await Psychologist.findById(id);

        if (!psychologist) {
          return NextResponse.json(
            createErrorResponse(404, 'Psychologist not found'),
            { status: 404 }
          );
        }

        // Update approval status
        psychologist.approvalStatus = 'rejected';
        psychologist.rejectedAt = new Date();
        psychologist.adminFeedback = feedback;
        await psychologist.save();

        // Send rejection email
        try {
          await sendRejectionEmail(
            psychologist.email,
            psychologist.firstName,
            psychologist.lastName,
            feedback
          );
        } catch (emailError) {
          console.error('Error sending rejection email:', emailError);
          // Continue even if email fails
        }

        return NextResponse.json(
          createSuccessResponse(200, {
            message: 'Psychologist rejected successfully',
          }),
          { status: 200 }
        );
      } catch (error: any) {
        console.error('Error rejecting psychologist:', error);
        return NextResponse.json(
          createErrorResponse(500, error.message || 'Internal Server Error'),
          { status: 500 }
        );
      }
    },
    req,
    ['admin']
  );
}
