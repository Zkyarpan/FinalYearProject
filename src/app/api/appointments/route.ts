// 'use server';

// import { NextRequest, NextResponse } from 'next/server';
// import mongoose, { Types } from 'mongoose';
// import connectDB from '@/db/db';
// import { withAuth } from '@/middleware/authMiddleware';
// import { stripe } from '@/lib/stripe';
// import { createErrorResponse, createSuccessResponse } from '@/lib/response';

// async function findAvailableSlot(
//   psychologistId: string,
//   startDate: Date,
//   endDate: Date
// ) {
//   const availabilities = mongoose.connection.collection('availabilities');

//   const slot = await availabilities.findOne({
//     psychologistId: new Types.ObjectId(psychologistId),
//     'slots.startTime': startDate,
//     'slots.endTime': endDate,
//     'slots.isBooked': false,
//     isActive: true,
//   });

//   if (!slot) {
//     return { slot: null, matchingSlot: undefined };
//   }

//   const matchingSlot = slot.slots.find(
//     (s: any) =>
//       new Date(s.startTime).getTime() === startDate.getTime() &&
//       new Date(s.endTime).getTime() === endDate.getTime() &&
//       !s.isBooked
//   );

//   return { slot, matchingSlot };
// }

// export async function POST(req: NextRequest) {
//   return withAuth(async (req: NextRequest, token: any) => {
//     const session = await mongoose.startSession();
//     session.startTransaction();

//     try {
//       await connectDB();

//       const appointmentData = await req.json();
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

//       const startDate = new Date(start);
//       const endDate = new Date(end);

//       const { slot, matchingSlot } = await findAvailableSlot(
//         psychologistId,
//         startDate,
//         endDate
//       );

//       if (!slot || !matchingSlot) {
//         await session.abortTransaction();
//         return NextResponse.json(
//           createErrorResponse(409, 'Selected time slot is unavailable')
//         );
//       }

//       const paymentIntent = await stripe.paymentIntents.retrieve(
//         paymentIntentId
//       );
//       if (paymentIntent.status !== 'succeeded') {
//         await session.abortTransaction();
//         return NextResponse.json(
//           createErrorResponse(400, 'Payment not completed')
//         );
//       }

//       const appointments = mongoose.connection.collection('appointments');
//       const appointment = await appointments.insertOne(
//         {
//           userId: new Types.ObjectId(token.id),
//           psychologistId: new Types.ObjectId(psychologistId),
//           dateTime: startDate,
//           endTime: endDate,
//           duration: Math.round(
//             (endDate.getTime() - startDate.getTime()) / (1000 * 60)
//           ),
//           stripePaymentIntentId: paymentIntentId,
//           sessionFormat,
//           patientName: patientName.trim(),
//           email: email.trim().toLowerCase(),
//           phone: phone.replace(/\D/g, ''),
//           reasonForVisit: reasonForVisit.trim(),
//           notes: notes?.trim() || '',
//           insuranceProvider: insuranceProvider?.trim() || '',
//           status: 'confirmed',
//           createdAt: new Date(),
//           updatedAt: new Date(),
//         },
//         { session }
//       );

//       const availabilities = mongoose.connection.collection('availabilities');
//       const updateResult = await availabilities.updateOne(
//         {
//           _id: slot._id,
//           'slots._id': matchingSlot._id,
//         },
//         {
//           $set: {
//             'slots.$.isBooked': true,
//             'slots.$.userId': new Types.ObjectId(token.id),
//             'slots.$.appointmentId': appointment.insertedId,
//           },
//         },
//         { session }
//       );

//       if (updateResult.modifiedCount === 0) {
//         await session.abortTransaction();
//         return NextResponse.json(
//           createErrorResponse(409, 'Failed to book the slot')
//         );
//       }

//       await session.commitTransaction();

