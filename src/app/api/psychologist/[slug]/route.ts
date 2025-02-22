'use server';

import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/db/db';
import Psychologist from '@/models/Psychologist';
import Availability from '@/models/Availability';
import { createErrorResponse, createSuccessResponse } from '@/lib/response';
import mongoose from 'mongoose';
import {
  Availability as AvailabilityType,
  DayData,
  FormattedDay,
  Slot,
} from '@/types/slot';

export async function GET(request: NextRequest, { params }) {
  try {
    await connectDB();

    const { slug } = await params;
    if (!slug) {
      return NextResponse.json(createErrorResponse(400, 'Slug is required'), {
        status: 400,
      });
    }

    const nameParts = slug
      .toLowerCase()
      .replace(/^dr-/, '')
      .split('-')
      .filter(Boolean);
    if (nameParts.length < 2) {
      return NextResponse.json(
        createErrorResponse(400, 'Invalid name format in slug'),
        { status: 400 }
      );
    }

    const firstName = nameParts[0];
    const lastName = nameParts.slice(1).join(' ');

    const psychologistDoc = await Psychologist.findOne({
      firstName: new RegExp(`^${firstName}$`, 'i'),
      lastName: new RegExp(`^${lastName}$`, 'i'),
    });

    if (!psychologistDoc) {
      return NextResponse.json(
        createErrorResponse(404, 'Psychologist not found'),
        { status: 404 }
      );
    }

    const psychologist = psychologistDoc.toObject();
    const psychologistId = psychologist._id.toString();

    const formatTime12Hour = (time24: string): string => {
      if (!time24) return '';
      if (time24.includes(' ')) return time24;

      const [hours, minutes] = time24.split(':').map(Number);
      const period = hours >= 12 ? 'PM' : 'AM';
      const hours12 = hours % 12 || 12;
      return `${hours12}:${minutes.toString().padStart(2, '0')} ${period}`;
    };

    const determineTimePeriods = (hour: number): string[] => {
      const periods: string[] = [];
      if (hour >= 0 && hour < 12) periods.push('MORNING');
      if (hour >= 12 && hour < 17) periods.push('AFTERNOON');
      if (hour >= 17 && hour < 21) periods.push('EVENING');
      if (hour >= 21) periods.push('NIGHT');
      return periods;
    };

    const now = new Date();
    const oneWeekLater = new Date(now);
    oneWeekLater.setDate(now.getDate() + 7);

    const availabilities = await Availability.aggregate<AvailabilityType>([
      {
        $match: {
          psychologistId: new mongoose.Types.ObjectId(psychologistId),
          isActive: true,
        },
      },
      {
        $project: {
          daysOfWeek: 1,
          startTime: 1,
          endTime: 1,
          duration: 1,
          timePeriods: 1,
          slots: {
            $filter: {
              input: '$slots',
              as: 'slot',
              cond: {
                $and: [
                  { $gte: ['$$slot.startTime', now] },
                  { $lte: ['$$slot.startTime', oneWeekLater] },
                  { $eq: ['$$slot.status', 'available'] },
                  { $eq: ['$$slot.isBooked', false] },
                ],
              },
            },
          },
        },
      },
    ]);

    const formattedAvailability: Record<string, FormattedDay> = {
      monday: { available: false, startTime: '', endTime: '', slots: [] },
      tuesday: { available: false, startTime: '', endTime: '', slots: [] },
      wednesday: { available: false, startTime: '', endTime: '', slots: [] },
      thursday: { available: false, startTime: '', endTime: '', slots: [] },
      friday: { available: false, startTime: '', endTime: '', slots: [] },
      saturday: { available: false, startTime: '', endTime: '', slots: [] },
      sunday: { available: false, startTime: '', endTime: '', slots: [] },
    };

    if (availabilities.length > 0) {
      const dayMap: Record<number, string> = {
        0: 'sunday',
        1: 'monday',
        2: 'tuesday',
        3: 'wednesday',
        4: 'thursday',
        5: 'friday',
        6: 'saturday',
      };

      const slotsByDay: Record<string, DayData> = {};

      availabilities.forEach((avail: AvailabilityType) => {
        avail.daysOfWeek.forEach(dayNum => {
          const dayName = dayMap[dayNum];
          if (!slotsByDay[dayName]) {
            slotsByDay[dayName] = {
              baseStartTime: avail.startTime,
              baseEndTime: avail.endTime,
              baseTimePeriods: avail.timePeriods || [],
              slots: [],
            };
          }
        });

        (avail.slots || []).forEach((slot: Slot) => {
          const slotDate = new Date(slot.startTime);
          const dayName = dayMap[slotDate.getDay()];

          if (slotDate > now && !slot.isBooked) {
            const slotStartHour = slotDate.getHours();

            slotsByDay[dayName].slots.push({
              id: slot._id.toString(),
              start: slotDate,
              end: new Date(slot.endTime),
              duration: slot.duration || avail.duration,
              timePeriods: determineTimePeriods(slotStartHour),
              isBooked: false,
              status: 'available',
            });
          }
        });
      });

      Object.entries(slotsByDay).forEach(([day, dayData]) => {
        if (dayData.slots.length > 0) {
          const sortedSlots = [...dayData.slots].sort(
            (a, b) => a.start.getTime() - b.start.getTime()
          );

          formattedAvailability[day] = {
            available: true,
            startTime: formatTime12Hour(
              `${sortedSlots[0].start.getHours()}:${sortedSlots[0].start.getMinutes()}`
            ),
            endTime: formatTime12Hour(
              `${sortedSlots[
                sortedSlots.length - 1
              ].end.getHours()}:${sortedSlots[
                sortedSlots.length - 1
              ].end.getMinutes()}`
            ),
            slots: sortedSlots.map(slot => ({
              id: slot.id,
              startTime: formatTime12Hour(
                `${slot.start.getHours()}:${slot.start.getMinutes()}`
              ),
              originalStartTime: formatTime12Hour(
                `${slot.start.getHours()}:${slot.start.getMinutes()}`
              ),
              endTime: formatTime12Hour(
                `${slot.end.getHours()}:${slot.end.getMinutes()}`
              ),
              originalEndTime: formatTime12Hour(
                `${slot.end.getHours()}:${slot.end.getMinutes()}`
              ),
              date: slot.start.toISOString().split('T')[0],
              duration: slot.duration,
              timePeriods: slot.timePeriods,
              isBooked: false,
              status: 'available',
            })),
          };
        }
      });
    }

    const formattedPsychologist = {
      id: psychologist._id.toString(),
      firstName: psychologist.firstName || '',
      lastName: psychologist.lastName || '',
      email: psychologist.email || '',
      country: psychologist.country || '',
      streetAddress: psychologist.streetAddress || '',
      city: psychologist.city || '',
      about: psychologist.about || '',
      profilePhoto: psychologist.profilePhotoUrl || '',
      certificateOrLicense: psychologist.certificateOrLicenseUrl || '',
      licenseType: psychologist.licenseType || '',
      licenseNumber: psychologist.licenseNumber || '',
      yearsOfExperience: psychologist.yearsOfExperience || 0,
      education: psychologist.education || [],
      languages: psychologist.languages || [],
      specializations: psychologist.specializations || [],
      sessionDuration: psychologist.sessionDuration || 0,
      sessionFee: psychologist.sessionFee || 0,
      sessionFormats: psychologist.sessionFormats || [],
      acceptsInsurance: psychologist.acceptsInsurance || false,
      insuranceProviders: psychologist.insuranceProviders || [],
      acceptingNewClients: psychologist.acceptingNewClients || false,
      ageGroups: psychologist.ageGroups || [],
      availability: formattedAvailability,
      fullName: `Dr. ${psychologist.firstName} ${psychologist.lastName}`,
    };

    return NextResponse.json(
      createSuccessResponse(200, {
        message: 'Psychologist fetched successfully',
        psychologist: formattedPsychologist,
      }),
      { status: 200 }
    );
  } catch (error) {
    console.error('Server error:', error);
    return NextResponse.json(
      createErrorResponse(
        500,
        'Internal Server Error: ' + (error as Error).message
      ),
      { status: 500 }
    );
  }
}
