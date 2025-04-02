'use server';

import { NextRequest, NextResponse } from 'next/server';
import { Types, PipelineStage } from 'mongoose';
import connectDB from '@/db/db';
import { withAuth } from '@/middleware/authMiddleware';
import { createSuccessResponse, createErrorResponse } from '@/lib/response';
import Appointment, { AppointmentStatus } from '@/models/Appointment';
import Payment from '@/models/Payment';

export async function GET(req: NextRequest) {
  return withAuth(
    async (req: NextRequest, token: any) => {
      try {
        // Verify admin role
        if (token.role !== 'admin') {
          return NextResponse.json(
            createErrorResponse(
              403,
              'Access denied. Admin privileges required.'
            ),
            { status: 403 }
          );
        }

        await connectDB();
        console.log('Connected to database for admin payments management');

        // Parse query parameters
        const url = new URL(req.url);
        const page = parseInt(url.searchParams.get('page') || '1');
        const limit = parseInt(url.searchParams.get('limit') || '10');
        const search = url.searchParams.get('search') || '';
        const status = url.searchParams.get('status') || '';
        const sortBy = url.searchParams.get('sortBy') || 'createdAt';
        const sortOrder = url.searchParams.get('sortOrder') || 'desc';

        // Build query
        const query: any = {};

        if (status) {
          query.status = status;
        }

        // Calculate pagination
        const skip = (page - 1) * limit;

        // Build aggregation pipeline to join with user and psychologist data
        const aggregationPipeline: PipelineStage[] = [
          // Initial match for status if provided
          status ? { $match: { status } } : { $match: {} },

          // Add lookups to get user and psychologist data
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
              from: 'psychologists',
              localField: 'psychologistId',
              foreignField: '_id',
              as: 'psychologist',
            },
          },
          {
            $lookup: {
              from: 'appointments',
              localField: 'appointmentId',
              foreignField: '_id',
              as: 'appointment',
            },
          },
          {
            $lookup: {
              from: 'profiles',
              localField: 'userId',
              foreignField: 'user',
              as: 'userProfile',
            },
          },

          // Unwind arrays to objects (or null if empty)
          {
            $unwind: {
              path: '$user',
              preserveNullAndEmptyArrays: true,
            },
          },
          {
            $unwind: {
              path: '$psychologist',
              preserveNullAndEmptyArrays: true,
            },
          },
          {
            $unwind: {
              path: '$appointment',
              preserveNullAndEmptyArrays: true,
            },
          },
          {
            $unwind: {
              path: '$userProfile',
              preserveNullAndEmptyArrays: true,
            },
          },

          // Search functionality across user and psychologist fields
          ...(search
            ? [
                {
                  $match: {
                    $or: [
                      { 'user.email': { $regex: search, $options: 'i' } },
                      {
                        'psychologist.email': { $regex: search, $options: 'i' },
                      },
                      {
                        'psychologist.firstName': {
                          $regex: search,
                          $options: 'i',
                        },
                      },
                      {
                        'psychologist.lastName': {
                          $regex: search,
                          $options: 'i',
                        },
                      },
                      {
                        'userProfile.firstName': {
                          $regex: search,
                          $options: 'i',
                        },
                      },
                      {
                        'userProfile.lastName': {
                          $regex: search,
                          $options: 'i',
                        },
                      },
                      { stripePaymentId: { $regex: search, $options: 'i' } },
                    ],
                  },
                },
              ]
            : []),

          // Sort by the specified field and order
          {
            $sort: {
              [sortBy]: sortOrder === 'asc' ? 1 : -1,
            },
          },

          // Apply pagination
          { $skip: skip },
          { $limit: limit },

          // Project the fields we need
          {
            $project: {
              _id: 1,
              userId: 1,
              psychologistId: 1,
              amount: 1,
              currency: 1,
              status: 1,
              stripePaymentId: 1,
              stripePaymentIntentId: 1,
              appointmentId: 1,
              refundReason: 1,
              createdAt: 1,
              updatedAt: 1,
              user: {
                _id: '$user._id',
                email: '$user.email',
                firstName: '$userProfile.firstName',
                lastName: '$userProfile.lastName',
                image: '$userProfile.image',
              },
              psychologist: {
                _id: '$psychologist._id',
                email: '$psychologist.email',
                firstName: '$psychologist.firstName',
                lastName: '$psychologist.lastName',
                profilePhotoUrl: '$psychologist.profilePhotoUrl',
              },
              appointment: {
                _id: '$appointment._id',
                startTime: '$appointment.startTime',
                endTime: '$appointment.endTime',
                status: '$appointment.status',
                sessionFormat: '$appointment.sessionFormat',
              },
            },
          },
        ];

        // Count total payments matching the criteria
        const countPipeline = [
          // Initial match for status if provided
          status ? { $match: { status } } : { $match: {} },

          // Add lookups for search functionality
          ...(search
            ? [
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
                    from: 'psychologists',
                    localField: 'psychologistId',
                    foreignField: '_id',
                    as: 'psychologist',
                  },
                },
                {
                  $lookup: {
                    from: 'profiles',
                    localField: 'userId',
                    foreignField: 'user',
                    as: 'userProfile',
                  },
                },
                {
                  $unwind: {
                    path: '$user',
                    preserveNullAndEmptyArrays: true,
                  },
                },
                {
                  $unwind: {
                    path: '$psychologist',
                    preserveNullAndEmptyArrays: true,
                  },
                },
                {
                  $unwind: {
                    path: '$userProfile',
                    preserveNullAndEmptyArrays: true,
                  },
                },
                {
                  $match: {
                    $or: [
                      { 'user.email': { $regex: search, $options: 'i' } },
                      {
                        'psychologist.email': { $regex: search, $options: 'i' },
                      },
                      {
                        'psychologist.firstName': {
                          $regex: search,
                          $options: 'i',
                        },
                      },
                      {
                        'psychologist.lastName': {
                          $regex: search,
                          $options: 'i',
                        },
                      },
                      {
                        'userProfile.firstName': {
                          $regex: search,
                          $options: 'i',
                        },
                      },
                      {
                        'userProfile.lastName': {
                          $regex: search,
                          $options: 'i',
                        },
                      },
                      { stripePaymentId: { $regex: search, $options: 'i' } },
                    ],
                  },
                },
              ]
            : []),
          { $count: 'total' },
        ];

        // Execute the aggregation pipeline
        const payments = await Payment.aggregate(aggregationPipeline);
        const countResult = await Payment.aggregate(countPipeline);

        const totalPayments = countResult.length > 0 ? countResult[0].total : 0;
        const totalPages = Math.ceil(totalPayments / limit);

        console.log(`Found ${payments.length} payments matching the criteria`);

        return NextResponse.json(
          createSuccessResponse(200, {
            payments,
            totalPayments,
            totalPages,
            currentPage: page,
          }),
          { status: 200 }
        );
      } catch (error: any) {
        console.error('Error fetching payments:', error);
        return NextResponse.json(
          createErrorResponse(500, error.message || 'Internal Server Error'),
          { status: 500 }
        );
      }
    },
    req,
    ['admin'] // Only allow admins
  );
}