//       const populatedAppointment = await mongoose.connection
//         .collection('appointments')
//         .aggregate([
//           { $match: { _id: appointment.insertedId } },
//           {
//             $lookup: {
//               from: 'users',
//               localField: 'userId',
//               foreignField: '_id',
//               as: 'user',
//             },
//           },
//           {
//             $lookup: {
//               from: 'users',
//               localField: 'psychologistId',
//               foreignField: '_id',
//               as: 'psychologist',
//             },
//           },
//           { $unwind: '$user' },
//           { $unwind: '$psychologist' },
//           {
//             $project: {
//               _id: 1,
//               dateTime: 1,
//               endTime: 1,
//               status: 1,
//               sessionFormat: 1,
//               'user.firstName': 1,
//               'user.lastName': 1,
//               'user.email': 1,
//               'psychologist.firstName': 1,
//               'psychologist.lastName': 1,
//               'psychologist.email': 1,
//               'psychologist.profilePhotoUrl': 1,
//               'psychologist.sessionFee': 1,
//             },
//           },
//         ])
//         .toArray();

//       return NextResponse.json(
//         createSuccessResponse(200, {
//           message: 'Appointment booked successfully',
//           appointment: {
//             _id: appointment.insertedId,
//             ...populatedAppointment[0],
//           },
//         })
//       );
//     } catch (error: any) {
//       await session.abortTransaction();
//       console.error('Error creating appointment:', error);
//       return NextResponse.json(
//         createErrorResponse(500, error.message || 'Internal Server Error')
//       );
//     } finally {
//       session.endSession();
//     }
//   }, req);
// }

'use server';

import { NextRequest, NextResponse } from 'next/server';
import mongoose, { Types } from 'mongoose';
import connectDB from '@/db/db';
import { withAuth } from '@/middleware/authMiddleware';
import { stripe } from '@/lib/stripe';
import { createErrorResponse, createSuccessResponse } from '@/lib/response';

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

async function validateAppointmentData(
  data: AppointmentData
): Promise<string | null> {
  if (!data.psychologistId || !Types.ObjectId.isValid(data.psychologistId)) {
    return 'Invalid psychologist ID';
  }

  const startDate = new Date(data.start);
  const endDate = new Date(data.end);
  const now = new Date();

  if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
    return 'Invalid date format';
  }

  if (startDate < now) {
    return 'Cannot book appointments in the past';
  }

  if (endDate <= startDate) {
    return 'End time must be after start time';
  }

  if (!data.email?.match(/^\S+@\S+\.\S+$/)) {
    return 'Invalid email format';
  }

  if (!data.phone?.match(/^\+?[\d\s-]{10,}$/)) {
    return 'Invalid phone number format';
  }

  return null;
}

