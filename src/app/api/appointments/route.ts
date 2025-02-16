'use server';

import { NextRequest, NextResponse } from 'next/server';
import mongoose, { Types } from 'mongoose';
import connectDB from '@/db/db';
import { withAuth } from '@/middleware/authMiddleware';
import { stripe } from '@/lib/stripe';
import { createErrorResponse, createSuccessResponse } from '@/lib/response';

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

      const paymentIntent = await stripe.paymentIntents.retrieve(
        paymentIntentId
      );
      if (paymentIntent.status !== 'succeeded') {
        await session.abortTransaction();
        return NextResponse.json(
          createErrorResponse(400, 'Payment not completed')
        );
      }

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
          appointment: {
            _id: appointment.insertedId,
            ...populatedAppointment[0],
          },
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

export async function GET(req: NextRequest) {
  return withAuth(async (req: NextRequest, token: any) => {
    try {
      await connectDB();

      const url = new URL(req.url);
      const dateParam = url.searchParams.get('date');
      const status = url.searchParams.get('status');
      const page = parseInt(url.searchParams.get('page') || '1');
      const limit = parseInt(url.searchParams.get('limit') || '10');
      const skip = (page - 1) * limit;

      const userId = new Types.ObjectId(token.id);

      const matchStage: any = {};

      if (token.role === 'psychologist') {
        matchStage.psychologistId = userId;
      } else {
        matchStage.userId = userId;
      }

      const pipeline = [
        { $match: matchStage },
        {
          $addFields: {
            userObjId: { $toObjectId: '$userId' },
            psychObjId: { $toObjectId: '$psychologistId' },
          },
        },
        // Lookup user info
        {
          $lookup: {
            from: 'users',
            localField: 'userObjId',
            foreignField: '_id',
            as: 'userInfo',
          },
        },
        // Lookup psychologist info
        {
          $lookup: {
            from: 'psychologists',
            localField: 'psychObjId',
            foreignField: '_id',
            as: 'psychologistInfo',
          },
        },
        // Lookup payment info
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
              {
                $project: {
                  amount: 1,
                  currency: 1,
                  status: 1,
                  stripePaymentId: 1,
                  stripePaymentIntentId: 1,
                  refundReason: 1,
                  createdAt: 1,
                  metadata: 1,
                },
              },
            ],
            as: 'paymentInfo',
          },
        },
        {
          $unwind: {
            path: '$userInfo',
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $unwind: {
            path: '$psychologistInfo',
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $unwind: {
            path: '$paymentInfo',
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
              _id: '$userInfo._id',
              email: '$userInfo.email',
              firstName: '$userInfo.firstName',
              lastName: '$userInfo.lastName',
            },
            psychologistId: {
              _id: '$psychologistInfo._id',
              email: '$psychologistInfo.email',
              firstName: '$psychologistInfo.firstName',
              lastName: '$psychologistInfo.lastName',
              profilePhotoUrl: '$psychologistInfo.profilePhotoUrl',
              specialty: '$psychologistInfo.specialty',
              sessionFee: '$psychologistInfo.sessionFee',
            },
            payment: {
              amount: '$paymentInfo.amount',
              currency: '$paymentInfo.currency',
              status: '$paymentInfo.status',
              stripePaymentId: '$paymentInfo.stripePaymentId',
              stripePaymentIntentId: '$paymentInfo.stripePaymentIntentId',
              refundReason: '$paymentInfo.refundReason',
              createdAt: '$paymentInfo.createdAt',
              metadata: '$paymentInfo.metadata',
            },
          },
        },
        {
          $sort: { dateTime: 1 },
        },
        { $skip: skip },
        { $limit: limit },
      ];

      const appointments = await mongoose.connection
        .collection('appointments')
        .aggregate(pipeline)
        .toArray();

      const currentDate = new Date();
      type ProcessedAppointment = (typeof appointments)[0] & {
        isPast: boolean;
        isToday: boolean;
        canJoin: boolean;
      };

      const processedAppointments = appointments.map(appointment => {
        const appointmentDate = new Date(appointment.dateTime);
        return {
          ...appointment,
          isPast: appointmentDate < currentDate,
          isToday:
            appointmentDate.toDateString() === currentDate.toDateString(),
          canJoin:
            appointment.status === 'confirmed' &&
            Math.abs(appointmentDate.getTime() - currentDate.getTime()) <=
              5 * 60 * 1000,
          // Set default payment info if not found
          payment: appointment.payment || {
            amount: appointment.psychologistId?.sessionFee || 0,
            currency: 'usd',
            status: 'pending',
            stripePaymentId: appointment.stripePaymentIntentId,
            stripePaymentIntentId: appointment.stripePaymentIntentId,
            createdAt: appointment.createdAt,
          },
        } as ProcessedAppointment;
      });

      const totalCount = await mongoose.connection
        .collection('appointments')
        .countDocuments(matchStage);

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
            hasMore: skip + limit < totalCount,
            limit,
          },
          summary: {
            total: totalCount,
            upcoming: processedAppointments.filter(
              appt => new Date(appt.dateTime) >= currentDate
            ).length,
            past: processedAppointments.filter(
              appt => new Date(appt.dateTime) < currentDate
            ).length,
            confirmed: processedAppointments.filter(
              appt => appt.status === 'confirmed'
            ).length,
            completed: processedAppointments.filter(
              appt => appt.status === 'completed'
            ).length,
            cancelled: processedAppointments.filter(
              appt => appt.status === 'cancelled'
            ).length,
          },
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
