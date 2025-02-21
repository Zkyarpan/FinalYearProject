'use server';

import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/db/db';
import Psychologist from '@/models/Psychologist';
import Availability, { SlotStatus } from '@/models/Availability';
import { createErrorResponse, createSuccessResponse } from '@/lib/response';
import mongoose from 'mongoose';

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

    // Find the psychologist
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

    // Helper functions for time formatting
    const formatTime12Hour = (time24: string): string => {
      if (!time24) return '';

      // Handle already formatted times
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
      if (hour >= 21 || hour < 0) periods.push('NIGHT');
      return periods;
    };

    // Get current date for availability search - only look for one week
    const now = new Date();
    const oneWeekLater = new Date(now);
    oneWeekLater.setDate(now.getDate() + 7);

    // Find all active availabilities and their slots for this psychologist
    const availabilities = await Availability.aggregate([
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
                  { $eq: ['$$slot.status', SlotStatus.AVAILABLE] },
                ],
              },
            },
          },
        },
      },
    ]);

    // Initialize availability object with default values
    const formattedAvailability = {
      monday: { available: false, startTime: '', endTime: '', slots: [] },
      tuesday: { available: false, startTime: '', endTime: '', slots: [] },
      wednesday: { available: false, startTime: '', endTime: '', slots: [] },
      thursday: { available: false, startTime: '', endTime: '', slots: [] },
      friday: { available: false, startTime: '', endTime: '', slots: [] },
      saturday: { available: false, startTime: '', endTime: '', slots: [] },
      sunday: { available: false, startTime: '', endTime: '', slots: [] },
    };

    // Process all availabilities
    if (availabilities.length > 0) {
      // Map day number to day name
      const dayMap = {
        0: 'sunday',
        1: 'monday',
        2: 'tuesday',
        3: 'wednesday',
        4: 'thursday',
        5: 'friday',
        6: 'saturday',
      };

      // Process slots from all availabilities
      const slotsByDay = {};

      availabilities.forEach(avail => {
        // Initialize days from the daysOfWeek pattern
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

        // Add actual slots to their respective days
        (avail.slots || []).forEach(slot => {
          const slotDate = new Date(slot.startTime);
          const dayOfWeek = slotDate.getDay();
          const dayName = dayMap[dayOfWeek];

          if (!slotsByDay[dayName]) {
            slotsByDay[dayName] = {
              baseStartTime: avail.startTime,
              baseEndTime: avail.endTime,
              baseTimePeriods: avail.timePeriods || [],
              slots: [],
            };
          }

          // Determine time periods
          const slotStartHour = slotDate.getHours();
          const slotTimePeriods = determineTimePeriods(slotStartHour);

          slotsByDay[dayName].slots.push({
            id: slot._id.toString(),
            start: new Date(slot.startTime),
            end: new Date(slot.endTime),
            duration: slot.duration || avail.duration,
            timePeriods: slotTimePeriods,
          });
        });
      });

      // Format the final availability object
      Object.keys(slotsByDay).forEach(day => {
        const dayData = slotsByDay[day];

        if (dayData.slots.length > 0) {
          // Sort slots by start time
          const sortedSlots = dayData.slots.sort(
            (a, b) => a.start.getTime() - b.start.getTime()
          );

          const earliestSlot = sortedSlots[0];
          const latestSlot = sortedSlots[sortedSlots.length - 1];

          formattedAvailability[day] = {
            available: true,
            startTime: formatTime12Hour(
              `${earliestSlot.start.getHours()}:${earliestSlot.start
                .getMinutes()
                .toString()
                .padStart(2, '0')}`
            ),
            endTime: formatTime12Hour(
              `${latestSlot.end.getHours()}:${latestSlot.end
                .getMinutes()
                .toString()
                .padStart(2, '0')}`
            ),
            slots: sortedSlots.map(slot => ({
              id: slot.id,
              startTime: formatTime12Hour(
                `${slot.start.getHours()}:${slot.start
                  .getMinutes()
                  .toString()
                  .padStart(2, '0')}`
              ),
              originalStartTime: formatTime12Hour(
                `${slot.start.getHours()}:${slot.start
                  .getMinutes()
                  .toString()
                  .padStart(2, '0')}`
              ),
              endTime: formatTime12Hour(
                `${slot.end.getHours()}:${slot.end
                  .getMinutes()
                  .toString()
                  .padStart(2, '0')}`
              ),
              originalEndTime: formatTime12Hour(
                `${slot.end.getHours()}:${slot.end
                  .getMinutes()
                  .toString()
                  .padStart(2, '0')}`
              ),
              date: slot.start.toISOString().split('T')[0],
              duration: slot.duration,
              timePeriods: slot.timePeriods,
            })),
          };
        } else if (dayData.baseStartTime && dayData.baseEndTime) {
          // Use base availability if no specific slots
          formattedAvailability[day] = {
            available: true,
            startTime: formatTime12Hour(dayData.baseStartTime),
            endTime: formatTime12Hour(dayData.baseEndTime),
            timePeriods: dayData.baseTimePeriods,
            slots: [],
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
