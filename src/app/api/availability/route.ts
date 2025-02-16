'use server';

import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/db/db';
import Availability from '@/models/Availability';
import { createErrorResponse, createSuccessResponse } from '@/lib/response';
import { withAuth } from '@/middleware/authMiddleware';
import Psychologist from '@/models/Psychologist';

interface Slot {
  _id?: string;
  startTime: Date;
  endTime: Date;
  isBooked: boolean;
  appointmentId?: string;
}

interface PsychologistDetails {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  about: string;
  languages: string[];
  sessionDuration: number;
  sessionFee: number;
  sessionFormats: string[];
  specializations: string[];
  acceptsInsurance: boolean;
  insuranceProviders: string[];
  licenseType: string;
  yearsOfExperience: number;
  profilePhotoUrl: string;
}

interface AvailabilityDocument {
  psychologistId: PsychologistDetails;
  slots?: Slot[];
  daysOfWeek: number[];
}

interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  extendedProps: {
    type: string;
    psychologistId: string;
    psychologistName: string;
    firstName: string;
    lastName: string;
    about: string;
    languages: string[];
    sessionDuration: number;
    sessionFee: number;
    sessionFormats: string[];
    specializations: string[];
    acceptsInsurance: boolean;
    insuranceProviders: string[];
    licenseType: string;
    yearsOfExperience: number;
    profilePhotoUrl: string;
    slotId?: string;
    isBooked: boolean;
    appointmentId?: string;
    dayOfWeek: number;
  };
  display: string;
  backgroundColor: string;
  borderColor: string;
  textColor: string;
  className: string[];
}

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
          'phone',
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
          availability: [],
          totalSlots: 0,
          bookedSlots: 0,
          availableSlots: 0,
        })
      );
    }

    const events: CalendarEvent[] = availabilities.reduce(
      (acc: CalendarEvent[], avail) => {
        const slots = avail.slots || [];
        const psychologist = avail.psychologistId;

        const slotEvents = slots.map((slot): CalendarEvent => {
          const startTime = new Date(slot.startTime);
          const endTime = new Date(slot.endTime);

          const formatTime = (date: Date): string => {
            return date.toLocaleTimeString('en-US', {
              hour: 'numeric',
              minute: '2-digit',
              hour12: true,
            });
          };

          const fullName = `Dr. ${psychologist.firstName} ${psychologist.lastName}`;

          return {
            id: slot._id?.toString() ?? 'temp-' + Date.now(),
            title: `${slot.isBooked ? 'Booked' : 'Available'} (${formatTime(
              startTime
            )} - ${formatTime(endTime)})`,
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
              slotId: slot._id,
              isBooked: slot.isBooked,
              appointmentId: slot.appointmentId,
              dayOfWeek: startTime.getDay(),
            },
            display: 'block',
            backgroundColor: slot.isBooked
              ? 'rgba(59, 130, 246, 0.1)'
              : 'rgba(34, 197, 94, 0.1)',
            borderColor: slot.isBooked
              ? 'rgba(59, 130, 246, 0.25)'
              : 'rgba(34, 197, 94, 0.25)',
            textColor: slot.isBooked ? '#1e40af' : '#166534',
            className: [
              'calendar-event',
              slot.isBooked ? 'booked-slot' : 'available-slot',
            ],
          };
        });

        return [...acc, ...slotEvents];
      },
      []
    );

    const formattedAvailabilities = availabilities.map(avail => {
      const psychologist = avail.psychologistId;
      const fullName = `Dr. ${psychologist.firstName} ${psychologist.lastName}`;

      const formattedSlots = (avail.slots || []).map(slot => ({
        ...slot,
        formattedStartTime: new Date(slot.startTime).toLocaleTimeString(
          'en-US',
          {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true,
          }
        ),
        formattedEndTime: new Date(slot.endTime).toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
          hour12: true,
        }),
        dayOfWeek: new Date(slot.startTime).getDay(),
      }));

      return {
        ...avail,
        psychologistDetails: {
          name: fullName,
          firstName: psychologist.firstName,
          lastName: psychologist.lastName,
          email: psychologist.email,
          phone: psychologist.phone,
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
        },
        slots: formattedSlots,
        formattedDays: avail.daysOfWeek.map(day => {
          const days = [
            'Sunday',
            'Monday',
            'Tuesday',
            'Wednesday',
            'Thursday',
            'Friday',
            'Saturday',
          ];
          return days[day];
        }),
      };
    });

    const totalSlots = events.length;
    const bookedSlots = events.filter(
      event => event.extendedProps.isBooked
    ).length;
    const availableSlots = totalSlots - bookedSlots;

    return NextResponse.json(
      createSuccessResponse(200, {
        message: 'Availability fetched successfully',
        events,
        availability: formattedAvailabilities,
        totalSlots,
        bookedSlots,
        availableSlots,
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

interface CreateAvailabilityData {
  daysOfWeek: number[];
  startTime: string;
  endTime: string;
}

interface AuthToken {
  id: string;
  roles: string[];
}

export async function POST(req: NextRequest) {
  return withAuth(
    async (req: NextRequest, token: AuthToken) => {
      try {
        await connectDB();
        const data: CreateAvailabilityData = await req.json();

        console.log('Creating availability with data:', data);

        const { daysOfWeek, startTime, endTime } = data;

        // Validation
        if (!daysOfWeek?.length || !startTime || !endTime) {
          return NextResponse.json(
            createErrorResponse(400, 'Missing required fields'),
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

        return NextResponse.json(
          createSuccessResponse(201, {
            message: 'Availability created successfully',
            availability: verifiedAvailability,
            slotsCreated: verifiedAvailability.slots.length,
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
