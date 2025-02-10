'use server';

import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/db/db';
import { withAuth } from '@/middleware/authMiddleware';
import Appointment from '@/models/Appointment';
import Stripe from 'stripe';
import { validateAppointmentData } from '@/utils/validations';
import { createErrorResponse, createSuccessResponse } from '@/lib/response';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

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
        .populate('psychologistId', 'firstName lastName email profilePhotoUrl')
        .sort({ dateTime: 1 });

      if (appointments.length === 0) {
        return NextResponse.json(
          createSuccessResponse(200, {
            message: 'No appointments found',
            appointments: [],
          })
        );
      }

      return NextResponse.json(
        createSuccessResponse(200, {
          message: 'Appointments retrieved successfully',
          appointments: appointments,
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

      const startDate = new Date(start);
      const endDate = new Date(end);

      const existingAppointment = await Appointment.findOne({
        psychologistId,
        $or: [
          {
            dateTime: { $lt: endDate },
            endTime: { $gt: startDate },
          },
        ],
        status: { $nin: ['canceled'] },
      });

      if (existingAppointment) {
        return NextResponse.json(
          createErrorResponse(409, 'Time slot is no longer available')
        );
      }

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

      const populatedAppointment = await Appointment.findById(appointment._id)
        .populate('userId', 'firstName lastName email')
        .populate('psychologistId', 'firstName lastName email profilePhotoUrl');

      return NextResponse.json(
        createSuccessResponse(200, {
          message: 'Appointment created successfully',
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
