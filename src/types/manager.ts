export interface AppointmentParticipant {
  _id?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  profilePhotoUrl?: string;
  phoneNumber?: string;
}

export interface Psychologist extends AppointmentParticipant {
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

export interface User extends AppointmentParticipant {
  // Additional user-specific fields can be added here
}

export interface ProfileInfo {
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

export interface Appointment {
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

export const formatDate = (
  dateString: string | undefined,
  formatType: 'date' | 'time' | 'full'
) => {
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
        return `${formatDate(dateString, 'date')} ${formatDate(
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