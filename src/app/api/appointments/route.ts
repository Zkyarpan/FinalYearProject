'use server';

import { NextRequest, NextResponse } from 'next/server';
import mongoose, { Types } from 'mongoose';
import connectDB from '@/db/db';
import { withAuth } from '@/middleware/authMiddleware';
import { stripe } from '@/lib/stripe';
import { createErrorResponse, createSuccessResponse } from '@/lib/response';
import Appointment from '@/models/Appointment';
import Availability from '@/models/Availability';

async function findAvailableSlot(
  psychologistId: string,
  startDate: Date,
  endDate: Date
) {
  const availabilities = mongoose.connection.collection('availabilities');

  const slot = await availabilities.findOne({
    psychologistId: new Types.ObjectId(psychologistId),
    'slots.startTime': startDate,
    'slots.endTime': endDate,
    'slots.isBooked': false,
    isActive: true,
  });

  if (!slot) {
    return { slot: null, matchingSlot: undefined };
  }

  const matchingSlot = slot.slots.find(
    (s: any) =>
      new Date(s.startTime).getTime() === startDate.getTime() &&
      new Date(s.endTime).getTime() === endDate.getTime() &&
      !s.isBooked
  );

  return { slot, matchingSlot };
}

export async function POST(req: NextRequest) {
  return withAuth(async (req: NextRequest, token: any) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      await connectDB();

      const appointmentData = await req.json();
      const {
        psychologistId,
        start,
        end,
        paymentIntentId,
        sessionFormat,
        patientName,
        email,
        phone,
        reasonForVisit,
        notes,
        insuranceProvider,
      } = appointmentData;

      const startDate = new Date(start);
      const endDate = new Date(end);

      // Find available slot
      const { slot, matchingSlot } = await findAvailableSlot(
        psychologistId,
        startDate,
        endDate
      );

      if (!slot || !matchingSlot) {
        await session.abortTransaction();
        return NextResponse.json(
          createErrorResponse(409, 'Selected time slot is unavailable')
        );
      }

      // Verify payment
      const paymentIntent = await stripe.paymentIntents.retrieve(
        paymentIntentId
      );
      if (paymentIntent.status !== 'succeeded') {
        await session.abortTransaction();
        return NextResponse.json(
          createErrorResponse(400, 'Payment not completed')
        );
      }

      // Create appointment using the native MongoDB driver
      const appointments = mongoose.connection.collection('appointments');
      const appointment = await appointments.insertOne(
        {
          userId: new Types.ObjectId(token.id),
          psychologistId: new Types.ObjectId(psychologistId),
          dateTime: startDate,
          endTime: endDate,
          duration: Math.round(
            (endDate.getTime() - startDate.getTime()) / (1000 * 60)
          ),
          stripePaymentIntentId: paymentIntentId,
          sessionFormat,
          patientName: patientName.trim(),
          email: email.trim().toLowerCase(),
          phone: phone.replace(/\D/g, ''),
          reasonForVisit: reasonForVisit.trim(),
          notes: notes?.trim() || '',
          insuranceProvider: insuranceProvider?.trim() || '',
          status: 'confirmed',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        { session }
      );

      // Update slot using native MongoDB driver
      const availabilities = mongoose.connection.collection('availabilities');
      const updateResult = await availabilities.updateOne(
        {
          _id: slot._id,
          'slots._id': matchingSlot._id,
        },
        {
          $set: {
            'slots.$.isBooked': true,
            'slots.$.userId': new Types.ObjectId(token.id),
            'slots.$.appointmentId': appointment.insertedId,
          },
        },
        { session }
      );

      if (updateResult.modifiedCount === 0) {
        await session.abortTransaction();
        return NextResponse.json(
          createErrorResponse(409, 'Failed to book the slot')
        );
      }

      await session.commitTransaction();

      // Fetch populated appointment data
      const populatedAppointment = await mongoose.connection
        .collection('appointments')
        .aggregate([
          { $match: { _id: appointment.insertedId } },
          {
            $lookup: {
              from: 'users',
              localField: 'userId',
              foreignField: '_id',
              as: 'user',
            },
          },
          {
            $lookup: {
              from: 'users',
              localField: 'psychologistId',
              foreignField: '_id',
              as: 'psychologist',
            },
          },
          { $unwind: '$user' },
          { $unwind: '$psychologist' },
          {
            $project: {
              _id: 1,
              dateTime: 1,
              endTime: 1,
              status: 1,
              sessionFormat: 1,
              'user.firstName': 1,
              'user.lastName': 1,
              'user.email': 1,
              'psychologist.firstName': 1,
              'psychologist.lastName': 1,
              'psychologist.email': 1,
              'psychologist.profilePhotoUrl': 1,
              'psychologist.sessionFee': 1,
            },
          },
        ])
        .toArray();

      return NextResponse.json(
        createSuccessResponse(200, {
          message: 'Appointment booked successfully',
          appointment: populatedAppointment[0],
        })
      );
    } catch (error: any) {
      await session.abortTransaction();
      console.error('Error creating appointment:', error);
      return NextResponse.json(
        createErrorResponse(500, error.message || 'Internal Server Error')
      );
    } finally {
      session.endSession();
    }
  }, req);
}

