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

export async function GET(req: NextRequest) {
  try {
    await connectDB();

    await Availability.cleanupPastSlots();

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

          const fullName = `Dr. ${psychologist.firstName} ${psychologist.lastName}`;

          const eventStyle = getEventStyle(slot.status);

          return {
            id: slot._id?.toString() ?? 'temp-' + Date.now(),
            title: `${
              slot.status.charAt(0).toUpperCase() + slot.status.slice(1)
            } (${formatTime(startTime)} - ${formatTime(endTime)})`,
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

        console.log('Creating availability with data:', data);

        const {
          daysOfWeek,
          startTime,
          endTime,
          duration: durationInput = SessionDuration.ONE_HOUR,
        } = data;
        console.log('Duration input:', durationInput);
        console.log('Parsed duration:', Number(durationInput));
        console.log('Parsed duration type:', typeof Number(durationInput));

        const duration = Number(durationInput);

        // Add validation to ensure it's a valid number
        if (isNaN(duration)) {
          return NextResponse.json(
            createErrorResponse(400, 'Duration must be a valid number'),
            { status: 400 }
          );
        }

        // Validation
        if (!daysOfWeek?.length || !startTime || !endTime) {
          return NextResponse.json(
            createErrorResponse(400, 'Missing required fields'),
            { status: 400 }
          );
        }

        // Validate duration is one of the allowed values
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

        // Parse time strings to validate duration fits within time range
        const [startHour, startMinute] = startTime.split(':').map(Number);
        const [endHour, endMinute] = endTime.split(':').map(Number);

        // Convert to minutes for comparison
        const startTotalMinutes = startHour * 60 + startMinute;
        const endTotalMinutes = endHour * 60 + endMinute;
        const timeSlotDuration = endTotalMinutes - startTotalMinutes;

        if (endTotalMinutes <= startTotalMinutes) {
          return NextResponse.json(
            createErrorResponse(400, 'End time must be after start time'),
            { status: 400 }
          );
        }

        if (timeSlotDuration < duration) {
          return NextResponse.json(
            createErrorResponse(
              400,
              `Time slot must be at least ${duration} minutes long for the selected session duration`
            ),
            { status: 400 }
          );
        }

        const psychologist = await Psychologist.findById(token.id).select(
          'firstName lastName specialty profileImage'
        );

        if (!psychologist) {
          return NextResponse.json(
            createErrorResponse(404, 'Psychologist not found'),
            { status: 404 }
          );
        }

        const availability = new Availability({
          psychologistId: token.id,
          daysOfWeek,
          startTime,
          endTime,
          duration,
          psychologistDetails: {
            name: `${psychologist.firstName} ${psychologist.lastName}`,
            specialty: psychologist.specialty,
            profileImage: psychologist.profileImage,
          },
        });

        const savedAvailability = await availability.save();
        console.log(
          'Created availability with slots:',
          savedAvailability.slots.length
        );

        const verifiedAvailability = await Availability.findById(
          savedAvailability._id
        );

        if (!verifiedAvailability) {
          throw new Error('Failed to verify created availability');
        }

        console.log('Verified slots count:', verifiedAvailability.slots.length);
        console.log(
          'Session duration:',
          verifiedAvailability.duration,
          'minutes'
        );

        return NextResponse.json(
          createSuccessResponse(201, {
            message: 'Availability created successfully',
            availability: verifiedAvailability,
            slotsCreated: verifiedAvailability.slots.length,
            sessionDuration: verifiedAvailability.duration,
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
