'use server';

import { NextRequest, NextResponse } from 'next/server';
import mongoose, { Types } from 'mongoose';
import connectDB from '@/db/db';
import { withAuth } from '@/middleware/authMiddleware';
import { createErrorResponse, createSuccessResponse } from '@/lib/response';

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

      // Verify the appointment exists and user has permissions
      const appointment = await mongoose.connection
        .collection('appointments')
        .findOne({ _id: new Types.ObjectId(id) });

      if (!appointment) {
        return NextResponse.json(
          createErrorResponse(404, 'Appointment not found')
        );
      }

      // Check user permissions - only psychologists can update notes
      const userId = token.id;
      const userRole = token.role;
      let isAuthorized = false;

      if (userRole === 'psychologist') {
        isAuthorized = appointment.psychologistId.toString() === userId;
      } else if (userRole === 'admin') {
        isAuthorized = true;
      }

      if (!isAuthorized) {
        return NextResponse.json(
          createErrorResponse(
            403,
            'Not authorized to update notes for this appointment'
          )
        );
      }

      // Update the appointment notes
      const result = await mongoose.connection
        .collection('appointments')
        .updateOne(
          { _id: new Types.ObjectId(id) },
          {
            $set: {
              notes: notes,
              lastUpdated: new Date(),
              lastUpdatedBy: new Types.ObjectId(userId),
            },
          }
        );

      if (result.modifiedCount === 0) {
        return NextResponse.json(
          createErrorResponse(400, 'Failed to update notes')
        );
      }

      return NextResponse.json(
        createSuccessResponse(200, {
          message: 'Notes updated successfully',
          appointmentId: id,
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
