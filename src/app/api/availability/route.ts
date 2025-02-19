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
import { determineTimePeriods } from '@/helpers/determineTimePeriods';

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

        const {
          daysOfWeek,
          startTime,
          endTime,
          duration: durationInput = SessionDuration.ONE_HOUR,
        } = data;

        const duration = Number(durationInput);

        if (isNaN(duration)) {
          return NextResponse.json(
            createErrorResponse(400, 'Duration must be a valid number'),
            { status: 400 }
          );
        }

        if (!daysOfWeek?.length || !startTime || !endTime) {
          return NextResponse.json(
            createErrorResponse(400, 'Missing required fields'),
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

        // Convert startTime and endTime to Date objects
        const startDate = new Date();
        const [startHour, startMinute] = startTime.split(':').map(Number);
        startDate.setHours(startHour, startMinute, 0, 0);

        const endDate = new Date();
        const [endHour, endMinute] = endTime.split(':').map(Number);
        endDate.setHours(endHour, endMinute, 0, 0);

        if (endDate <= startDate) {
          return NextResponse.json(
            createErrorResponse(400, 'End time must be after start time'),
            { status: 400 }
          );
        }

        const timeSlotDuration = endDate.getTime() - startDate.getTime();

        if (timeSlotDuration < duration * 60 * 1000) {
          return NextResponse.json(
            createErrorResponse(
              400,
              `Time slot must be at least ${duration} minutes long for the selected session duration`
            ),
            { status: 400 }
          );
        }

        const psychologist = await Psychologist.findById(token.id).select(
          'firstName lastName specialty profileImage sessionFee'
        );

        if (!psychologist) {
          return NextResponse.json(
            createErrorResponse(404, 'Psychologist not found'),
            { status: 404 }
          );
        }

        const TIME_PERIODS = {
          MORNING: { start: 0, end: 11 },
          AFTERNOON: { start: 12, end: 16 },
          EVENING: { start: 17, end: 20 },
          NIGHT: { start: 21, end: 23 },
        };

        const periods = new Set<string>();
        for (
          let hour = startDate.getHours();
          hour <= endDate.getHours();
          hour++
        ) {
          if (
            hour >= TIME_PERIODS.MORNING.start &&
            hour <= TIME_PERIODS.MORNING.end
          ) {
            periods.add('MORNING');
          } else if (
            hour >= TIME_PERIODS.AFTERNOON.start &&
            hour <= TIME_PERIODS.AFTERNOON.end
          ) {
            periods.add('AFTERNOON');
          } else if (
            hour >= TIME_PERIODS.EVENING.start &&
            hour <= TIME_PERIODS.EVENING.end
          ) {
            periods.add('EVENING');
          } else if (
            hour >= TIME_PERIODS.NIGHT.start &&
            hour <= TIME_PERIODS.NIGHT.end
          ) {
            periods.add('NIGHT');
          }
        }
        const determinedTimePeriods = Array.from(periods);

        const availability = new Availability({
          psychologistId: token.id,
          daysOfWeek,
          startTime: startDate,
          endTime: endDate,
          duration,
          timePeriods: determinedTimePeriods,
          psychologistDetails: {
            name: `${psychologist.firstName} ${psychologist.lastName}`,
            specialty: psychologist.specialty || '',
            profilePhotoUrl: psychologist.profileImage || '',
            sessionFee: psychologist.sessionFee || 0,
          },
          isActive: true,
        });

        // Check for overlapping slots
        const overlappingSlots = await Availability.findOne({
          psychologistId: token.id,
          'slots.startTime': { $lt: availability.endTime },
          'slots.endTime': { $gt: availability.startTime },
        });

        if (overlappingSlots) {
          return NextResponse.json(
            createErrorResponse(400, 'Overlapping slots already exist'),
            { status: 400 }
          );
        }

        const savedAvailability = await availability.save();

        if (savedAvailability.slots && savedAvailability.slots.length > 0) {
          for (const slot of savedAvailability.slots) {
            const slotPeriods = new Set<string>();
            for (
              let hour = slot.startTime.getHours();
              hour <= slot.endTime.getHours();
              hour++
            ) {
              if (
                hour >= TIME_PERIODS.MORNING.start &&
                hour <= TIME_PERIODS.MORNING.end
              ) {
                slotPeriods.add('MORNING');
              } else if (
                hour >= TIME_PERIODS.AFTERNOON.start &&
                hour <= TIME_PERIODS.AFTERNOON.end
              ) {
                slotPeriods.add('AFTERNOON');
              } else if (
                hour >= TIME_PERIODS.EVENING.start &&
                hour <= TIME_PERIODS.EVENING.end
              ) {
                slotPeriods.add('EVENING');
              } else if (
                hour >= TIME_PERIODS.NIGHT.start &&
                hour <= TIME_PERIODS.NIGHT.end
              ) {
                slotPeriods.add('NIGHT');
              }
            }

            slot.timePeriods = Array.from(slotPeriods);
          }

          await savedAvailability.save();
        }

        const verifiedAvailability = await Availability.findById(
          savedAvailability._id
        );

        if (!verifiedAvailability) {
          throw new Error('Failed to verify created availability');
        }

        return NextResponse.json(
          createSuccessResponse(201, {
            message: 'Availability created successfully',
            availability: verifiedAvailability,
            slotsCreated: verifiedAvailability.slots.length,
            sessionDuration: verifiedAvailability.duration,
            timePeriods: verifiedAvailability.timePeriods,
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
