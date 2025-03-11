'use server';

import { NextRequest, NextResponse } from 'next/server';
import mongoose, { Types } from 'mongoose';
import connectDB from '@/db/db';
import { withAuth } from '@/middleware/authMiddleware';
import { createErrorResponse, createSuccessResponse } from '@/lib/response';

export async function GET(req: NextRequest) {
  return withAuth(async (req: NextRequest, token: any) => {
    try {
      await connectDB();

      const url = new URL(req.url);
      const dateParam = url.searchParams.get('date');
      const status = url.searchParams.get('status');
      const timeframe = url.searchParams.get('timeframe') || 'all';
      const page = parseInt(url.searchParams.get('page') || '1');
      const limit = parseInt(url.searchParams.get('limit') || '10');
      const skip = (page - 1) * limit;

      const matchStage: any = {};
      const isPsychologist = token.role === 'psychologist';

      if (isPsychologist) {
        matchStage.psychologistId = new Types.ObjectId(token.id);
      } else {
        matchStage.userId = new Types.ObjectId(token.id);
      }

      const currentDate = new Date();
      if (dateParam) {
        const date = new Date(dateParam);
        const startOfDay = new Date(date);
        startOfDay.setUTCHours(0, 0, 0, 0);
        const endOfDay = new Date(date);
        endOfDay.setUTCHours(23, 59, 59, 999);

        matchStage.dateTime = {
          $gte: startOfDay,
          $lte: endOfDay,
        };
      } else {
        switch (timeframe) {
          case 'upcoming':
            matchStage.dateTime = { $gte: currentDate };
            break;
          case 'past':
            matchStage.dateTime = { $lt: currentDate };
            break;
        }
      }

      if (status) {
        matchStage.status = status;
      }

      const pipeline = [
        { $match: matchStage },
        // Lookup user details
        {
          $lookup: {
            from: 'users',
            localField: 'userId',
            foreignField: '_id',
            as: 'userDetails',
          },
        },
        {
          $unwind: {
            path: '$userDetails',
            preserveNullAndEmptyArrays: true,
          },
        },
        // Lookup profile details
        {
          $lookup: {
            from: 'profiles',
            localField: 'userId',
            foreignField: 'user',
            as: 'profileDetails',
          },
        },
        {
          $unwind: {
            path: '$profileDetails',
            preserveNullAndEmptyArrays: true,
          },
        },
        // Lookup psychologist details
        {
          $lookup: {
            from: 'users',
            localField: 'psychologistId',
            foreignField: '_id',
            as: 'psychologistDetails',
          },
        },
        {
          $unwind: {
            path: '$psychologistDetails',
            preserveNullAndEmptyArrays: true,
          },
        },
        // Lookup payment details
        {
          $lookup: {
            from: 'payments',
            let: { paymentIntentId: '$stripePaymentIntentId' },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $eq: ['$stripePaymentIntentId', '$$paymentIntentId'],
                  },
                },
              },
            ],
            as: 'paymentDetails',
          },
        },
        {
          $unwind: {
            path: '$paymentDetails',
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $project: {
            _id: 1,
            dateTime: 1,
            endTime: 1,
            duration: 1,
            stripePaymentIntentId: 1,
            sessionFormat: 1,
            patientName: 1,
            email: 1,
            phone: 1,
            reasonForVisit: 1,
            notes: 1,
            insuranceProvider: 1,
            status: 1,
            createdAt: 1,
            updatedAt: 1,
            userId: {
              _id: '$userDetails._id',
              email: '$userDetails.email',
              firstName: '$userDetails.firstName',
              lastName: '$userDetails.lastName',
              profilePhotoUrl: '$userDetails.profilePhotoUrl',
            },
            // Only include detailed profile info for psychologists
            profile: {
              $cond: {
                if: { $eq: [isPsychologist, true] },
                then: {
                  profilePhotoUrl: '$profileDetails.image',
                  age: '$profileDetails.age',
                  gender: '$profileDetails.gender',
                  address: '$profileDetails.address',
                  emergencyContact: '$profileDetails.emergencyContact',
                  emergencyPhone: '$profileDetails.emergencyPhone',
                  therapyHistory: '$profileDetails.therapyHistory',
                  preferredCommunication:
                    '$profileDetails.preferredCommunication',
                  struggles: '$profileDetails.struggles',
                  briefBio: '$profileDetails.briefBio',
                },
                else: {
                  profilePhotoUrl: '$profileDetails.image',
                },
              },
            },
            payment: {
              $cond: {
                if: { $eq: [isPsychologist, true] },
                then: {
                  amount: {
                    $ifNull: [
                      '$paymentDetails.amount',
                      '$psychologistDetails.sessionFee',
                    ],
                  },
                  status: { $ifNull: ['$paymentDetails.status', 'pending'] },
                  currency: { $ifNull: ['$paymentDetails.currency', 'usd'] },
                  createdAt: {
                    $ifNull: ['$paymentDetails.createdAt', '$createdAt'],
                  },
                },
                else: {
                  amount: {
                    $ifNull: [
                      '$paymentDetails.amount',
                      '$psychologistDetails.sessionFee',
                    ],
                  },
                  currency: { $ifNull: ['$paymentDetails.currency', 'usd'] },
                  status: { $ifNull: ['$paymentDetails.status', 'pending'] },
                  stripePaymentId: '$paymentDetails.stripePaymentId',
                  stripePaymentIntentId: '$stripePaymentIntentId',
                  refundReason: '$paymentDetails.refundReason',
                  createdAt: {
                    $ifNull: ['$paymentDetails.createdAt', '$createdAt'],
                  },
                },
              },
            },
          },
        },
        { $sort: { dateTime: timeframe === 'past' ? -1 : 1 } },
        { $skip: skip },
        { $limit: limit },
      ];

      const appointments = await mongoose.connection
        .collection('appointments')
        .aggregate(pipeline)
        .toArray();

      const processedAppointments: ((typeof appointments)[0] & {
        isPast: boolean;
        isToday: boolean;
        canJoin: boolean;
      })[] = appointments.map(appointment => {
        // FIXED: Proper date handling - use dateTime field consistently
        const appointmentDate = new Date(appointment.dateTime);

        // FIXED: Improved isToday check using date components only
        const isToday =
          appointmentDate.getDate() === currentDate.getDate() &&
          appointmentDate.getMonth() === currentDate.getMonth() &&
          appointmentDate.getFullYear() === currentDate.getFullYear();

        // FIXED: isPast only if the appointment time is earlier than current time
        const isPast = appointmentDate < currentDate;

        // FIXED: Calculate the join window (5 minutes before to 15 minutes after)
        const joinWindowStart = new Date(appointmentDate);
        joinWindowStart.setMinutes(joinWindowStart.getMinutes() - 5);

        const joinWindowEnd = new Date(appointmentDate);
        joinWindowEnd.setMinutes(joinWindowEnd.getMinutes() + 15);

        // FIXED: Correct canJoin logic - only if within join window and status is confirmed
        const canJoin =
          appointment.status === 'confirmed' &&
          currentDate >= joinWindowStart &&
          currentDate <= joinWindowEnd;

        const processed = {
          ...appointment,
          isPast,
          isToday,
          canJoin,
        };
        return processed;
      });

      const totalCount = await mongoose.connection
        .collection('appointments')
        .countDocuments(matchStage);

      // FIXED: Calculate summary counts using the corrected isPast logic
      const summary = {
        total: totalCount,
        upcoming: processedAppointments.filter(appt => !appt.isPast).length,
        past: processedAppointments.filter(appt => appt.isPast).length,
        confirmed: processedAppointments.filter(
          appt => appt.status === 'confirmed'
        ).length,
        completed: processedAppointments.filter(
          appt => appt.status === 'completed'
        ).length,
        cancelled: processedAppointments.filter(
          appt => appt.status === 'cancelled'
        ).length,
      };

      return NextResponse.json(
        createSuccessResponse(200, {
          message: processedAppointments.length
            ? 'Appointments retrieved successfully'
            : 'No appointments found',
          appointments: processedAppointments,
          pagination: {
            currentPage: page,
            totalPages: Math.ceil(totalCount / limit),
            totalAppointments: totalCount,
            hasMore: page < Math.ceil(totalCount / limit),
            limit,
          },
          summary,
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
