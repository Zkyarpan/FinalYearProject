'use server';

import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/db/db';
import { withAuth } from '@/middleware/authMiddleware';
import Appointment from '@/models/Appointment';
import Availability from '@/models/Availability';
import Stripe from 'stripe';
import { validateAppointmentData } from '@/utils/validations';
import { createErrorResponse, createSuccessResponse } from '@/lib/response';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(req: NextRequest) {
  return withAuth(async (req: NextRequest, token: any) => {
    try {
      await connectDB();
      const appointmentData = await req.json();

      const validation = validateAppointmentData(appointmentData);
      if (!validation.isValid) {
        return NextResponse.json(
          createErrorResponse(400, validation.error || 'Validation error')
        );
      }

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

      // Check if the time slot is within psychologist's availability
      const availability = await Availability.findOne({
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

      if (!availability) {
        return NextResponse.json(
          createErrorResponse(
            400,
            "Selected time is outside of provider's availability"
          )
        );
      }

      // Check for existing appointments in the selected time slot
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
          createErrorResponse(409, 'This time slot has already been booked')
        );
      }

      // Verify payment
      try {
        const paymentIntent = await stripe.paymentIntents.retrieve(
          paymentIntentId
        );
        if (paymentIntent.status !== 'succeeded') {
          return NextResponse.json(
            createErrorResponse(400, 'Payment not completed')
          );
        }
      } catch (stripeError) {
        console.error('Stripe error:', stripeError);
        return NextResponse.json(
          createErrorResponse(400, 'Invalid payment information')
        );
      }

      // Create the appointment
      const appointment = await Appointment.create({
        userId: token.id,
        psychologistId,
        dateTime: startDate,
        endTime: endDate,
        duration: Math.round(
          (endDate.getTime() - startDate.getTime()) / (1000 * 60)
        ),
        stripePaymentIntentId: paymentIntentId,
        sessionFormat,
        patientName: patientName.trim(),
        email: email.trim(),
        phone: phone.replace(/\D/g, ''),
        reasonForVisit: reasonForVisit.trim(),
        notes: notes?.trim() || '',
        insuranceProvider: insuranceProvider?.trim() || '',
        status: 'confirmed',
      });

      // Return populated appointment data
      const populatedAppointment = await Appointment.findById(appointment._id)
        .populate('userId', 'firstName lastName email')
        .populate(
          'psychologistId',
          'firstName lastName email profilePhotoUrl sessionFee'
        );

      return NextResponse.json(
        createSuccessResponse(200, {
          message: 'Appointment booked successfully',
          appointment: populatedAppointment,
        })
      );
    } catch (error) {
      console.error('Error creating appointment:', error);
      return NextResponse.json(
        createErrorResponse(500, 'Internal Server Error: ' + error.message)
      );
    }
  }, req);
}

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
    } catch (error) {
      console.error('Error fetching appointments:', error);
      return NextResponse.json(
        createErrorResponse(500, 'Internal Server Error: ' + error.message)
      );
    }
  }, req);
}
