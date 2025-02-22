'use server';

import { NextRequest, NextResponse } from 'next/server';
import mongoose, { Types } from 'mongoose';
import connectDB from '@/db/db';
import { withAuth } from '@/middleware/authMiddleware';
import { stripe } from '@/lib/stripe';
import { createErrorResponse, createSuccessResponse } from '@/lib/response';
import Appointment from '@/models/Appointment';

export async function DELETE(req: NextRequest, { params }) {
  return withAuth(async (req: NextRequest, token: any) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      await connectDB();
      const appointmentId = await params.id;

      const body = await req.json();
      const { cancellationNotes } = body;

      if (!cancellationNotes) {
        return NextResponse.json(
          createErrorResponse(400, 'Cancellation notes are required')
        );
      }

      const appointment = await Appointment.findOne({
        _id: appointmentId,
      }).session(session);

      if (!appointment) {
        await session.abortTransaction();
        return NextResponse.json(
          createErrorResponse(404, 'Appointment not found')
        );
      }

      if (appointment.userId.toString() !== token.id) {
        await session.abortTransaction();
        return NextResponse.json(
          createErrorResponse(403, 'Not authorized to cancel this appointment')
        );
      }

      if (new Date(appointment.dateTime) < new Date()) {
        await session.abortTransaction();
        return NextResponse.json(
          createErrorResponse(400, 'Cannot cancel past appointments')
        );
      }

      const updatedAppointment = await Appointment.findByIdAndUpdate(
        appointmentId,
        {
          status: 'canceled',
          isCanceled: true,
          cancelationReason:
            cancellationNotes || 'Appointment cancelled by user',
          canceledAt: new Date(),
          canceledBy: new Types.ObjectId(token.id),
        },
        {
          session,
          new: true,
        }
      );

      if (!updatedAppointment) {
        await session.abortTransaction();
        return NextResponse.json(
          createErrorResponse(500, 'Failed to cancel appointment')
        );
      }

      // If you have payment refund logic, add it here
      // if (appointment.stripePaymentIntentId) {
      //   await stripe.refunds.create({
      //     payment_intent: appointment.stripePaymentIntentId,
      //   });
      // }

      await session.commitTransaction();

      return NextResponse.json(
        createSuccessResponse(200, {
          message: 'Appointment cancelled successfully',
          appointment: updatedAppointment,
        })
      );
    } catch (error: any) {
      await session.abortTransaction();
      console.error('Error cancelling appointment:', error);
      return NextResponse.json(
        createErrorResponse(500, error.message || 'Internal Server Error')
      );
    } finally {
      session.endSession();
    }
  }, req);
}