async function findAvailableSlot(
  psychologistId: string,
  startDate: Date,
  endDate: Date,
  session: mongoose.ClientSession
) {
  const availabilities = mongoose.connection.collection('availabilities');

  // Use more precise query with session
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
    dateTime: startDate,
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
  slotId: Types.ObjectId,
  matchingSlotId: Types.ObjectId,
  userId: string,
  appointmentId: Types.ObjectId,
  session: mongoose.ClientSession
) {
  const availabilities = mongoose.connection.collection('availabilities');

  const updateResult = await availabilities.updateOne(
    {
      _id: slotId,
      'slots._id': matchingSlotId,
      'slots.isBooked': false,
    },
    {
      $set: {
        'slots.$.isBooked': true,
        'slots.$.userId': new Types.ObjectId(userId),
        'slots.$.appointmentId': appointmentId,
        'slots.$.bookedAt': new Date(),
      },
    },
    { session }
  );

  return updateResult.modifiedCount > 0;
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
          dateTime: 1,
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

export async function POST(req: NextRequest) {
  return withAuth(async (req: NextRequest, token: any) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      await connectDB();

      const appointmentData: AppointmentData = await req.json();

      // Validate input data
      const validationError = await validateAppointmentData(appointmentData);
      if (validationError) {
        return NextResponse.json(createErrorResponse(400, validationError));
      }

      const startDate = new Date(appointmentData.start);
      const endDate = new Date(appointmentData.end);

      // Verify payment first
      const paymentIntent = await stripe.paymentIntents.retrieve(
        appointmentData.paymentIntentId
      );
      if (paymentIntent.status !== 'succeeded') {
        return NextResponse.json(
          createErrorResponse(400, 'Payment not completed')
        );
      }

      // Find available slot
      const { slot, matchingSlot } = await findAvailableSlot(
        appointmentData.psychologistId,
        startDate,
        endDate,
        session
      );

      if (!slot || !matchingSlot) {
        await session.abortTransaction();
        return NextResponse.json(
          createErrorResponse(409, 'Selected time slot is unavailable')
        );
      }

      // Create appointment
      const appointment = await createAppointment(
        appointmentData,
        token.id,
        session
      );

      // Update availability
      const slotUpdated = await updateAvailabilitySlot(
        slot._id,
        matchingSlot._id,
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

      // Get populated appointment data
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

const APPOINTMENT_STATUS = {
  CONFIRMED: 'confirmed',
  CANCELED: 'canceled',
  COMPLETED: 'completed',
  ONGOING: 'ongoing',
  MISSED: 'missed',
};

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
        matchStage.dateTime = { $gt: now };
        break;
      case 'past':
        matchStage.dateTime = { $lt: now };
        break;
    }
  }

  if (filters.startDate) {
    matchStage.dateTime = { ...matchStage.dateTime, $gte: filters.startDate };
  }

  if (filters.endDate) {
    matchStage.dateTime = { ...matchStage.dateTime, $lte: filters.endDate };
  }

  return matchStage;
}

function buildAggregationPipeline(
  matchStage: any,
  skip: number,
  limit: number
) {
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
        isPast: { $lt: ['$dateTime', '$$NOW'] },
        isToday: {
          $eq: [
            { $dateToString: { format: '%Y-%m-%d', date: '$dateTime' } },
            { $dateToString: { format: '%Y-%m-%d', date: '$$NOW' } },
          ],
        },
        canJoin: {
          $and: [
            { $eq: ['$status', 'confirmed'] },
            {
              $lte: [
                { $abs: { $subtract: ['$dateTime', '$$NOW'] } },
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
        dateTime: 1,
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
    { $sort: { dateTime: 1 } },
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
            $sum: { $cond: [{ $gt: ['$dateTime', now] }, 1, 0] },
          },
          past: {
            $sum: { $cond: [{ $lt: ['$dateTime', now] }, 1, 0] },
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
                      $dateToString: { format: '%Y-%m-%d', date: '$dateTime' },
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

// export async function GET(req: NextRequest) {
//   return withAuth(async (req: NextRequest, token: any) => {
//     try {
//       await connectDB();

//       const url = new URL(req.url);

//       const page = parseInt(url.searchParams.get('page') || '1');
//       const limit = parseInt(url.searchParams.get('limit') || '10');
//       const skip = (page - 1) * limit;

//       const userId = new Types.ObjectId(token.id);

//       const matchStage: any = {};

//       if (token.role === 'psychologist') {
//         matchStage.psychologistId = userId;
//       } else {
//         matchStage.userId = userId;
//       }

//       const pipeline = [
//         { $match: matchStage },
//         {
//           $addFields: {
//             userObjId: { $toObjectId: '$userId' },
//             psychObjId: { $toObjectId: '$psychologistId' },
//           },
//         },
//         // Lookup user info
//         {
//           $lookup: {
//             from: 'users',
//             localField: 'userObjId',
//             foreignField: '_id',
//             as: 'userInfo',
//           },
//         },
//         // Lookup psychologist info
//         {
//           $lookup: {
//             from: 'psychologists',
//             localField: 'psychObjId',
//             foreignField: '_id',
//             as: 'psychologistInfo',
//           },
//         },
//         // Lookup payment info
//         {
//           $lookup: {
//             from: 'payments',
//             let: { paymentIntentId: '$stripePaymentIntentId' },
//             pipeline: [
//               {
//                 $match: {
//                   $expr: {
//                     $eq: ['$stripePaymentIntentId', '$$paymentIntentId'],
//                   },
//                 },
//               },
//               {
//                 $project: {
//                   amount: 1,
//                   currency: 1,
//                   status: 1,
//                   stripePaymentId: 1,
//                   stripePaymentIntentId: 1,
//                   refundReason: 1,
//                   createdAt: 1,
//                   metadata: 1,
//                 },
//               },
//             ],
//             as: 'paymentInfo',
//           },
//         },
//         {
//           $unwind: {
//             path: '$userInfo',
//             preserveNullAndEmptyArrays: true,
//           },
//         },
//         {
//           $unwind: {
//             path: '$psychologistInfo',
//             preserveNullAndEmptyArrays: true,
//           },
//         },
//         {
//           $unwind: {
//             path: '$paymentInfo',
//             preserveNullAndEmptyArrays: true,
//           },
//         },
//         {
//           $project: {
//             _id: 1,
//             dateTime: 1,
//             endTime: 1,
//             duration: 1,
//             stripePaymentIntentId: 1,
//             sessionFormat: 1,
//             patientName: 1,
//             email: 1,
//             phone: 1,
//             reasonForVisit: 1,
//             notes: 1,
//             insuranceProvider: 1,
//             status: 1,
//             createdAt: 1,
//             updatedAt: 1,
//             userId: {
//               _id: '$userInfo._id',
//               email: '$userInfo.email',
//               firstName: '$userInfo.firstName',
//               lastName: '$userInfo.lastName',
//             },
//             psychologistId: {
//               _id: '$psychologistInfo._id',
//               email: '$psychologistInfo.email',
//               firstName: '$psychologistInfo.firstName',
//               lastName: '$psychologistInfo.lastName',
//               profilePhotoUrl: '$psychologistInfo.profilePhotoUrl',
//               specialty: '$psychologistInfo.specialty',
//               sessionFee: '$psychologistInfo.sessionFee',
//             },
//             payment: {
//               amount: '$paymentInfo.amount',
//               currency: '$paymentInfo.currency',
//               status: '$paymentInfo.status',
//               stripePaymentId: '$paymentInfo.stripePaymentId',
//               stripePaymentIntentId: '$paymentInfo.stripePaymentIntentId',
//               refundReason: '$paymentInfo.refundReason',
//               createdAt: '$paymentInfo.createdAt',
//               metadata: '$paymentInfo.metadata',
//             },
//           },
//         },
//         {
//           $sort: { dateTime: 1 },
//         },
//         { $skip: skip },
//         { $limit: limit },
//       ];

//       const appointments = await mongoose.connection
//         .collection('appointments')
//         .aggregate(pipeline)
//         .toArray();

//       const currentDate = new Date();
//       type ProcessedAppointment = (typeof appointments)[0] & {
//         isPast: boolean;
//         isToday: boolean;
//         canJoin: boolean;
//       };

//       const processedAppointments = appointments.map(appointment => {
//         const appointmentDate = new Date(appointment.dateTime);
//         return {
//           ...appointment,
//           isPast: appointmentDate < currentDate,
//           isToday:
//             appointmentDate.toDateString() === currentDate.toDateString(),
//           canJoin:
//             appointment.status === 'confirmed' &&
//             Math.abs(appointmentDate.getTime() - currentDate.getTime()) <=
//               5 * 60 * 1000,
//           // Set default payment info if not found
//           payment: appointment.payment || {
//             amount: appointment.psychologistId?.sessionFee || 0,
//             currency: 'usd',
//             status: 'pending',
//             stripePaymentId: appointment.stripePaymentIntentId,
//             stripePaymentIntentId: appointment.stripePaymentIntentId,
//             createdAt: appointment.createdAt,
//           },
//         } as ProcessedAppointment;
//       });

//       const totalCount = await mongoose.connection
//         .collection('appointments')
//         .countDocuments(matchStage);

//       return NextResponse.json(
//         createSuccessResponse(200, {
//           message: processedAppointments.length
//             ? 'Appointments retrieved successfully'
//             : 'No appointments found',
//           appointments: processedAppointments,
//           pagination: {
//             currentPage: page,
//             totalPages: Math.ceil(totalCount / limit),
//             totalAppointments: totalCount,
//             hasMore: skip + limit < totalCount,
//             limit,
//           },
//           summary: {
//             total: totalCount,
//             upcoming: processedAppointments.filter(
//               appt => new Date(appt.dateTime) >= currentDate
//             ).length,
//             past: processedAppointments.filter(
//               appt => new Date(appt.dateTime) < currentDate
//             ).length,
//             confirmed: processedAppointments.filter(
//               appt => appt.status === 'confirmed'
//             ).length,
//             completed: processedAppointments.filter(
//               appt => appt.status === 'completed'
//             ).length,
//             cancelled: processedAppointments.filter(
//               appt => appt.status === 'cancelled'
//             ).length,
//           },
//         })
//       );
//     } catch (error: any) {
//       console.error('Error fetching appointments:', error);
//       return NextResponse.json(
//         createErrorResponse(500, 'Internal Server Error: ' + error.message)
//       );
//     }
//   }, req);
// }
