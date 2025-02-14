'use server';

import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/db/db';
import { withAuth } from '@/middleware/authMiddleware';
import Appointment from '@/models/Appointment';
import Availability from '@/models/Availability';
import { createErrorResponse, createSuccessResponse } from '@/lib/response';

export async function POST(req: NextRequest) {
  return withAuth(async (req: NextRequest, token: any) => {
    try {
      await connectDB();
      const { start, end, psychologistId } = await req.json();
      console.log('start:', start);
      console.log('end:', end);
      console.log('psychologistId:', psychologistId);

      // Input validation
      if (!start || !end || !psychologistId) {
        return NextResponse.json(
          createErrorResponse(400, 'Missing required parameters')
        );
      }

      const startDate = new Date(start);
      const endDate = new Date(end);
      const currentDate = new Date();

      // Time validation
      if (startDate < currentDate) {
        return NextResponse.json(
          createErrorResponse(400, 'Cannot book appointments in the past')
        );
      }

      if (endDate <= startDate) {
        return NextResponse.json(
          createErrorResponse(400, 'Invalid time range')
        );
      }

      // Check psychologist's availability
      const availabilitySlot = await Availability.findOne({
        psychologistId,
        daysOfWeek: startDate.getDay(),
        startTime: {
          $lte: startDate.toLocaleTimeString('en-US', {
            hour12: false,
            hour: '2-digit',
            minute: '2-digit',
          }),
        },
        endTime: {
          $gte: endDate.toLocaleTimeString('en-US', {
            hour12: false,
            hour: '2-digit',
            minute: '2-digit',
          }),
        },
      });

      if (!availabilitySlot) {
        return NextResponse.json(
          createErrorResponse(
            400,
            "Selected time is outside of provider's availability"
          )
        );
      }

      // Check for existing appointments
      const existingAppointment = await Appointment.findOne({
        psychologistId,
        $or: [
          {
            dateTime: { $lt: endDate, $gte: startDate },
          },
          {
            endTime: { $gt: startDate, $lte: endDate },
          },
        ],
        status: { $nin: ['canceled'] },
      });

      if (existingAppointment) {
        return NextResponse.json(
          createErrorResponse(409, 'Time slot is no longer available')
        );
      }

      // Check for user's existing appointments
      const userAppointments = await Appointment.find({
        userId: token.id,
        dateTime: { $gte: currentDate },
        status: { $nin: ['canceled'] },
      });

      // Limit concurrent pending appointments
      const pendingAppointments = userAppointments.filter(
        apt => apt.status === 'pending'
      );
      if (pendingAppointments.length >= 3) {
        return NextResponse.json(
          createErrorResponse(400, 'Maximum pending appointments limit reached')
        );
      }

      // Check for overlapping appointments for the user
      const hasOverlap = userAppointments.some(apt => {
        const aptStart = new Date(apt.dateTime);
        const aptEnd = new Date(apt.endTime);
        return (
          (startDate >= aptStart && startDate < aptEnd) ||
          (endDate > aptStart && endDate <= aptEnd)
        );
      });

      if (hasOverlap) {
        return NextResponse.json(
          createErrorResponse(
            409,
            'You already have an appointment during this time'
          )
        );
      }

      return NextResponse.json(
        createSuccessResponse(200, {
          message: 'Time slot is available',
          slot: { start: startDate, end: endDate, psychologistId },
        })
      );
    } catch (error) {
      console.error('Check availability error:', error);
      return NextResponse.json(
        createErrorResponse(500, 'Internal Server Error: ' + error.message)
      );
    }
  }, req);
}
