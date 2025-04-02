'use server';

import { NextRequest, NextResponse } from 'next/server';
import { Types, PipelineStage } from 'mongoose';
import connectDB from '@/db/db';
import { withAuth } from '@/middleware/authMiddleware';
import { createSuccessResponse, createErrorResponse } from '@/lib/response';
import Appointment, { AppointmentStatus } from '@/models/Appointment';

export async function GET(req: NextRequest) {
  return withAuth(
    async (req: NextRequest, token: any) => {
      try {
        // Verify the user is an admin
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
        console.log('Connected to database for admin appointments management');

        // Parse query parameters
        const url = new URL(req.url);
        const page = parseInt(url.searchParams.get('page') || '1');
        const limit = parseInt(url.searchParams.get('limit') || '10');
        const search = url.searchParams.get('search') || '';
        const status = url.searchParams.get('status') || 'all';

        // Build the base query
        const baseQuery: any = {};

        // Filter by status if specified
        if (status !== 'all') {
          // Mapping UI statuses to model statuses
          let statusMap: { [key: string]: string } = {
            scheduled: AppointmentStatus.CONFIRMED,
            completed: AppointmentStatus.COMPLETED,
            canceled: AppointmentStatus.CANCELED,
            'no-show': AppointmentStatus.MISSED,
            ongoing: AppointmentStatus.ONGOING,
          };

          baseQuery.status = statusMap[status] || status;
        }

        // Search functionality (search in user and psychologist names/emails)
        if (search) {
          // We'll implement this with aggregation later
          console.log(`Searching for: ${search}`);
        }

        // Calculate pagination
        const skip = (page - 1) * limit;

        // Build an aggregation pipeline for rich data retrieval
        const aggregationPipeline: PipelineStage[] = [
          // Initial match based on status
          { $match: baseQuery },

          // Add lookup to get user data
          {
            $lookup: {
              from: 'users',
              localField: 'userId',
              foreignField: '_id',
              as: 'userInfo',
            },
          },
          // Unwind the user array to get a single object
          {
            $unwind: {
              path: '$userInfo',
              preserveNullAndEmptyArrays: true,
            },
          },

          // Add lookup to get psychologist data
          {
            $lookup: {
              from: 'psychologists',
              localField: 'psychologistId',
              foreignField: '_id',
              as: 'psychologistInfo',
            },
          },
          // Unwind the psychologist array to get a single object
          {
            $unwind: {
              path: '$psychologistInfo',
              preserveNullAndEmptyArrays: true,
            },
          },

          // Add lookup to get user profile information
          {
            $lookup: {
              from: 'profiles',
              localField: 'userId',
              foreignField: 'user',
              as: 'userProfile',
            },
          },
          // Unwind user profile (optional)
          {
            $unwind: {
              path: '$userProfile',
              preserveNullAndEmptyArrays: true,
            },
          },

          // Search across user and psychologist properties if search term provided
          ...(search
            ? [
                {
                  $match: {
                    $or: [
                      { patientName: { $regex: search, $options: 'i' } },
                      { email: { $regex: search, $options: 'i' } },
                      { 'userInfo.email': { $regex: search, $options: 'i' } },
                      {
                        'psychologistInfo.email': {
                          $regex: search,
                          $options: 'i',
                        },
                      },
                      {
                        'psychologistInfo.firstName': {
                          $regex: search,
                          $options: 'i',
                        },
                      },
                      {
                        'psychologistInfo.lastName': {
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
                    ],
                  },
                },
              ]
            : []),

          // Sort appointments - most recent first
          { $sort: { startTime: -1 } },

          // Pagination
          { $skip: skip },
          { $limit: limit },

          // Project the shape of the data for the frontend
          {
            $project: {
              _id: 1,
              userId: {
                _id: '$userInfo._id',
                email: '$userInfo.email',
                firstName: {
                  $ifNull: [
                    '$userProfile.firstName',
                    { $arrayElemAt: [{ $split: ['$patientName', ' '] }, 0] },
                  ],
                },
                lastName: {
                  $ifNull: [
                    '$userProfile.lastName',
                    { $arrayElemAt: [{ $split: ['$patientName', ' '] }, 1] },
                  ],
                },
              },
              psychologistId: {
                _id: '$psychologistInfo._id',
                email: '$psychologistInfo.email',
                firstName: '$psychologistInfo.firstName',
                lastName: '$psychologistInfo.lastName',
                licenseType: '$psychologistInfo.licenseType',
                profilePhotoUrl: '$psychologistInfo.profilePhotoUrl',
              },
              startTime: 1,
              endTime: 1,
              duration: 1,
              status: 1,
              sessionFormat: 1,
              patientName: 1,
              email: 1,
              phone: 1,
              reasonForVisit: 1,
              notes: 1,
              insuranceProvider: 1,
              isCanceled: 1,
              canceledAt: 1,
              canceledBy: 1,
              cancelationReason: 1,
              joinedAt: 1,
              completedAt: 1,
              createdAt: 1,
              updatedAt: 1,
              // Add payment information
              paymentStatus: {
                $cond: {
                  if: { $eq: ['$status', 'canceled'] },
                  then: 'refunded',
                  else: 'paid', // Assume paid for simplicity
                },
              },
              // Add payment information (mock)
              payment: {
                amount: { $literal: 120 }, // Default value since the actual value isn't in the schema
                currency: { $literal: 'usd' }, // Default value
              },
              // Add profile info for user
              profile: {
                age: '$userProfile.age',
                gender: '$userProfile.gender',
                emergencyContact: '$userProfile.emergencyContact',
                emergencyPhone: '$userProfile.emergencyPhone',
                therapyHistory: '$userProfile.therapyHistory',
                profilePhotoUrl: '$userProfile.image',
              },
            },
          },
        ];

        // Get appointments with full data
        const appointments = await Appointment.aggregate(aggregationPipeline);

        // Get total count for pagination
        const countPipeline = [
          { $match: baseQuery },
          ...(search
            ? [
                {
                  $lookup: {
                    from: 'users',
                    localField: 'userId',
                    foreignField: '_id',
                    as: 'userInfo',
                  },
                },
                {
                  $lookup: {
                    from: 'psychologists',
                    localField: 'psychologistId',
                    foreignField: '_id',
                    as: 'psychologistInfo',
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
                  $match: {
                    $or: [
                      { patientName: { $regex: search, $options: 'i' } },
                      { email: { $regex: search, $options: 'i' } },
                      { 'userInfo.email': { $regex: search, $options: 'i' } },
                      {
                        'psychologistInfo.email': {
                          $regex: search,
                          $options: 'i',
                        },
                      },
                      {
                        'psychologistInfo.firstName': {
                          $regex: search,
                          $options: 'i',
                        },
                      },
                      {
                        'psychologistInfo.lastName': {
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
                    ],
                  },
                },
              ]
            : []),
          { $count: 'total' },
        ];

        const countResult = await Appointment.aggregate(countPipeline);
        const totalCount = countResult.length > 0 ? countResult[0].total : 0;
        const totalPages = Math.ceil(totalCount / limit);

        console.log(
          `Found ${appointments.length} appointments matching the criteria`
        );

        return NextResponse.json(
          createSuccessResponse(200, {
            appointments,
            currentPage: page,
            totalPages,
            totalAppointments: totalCount,
          }),
          { status: 200 }
        );
      } catch (error: any) {
        console.error('Error fetching appointments:', error);
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

// Handler for updating appointment status
export async function PATCH(req: NextRequest) {
  return withAuth(
    async (req: NextRequest, token: any) => {
      try {
        // Check if user is admin
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

        // Parse the URL to get the appointment ID
        const url = new URL(req.url);
        const pathname = url.pathname;
        const segments = pathname.split('/');

        // The appointment ID should be in the URL path
        const appointmentId = segments[segments.length - 2]; // Assuming path is /api/admin/appointments/:id/status
        const action = segments[segments.length - 1]; // 'cancel', 'complete', or 'no-show'

        // Validate the appointment ID
        if (!appointmentId || !Types.ObjectId.isValid(appointmentId)) {
          return NextResponse.json(
            createErrorResponse(400, 'Invalid appointment ID'),
            { status: 400 }
          );
        }

        // Determine what action to take based on the endpoint
        let updateData: any = {};
        let message = '';

        // Get request body for additional data if needed
        const body = await req.json().catch(() => ({}));

        switch (action) {
          case 'cancel':
            updateData = {
              status: AppointmentStatus.CANCELED,
              isCanceled: true,
              canceledAt: new Date(),
              canceledBy: new Types.ObjectId(token.id),
              cancelationReason: body.reason || 'Canceled by admin',
            };
            message = 'Appointment canceled successfully';
            break;

          case 'complete':
            updateData = {
              status: AppointmentStatus.COMPLETED,
              completedAt: new Date(),
            };
            message = 'Appointment marked as completed';
            break;

          case 'no-show':
            updateData = {
              status: AppointmentStatus.MISSED,
            };
            message = 'Appointment marked as no-show';
            break;

          default:
            return NextResponse.json(
              createErrorResponse(400, 'Invalid action'),
              { status: 400 }
            );
        }

        // Update the appointment
        const updatedAppointment = await Appointment.findByIdAndUpdate(
          appointmentId,
          { $set: updateData },
          { new: true }
        );

        if (!updatedAppointment) {
          return NextResponse.json(
            createErrorResponse(404, 'Appointment not found'),
            { status: 404 }
          );
        }

        // Return success response
        return NextResponse.json(
          createSuccessResponse(200, {
            appointment: updatedAppointment,
            message,
          }),
          { status: 200 }
        );
      } catch (error: any) {
        console.error('Error updating appointment:', error);
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
