import mongoose from 'mongoose';

export interface IPsychologist {
  _id: mongoose.Types.ObjectId;
  firstName: string;
  lastName: string;
  email: string;
  country: string;
  streetAddress: string;
  city: string;
  about: string;
  profilePhotoUrl: string;
  certificateOrLicenseUrl: string;
  licenseType: string;
  licenseNumber: string;
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
    monday: { available: boolean; startTime: string; endTime: string };
    tuesday: { available: boolean; startTime: string; endTime: string };
    wednesday: { available: boolean; startTime: string; endTime: string };
    thursday: { available: boolean; startTime: string; endTime: string };
    friday: { available: boolean; startTime: string; endTime: string };
    saturday: { available: boolean; startTime: string; endTime: string };
    sunday: { available: boolean; startTime: string; endTime: string };
  };
}
