'use server';

import { NextRequest, NextResponse } from 'next/server';
import mongoose, { Types } from 'mongoose';
import connectDB from '@/db/db';
import { withAuth } from '@/middleware/authMiddleware';
import { createErrorResponse, createSuccessResponse } from '@/lib/response';

// Get session details by appointment ID
export async function GET(
  req: NextRequest,
  { params }: { params: { appointmentId: string } }
) {
  return withAuth(async (req: NextRequest, token: any) => {
    try {
      await connectDB();
      const { appointmentId } = params;

      if (!appointmentId || !Types.ObjectId.isValid(appointmentId)) {
        return NextResponse.json(
          createErrorResponse(400, 'Invalid appointment ID')
        );
      }

      // Find the appointment with user and psychologist details
      const appointment = await mongoose.connection
        .collection('appointments')
        .aggregate([
          { $match: { _id: new Types.ObjectId(appointmentId) } },
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

      // Verify user has access to this appointment
      const appointmentData = appointment[0];
      const userId = token.id;
      const userRole = token.role;

      const isUserAuthorized =
        userRole === 'psychologist'
          ? appointmentData.psychologistId.toString() === userId
          : appointmentData.userId.toString() === userId;

      if (!isUserAuthorized) {
        return NextResponse.json(
          createErrorResponse(403, 'Not authorized to access this session')
        );
      }

      // Calculate if the appointment can be joined
      const now = new Date();
      const appointmentTime = new Date(appointmentData.startTime);
      
      // Create time window: 5 minutes before to 15 minutes after
      const joinWindowStart = new Date(appointmentTime);
      joinWindowStart.setMinutes(joinWindowStart.getMinutes() - 5);
      
      const joinWindowEnd = new Date(appointmentTime);
      joinWindowEnd.setMinutes(joinWindowEnd.getMinutes() + 15);
      
      const canJoin = (
        appointmentData.status === 'confirmed' && 
        now >= joinWindowStart && 
        now <= joinWindowEnd
      );

      // Update appointment to 'ongoing' status if joining and status is 'confirmed'
      if (canJoin && appointmentData.status === 'confirmed') {
        await mongoose.connection.collection('appointments').updateOne(
          { _id: new Types.ObjectId(appointmentId) },
          { 
            $set: { 
              status: 'ongoing',
              joinedAt: new Date()
            } 
          }
        );
        
        appointmentData.status = 'ongoing';
      }

      return NextResponse.json(
        createSuccessResponse(200, {
          appointment: {
            ...appointmentData,
            canJoin,
          },
        })
      );
    } catch (error: any) {
      console.error('Error fetching session details:', error);
      return NextResponse.json(
        createErrorResponse(500, 'Internal Server Error: ' + error.message)
      );
    }
  }, req);
}

// Update session status
export async function PATCH(
  req: NextRequest,
  { params }: { params: { appointmentId: string } }
) {
  return withAuth(async (req: NextRequest, token: any) => {
    try {
      await connectDB();
      const { appointmentId } = params;
      const { status } = await req.json();

      if (!appointmentId || !Types.ObjectId.isValid(appointmentId)) {
        return NextResponse.json(
          createErrorResponse(400, 'Invalid appointment ID')
        );
      }

      if (!['ongoing', 'completed'].includes(status)) {
        return NextResponse.json(
          createErrorResponse(400, 'Invalid status update')
        );
      }

      // Verify user has access to this appointment
      const appointment = await mongoose.connection
        .collection('appointments')
        .findOne({ _id: new Types.ObjectId(appointmentId) });

      if (!appointment) {
        return NextResponse.json(
          createErrorResponse(404, 'Appointment not found')
        );
      }

      const userId = token.id;
      const userRole = token.role;

      const isUserAuthorized =
        userRole === 'psychologist'
          ? appointment.psychologistId.toString() === userId
          : appointment.userId.toString() === userId;

      if (!isUserAuthorized) {
        return NextResponse.json(
          createErrorResponse(403, 'Not authorized to update this session')
        );
      }

      // Update fields based on status
      const updateFields: any = { status };
      
      if (status === 'completed') {
        updateFields.completedAt = new Date();
      }

      // Update the appointment
      const result = await mongoose.connection
        .collection('appointments')
        .updateOne(
          { _id: new Types.ObjectId(appointmentId) },
          { $set: updateFields }
        );

      if (result.modifiedCount === 0) {
        return NextResponse.json(
          createErrorResponse(400, 'Failed to update session status')
        );
      }

      return NextResponse.json(
        createSuccessResponse(200, {
          message: `Session status updated to ${status}`,
          appointmentId,
          status,
        })
      );
    } catch (error: any) {
      console.error('Error updating session status:', error);
      return NextResponse.json(
        createErrorResponse(500, 'Internal Server Error: ' + error.message)
      );
    }
  }, req);
}