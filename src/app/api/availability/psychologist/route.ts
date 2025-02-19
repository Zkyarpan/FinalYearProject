'use server';

import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/db/db';
import { withAuth } from '@/middleware/authMiddleware';
import Availability from '@/models/Availability';
import { createErrorResponse, createSuccessResponse } from '@/lib/response';

export async function GET(req: NextRequest) {
  return withAuth(
    async (req: NextRequest, token: any) => {
      try {
        await connectDB();

        const availability = await Availability.find({
          psychologistId: token.id,
          isActive: true,
        }).select('daysOfWeek startTime endTime timePeriods');

        const availabilityEvents = availability.map(slot => ({
          id: slot._id,
          daysOfWeek: slot.daysOfWeek,
          startTime: slot.startTime,
          endTime: slot.endTime,
          timePeriods: slot.timePeriods,
        }));

        return NextResponse.json(
          createSuccessResponse(200, {
            message: 'Psychologist availability fetched successfully',
            availability: availabilityEvents,
          })
        );
      } catch (error) {
        console.error('Fetch psychologist availability error:', error);
        return NextResponse.json(
          createErrorResponse(
            500,
            'Error fetching psychologist availability: ' + error.message
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

        const url = new URL(req.url);
        const availabilityId = url.searchParams.get('id');

        if (!availabilityId) {
          return NextResponse.json(
            createErrorResponse(400, 'Availability ID is required'),
            { status: 400 }
          );
        }

        const deletedAvailability = await Availability.findOneAndUpdate(
          {
            _id: availabilityId,
            psychologistId: token.id,
          },
          { isActive: false },
          { new: true }
        );

        if (!deletedAvailability) {
          return NextResponse.json(
            createErrorResponse(404, 'Availability slot not found'),
            { status: 404 }
          );
        }

        return NextResponse.json(
          createSuccessResponse(200, {
            message: 'Availability slot deleted successfully',
            availability: deletedAvailability,
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

export async function PUT(req: NextRequest) {
  return withAuth(
    async (req: NextRequest, token: any) => {
      try {
        await connectDB();
        const data = await req.json();

        const { id, daysOfWeek, startTime, endTime } = data;
        const missingFields: string[] = [];

        if (!id) missingFields.push('id');
        if (!daysOfWeek?.length) missingFields.push('daysOfWeek');
        if (!startTime) missingFields.push('startTime');
        if (!endTime) missingFields.push('endTime');

        const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
        if (!timeRegex.test(startTime))
          missingFields.push('invalid startTime format');
        if (!timeRegex.test(endTime))
          missingFields.push('invalid endTime format');

        if (missingFields.length > 0) {
          return NextResponse.json(
            createErrorResponse(
              400,
              `Missing or invalid fields: ${missingFields.join(', ')}`
            ),
            { status: 400 }
          );
        }

        const existingSlot = await Availability.findOne({
          psychologistId: token.id,
          _id: { $ne: id },
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

        const updatedAvailability = await Availability.findOneAndUpdate(
          {
            _id: id,
            psychologistId: token.id,
          },
          {
            daysOfWeek,
            startTime,
            endTime,
          },
          { new: true }
        );

        if (!updatedAvailability) {
          return NextResponse.json(
            createErrorResponse(404, 'Availability slot not found'),
            { status: 404 }
          );
        }

        return NextResponse.json(
          createSuccessResponse(200, {
            message: 'Availability updated successfully',
            availability: updatedAvailability,
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
