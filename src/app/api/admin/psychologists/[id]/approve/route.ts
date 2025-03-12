'use server';

import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/db/db';
import Psychologist from '@/models/Psychologist';
import { createSuccessResponse, createErrorResponse } from '@/lib/response';
import { withAuth } from '@/middleware/authMiddleware';
import { sendApprovalEmail } from '@/helpers/sendEmailVerification';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  return withAuth(
    async (req: NextRequest, token: any) => {
      try {
        await connectDB();

        const { id } = params;

        // Find psychologist
        const psychologist = await Psychologist.findById(id);

        if (!psychologist) {
          return NextResponse.json(
            createErrorResponse(404, 'Psychologist not found'),
            { status: 404 }
          );
        }

        // Update approval status
        psychologist.approvalStatus = 'approved';
        psychologist.approvedAt = new Date();
        psychologist.adminFeedback = ''; // Clear any previous feedback
        await psychologist.save();

        // Send approval email
        try {
          await sendApprovalEmail(
            psychologist.email,
            psychologist.firstName,
            psychologist.lastName
          );
        } catch (emailError) {
          console.error('Error sending approval email:', emailError);
          // Continue even if email fails
        }

        return NextResponse.json(
          createSuccessResponse(200, {
            message: 'Psychologist approved successfully',
          }),
          { status: 200 }
        );
      } catch (error: any) {
        console.error('Error approving psychologist:', error);
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
