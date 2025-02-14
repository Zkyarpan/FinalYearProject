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
  start: Date;
  end: Date;
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
