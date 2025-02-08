'use server';

import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/db/db';
import { withAuth } from '@/middleware/authMiddleware';
import Appointment from '@/models/Appointment';
import Availability from '@/models/Availability';
import { parse, isBefore, isAfter, set } from 'date-fns';
import Payment from '@/models/Payment';

export async function GET(req: NextRequest) {
  return withAuth(async (req: NextRequest, token: any) => {
    try {
      await connectDB();
      const query =
        token.role === 'psychologist'
          ? { psychologistId: token.id }
          : { userId: token.id };

      const appointments = await Appointment.find(query)
        .populate('userId', 'firstName lastName email')
        .populate('psychologistId', 'firstName lastName email')
        .sort({ start: 1 });

      return NextResponse.json({
        StatusCode: 200,
        IsSuccess: true,
        Result: { appointments },
      });
    } catch (error) {
      return NextResponse.json({
        StatusCode: 500,
        IsSuccess: false,
        ErrorMessage: [{ message: error.message }],
      });
    }
  }, req);
}

export async function POST(req: NextRequest) {
  return withAuth(async (req: NextRequest, token: any) => {
    try {
      const { start, end, psychologistId, title, notes } = await req.json();
      console.log('Hitting the request');

      const startDate = new Date(start);
      const endDate = new Date(end);

      // Calculate duration in minutes
      const duration = (endDate.getTime() - startDate.getTime()) / (1000 * 60);

      // First check availability
      const availability = await Availability.findOne({
        psychologistId,
        daysOfWeek: startDate.getDay(),
        isActive: true,
      });

      if (!availability) {
        return NextResponse.json({
          StatusCode: 400,
          IsSuccess: false,
          ErrorMessage: [{ message: 'Time slot is not available' }],
        });
      }

      // Create a temporary payment record (or handle payment logic)
      const payment = await Payment.create({
        userId: token.id,
        amount: 0, // Set your amount
        status: 'pending',
      });

      // Create appointment with all required fields
      const appointment = await Appointment.create({
        userId: token.id,
        psychologistId,
        dateTime: startDate, // Use start date as dateTime
        duration,
        status: 'pending',
        paymentId: payment._id, // Link the payment
        title,
        notes,
      });

      // Update availability
      if (availability.bookedSlots) {
        availability.bookedSlots.push({
          start: startDate,
          end: endDate,
          appointmentId: appointment._id,
        });
        await availability.save();
      }

      const populatedAppointment = await appointment.populate([
        { path: 'userId', select: 'firstName lastName email' },
        { path: 'psychologistId', select: 'firstName lastName email' },
      ]);

      return NextResponse.json({
        StatusCode: 201,
        IsSuccess: true,
        Result: { appointment: populatedAppointment },
      });
    } catch (error) {
      console.error('Appointment creation error:', error);
      return NextResponse.json({
        StatusCode: 500,
        IsSuccess: false,
        ErrorMessage: [{ message: error.message }],
      });
    }
  }, req);
}

export async function PATCH(req: NextRequest) {
  return withAuth(async (req: NextRequest, token: any) => {
    try {
      await connectDB();
      const { appointmentId, status, notes } = await req.json();

      const appointment = await Appointment.findOneAndUpdate(
        {
          _id: appointmentId,
          $or: [{ psychologistId: token.id }, { userId: token.id }],
        },
        { status, ...(notes && { notes }) },
        { new: true }
      );

      if (!appointment) {
        return NextResponse.json({
          StatusCode: 404,
          IsSuccess: false,
          ErrorMessage: [{ message: 'Appointment not found or unauthorized' }],
        });
      }

      return NextResponse.json({
        StatusCode: 200,
        IsSuccess: true,
        Result: { appointment },
      });
    } catch (error) {
      return NextResponse.json({
        StatusCode: 500,
        IsSuccess: false,
        ErrorMessage: [{ message: error.message }],
      });
    }
  }, req);
}
