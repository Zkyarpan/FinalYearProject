'use server';

import { NextRequest, NextResponse } from 'next/server';
import mongoose, { Types } from 'mongoose';
import connectDB from '@/db/db';
import { withAuth } from '@/middleware/authMiddleware';
import { stripe } from '@/lib/stripe';
import { createErrorResponse, createSuccessResponse } from '@/lib/response';
import { getDayName } from '@/utils/getDayName';

interface AppointmentData {
  psychologistId: string;
  start: string;
  end: string;
  paymentIntentId: string;
  sessionFormat: string;
  patientName: string;
  email: string;
  phone: string;
  reasonForVisit: string;
  notes?: string;
  insuranceProvider?: string;
}

async function createAppointment(
  data: AppointmentData,
  userId: string,
  session: mongoose.ClientSession
) {
  const appointments = mongoose.connection.collection('appointments');

  const startDate = new Date(data.start);
  const endDate = new Date(data.end);

  const appointmentDoc = {
    userId: new Types.ObjectId(userId),
    psychologistId: new Types.ObjectId(data.psychologistId),
    startTime: startDate, // Changed from startDate to startTime to match the model
    endTime: endDate,
    duration: Math.round(
      (endDate.getTime() - startDate.getTime()) / (1000 * 60)
    ),
    stripePaymentIntentId: data.paymentIntentId,
    sessionFormat: data.sessionFormat,
    patientName: data.patientName.trim(),
    email: data.email.trim().toLowerCase(),
    phone: data.phone.replace(/\D/g, ''),
    reasonForVisit: data.reasonForVisit.trim(),
    notes: data.notes?.trim() || '',
    insuranceProvider: data.insuranceProvider?.trim() || '',
    status: 'confirmed',
    isCanceled: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    joinedAt: null,
    completedAt: null,
  };

  const appointment = await appointments.insertOne(appointmentDoc, { session });
  return { insertedId: appointment.insertedId, ...appointmentDoc };
}

async function updateAvailabilitySlot(
  psychologistId: string,
  startDate: Date,
  endDate: Date,
  userId: string,
  appointmentId: Types.ObjectId,
  session: mongoose.ClientSession
) {
  const availabilities = mongoose.connection.collection('availabilities');

  // First, find the availability document that contains this slot
  const update = await availabilities.updateOne(
    {
      psychologistId: new Types.ObjectId(psychologistId),
      isActive: true,
      slots: {
        $elemMatch: {
          startTime: startDate,
          endTime: endDate,
          isBooked: false,
        },
      },
    },
    {
      $set: {
        'slots.$.isBooked': true,
        'slots.$.status': 'booked',
        'slots.$.userId': new Types.ObjectId(userId),
        'slots.$.appointmentId': appointmentId,
        'slots.$.bookedAt': new Date(),
        'slots.$.lastUpdated': new Date(),
      },
    },
    { session }
  );

  // Also update the cached availability in the psychologist document
  const psychologists = mongoose.connection.collection('psychologist');
  await psychologists.updateOne(
    { _id: new Types.ObjectId(psychologistId) },
    {
      $set: {
        [`availability.${getDayName(
          startDate.getDay()
        )}.slots.$[slot].isBooked`]: true,
        [`availability.${getDayName(startDate.getDay())}.slots.$[slot].status`]:
          'booked',
      },
    },
    {
      arrayFilters: [
        {
          'slot.startTime': startDate,
          'slot.endTime': endDate,
        },
      ],
      session,
    }
  );

  return update.modifiedCount > 0;
}

