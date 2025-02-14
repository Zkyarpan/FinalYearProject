export interface SendVerificationEmailParams {
  email: string;
  verifyCode: string;
}

export interface VerificationEmailResponse {
  success: boolean;
  message: string;
}

export type AppointmentStatus =
  | 'scheduled'
  | 'confirmed'
  | 'completed'
  | 'canceled'
  | 'no-show';

// types.ts - Contains all type definitions
export interface Profile {
  firstName: string;
  lastName: string;
  image: string;
}

export interface User {
  email: string;
  profile: Profile;
}

export interface Appointment {
  _id: string;
  patientName: string;
  startTime: string;
  endTime: string;
  dateTime: string;
  duration: number;
  userId: User;
  status: 'pending' | 'confirmed' | 'cancelled';
  sessionFormat: 'video' | 'in-person';
  videoCallLink?: string;
}

export interface DailyAvailability {
  dayOfWeek: number;
  timeSlots: TimeSlot[];
}

export interface Availability {
  daysOfWeek: number[];
  timeSlots: DailyAvailability[];
}

export interface Psychologist {
  id: string;
  name: string;
  specialization?: string;
  availability?: {
    daysOfWeek: number[];
    startTime: string;
    endTime: string;
  }[];
}

export interface AppointmentFormData {
  title: string;
  patientName: string;
  notes: string;
  start: string;
  end: string;
  status: AppointmentStatus;
}

export interface TimeSlot {
  _id: string;
  startTime: Date;
  endTime: Date;
  isBooked: boolean;
}

export interface AvailabilitySlot {
  id: string;
  daysOfWeek: number[];
  startTime: string;
  endTime: string;
}

export interface AvailabilitySettingsProps {
  onRefresh?: () => Promise<void>;
}
