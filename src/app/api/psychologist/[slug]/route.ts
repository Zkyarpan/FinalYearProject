'use server';

import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/db/db';
import Psychologist from '@/models/Psychologist';
import Availability, { SlotStatus } from '@/models/Availability';
import { createErrorResponse, createSuccessResponse } from '@/lib/response';

export async function GET(
  request: NextRequest,
  context: { params: { slug: string } }
) {
  try {
    await connectDB();

    const slug = context.params.slug;

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

    // Initialize availability object with default values
    const formattedAvailability = {
      monday: { available: false, startTime: '', endTime: '' },
      tuesday: { available: false, startTime: '', endTime: '' },
      wednesday: { available: false, startTime: '', endTime: '' },
      thursday: { available: false, startTime: '', endTime: '' },
      friday: { available: false, startTime: '', endTime: '' },
      saturday: { available: false, startTime: '', endTime: '' },
      sunday: { available: false, startTime: '', endTime: '' },
    };

    // Get availability data
    const availabilityDoc = await Availability.findOne({
      psychologistId: psychologist._id,
      isActive: true,
    });

    // Process slot data if available
    if (
      availabilityDoc &&
      availabilityDoc.slots &&
      availabilityDoc.slots.length > 0
    ) {
      // Group slots by day of week
      const slotsByDay = {};

      // Filter to only available slots
      const availableSlots = availabilityDoc.slots.filter(
        slot => slot.status === SlotStatus.AVAILABLE
      );

      availableSlots.forEach(slot => {
        const startTime = new Date(slot.startTime);
        const endTime = new Date(slot.endTime);
        const dayOfWeek = startTime.getDay(); // 0 = Sunday, 1 = Monday, ...

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

        const dayName = dayMap[dayOfWeek];

        if (!slotsByDay[dayName]) {
          slotsByDay[dayName] = [];
        }

        slotsByDay[dayName].push({
          start: startTime,
          end: endTime,
        });
      });

      // Format time to 24-hour format (HH:MM)
      const formatTimeString = date => {
        const hours = date.getUTCHours().toString().padStart(2, '0');
        const minutes = date.getUTCMinutes().toString().padStart(2, '0');
        return `${hours}:${minutes}`;
      };

      // Update availability with actual slot data
      Object.keys(slotsByDay).forEach(day => {
        if (slotsByDay[day].length > 0) {
          // Sort slots by start time
          const sortedSlots = slotsByDay[day].sort(
            (a, b) => a.start.getTime() - b.start.getTime()
          );

          const earliestSlot = sortedSlots[0];
          const latestSlot = sortedSlots[sortedSlots.length - 1];

          formattedAvailability[day] = {
            available: true,
            startTime: formatTimeString(earliestSlot.start),
            endTime: formatTimeString(latestSlot.end),
          };
        }
      });
    } else if (availabilityDoc) {
      // Use the availability settings if no slots are found
      const dayMap = {
        0: 'sunday',
        1: 'monday',
        2: 'tuesday',
        3: 'wednesday',
        4: 'thursday',
        5: 'friday',
        6: 'saturday',
      };

      availabilityDoc.daysOfWeek.forEach(day => {
        const dayName = dayMap[day];
        formattedAvailability[dayName] = {
          available: true,
          startTime: availabilityDoc.startTime,
          endTime: availabilityDoc.endTime,
        };
      });
    }

    // Format the psychologist data for the response
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
      createErrorResponse(500, 'Internal Server Error'),
      { status: 500 }
    );
  }
}