async function getPopulatedAppointment(appointmentId: Types.ObjectId) {
  return mongoose.connection
    .collection('appointments')
    .aggregate([
      { $match: { _id: appointmentId } },
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
          from: 'psychologist',
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
          startTime: 1, // Changed from dateTime to startTime
          endTime: 1,
          status: 1,
          sessionFormat: 1,
          isCanceled: 1,
          duration: 1,
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
}

async function checkSlotAvailability(
  psychologistId: string,
  startDate: Date,
  endDate: Date,
  session: mongoose.ClientSession
): Promise<boolean> {
  const availabilities = mongoose.connection.collection('availabilities');

  const slot = await availabilities.findOne(
    {
      psychologistId: new Types.ObjectId(psychologistId),
      isActive: true,
      slots: {
        $elemMatch: {
          startTime: startDate,
          endTime: endDate,
          isBooked: false,
        },
      },
    },
    { session }
  );

  return !!slot;
}

export async function POST(req: NextRequest) {
  return withAuth(async (req: NextRequest, token: any) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      await connectDB();
      const appointmentData: AppointmentData = await req.json();

      const startDate = new Date(appointmentData.start);
      const endDate = new Date(appointmentData.end);

      const isSlotAvailable = await checkSlotAvailability(
        appointmentData.psychologistId,
        startDate,
        endDate,
        session
      );

      if (!isSlotAvailable) {
        await session.abortTransaction();
        return NextResponse.json(
          createErrorResponse(409, 'This slot has already been booked')
        );
      }

      const paymentIntent = await stripe.paymentIntents.retrieve(
        appointmentData.paymentIntentId
      );

      if (paymentIntent.status !== 'succeeded') {
        return NextResponse.json(
          createErrorResponse(400, 'Payment not completed')
        );
      }

      const appointment = await createAppointment(
        appointmentData,
        token.id,
        session
      );

      const slotUpdated = await updateAvailabilitySlot(
        appointmentData.psychologistId,
        startDate,
        endDate,
        token.id,
        appointment.insertedId,
        session
      );

      if (!slotUpdated) {
        await session.abortTransaction();
        return NextResponse.json(
          createErrorResponse(409, 'Failed to book the slot - please try again')
        );
      }

      await session.commitTransaction();

      const populatedAppointment = await getPopulatedAppointment(
        appointment.insertedId
      );

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

interface AppointmentFilters {
  status?: string[];
  timeRange?: 'upcoming' | 'past' | 'all';
  startDate?: Date;
  endDate?: Date;
}

function parseFilters(url: URL): AppointmentFilters {
  const filters: AppointmentFilters = {};

  const status = url.searchParams.get('status');
  if (status) {
    filters.status = status.split(',');
  }

  const timeRange = url.searchParams.get('timeRange');
  if (timeRange && ['upcoming', 'past', 'all'].includes(timeRange)) {
    filters.timeRange = timeRange as 'upcoming' | 'past' | 'all';
  }

  const startDate = url.searchParams.get('startDate');
  if (startDate) {
    filters.startDate = new Date(startDate);
  }

  const endDate = url.searchParams.get('endDate');
  if (endDate) {
    filters.endDate = new Date(endDate);
  }

  return filters;
}

function buildMatchStage(
  userId: Types.ObjectId,
  userRole: string,
  filters: AppointmentFilters
) {
  const matchStage: any = {
    [userRole === 'psychologist' ? 'psychologistId' : 'userId']: userId,
  };

  if (filters.status?.length) {
    matchStage.status = { $in: filters.status };
  }

  const now = new Date();
  if (filters.timeRange) {
    switch (filters.timeRange) {
      case 'upcoming':
        matchStage.startTime = { $gt: now }; // Changed from dateTime to startTime
        break;
      case 'past':
        matchStage.startTime = { $lt: now }; // Changed from dateTime to startTime
        break;
    }
  }

  if (filters.startDate) {
    matchStage.startTime = { ...matchStage.startTime, $gte: filters.startDate }; // Changed from dateTime to startTime
  }

  if (filters.endDate) {
    matchStage.startTime = { ...matchStage.startTime, $lte: filters.endDate }; // Changed from dateTime to startTime
  }

  return matchStage;
}

function buildAggregationPipeline(matchStage, skip, limit) {
  return [
    { $match: matchStage },
    // Lookup user info
    {
      $lookup: {
        from: 'users',
        let: { userId: { $toObjectId: '$userId' } },
        pipeline: [
          { $match: { $expr: { $eq: ['$_id', '$$userId'] } } },
          {
            $project: {
              _id: 1,
              email: 1,
              firstName: 1,
              lastName: 1,
              phoneNumber: 1,
            },
          },
        ],
        as: 'userInfo',
      },
    },
    // Add lookup for user profile data
    {
      $lookup: {
        from: 'profiles',
        let: { userId: { $toObjectId: '$userId' } },
        pipeline: [
          { $match: { $expr: { $eq: ['$user', '$$userId'] } } },
          {
            $project: {
              _id: 1,
              firstName: 1,
              lastName: 1,
              image: 1,
              age: 1,
              gender: 1,
              address: 1,
              phone: 1,
              emergencyContact: 1,
              emergencyPhone: 1,
              therapyHistory: 1,
              preferredCommunication: 1,
              struggles: 1,
              briefBio: 1,
            },
          },
        ],
        as: 'profileInfo',
      },
    },
    // Lookup psychologist info from psychologists collection
    {
      $lookup: {
        from: 'psychologists',
        let: { psychId: { $toObjectId: '$psychologistId' } },
        pipeline: [
          { $match: { $expr: { $eq: ['$_id', '$$psychId'] } } },
          {
            $project: {
              _id: 1,
              email: 1,
              firstName: 1,
              lastName: 1,
              profilePhotoUrl: 1,
              specialty: 1,
              sessionFee: 1,
              languages: 1,
              timezone: 1,
              about: 1,
              education: 1,
              experience: 1,
              specializations: 1,
              acceptsInsurance: 1,
              insuranceProviders: 1,
              licenseType: 1,
              licenseNumber: 1,
              yearsOfExperience: 1,
              rating: 1,
              reviewCount: 1,
              availabilitySchedule: 1,
              sessionFormats: 1,
              address: 1,
              city: 1,
              state: 1,
              country: 1,
              postalCode: 1,
            },
          },
        ],
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
              $expr: { $eq: ['$stripePaymentIntentId', '$$paymentIntentId'] },
            },
          },
          {
            $project: {
              _id: 1,
              amount: 1,
              currency: 1,
              status: 1,
              stripePaymentId: 1,
              refundReason: 1,
              createdAt: 1,
              metadata: 1,
            },
          },
        ],
        as: 'paymentInfo',
      },
    },
    // Unwind arrays
    {
      $unwind: {
        path: '$userInfo',
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $unwind: {
        path: '$profileInfo',
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
    // Add computed fields
    {
      $addFields: {
        isPast: { $lt: ['$startTime', '$$NOW'] },
        isToday: {
          $eq: [
            { $dateToString: { format: '%Y-%m-%d', date: '$startTime' } },
            { $dateToString: { format: '%Y-%m-%d', date: '$$NOW' } },
          ],
        },
        canJoin: {
          $and: [
            { $eq: ['$status', 'confirmed'] },
            {
              $lte: [
                { $abs: { $subtract: ['$startTime', '$$NOW'] } },
                300000, // 5 minutes in milliseconds
              ],
            },
          ],
        },
      },
    },
    // Final projection
    {
      $project: {
        _id: 1,
        startTime: 1,
        endTime: 1,
        duration: 1,
        sessionFormat: 1,
        patientName: 1,
        email: 1,
        phone: 1,
        reasonForVisit: 1,
        notes: 1,
        insuranceProvider: 1,
        status: 1,
        isPast: 1,
        isToday: 1,
        canJoin: 1,
        createdAt: 1,
        updatedAt: 1,
        isCanceled: 1,
        canceledAt: 1,
        canceledBy: 1,
        cancelationReason: 1,
        joinedAt: 1,
        completedAt: 1,
        user: {
          _id: '$userInfo._id',
          email: '$userInfo.email',
          firstName: '$userInfo.firstName',
          lastName: '$userInfo.lastName',
          phoneNumber: '$userInfo.phoneNumber',
        },
        // Add profile data to the response
        profile: {
          _id: '$profileInfo._id',
          firstName: '$profileInfo.firstName',
          lastName: '$profileInfo.lastName',
          profilePhotoUrl: '$profileInfo.image',
          age: '$profileInfo.age',
          gender: '$profileInfo.gender',
          address: '$profileInfo.address',
          phone: '$profileInfo.phone',
          emergencyContact: '$profileInfo.emergencyContact',
          emergencyPhone: '$profileInfo.emergencyPhone',
          therapyHistory: '$profileInfo.therapyHistory',
          preferredCommunication: '$profileInfo.preferredCommunication',
          struggles: '$profileInfo.struggles',
          briefBio: '$profileInfo.briefBio',
        },
        psychologist: {
          _id: '$psychologistInfo._id',
          email: '$psychologistInfo.email',
          firstName: '$psychologistInfo.firstName',
          lastName: '$psychologistInfo.lastName',
          profilePhotoUrl: '$psychologistInfo.profilePhotoUrl',
          specialty: '$psychologistInfo.specialty',
          sessionFee: '$psychologistInfo.sessionFee',
          languages: '$psychologistInfo.languages',
          timezone: '$psychologistInfo.timezone',
          about: '$psychologistInfo.about',
          education: '$psychologistInfo.education',
          experience: '$psychologistInfo.experience',
          specializations: '$psychologistInfo.specializations',
          acceptsInsurance: '$psychologistInfo.acceptsInsurance',
          insuranceProviders: '$psychologistInfo.insuranceProviders',
          licenseType: '$psychologistInfo.licenseType',
          licenseNumber: '$psychologistInfo.licenseNumber',
          yearsOfExperience: '$psychologistInfo.yearsOfExperience',
          rating: '$psychologistInfo.rating',
          reviewCount: '$psychologistInfo.reviewCount',
          availabilitySchedule: '$psychologistInfo.availabilitySchedule',
          sessionFormats: '$psychologistInfo.sessionFormats',
          address: '$psychologistInfo.address',
          city: '$psychologistInfo.city',
          state: '$psychologistInfo.state',
          country: '$psychologistInfo.country',
          postalCode: '$psychologistInfo.postalCode',
        },
        payment: {
          $ifNull: [
            '$paymentInfo',
            {
              amount: '$psychologistInfo.sessionFee',
              currency: 'usd',
              status: 'pending',
              stripePaymentId: '$stripePaymentIntentId',
              createdAt: '$createdAt',
            },
          ],
        },
      },
    },
    { $sort: { startTime: 1 } },
    { $skip: skip },
    { $limit: limit },
  ];
}

async function getAppointmentSummary(matchStage: any) {
  const now = new Date();

  const [summaryResult] = await mongoose.connection
    .collection('appointments')
    .aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          upcoming: {
            $sum: { $cond: [{ $gt: ['$startTime', now] }, 1, 0] }, // Changed from dateTime to startTime
          },
          past: {
            $sum: { $cond: [{ $lt: ['$startTime', now] }, 1, 0] }, // Changed from dateTime to startTime
          },
          confirmed: {
            $sum: { $cond: [{ $eq: ['$status', 'confirmed'] }, 1, 0] },
          },
          completed: {
            $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] },
          },
          canceled: {
            $sum: { $cond: [{ $eq: ['$status', 'canceled'] }, 1, 0] },
          },
          ongoing: {
            $sum: { $cond: [{ $eq: ['$status', 'ongoing'] }, 1, 0] },
          },
          missed: {
            $sum: { $cond: [{ $eq: ['$status', 'missed'] }, 1, 0] },
          },
          todayCount: {
            $sum: {
              $cond: [
                {
                  $eq: [
                    {
                      $dateToString: { format: '%Y-%m-%d', date: '$startTime' }, // Changed from dateTime to startTime
                    },
                    { $dateToString: { format: '%Y-%m-%d', date: now } },
                  ],
                },
                1,
                0,
              ],
            },
          },
        },
      },
      {
        $project: {
          _id: 0,
          total: 1,
          upcoming: 1,
          past: 1,
          confirmed: 1,
          completed: 1,
          canceled: 1,
          ongoing: 1,
          missed: 1,
          todayCount: 1,
        },
      },
    ])
    .toArray();

  return {
    total: summaryResult?.total ?? 0,
    upcoming: summaryResult?.upcoming ?? 0,
    past: summaryResult?.past ?? 0,
    confirmed: summaryResult?.confirmed ?? 0,
    completed: summaryResult?.completed ?? 0,
    canceled: summaryResult?.canceled ?? 0,
    ongoing: summaryResult?.ongoing ?? 0,
    missed: summaryResult?.missed ?? 0,
    todayCount: summaryResult?.todayCount ?? 0,
  };
}

