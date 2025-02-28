'use server';

import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import connectDB from '@/db/db';
import { withAuth } from '@/middleware/authMiddleware';
import { createErrorResponse, createSuccessResponse } from '@/lib/response';
import Appointment from '@/models/Appointment';

export async function GET(req: NextRequest) {
  return withAuth(async (req: NextRequest, token: any) => {
    try {
      await connectDB();

      const canceledAppointments = await Appointment.find({
        userId: token.id,
        isCanceled: true,
      })
        .populate(
          'psychologistId',
          'firstName lastName email profilePhotoUrl specialty'
        )
        .sort({ canceledAt: -1 })
        .lean();

      const formattedAppointments = canceledAppointments.map(appointment => {
        const now = new Date();
        const appointmentDate = new Date(appointment.dateTime);

        return {
          ...appointment,
          isPast: appointmentDate < now,
          isToday: appointmentDate.toDateString() === now.toDateString(),
          canJoin: false,
        };
      });

      return NextResponse.json(
        createSuccessResponse(200, {
          message: 'Fetched canceled appointments successfully',
          appointments: formattedAppointments,
        })
      );
    } catch (error: any) {
      console.error('Error fetching canceled appointments:', error);
      return NextResponse.json(
        createErrorResponse(500, error.message || 'Internal Server Error')
      );
    }
  }, req);
}
