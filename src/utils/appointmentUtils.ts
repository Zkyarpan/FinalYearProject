/**
 * Utility functions for appointment time handling
 */

/**
 * Process an appointment to determine its timing status
 * @param {Object} appointment - The appointment object
 * @returns {Object} Appointment with added isPast, isToday, and canJoin properties
 */
export const processAppointmentTiming = appointment => {
  const now = new Date();

  // Ensure we're using consistent field name (handle both startTime and dateTime)
  const startTimeField = appointment.startTime || appointment.dateTime;
  const appointmentDate = new Date(startTimeField);

  // Check if appointment is today
  const isToday =
    appointmentDate.getDate() === now.getDate() &&
    appointmentDate.getMonth() === now.getMonth() &&
    appointmentDate.getFullYear() === now.getFullYear();

  // Determine if appointment is in the past
  const isPast = appointmentDate < now;

  // Calculate join window (5 minutes before to 15 minutes after)
  const joinWindowStart = new Date(appointmentDate);
  joinWindowStart.setMinutes(joinWindowStart.getMinutes() - 5);

  const joinWindowEnd = new Date(appointmentDate);
  joinWindowEnd.setMinutes(joinWindowEnd.getMinutes() + 15);

  // Determine if user can join
  const canJoin =
    appointment.status === 'confirmed' &&
    now >= joinWindowStart &&
    now <= joinWindowEnd;

  return {
    ...appointment,
    isPast,
    isToday,
    canJoin,
  };
};

/**
 * Format a date for display
 * @param {string|Date} dateString - The date to format
 * @param {string} formatType - 'date', 'time', or 'full'
 * @returns {string} Formatted date string
 */
export const formatDate = (dateString, formatType = 'full') => {
  if (!dateString) return 'N/A';

  try {
    const date = new Date(dateString);

    // Check if date is valid
    if (isNaN(date.getTime())) {
      return 'Invalid date';
    }

    switch (formatType) {
      case 'date':
        return date.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        });
      case 'time':
        return date.toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
          hour12: true,
        });
      case 'full':
        return `${formatDate(dateString, 'date')} at ${formatDate(
          dateString,
          'time'
        )}`;
      default:
        return 'Invalid format';
    }
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Date error';
  }
};

/**
 * Determine the badge variant for an appointment
 * @param {Object} appointment - The appointment object
 * @returns {string} Badge variant
 */
export const getStatusBadgeVariant = appointment => {
  const { status, isPast, isToday } = appointment;

  // Status-based variants
  if (status === 'canceled') return 'destructive';
  if (status === 'completed') return 'secondary';
  if (status === 'ongoing') return 'custom';
  if (status === 'missed') return 'destructive';

  // Timing-based variants for confirmed appointments
  if (status === 'confirmed') {
    if (isPast) return 'outline';
    if (isToday) return 'default';
  }

  return 'default';
};
