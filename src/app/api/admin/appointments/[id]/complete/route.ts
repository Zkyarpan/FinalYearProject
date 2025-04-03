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

        // Check if the appointment exists and isn't already completed or canceled
        const appointment = await Appointment.findById(appointmentId);

        if (!appointment) {
          return NextResponse.json(
            createErrorResponse(404, 'Appointment not found'),
            { status: 404 }
          );
        }

        if (appointment.status === AppointmentStatus.CANCELED) {
          return NextResponse.json(
            createErrorResponse(400, 'Cannot complete a canceled appointment'),
            { status: 400 }
          );
        }

        if (appointment.status === AppointmentStatus.COMPLETED) {
          return NextResponse.json(
            createSuccessResponse(200, {
              appointment,
              message: 'Appointment is already marked as completed',
            }),
            { status: 200 }
          );
        }

        // Mark the appointment as completed
        appointment.status = AppointmentStatus.COMPLETED;
        appointment.completedAt = new Date();
        await appointment.save();

        return NextResponse.json(
          createSuccessResponse(200, {
            appointment,
            message: 'Appointment marked as completed successfully',
          }),
          { status: 200 }
        );
      } catch (error: any) {
        console.error('Error completing appointment:', error);
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
