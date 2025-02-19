import { SlotStatus } from '@/models/Availability';
import { Types } from 'mongoose';

interface Slot {
  _id?: Types.ObjectId;
  startTime: Date;
  endTime: Date;
  status: SlotStatus;
  isBooked?: boolean;
  appointmentId?: Types.ObjectId;
  userId?: Types.ObjectId;
  sessionStartedAt?: Date;
  sessionEndedAt?: Date;
}

export interface PsychologistDetails {
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

export interface AvailabilityDocument {
  psychologistId: PsychologistDetails;
  slots?: Slot[];
  daysOfWeek: number[];
}

export interface CalendarEvent {
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
    status: SlotStatus;
  };
  display: string;
  backgroundColor: string;
  borderColor: string;
  textColor: string;
  className: string[];
}

export interface CreateAvailabilityData {
  daysOfWeek: number[];
  startTime: string;
  endTime: string;
  duration?: number;
  timePeriods?: string[];
}

export interface AuthToken {
  id: string;
  roles: string[];
}
