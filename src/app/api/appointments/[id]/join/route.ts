'use server';

import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import connectDB from '@/db/db';
import { withAuth } from '@/middleware/authMiddleware';
import { createErrorResponse, createSuccessResponse } from '@/lib/response';
import Appointment, { AppointmentStatus } from '@/models/Appointment';

// Handle marking an appointment as joined/started
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  return withAuth(async (req: NextRequest, token: any) => {
    try {
      await connectDB();

      const appointmentId = params.id;

      // Validate appointment ID
      if (!mongoose.Types.ObjectId.isValid(appointmentId)) {
        return NextResponse.json(
          createErrorResponse(400, 'Invalid appointment ID')
        );
      }

      // Get the appointment
      const appointment = await mongoose.connection
        .collection('appointments')
        .findOne({
          _id: new mongoose.Types.ObjectId(appointmentId),
        });

      if (!appointment) {
        return NextResponse.json(
          createErrorResponse(404, 'Appointment not found')
        );
      }

      // Check if user has permission to join this appointment
      const isAuthorized =
        appointment.userId.toString() === token.id ||
        appointment.psychologistId.toString() === token.id;

      if (!isAuthorized) {
        return NextResponse.json(
          createErrorResponse(
            403,
            'You are not authorized to access this appointment'
          )
        );
      }

      // Check if appointment is in an appropriate state to join
      if (appointment.status === AppointmentStatus.CANCELED) {
        return NextResponse.json(
          createErrorResponse(400, 'Cannot join a canceled appointment')
        );
      }

      if (appointment.status === AppointmentStatus.COMPLETED) {
        return NextResponse.json(
          createErrorResponse(
            400,
            'This appointment has already been completed'
          )
        );
      }

      // Update appointment status
      const now = new Date();
      await mongoose.connection.collection('appointments').updateOne(
        { _id: new mongoose.Types.ObjectId(appointmentId) },
        {
          $set: {
            status: AppointmentStatus.ONGOING,
            joinedAt: now,
            updatedAt: now,
          },
        }
      );

      // Also update the availability slot if needed
      await mongoose.connection.collection('availabilities').updateOne(
        {
          psychologistId: appointment.psychologistId,
          'slots.appointmentId': new mongoose.Types.ObjectId(appointmentId),
        },
        {
          $set: {
            'slots.$.status': 'in_progress',
            'slots.$.sessionStartedAt': now,
            'slots.$.lastUpdated': now,
          },
        }
      );

      return NextResponse.json(
        createSuccessResponse(200, {
          message: 'Session started successfully',
          appointmentId,
          status: AppointmentStatus.ONGOING,
        })
      );
    } catch (error: any) {
      console.error('Error starting session:', error);
      return NextResponse.json(
        createErrorResponse(500, `Internal Server Error: ${error.message}`)
      );
    }
  }, req);
}
