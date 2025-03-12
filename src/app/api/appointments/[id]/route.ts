'use server';

import { NextRequest, NextResponse } from 'next/server';
import mongoose, { Types } from 'mongoose';
import connectDB from '@/db/db';
import { withAuth } from '@/middleware/authMiddleware';
import { createErrorResponse, createSuccessResponse } from '@/lib/response';

// GET appointment details by ID
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  return withAuth(async (req: NextRequest, token: any) => {
    try {
      await connectDB();
      const { id } = params;

      if (!id || !Types.ObjectId.isValid(id)) {
        return NextResponse.json(
          createErrorResponse(400, 'Invalid appointment ID')
        );
      }

      // Find the appointment with user and psychologist details
      const appointment = await mongoose.connection
        .collection('appointments')
        .aggregate([
          { $match: { _id: new Types.ObjectId(id) } },
          // Lookup user details
          {
            $lookup: {
              from: 'users',
              localField: 'userId',
              foreignField: '_id',
              as: 'user',
            },
          },
          {
            $unwind: {
              path: '$user',
              preserveNullAndEmptyArrays: true,
            },
          },
          // Lookup psychologist details
          {
            $lookup: {
              from: 'psychologists',
              localField: 'psychologistId',
              foreignField: '_id',
              as: 'psychologist',
            },
          },
          {
            $unwind: {
              path: '$psychologist',
              preserveNullAndEmptyArrays: true,
            },
          },
          // Project necessary fields
          {
            $project: {
              _id: 1,
              startTime: 1,
              endTime: 1,
              dateTime: 1,
              duration: 1,
              sessionFormat: 1,
              status: 1,
              reasonForVisit: 1,
              notes: 1,
              userId: 1,
              psychologistId: 1,
              'user._id': 1,
              'user.firstName': 1,
              'user.lastName': 1,
              'user.email': 1,
              'user.profilePhotoUrl': 1,
              'psychologist._id': 1,
              'psychologist.firstName': 1,
              'psychologist.lastName': 1,
              'psychologist.email': 1,
              'psychologist.profilePhotoUrl': 1,
              'psychologist.specialty': 1,
              'psychologist.licenseType': 1,
            },
          },
        ])
        .toArray();

      if (!appointment || appointment.length === 0) {
        return NextResponse.json(
          createErrorResponse(404, 'Appointment not found')
        );
      }

      const appointmentData = appointment[0];

      // Calculate if the appointment can be joined
      const now = new Date();
      const appointmentTime = new Date(
        appointmentData.startTime || appointmentData.dateTime
      );

      // Create time window: 5 minutes before to 15 minutes after
      const joinWindowStart = new Date(appointmentTime);
      joinWindowStart.setMinutes(joinWindowStart.getMinutes() - 5);

      const joinWindowEnd = new Date(appointmentTime);
      joinWindowEnd.setMinutes(
        joinWindowEnd.getMinutes() + appointmentData.duration + 15
      ); // Add duration + 15min buffer

      const canJoin =
        (appointmentData.status === 'confirmed' ||
          appointmentData.status === 'ongoing') &&
        now >= joinWindowStart &&
        now <= joinWindowEnd;

      return NextResponse.json(
        createSuccessResponse(200, {
          appointment: appointmentData,
          canJoin,
        })
      );
    } catch (error: any) {
      console.error('Error fetching appointment details:', error);
      return NextResponse.json(
        createErrorResponse(500, 'Internal Server Error: ' + error.message)
      );
    }
  }, req);
}

// Update appointment complete status
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  return withAuth(async (req: NextRequest, token: any) => {
    try {
      await connectDB();
      const { id } = params;
      const { notes } = await req.json();

      if (!id || !Types.ObjectId.isValid(id)) {
        return NextResponse.json(
          createErrorResponse(400, 'Invalid appointment ID')
        );
      }

      // Find and update the appointment
      const result = await mongoose.connection
        .collection('appointments')
        .updateOne(
          { _id: new Types.ObjectId(id) },
          {
            $set: {
              status: 'completed',
              notes: notes || '',
              completedAt: new Date(),
            },
          }
        );

      if (result.matchedCount === 0) {
        return NextResponse.json(
          createErrorResponse(404, 'Appointment not found')
        );
      }

      return NextResponse.json(
        createSuccessResponse(200, {
          message: 'Appointment completed successfully',
        })
      );
    } catch (error: any) {
      console.error('Error completing appointment:', error);
      return NextResponse.json(
        createErrorResponse(500, 'Internal Server Error: ' + error.message)
      );
    }
  }, req);
}

// Update appointment notes
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  return withAuth(async (req: NextRequest, token: any) => {
    try {
      await connectDB();
      const { id } = params;
      const { notes } = await req.json();

      if (!id || !Types.ObjectId.isValid(id)) {
        return NextResponse.json(
          createErrorResponse(400, 'Invalid appointment ID')
        );
      }

      // Find and update the appointment
      const result = await mongoose.connection
        .collection('appointments')
        .updateOne(
          { _id: new Types.ObjectId(id) },
          { $set: { notes: notes || '' } }
        );

      if (result.matchedCount === 0) {
        return NextResponse.json(
          createErrorResponse(404, 'Appointment not found')
        );
      }

      return NextResponse.json(
        createSuccessResponse(200, {
          message: 'Notes updated successfully',
        })
      );
    } catch (error: any) {
      console.error('Error updating notes:', error);
      return NextResponse.json(
        createErrorResponse(500, 'Internal Server Error: ' + error.message)
      );
    }
  }, req);
}
