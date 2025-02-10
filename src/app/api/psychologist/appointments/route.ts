'use server';

import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/db/db';
import { withAuth } from '@/middleware/authMiddleware';
import Appointment from '@/models/Appointment';
import Profile from '@/models/Profile';
import Stripe from 'stripe';
import User from '@/models/User';
import Psychologist from '@/models/Psychologist';
import mongoose from 'mongoose';
import { validateAppointmentData } from '@/utils/validations';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function GET(req: NextRequest) {
  return withAuth(async (req: NextRequest, token: any) => {
    try {
      await connectDB();

      // Ensure models are registered
      if (!mongoose.models.User) {
        mongoose.model('User', User.schema);
      }
      if (!mongoose.models.Psychologist) {
        mongoose.model('Psychologist', Psychologist.schema);
      }
      if (!mongoose.models.Appointment) {
        mongoose.model('Appointment', Appointment.schema);
      }

      // Determine query based on user role
      const query =
        token.role === 'psychologist'
          ? { psychologistId: token.id }
          : { userId: token.id };

      // Get all appointments with user and psychologist details
      const appointments = await Appointment.find(query)
        .populate({
          path: 'userId',
          model: 'User',
          select: 'firstName lastName email profilePhotoUrl',
        })
        .populate({
          path: 'psychologistId',
          model: 'Psychologist',
          select:
            'firstName lastName email profilePhotoUrl specializations education city sessionFee availability',
        })
        .sort({ dateTime: 1 })
        .lean();

      // Fetch user profiles
      const userIds = appointments.map(apt => apt.userId._id);
      const userProfiles = await Profile.find({
        user: { $in: userIds },
      }).lean();

      // Combine appointment data with profiles
      const appointmentsWithProfiles = appointments.map(apt => {
        const userProfile = userProfiles.find(
          profile => profile.user.toString() === apt.userId._id.toString()
        );

        return {
          _id: apt._id,
          userId: {
            ...apt.userId,
            profile: userProfile || null,
          },
          psychologistId: apt.psychologistId || {
            _id: 'placeholder',
            firstName: 'Healthcare',
            lastName: 'Provider',
            email: 'provider@example.com',
            profilePhotoUrl: '',
            specializations: [],
            biography: 'Information not available',
            education: [],
            location: 'Not specified',
            sessionFee: 0,
          },
          dateTime: apt.dateTime,
          endTime: apt.endTime,
          duration: apt.duration,
          sessionFormat: apt.sessionFormat,
          patientName: apt.patientName,
          email: apt.email,
          phone: apt.phone,
          reasonForVisit: apt.reasonForVisit,
          notes: apt.notes,
          insuranceProvider: apt.insuranceProvider,
          status: apt.status,
          stripePaymentIntentId: apt.stripePaymentIntentId,
          createdAt: apt.createdAt,
          updatedAt: apt.updatedAt,
        };
      });

      return NextResponse.json({
        StatusCode: 200,
        IsSuccess: true,
        Result: {
          appointments: appointmentsWithProfiles,
        },
      });
    } catch (error) {
      console.error('Error fetching appointments:', error);
      return NextResponse.json({
        StatusCode: 500,
        IsSuccess: false,
        ErrorMessage: [{ message: error.message }],
      });
    }
  }, req);
}

// export async function POST(req: NextRequest) {
//   return withAuth(async (req: NextRequest, token: any) => {
//     try {
//       await connectDB();
//       const appointmentData = await req.json();

//       // Validate appointment data
//       const validation = validateAppointmentData(appointmentData);
//       if (!validation.isValid) {
//         return NextResponse.json({
//           StatusCode: 400,
//           IsSuccess: false,
//           ErrorMessage: [{ message: validation.error }],
//         });
//       }

//       const {
//         psychologistId,
//         start,
//         end,
//         paymentIntentId,
//         sessionFormat,
//         patientName,
//         email,
//         phone,
//         reasonForVisit,
//         notes,
//         insuranceProvider,
//       } = appointmentData;

//       // Verify the payment intent
//       try {
//         const paymentIntent = await stripe.paymentIntents.retrieve(
//           paymentIntentId
//         );
//         if (paymentIntent.status !== 'succeeded') {
//           return NextResponse.json({
//             StatusCode: 400,
//             IsSuccess: false,
//             ErrorMessage: [{ message: 'Payment not completed' }],
//           });
//         }
//       } catch (stripeError) {
//         console.error('Stripe error:', stripeError);
//         return NextResponse.json({
//           StatusCode: 400,
//           IsSuccess: false,
//           ErrorMessage: [{ message: 'Invalid payment information' }],
//         });
//       }

//       // Check for time slot availability
//       const startDate = new Date(start);
//       const endDate = new Date(end);

//       const existingAppointment = await Appointment.findOne({
//         psychologistId,
//         $or: [
//           {
//             dateTime: { $lt: endDate },
//             endTime: { $gt: startDate },
//           },
//         ],
//         status: { $nin: ['canceled'] },
//       });

//       if (existingAppointment) {
//         return NextResponse.json({
//           StatusCode: 409,
//           IsSuccess: false,
//           ErrorMessage: [{ message: 'Time slot is no longer available' }],
//         });
//       }

//       // Calculate appointment duration
//       const duration = Math.round(
//         (endDate.getTime() - startDate.getTime()) / (1000 * 60)
//       );

//       // Create new appointment
//       const appointment = await Appointment.create({
//         userId: token.id,
//         psychologistId,
//         dateTime: startDate,
//         endTime: endDate,
//         duration,
//         stripePaymentIntentId: paymentIntentId,
//         sessionFormat,
//         patientName: patientName.trim(),
//         email: email.trim(),
//         phone: phone.replace(/\D/g, ''),
//         reasonForVisit: reasonForVisit.trim(),
//         notes: notes?.trim() || '',
//         insuranceProvider: insuranceProvider?.trim() || '',
//         status: 'confirmed',
//       });

//       // Populate appointment details for response
//       const populatedAppointment = await Appointment.findById(appointment._id)
//         .populate('userId', 'email')
//         .populate('psychologistId', 'email');

//       return NextResponse.json({
//         StatusCode: 200,
//         IsSuccess: true,
//         Result: populatedAppointment,
//       });
//     } catch (error) {
//       console.error('Error creating appointment:', error);
//       return NextResponse.json({
//         StatusCode: 500,
//         IsSuccess: false,
//         ErrorMessage: [{ message: error.message }],
//       });
//     }
//   }, req);
// }
