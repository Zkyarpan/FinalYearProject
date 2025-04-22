import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/db/db';
import Psychologist from '@/models/Psychologist';
import { createSuccessResponse, createErrorResponse } from '@/lib/response';
import { withAuth } from '@/middleware/authMiddleware';
import { sendRejectionEmail } from '@/helpers/sendEmailVerification';

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  console.log('REJECT API CALLED:', params.id); // Debug log

  return withAuth(
    async (req: NextRequest, token: any) => {
      try {
        await connectDB();

        const { id } = params;
        console.log('Finding psychologist with ID:', id); // Debug log

        let feedback = '';

        try {
          // Try to parse the request body
          const body = await req.json();
          feedback = body.feedback || '';
        } catch (e) {
          console.log('No request body or invalid JSON'); // Debug log
        }

        if (!feedback || feedback.trim() === '') {
          feedback =
            'Your application has been reviewed and was not approved at this time.';
          console.log('Using default rejection feedback'); // Debug log
        }

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
        psychologist.approvalStatus = 'rejected';
        psychologist.rejectedAt = new Date();
        psychologist.adminFeedback = feedback;
        await psychologist.save();

        console.log('Psychologist rejected and saved'); // Debug log

        // Send rejection email
        try {
          await sendRejectionEmail(
            psychologist.email,
            psychologist.firstName,
            psychologist.lastName,
            feedback
          );
          console.log('Rejection email sent'); // Debug log
        } catch (emailError) {
          console.error('Error sending rejection email:', emailError);
          // Continue even if email fails
        }

        return NextResponse.json(
          createSuccessResponse(200, {
            message: 'Psychologist rejected successfully',
            psychologist: {
              id: psychologist._id,
              email: psychologist.email,
              approvalStatus: psychologist.approvalStatus,
            },
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
