import mongoose from 'mongoose';

export interface Slot {
  _id: mongoose.Types.ObjectId;
  startTime: Date;
  endTime: Date;
  duration: number;
  isBooked: boolean;
  status: string;
}

export interface DayData {
  baseStartTime: string;
  baseEndTime: string;
  baseTimePeriods: string[];
  slots: ProcessedSlot[];
}

export interface ProcessedSlot {
  id: string;
  start: Date;
  end: Date;
  duration: number;
  timePeriods: string[];
  isBooked: boolean;
  status: string;
}

export interface FormattedSlot {
  id: string;
  startTime: string;
  originalStartTime: string;
  endTime: string;
  originalEndTime: string;
  date: string;
  duration: number;
  timePeriods: string[];
  isBooked: boolean;
  status: string;
}

export interface FormattedDay {
  available: boolean;
  startTime: string;
  endTime: string;
  slots: FormattedSlot[];
  timePeriods?: string[];
}

export interface Availability {
  _id: mongoose.Types.ObjectId;
  psychologistId: mongoose.Types.ObjectId;
  daysOfWeek: number[];
  startTime: string;
  endTime: string;
  duration: number;
  timePeriods: string[];
  slots: Slot[];
  isActive: boolean;
}
