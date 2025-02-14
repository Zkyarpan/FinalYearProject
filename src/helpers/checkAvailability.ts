'use server';
import Availability from '@/models/Availability';
import Appointment from '@/models/Appointment';

export async function checkAvailability(
  start: Date,
  end: Date,
  psychologistId: string
) {
  const startDate = new Date(start);
  const endDate = new Date(end);
  const currentDate = new Date();

  // Time validation
  if (startDate < currentDate) {
    return { isValid: false, error: 'Cannot book appointments in the past' };
  }

  if (endDate <= startDate) {
    return { isValid: false, error: 'Invalid time range' };
  }

  // Check psychologist's availability
  const availabilitySlot = await Availability.findOne({
    psychologistId,
    daysOfWeek: startDate.getDay(),
    startTime: {
      $lte: startDate.toLocaleTimeString('en-US', {
        hour12: false,
        hour: '2-digit',
        minute: '2-digit',
      }),
    },
    endTime: {
      $gte: endDate.toLocaleTimeString('en-US', {
        hour12: false,
        hour: '2-digit',
        minute: '2-digit',
      }),
    },
  });

  if (!availabilitySlot) {
    return {
      isValid: false,
      error: "Selected time is outside of provider's availability",
    };
  }

  // Check for existing appointments
  const existingAppointment = await Appointment.findOne({
    psychologistId,
    $or: [
      {
        dateTime: { $lt: endDate, $gte: startDate },
      },
      {
        endTime: { $gt: startDate, $lte: endDate },
      },
    ],
    status: { $nin: ['canceled'] },
  });

  if (existingAppointment) {
    return {
      isValid: false,
      error: 'Time slot is no longer available',
    };
  }

  return {
    isValid: true,
    slot: { start: startDate, end: endDate, psychologistId },
  };
}
