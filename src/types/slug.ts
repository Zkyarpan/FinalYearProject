export interface Slot {
  id: string;
  startTime: string;
  endTime: string;
  date: string;
  duration: number;
  timePeriods: string[];
  rawStartTime: string;
  originalStartTime: string;
  originalEndTime: string;
  rawEndTime: string;
  isBooked?: boolean;
}

export interface DayAvailability {
  available: boolean;
  startTime: string;
  endTime: string;
  timePeriods?: string[];
  slots?: Slot[];
}

export interface PsychologistProfile {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  country: string;
  city: string;
  about: string;
  profilePhoto: string;
  licenseType: string;
  yearsOfExperience: number;
  education: Array<{
    degree: string;
    university: string;
    graduationYear: number;
  }>;
  languages: string[];
  specializations: string[];
  sessionDuration: number;
  sessionFee: number;
  sessionFormats: string[];
  acceptsInsurance: boolean;
  insuranceProviders: string[];
  acceptingNewClients: boolean;
  ageGroups: string[];
  availability: {
    [key: string]: DayAvailability;
  };
  fullName: string;
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
