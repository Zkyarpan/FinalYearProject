'use server';

import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/db/db';
import Availability, {
  SessionDuration,
  SlotStatus,
} from '@/models/Availability';
import { createErrorResponse, createSuccessResponse } from '@/lib/response';
import { withAuth } from '@/middleware/authMiddleware';
import Psychologist from '@/models/Psychologist';
import {
  AuthToken,
  AvailabilityDocument,
  CalendarEvent,
  CreateAvailabilityData,
} from '@/types/avaibality';
import { getEventStyle } from '@/helpers/getEventStyle';
import { formatTimeToHHMM } from '@/helpers/formatTimeToHHMM';

export async function GET(req: NextRequest) {
  try {
    await connectDB();

    const availabilities = await Availability.find({ isActive: true })
      .populate({
        path: 'psychologistId',
        model: Psychologist,
        select: [
          'firstName',
          'lastName',
          'email',
          'about',
          'languages',
          'sessionDuration',
          'sessionFee',
          'sessionFormats',
          'specializations',
          'acceptsInsurance',
          'insuranceProviders',
          'licenseType',
          'yearsOfExperience',
          'profilePhotoUrl',
        ],
      })
      .lean<AvailabilityDocument[]>();

    if (!availabilities || availabilities.length === 0) {
      return NextResponse.json(
        createSuccessResponse(200, {
          message: 'No availability found',
          events: [],
          totalSlots: 0,
          bookedSlots: 0,
          availableSlots: 0,
          slotsByStatus: {
            available: [],
            booked: [],
            inProgress: [],
            completed: [],
            cancelled: [],
            missed: [],
          },
        })
      );
    }

    // Track slots by their status
    const slotsByStatus = {
      available: [] as Array<{
        id: string;
        psychologistId: string;
        startTime: string;
        endTime: string;
      }>,
      booked: [] as Array<{
        id: string;
        psychologistId: string;
        startTime: string;
        endTime: string;
      }>,
      inProgress: [] as Array<{
        id: string;
        psychologistId: string;
        startTime: string;
        endTime: string;
      }>,
      completed: [] as Array<{
        id: string;
        psychologistId: string;
        startTime: string;
        endTime: string;
      }>,
      cancelled: [] as Array<{
        id: string;
        psychologistId: string;
        startTime: string;
        endTime: string;
      }>,
      missed: [] as Array<{
        id: string;
        psychologistId: string;
        startTime: string;
        endTime: string;
      }>,
    };

    const events: CalendarEvent[] = availabilities.reduce(
      (acc: CalendarEvent[], avail) => {
        const slots = avail.slots || [];
        const psychologist = avail.psychologistId;

        const slotEvents = slots.map((slot): CalendarEvent => {
          const startTime = new Date(slot.startTime);
          const endTime = new Date(slot.endTime);

          // Add slot to appropriate status category
          const baseSlotInfo = {
            id: slot._id?.toString() ?? '',
            psychologistId: psychologist._id.toString(),
            startTime: startTime.toISOString(),
            endTime: endTime.toISOString(),
          };

          switch (slot.status) {
            case SlotStatus.AVAILABLE:
              slotsByStatus.available.push(baseSlotInfo);
              break;
            case SlotStatus.BOOKED:
              slotsByStatus.booked.push(baseSlotInfo);
              break;
            case SlotStatus.IN_PROGRESS:
              slotsByStatus.inProgress.push(baseSlotInfo);
              break;
            case SlotStatus.COMPLETED:
              slotsByStatus.completed.push(baseSlotInfo);
              break;
            case SlotStatus.CANCELLED:
              slotsByStatus.cancelled.push(baseSlotInfo);
              break;
            case SlotStatus.MISSED:
              slotsByStatus.missed.push(baseSlotInfo);
              break;
          }

          const formatTime = (date: Date): string => {
            return date.toLocaleTimeString('en-US', {
              hour: 'numeric',
              minute: '2-digit',
              hour12: true,
            });
          };

          const formatTimeString = (timeString: string): string => {
            const [hours, minutes] = timeString.split(':').map(Number);
            const date = new Date();
            date.setHours(hours);
            date.setMinutes(minutes);

            return date.toLocaleTimeString('en-US', {
              hour: 'numeric',
              minute: '2-digit',
              hour12: true,
            });
          };

          const fullName = `Dr. ${psychologist.firstName} ${psychologist.lastName}`;

          const eventStyle = getEventStyle(slot.status);

          const slotTimePeriods =
            slot.timePeriods && slot.timePeriods.length > 0
              ? slot.timePeriods
              : avail.timePeriods || [];

          return {
            id: slot._id?.toString() ?? 'temp-' + Date.now(),
            title: `${
              slot.status.charAt(0).toUpperCase() + slot.status.slice(1)
            } (${formatTimeString(
              avail.startTime ?? '00:00'
            )} - ${formatTimeString(avail.endTime || '00:00')})`,
            start: startTime,
            end: endTime,
            extendedProps: {
              type: 'availability',
              psychologistId: psychologist._id,
              psychologistName: fullName,
              firstName: psychologist.firstName,
              lastName: psychologist.lastName,
              about: psychologist.about,
              languages: psychologist.languages,
              sessionDuration: psychologist.sessionDuration,
              sessionFee: psychologist.sessionFee,
              sessionFormats: psychologist.sessionFormats,
              specializations: psychologist.specializations,
              acceptsInsurance: psychologist.acceptsInsurance,
              insuranceProviders: psychologist.insuranceProviders,
              licenseType: psychologist.licenseType,
              yearsOfExperience: psychologist.yearsOfExperience,
              profilePhotoUrl: psychologist.profilePhotoUrl,
              slotId: slot._id?.toString(),
              status: slot.status,
              isBooked: slot.isBooked ?? false,
              appointmentId: slot.appointmentId?.toString(),
              dayOfWeek: startTime.getDay(),
              timePeriods: slotTimePeriods,
              originalStartTime: formatTimeString(avail.startTime || '00:00'),
              originalEndTime: formatTimeString(avail.endTime || '00:00'),
            },
            display: 'block',
            ...eventStyle,
          };
        });

        return [...acc, ...slotEvents];
      },
      []
    );

    const totalSlots = events.length;
    const bookedSlots = events.filter(
      event =>
        event.extendedProps.status === SlotStatus.BOOKED ||
        event.extendedProps.status === SlotStatus.IN_PROGRESS
    ).length;
    const availableSlots = events.filter(
      event => event.extendedProps.status === SlotStatus.AVAILABLE
    ).length;

    return NextResponse.json(
      createSuccessResponse(200, {
        message: 'Availability fetched successfully',
        events,
        totalSlots,
        bookedSlots,
        availableSlots,
        slotsByStatus,
      })
    );
  } catch (error) {
    console.error('Fetch availability error:', error);
    return NextResponse.json(
      createErrorResponse(
        500,
        'Error fetching availability: ' + (error as Error).message
      )
    );
  }
}