export async function GET(req: NextRequest) {
  return withAuth(async (req: NextRequest, token: any) => {
    try {
      await connectDB();

      const url = new URL(req.url);
      const page = Math.max(1, parseInt(url.searchParams.get('page') || '1'));
      const limit = Math.min(
        50,
        Math.max(1, parseInt(url.searchParams.get('limit') || '10'))
      );
      const skip = (page - 1) * limit;

      const filters = parseFilters(url);
      const matchStage = buildMatchStage(
        new Types.ObjectId(token.id),
        token.role,
        filters
      );
      const pipeline = buildAggregationPipeline(matchStage, skip, limit);

      const [appointments, totalCount, summary] = await Promise.all([
        mongoose.connection
          .collection('appointments')
          .aggregate(pipeline)
          .toArray(),
        mongoose.connection
          .collection('appointments')
          .countDocuments(matchStage),
        getAppointmentSummary(matchStage),
      ]);

      return NextResponse.json(
        createSuccessResponse(200, {
          message: appointments.length
            ? 'Appointments retrieved successfully'
            : 'No appointments found',
          appointments,
          pagination: {
            currentPage: page,
            totalPages: Math.ceil(totalCount / limit),
            totalAppointments: totalCount,
            hasMore: skip + limit < totalCount,
            limit,
          },
          summary,
        })
      );
    } catch (error: any) {
      console.error('Error fetching appointments:', error);
      return NextResponse.json(
        createErrorResponse(
          500,
          `Failed to fetch appointments: ${error.message}`
        )
      );
    }
  }, req);
}
