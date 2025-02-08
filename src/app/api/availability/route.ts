// app/api/availability/route.ts
import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/db/db';
import Availability from '@/models/Availability';
import Psychologist from '@/models/Psychologist';
import { createErrorResponse, createSuccessResponse } from '@/lib/response';
import mongoose from 'mongoose';
import { withAuth } from '@/middleware/authMiddleware';

export async function POST(req: NextRequest) {
  return withAuth(
    async (req: NextRequest, token: any) => {
      try {
        await connectDB();
        const data = await req.json();

        // Validate required fields
        const { daysOfWeek, startTime, endTime } = data;
        const missingFields: string[] = [];

        if (!daysOfWeek?.length) missingFields.push('daysOfWeek');
        if (!startTime) missingFields.push('startTime');
        if (!endTime) missingFields.push('endTime');

        // Validate time format
        const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
        if (!timeRegex.test(startTime))
          missingFields.push('invalid startTime format');
        if (!timeRegex.test(endTime))
          missingFields.push('invalid endTime format');

        // Validate start time is before end time
        const start = new Date(`2000-01-01T${startTime}:00`);
        const end = new Date(`2000-01-01T${endTime}:00`);
        if (start >= end) {
          missingFields.push('startTime must be before endTime');
        }

        if (missingFields.length > 0) {
          return NextResponse.json(
            createErrorResponse(
              400,
              `Missing or invalid fields: ${missingFields.join(', ')}`
            ),
            { status: 400 }
          );
        }

        // Find psychologist and validate existence
        const psychologist = await Psychologist.findById(token.id).select(
          'firstName lastName specialty profileImage'
        );

        if (!psychologist) {
          return NextResponse.json(
            createErrorResponse(
              404,
              'Psychologist not found. Please log in again.'
            ),
            { status: 404 }
          );
        }

        // Check for overlapping availability
        const existingSlot = await Availability.findOne({
          psychologistId: token.id,
          daysOfWeek: { $in: daysOfWeek },
          isActive: true,
          $or: [
            {
              startTime: { $lte: endTime },
              endTime: { $gte: startTime },
            },
          ],
        });

        if (existingSlot) {
          return NextResponse.json(
            createErrorResponse(
              400,
              'Time slot overlaps with existing availability'
            ),
            { status: 400 }
          );
        }

        // Create availability
        const availability = await Availability.create({
          psychologistId: token.id,
          daysOfWeek,
          startTime,
          endTime,
          psychologistDetails: {
            name: `${psychologist.firstName} ${psychologist.lastName}`,
            specialty: psychologist.specialty,
            profileImage: psychologist.profileImage,
          },
        });

        return NextResponse.json(
          createSuccessResponse(201, {
            message: 'Availability created successfully',
            availability,
          }),
          { status: 201 }
        );
      } catch (error) {
        console.error('Create availability error:', error);
        return NextResponse.json(
          createErrorResponse(
            500,
            'Error creating availability: ' + error.message
          ),
          { status: 500 }
        );
      }
    },
    req,
    ['psychologist']
  );
}

export async function GET(req: NextRequest) {
  try {
    await connectDB();

    const availability = await Availability.find({ isActive: true });

    const availabilityEvents = availability.map(slot => ({
      title: slot.psychologistDetails?.name || 'Available',
      daysOfWeek: slot.daysOfWeek,
      startTime: slot.startTime,
      endTime: slot.endTime,
      extendedProps: {
        type: 'availability',
        psychologistId: slot.psychologistId,
        psychologistName: slot.psychologistDetails?.name || 'Available',
      },
      display: 'background',
      color: 'rgba(59, 130, 246, 0.1)',
    }));

    return NextResponse.json(
      createSuccessResponse(200, {
        message: 'Availability fetched successfully',
        availability: availabilityEvents,
      })
    );
  } catch (error) {
    return NextResponse.json(
      createErrorResponse(500, 'Error fetching availability: ' + error.message)
    );
  }
}

export async function PUT(req: NextRequest) {
  return withAuth(
    async (req: NextRequest, token: any) => {
      try {
        await connectDB();
        const data = await req.json();
        const { id, ...updateData } = data;

        const availability = await Availability.findOne({
          _id: id,
          psychologistId: token.id,
        });

        if (!availability) {
          return NextResponse.json(
            createErrorResponse(404, 'Availability not found'),
            { status: 404 }
          );
        }

        if (
          updateData.startTime ||
          updateData.endTime ||
          updateData.daysOfWeek
        ) {
          const overlapQuery = {
            _id: { $ne: id },
            psychologistId: token.id,
            daysOfWeek: {
              $in: updateData.daysOfWeek || availability.daysOfWeek,
            },
            isActive: true,
            $or: [
              {
                startTime: { $lte: updateData.endTime || availability.endTime },
                endTime: {
                  $gte: updateData.startTime || availability.startTime,
                },
              },
            ],
          };

          const overlap = await Availability.findOne(overlapQuery);
          if (overlap) {
            return NextResponse.json(
              createErrorResponse(
                400,
                'Time slot overlaps with existing availability'
              ),
              { status: 400 }
            );
          }
        }

        Object.assign(availability, updateData);
        await availability.save();

        return NextResponse.json(
          createSuccessResponse(200, {
            message: 'Availability updated successfully',
            availability,
          })
        );
      } catch (error) {
        console.error('Update availability error:', error);
        return NextResponse.json(
          createErrorResponse(
            500,
            'Error updating availability: ' + error.message
          ),
          { status: 500 }
        );
      }
    },
    req,
    ['psychologist']
  );
}

export async function DELETE(req: NextRequest) {
  return withAuth(
    async (req: NextRequest, token: any) => {
      try {
        await connectDB();
        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');

        if (!id) {
          return NextResponse.json(
            createErrorResponse(400, 'Availability ID is required'),
            { status: 400 }
          );
        }

        const availability = await Availability.findOneAndUpdate(
          { _id: id, psychologistId: token.id },
          { isActive: false },
          { new: true }
        );

        if (!availability) {
          return NextResponse.json(
            createErrorResponse(404, 'Availability not found'),
            { status: 404 }
          );
        }

        return NextResponse.json(
          createSuccessResponse(200, {
            message: 'Availability deleted successfully',
          })
        );
      } catch (error) {
        console.error('Delete availability error:', error);
        return NextResponse.json(
          createErrorResponse(
            500,
            'Error deleting availability: ' + error.message
          ),
          { status: 500 }
        );
      }
    },
    req,
    ['psychologist']
  );
}