export async function POST(req: NextRequest) {
  return withAuth(
    async (req: NextRequest, token: AuthToken) => {
      try {
        await connectDB();
        const data: CreateAvailabilityData = await req.json();

        const {
          daysOfWeek,
          startTime,
          endTime,
          duration: durationInput = SessionDuration.ONE_HOUR,
          timezone = Intl.DateTimeFormat().resolvedOptions().timeZone ||
            'Asia/Kathmandu',
        } = data;

        const formattedStartTime = formatTimeToHHMM(startTime);
        const formattedEndTime = formatTimeToHHMM(endTime);

        const timeFormatRegex = /^([01]?[0-9]|2[0-3]):([0-5][0-9])$/;
        if (
          !timeFormatRegex.test(formattedStartTime) ||
          !timeFormatRegex.test(formattedEndTime)
        ) {
          return NextResponse.json(
            createErrorResponse(
              400,
              'Invalid time format. Use HH:mm (24-hour format)'
            ),
            { status: 400 }
          );
        }

        const duration = Number(durationInput);

        if (isNaN(duration)) {
          return NextResponse.json(
            createErrorResponse(400, 'Duration must be a valid number'),
            { status: 400 }
          );
        }

        if (!daysOfWeek?.length) {
          return NextResponse.json(
            createErrorResponse(400, 'Days of week are required'),
            { status: 400 }
          );
        }

        const allowedDurations = Object.values(SessionDuration).filter(
          value => typeof value === 'number'
        );

        if (!allowedDurations.includes(duration)) {
          return NextResponse.json(
            createErrorResponse(
              400,
              `Invalid session duration. Allowed values are: ${allowedDurations.join(
                ', '
              )} minutes`
            ),
            { status: 400 }
          );
        }

        const psychologist = await Psychologist.findById(token.id).select(
          'firstName lastName profileImage sessionFee'
        );

        if (!psychologist) {
          return NextResponse.json(
            createErrorResponse(404, 'Psychologist not found'),
            { status: 404 }
          );
        }

        const overlappingSlots = await Availability.findOne({
          psychologistId: token.id,
          daysOfWeek: { $in: daysOfWeek },
          $or: [
            {
              startTime: { $lt: formattedEndTime },
              endTime: { $gt: formattedStartTime },
            },
          ],
          isActive: true,
        });

        if (overlappingSlots) {
          return NextResponse.json(
            createErrorResponse(400, 'Overlapping slots already exist'),
            { status: 400 }
          );
        }

        const availability = new Availability({
          psychologistId: token.id,
          daysOfWeek,
          startTime: formattedStartTime,
          endTime: formattedEndTime,
          duration,
          timezone,
          psychologistDetails: {
            name: `${psychologist.firstName} ${psychologist.lastName}`,
            profilePhotoUrl: psychologist.profileImage,
            sessionFee: psychologist.sessionFee,
          },
          isActive: true,
        });

        const savedAvailability = await availability.save();

        return NextResponse.json(
          createSuccessResponse(201, {
            message: 'Availability created successfully',
            availability: savedAvailability,
            slotsCreated: savedAvailability.slots.length,
            sessionDuration: savedAvailability.duration,
          }),
          { status: 201 }
        );
      } catch (error) {
        console.error('Create availability error:', error);
        return NextResponse.json(
          createErrorResponse(
            500,
            'Error creating availability: ' + (error as Error).message
          ),
          { status: 500 }
        );
      }
    },
    req,
    ['psychologist']
  );
}
