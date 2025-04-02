import { AppointmentStatus } from '@/models/Appointment';

// Helper function to map between UI status and model status
export const mapStatusToModelStatus = (uiStatus: string): string => {
  const statusMap: { [key: string]: string } = {
    scheduled: AppointmentStatus.CONFIRMED,
    completed: AppointmentStatus.COMPLETED,
    canceled: AppointmentStatus.CANCELED,
    'no-show': AppointmentStatus.MISSED,
    ongoing: AppointmentStatus.ONGOING,
  };

  return statusMap[uiStatus] || uiStatus;
};

// Helper function to map from model status to UI status
export const mapModelStatusToUIStatus = (modelStatus: string): string => {
  const reverseStatusMap: { [key: string]: string } = {
    [AppointmentStatus.CONFIRMED]: 'scheduled',
    [AppointmentStatus.COMPLETED]: 'completed',
    [AppointmentStatus.CANCELED]: 'canceled',
    [AppointmentStatus.MISSED]: 'no-show',
    [AppointmentStatus.ONGOING]: 'ongoing',
  };

  return reverseStatusMap[modelStatus] || modelStatus;
};

// Helper function to determine if an appointment is in the past
export const isAppointmentInPast = (appointment: any): boolean => {
  const now = new Date();
  const endTime = new Date(appointment.endTime);

  return endTime < now;
};

// Helper function to determine if an appointment is today
export const isAppointmentToday = (appointment: any): boolean => {
  const now = new Date();
  const startTime = new Date(appointment.startTime);

  return (
    startTime.getDate() === now.getDate() &&
    startTime.getMonth() === now.getMonth() &&
    startTime.getFullYear() === now.getFullYear()
  );
};

// Helper to verify if an appointment can be joined (for video sessions)
export const canJoinAppointment = (appointment: any): boolean => {
  if (appointment.status === AppointmentStatus.CANCELED) {
    return false;
  }

  if (appointment.sessionFormat !== 'video') {
    return false;
  }

  const now = new Date();
  const startTime = new Date(appointment.startTime);
  const endTime = new Date(appointment.endTime);

  // Can join 5 minutes before start time until 15 minutes after end time
  const fiveMinutesBeforeStart = new Date(startTime.getTime() - 5 * 60000);
  const fifteenMinutesAfterEnd = new Date(endTime.getTime() + 15 * 60000);

  return now >= fiveMinutesBeforeStart && now <= fifteenMinutesAfterEnd;
};

// Helper to format a date string
export const formatAppointmentDate = (
  dateString: string,
  format: 'date' | 'time' | 'full' = 'full'
): string => {
  try {
    const date = new Date(dateString);

    switch (format) {
      case 'date':
        return date.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
        });
      case 'time':
        return date.toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
        });
      case 'full':
      default:
        return date.toLocaleString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        });
    }
  } catch (error) {
    console.error('Error formatting date:', error);
    return dateString || 'Invalid date';
  }
};

// Helper to calculate appointment duration in minutes
export const calculateDurationInMinutes = (
  startTime: string,
  endTime: string
): number => {
  try {
    const start = new Date(startTime);
    const end = new Date(endTime);

    return Math.round((end.getTime() - start.getTime()) / 60000);
  } catch (error) {
    console.error('Error calculating duration:', error);
    return 0;
  }
};

// Helper to verify and update appointment status based on current time
export const verifyAppointmentStatus = (appointment: any): any => {
  // Create a copy of the appointment to avoid modifying the original
  const verifiedAppointment = { ...appointment };

  // Add computed properties
  verifiedAppointment.isPast = isAppointmentInPast(appointment);
  verifiedAppointment.isToday = isAppointmentToday(appointment);
  verifiedAppointment.canJoin = canJoinAppointment(appointment);

  // Update status based on time if needed
  const now = new Date();
  const startTime = new Date(appointment.startTime || appointment.dateTime);
  const endTime = new Date(appointment.endTime);

  if (appointment.status !== AppointmentStatus.CANCELED) {
    if (endTime < now) {
      // Appointment is in the past
      if (
        appointment.status !== AppointmentStatus.COMPLETED &&
        appointment.status !== AppointmentStatus.MISSED
      ) {
        verifiedAppointment.status = appointment.joinedAt
          ? AppointmentStatus.COMPLETED
          : AppointmentStatus.MISSED;
      }
    } else if (startTime <= now && endTime > now) {
      // Appointment is ongoing
      if (appointment.status === AppointmentStatus.CONFIRMED) {
        verifiedAppointment.status = AppointmentStatus.ONGOING;
      }
    }
  }

  return verifiedAppointment;
};
