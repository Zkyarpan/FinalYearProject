interface AppointmentParticipant {
  _id?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  profilePhotoUrl?: string;
  phoneNumber?: string;
}

interface Psychologist extends AppointmentParticipant {
  sessionFee?: number;
  specialty?: string;
  languages?: string[];
  licenseType?: string;
  education?: Array<{
    degree: string;
    university: string;
    graduationYear: number;
  }>;
  about?: string;
}

interface User extends AppointmentParticipant {
  // Additional user-specific fields can be added here
}

interface ProfileInfo {
  profilePhotoUrl?: string;
  age?: number;
  gender?: string;
  address?: string;
  emergencyContact?: string;
  emergencyPhone?: string;
  therapyHistory?: string;
  preferredCommunication?: string;
  struggles?: string[];
  briefBio?: string;
}

interface Appointment {
  _id: string;
  startTime?: string;
  dateTime?: string; // Some API responses use dateTime instead of startTime
  endTime: string;
  duration: number;
  sessionFormat: 'video' | 'in-person';
  status: 'confirmed' | 'canceled' | 'completed' | 'ongoing' | 'missed';
  reasonForVisit?: string;
  notes?: string;
  cancelationReason?: string;
  canceledAt?: string;
  patientName?: string;
  email?: string;
  phone?: string;
  psychologist?: Psychologist;
  user?: User;
  userId?: {
    // For past appointments, the API might return userId instead of user
    _id?: string;
    email?: string;
    firstName?: string;
    lastName?: string;
    profilePhotoUrl?: string;
  };
  profile?: ProfileInfo;
  payment: {
    amount: number;
    currency: string;
    status: string;
  };
  isPast: boolean;
  isToday: boolean;
  canJoin: boolean;
}

export const verifyAppointmentStatus = (
  appointment: Appointment
): Appointment => {
  // Re-check isPast and canJoin in case the page has been open for a while
  const now = new Date();
  const appointmentDate = new Date(
    appointment.startTime || appointment.dateTime || ''
  );
  const appointmentEndDate = new Date(appointment.endTime);

  // Check if appointment is today
  const isToday =
    appointmentDate.getDate() === now.getDate() &&
    appointmentDate.getMonth() === now.getMonth() &&
    appointmentDate.getFullYear() === now.getFullYear();

  // Calculate time windows
  const joinWindowStart = new Date(appointmentDate);
  joinWindowStart.setMinutes(joinWindowStart.getMinutes() - 5);

  const joinWindowEnd = new Date(appointmentEndDate);
  joinWindowEnd.setMinutes(joinWindowEnd.getMinutes() + 15);

  // Determine if the appointment is joinable now
  const canJoin =
    appointment.status === 'confirmed' &&
    now >= joinWindowStart &&
    now <= joinWindowEnd;

  // Only mark as past if it's completely over (after join window end)
  const isPast = now > joinWindowEnd;

  // Special case: If the appointment is ongoing, it should not be marked as past
  // even if it started in the past
  const isOngoing = now >= appointmentDate && now <= appointmentEndDate;

  // Make a deep copy to avoid modifying the original
  return {
    ...appointment,
    isPast: isOngoing ? false : isPast,
    isToday,
    canJoin,
  };
};
