'use server';

import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/db/db';
import Psychologist from '@/models/Psychologist';
import { createSuccessResponse, createErrorResponse } from '@/lib/response';
import { withAuth } from '@/middleware/authMiddleware';

interface Params {
  params: {
    id: string;
  };
}

export async function PATCH(req: NextRequest, { params }: Params) {
  return withAuth(
    async (req: NextRequest, token: any) => {
      try {
        await connectDB();
        console.log(`Updating psychologist ${params.id} status`);

        // Parse the request body to get the new status
        const body = await req.json();
        const status = body.status as 'approved' | 'rejected' | 'pending';

        if (!['approved', 'rejected', 'pending'].includes(status)) {
          console.log(`Invalid status: ${status}`);
          return NextResponse.json(
            createErrorResponse(400, 'Invalid status parameter'),
            { status: 400 }
          );
        }

        // Update the psychologist's approval status
        const psychologist = await Psychologist.findByIdAndUpdate(
          params.id,
          { approvalStatus: status },
          { new: true }
        ).select('-password');

        if (!psychologist) {
          console.log(`Psychologist ${params.id} not found`);
          return NextResponse.json(
            createErrorResponse(404, 'Psychologist not found'),
            { status: 404 }
          );
        }

        console.log(
          `Successfully updated psychologist ${params.id} status to ${status}`
        );

        // If approval status changed to approved/rejected, send email notification
        if (status === 'approved' || status === 'rejected') {
          // In a real implementation, you would send an email to the psychologist here
          console.log(
            `Would send email to ${psychologist.email} about ${status} status`
          );
        }

        return NextResponse.json(
          createSuccessResponse(200, {
            message: `Psychologist status updated to ${status}`,
            psychologist,
          }),
          { status: 200 }
        );
      } catch (error: any) {
        console.error('Error updating psychologist status:', error);
        return NextResponse.json(
          createErrorResponse(500, error.message || 'Internal Server Error'),
          { status: 500 }
        );
      }
    },
    req,
    ['admin'] // Only admin users can update psychologist status
  );
}