// GET - Fetch appointments
export async function GET(req: NextRequest) {
  return withAuth(async (req: NextRequest, token: any) => {
    try {
      await connectDB();

      const url = new URL(req.url);
      const dateParam = url.searchParams.get('date');
      const status = url.searchParams.get('status');

      const query: any = {};

      // Add filters based on role
      if (token.role === 'psychologist') {
        query.psychologistId = new Types.ObjectId(token.id);
      } else {
        query.userId = new Types.ObjectId(token.id);
      }

      // Add date filter if provided
      if (dateParam) {
        const date = new Date(dateParam);
        const startOfDay = new Date(
          Date.UTC(
            date.getUTCFullYear(),
            date.getUTCMonth(),
            date.getUTCDate(),
            0,
            0,
            0
          )
        );
        const endOfDay = new Date(
          Date.UTC(
            date.getUTCFullYear(),
            date.getUTCMonth(),
            date.getUTCDate(),
            23,
            59,
            59
          )
        );

        query.dateTime = {
          $gte: startOfDay,
          $lte: endOfDay,
        };
      }

      // Add status filter if provided
      if (status) {
        query.status = status;
      }

      console.log('Query:', JSON.stringify(query, null, 2));

      const appointments = await Appointment.find(query)
        .populate('userId', 'firstName lastName email')
        .populate(
          'psychologistId',
          'firstName lastName email profilePhotoUrl sessionFee'
        )
        .sort({ dateTime: 1 });

      return NextResponse.json(
        createSuccessResponse(200, {
          message: appointments.length
            ? 'Appointments retrieved successfully'
            : 'No appointments found',
          appointments,
        })
      );
    } catch (error: any) {
      console.error('Error fetching appointments:', error);
      return NextResponse.json(
        createErrorResponse(500, 'Internal Server Error: ' + error.message)
      );
    }
  }, req);
}

// PATCH - Update appointment status
export async function PATCH(req: NextRequest) {
  return withAuth(async (req: NextRequest, token: any) => {
    try {
      await connectDB();

      const { appointmentId, status } = await req.json();

      if (!appointmentId || !status) {
        return NextResponse.json(
          createErrorResponse(400, 'Appointment ID and status are required')
        );
      }

      const validStatuses = ['pending', 'confirmed', 'completed', 'cancelled'];
      if (!validStatuses.includes(status)) {
        return NextResponse.json(
          createErrorResponse(400, 'Invalid status provided')
        );
      }

      // Find and update the appointment
      const updatedAppointment = await Appointment.findOneAndUpdate(
        {
          _id: new Types.ObjectId(appointmentId),
          $or: [
            { userId: new Types.ObjectId(token.id) },
            { psychologistId: new Types.ObjectId(token.id) },
          ],
        },
        { status },
        { new: true }
      )
        .populate('userId', 'firstName lastName email')
        .populate(
          'psychologistId',
          'firstName lastName email profilePhotoUrl sessionFee'
        );

      if (!updatedAppointment) {
        return NextResponse.json(
          createErrorResponse(404, 'Appointment not found or unauthorized')
        );
      }

      return NextResponse.json(
        createSuccessResponse(200, {
          message: 'Appointment status updated successfully',
          appointment: updatedAppointment,
        })
      );
    } catch (error: any) {
      console.error('Error updating appointment:', error);
      return NextResponse.json(
        createErrorResponse(500, error.message || 'Internal Server Error')
      );
    }
  }, req);
}

// DELETE - Cancel appointment
export async function DELETE(req: NextRequest) {
  return withAuth(async (req: NextRequest, token: any) => {
    try {
      await connectDB();

      const url = new URL(req.url);
      const appointmentId = url.searchParams.get('id');

      if (!appointmentId) {
        return NextResponse.json(
          createErrorResponse(400, 'Appointment ID is required')
        );
      }

      // Find the appointment
      const appointment = await Appointment.findOne({
        _id: new Types.ObjectId(appointmentId),
        $or: [
          { userId: new Types.ObjectId(token.id) },
          { psychologistId: new Types.ObjectId(token.id) },
        ],
      });

      if (!appointment) {
        return NextResponse.json(
          createErrorResponse(404, 'Appointment not found or unauthorized')
        );
      }

      // Update the availability slot if it exists
      await Availability.updateOne(
        {
          'slots.appointmentId': new Types.ObjectId(appointmentId),
        },
        {
          $set: {
            'slots.$.isBooked': false,
            'slots.$.userId': null,
            'slots.$.appointmentId': null,
          },
        }
      );

      // Delete the appointment
      await Appointment.findByIdAndDelete(appointmentId);

      return NextResponse.json(
        createSuccessResponse(200, {
          message: 'Appointment cancelled successfully',
        })
      );
    } catch (error: any) {
      console.error('Error cancelling appointment:', error);
      return NextResponse.json(
        createErrorResponse(500, error.message || 'Internal Server Error')
      );
    }
  }, req);
}
