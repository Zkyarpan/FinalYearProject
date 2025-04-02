'use server';

import { NextRequest, NextResponse } from 'next/server';
import { Types, PipelineStage } from 'mongoose';
import connectDB from '@/db/db';
import { withAuth } from '@/middleware/authMiddleware';
import { createSuccessResponse, createErrorResponse } from '@/lib/response';
import Appointment, { AppointmentStatus } from '@/models/Appointment';

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  return withAuth(
    async (req: NextRequest, token: any) => {
      try {
        // Check if user is admin
        if (token.role !== 'admin') {
          return NextResponse.json(
            createErrorResponse(
              403,
              'Access denied. Admin privileges required.'
            ),
            { status: 403 }
          );
        }

        const appointmentId = params.id;

        // Validate the appointment ID
        if (!appointmentId || !Types.ObjectId.isValid(appointmentId)) {
          return NextResponse.json(
            createErrorResponse(400, 'Invalid appointment ID'),
            { status: 400 }
          );
        }

        await connectDB();

        // Get cancellation reason from request body
        const body = await req.json().catch(() => ({}));

        // Update appointment to canceled status
        const updatedAppointment = await Appointment.findByIdAndUpdate(
          appointmentId,
          {
            $set: {
              status: AppointmentStatus.CANCELED,
              isCanceled: true,
              canceledAt: new Date(),
              canceledBy: new Types.ObjectId(token.id),
              cancelationReason: body.reason || 'Canceled by admin',
            },
          },
          { new: true }
        );

        if (!updatedAppointment) {
          return NextResponse.json(
            createErrorResponse(404, 'Appointment not found'),
            { status: 404 }
          );
        }

        // Release any availability slot (if applicable)
        try {
          await Appointment.prototype.cancel.call(
            updatedAppointment,
            new Types.ObjectId(token.id),
            body.reason || 'Canceled by admin'
          );
        } catch (cancelError) {
          console.error('Error releasing availability slot:', cancelError);
          // Continue anyway as the appointment itself was canceled
        }

        return NextResponse.json(
          createSuccessResponse(200, {
            appointment: updatedAppointment,
            message: 'Appointment canceled successfully',
          }),
          { status: 200 }
        );
      } catch (error: any) {
        console.error('Error canceling appointment:', error);
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
