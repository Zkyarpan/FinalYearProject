import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/db/db';
import Psychologist from '@/models/Psychologist';
import { createSuccessResponse, createErrorResponse } from '@/lib/response';
import { withAuth } from '@/middleware/authMiddleware';
import { sendApprovalEmail } from '@/helpers/sendEmailVerification';

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  console.log('APPROVE API CALLED:', params.id); // Debug log

  return withAuth(
    async (req: NextRequest, token: any) => {
      try {
        await connectDB();

        const { id } = params;
        console.log('Finding psychologist with ID:', id); // Debug log

        // Find psychologist
        const psychologist = await Psychologist.findById(id);

        if (!psychologist) {
          console.log('Psychologist not found'); // Debug log
          return NextResponse.json(
            createErrorResponse(404, 'Psychologist not found'),
            { status: 404 }
          );
        }

        console.log('Found psychologist:', psychologist.email); // Debug log

        // Update approval status
        psychologist.approvalStatus = 'approved';
        psychologist.approvedAt = new Date();
        psychologist.adminFeedback = '';
        psychologist.country = psychologist.country || '';
        await psychologist.save();

        console.log('Psychologist approved and saved'); // Debug log

        // Send approval email
        try {
          await sendApprovalEmail(
            psychologist.email,
            psychologist.firstName,
            psychologist.lastName
          );
          console.log('Approval email sent'); // Debug log
        } catch (emailError) {
          console.error('Error sending approval email:', emailError);
          // Continue even if email fails
        }

        return NextResponse.json(
          createSuccessResponse(200, {
            message: 'Psychologist approved successfully',
            psychologist: {
              id: psychologist._id,
              email: psychologist.email,
              approvalStatus: psychologist.approvalStatus,
            },
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
