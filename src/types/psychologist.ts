// import mongoose from 'mongoose';

// export interface IPsychologist {
//   _id: mongoose.Types.ObjectId;
//   firstName: string;
//   lastName: string;
//   email: string;
//   country: string;
//   streetAddress: string;
//   city: string;
//   about: string;
//   profilePhotoUrl: string;
//   certificateOrLicenseUrl: string;
//   licenseType: string;
//   licenseNumber: string;
//   yearsOfExperience: number;
//   education: Array<{
//     degree: string;
//     university: string;
//     graduationYear: number;
//   }>;
//   languages: string[];
//   specializations: string[];
//   sessionDuration: number;
//   sessionFee: number;
//   sessionFormats: string[];
//   acceptsInsurance: boolean;
//   insuranceProviders: string[];
//   acceptingNewClients: boolean;
//   ageGroups: string[];
//   availability: {
//     monday: { available: boolean; startTime: string; endTime: string };
//     tuesday: { available: boolean; startTime: string; endTime: string };
//     wednesday: { available: boolean; startTime: string; endTime: string };
//     thursday: { available: boolean; startTime: string; endTime: string };
//     friday: { available: boolean; startTime: string; endTime: string };
//     saturday: { available: boolean; startTime: string; endTime: string };
//     sunday: { available: boolean; startTime: string; endTime: string };
//   };
// }

// types/psychologist.ts
export interface Education {
  degree: string;
  university: string;
  graduationYear: number;
}

export interface AvailabilityDay {
  available: boolean;
  startTime?: string;
  endTime?: string;
}

export type LicenseType =
  | 'clinical_psychologist'
  | 'counseling_psychologist'
  | 'psychiatrist'
  | 'mental_health_counselor'
  | 'school_psychologist'
  | 'neuropsychologist'
  | 'health_psychologist'
  | 'forensic_psychologist';

export type ApprovalStatus = 'pending' | 'approved' | 'rejected';

export type SessionFormat = 'in-person' | 'video' | 'phone';

export type AgeGroup = 'children' | 'teenagers' | 'adults' | 'seniors';

export interface IPsychologist {
  _id: string;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  country: string;
  city: string;
  streetAddress: string;
  about: string;
  role: 'psychologist';
  licenseNumber: string;
  licenseType: LicenseType;
  profilePhotoUrl?: string;
  certificateOrLicenseUrl?: string;
  isVerified: boolean;
  approvalStatus: ApprovalStatus;
  adminFeedback?: string;
  approvedAt?: Date;
  rejectedAt?: Date;
  education: Education[];
  specializations: string[];
  yearsOfExperience: number;
  languages: string[];
  sessionDuration: 30 | 50 | 80;
  sessionFee: number;
  sessionFormats: SessionFormat[];
  acceptsInsurance: boolean;
  insuranceProviders?: string[];
  acceptingNewClients: boolean;
  ageGroups: AgeGroup[];
  availability: {
    monday: AvailabilityDay;
    tuesday: AvailabilityDay;
    wednesday: AvailabilityDay;
    thursday: AvailabilityDay;
    friday: AvailabilityDay;
    saturday: AvailabilityDay;
    sunday: AvailabilityDay;
  };
  createdAt: Date;
  updatedAt: Date;
}

// For use in components when displaying a psychologist profile
export interface PsychologistDisplay {
  _id: string;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  country: string;
  city: string;
  streetAddress: string;
  about: string;
  licenseNumber: string;
  licenseType: LicenseType;
  profilePhotoUrl?: string;
  certificateOrLicenseUrl?: string;
  approvalStatus: ApprovalStatus;
  adminFeedback?: string;
  education: Education[];
  specializations: string[];
  yearsOfExperience: number;
  languages: string[];
  sessionDuration: 30 | 50 | 80;
  sessionFee: number;
  sessionFormats: SessionFormat[];
  acceptsInsurance: boolean;
  insuranceProviders?: string[];
  acceptingNewClients: boolean;
  ageGroups: AgeGroup[];
}
