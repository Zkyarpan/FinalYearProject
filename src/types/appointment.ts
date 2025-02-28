export interface Event {
  id: string;
  title: string;
  start: Date;
  end: Date;
  extendedProps: any;
  display: string;
  backgroundColor: string;
  borderColor: string;
  textColor: string;
  classNames: string[];
}

export interface PsychologistDetails {
  psychologistId: string;
  psychologistName: string;
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

export interface SelectedSlot {
  start: string;
  title: string;
  end: string;
  psychologistId: string;
  psychologistName: string;
  psychologistPhoto: string;
  sessionDuration: number;
  sessionFee: number;
  sessionFormat: string;
  timezone: string;
  rawStartTime: string;
  rawEndTime: string;
  originalStartTime: string;
  originalEndTime: string;
  about: string;
  sessionFormats: string[];
  timePeriods: string[];
  profilePhotoUrl: string;
  licenseType: string;
  yearsOfExperience: number;
  languages: string[];
  specializations: string[];
  id: string;
  date: string;
  status: string;
  isBooked: boolean;
  acceptsInsurance: boolean;
}

export interface BookingDetails {
  title: string;
  notes: string;
  patientName: string;
  email: string;
  phone: string;
  sessionFormat: string;
  insuranceProvider: string;
  reasonForVisit: string;
}

export interface AppointmentEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  display: string;
  backgroundColor: string;
  borderColor: string;
  textColor: string;
  className?: string;
  extendedProps?: Record<string, any>;
}
