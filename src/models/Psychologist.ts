import mongoose, { Schema, Document } from 'mongoose';

export interface IPsychologist extends Document {
  firstName: string;
  lastName: string;
  email: string;
  country: string;
  role: 'admin' | 'psychologist' | 'user';
  streetAddress: string;
  city: string;
  about: string;
  profilePhotoUrl?: string;
  certificateOrLicenseUrl?: string;
  password: string;
  isVerified: boolean;

  licenseNumber: string;
  licenseType:
    | 'clinical_psychologist'
    | 'counseling_psychologist'
    | 'psychiatrist'
    | 'mental_health_counselor';
  education: {
    degree: string;
    university: string;
    graduationYear: number;
  }[];
  specializations: string[];
  yearsOfExperience: number;
  languages: string[];

  sessionDuration: 30 | 50 | 80;
  sessionFee: number;
  sessionFormats: ('in-person' | 'video' | 'phone')[];

  acceptsInsurance: boolean;
  insuranceProviders?: string[];

  availability: {
    monday: { available: boolean; startTime?: string; endTime?: string };
    tuesday: { available: boolean; startTime?: string; endTime?: string };
    wednesday: { available: boolean; startTime?: string; endTime?: string };
    thursday: { available: boolean; startTime?: string; endTime?: string };
    friday: { available: boolean; startTime?: string; endTime?: string };
    saturday: { available: boolean; startTime?: string; endTime?: string };
    sunday: { available: boolean; startTime?: string; endTime?: string };
  };

  acceptingNewClients: boolean;
  ageGroups: ('children' | 'teenagers' | 'adults' | 'seniors')[];

  createdAt: Date;
  updatedAt: Date;
}

const availabilityDaySchema = new Schema(
  {
    available: { type: Boolean, default: false },
    startTime: String,
    endTime: String,
  },
  { _id: false }
);

const educationSchema = new Schema(
  {
    degree: { type: String, required: true },
    university: { type: String, required: true },
    graduationYear: { type: Number, required: true },
  },
  { _id: false }
);

const PsychologistSchema: Schema = new Schema(
  {
    firstName: {
      type: String,
      required: true,
      trim: true,
    },
    lastName: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address.'],
    },
    country: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ['admin', 'psychologist', 'user'],
      default: 'psychologist',
      index: true,
    },
    streetAddress: {
      type: String,
      required: true,
    },
    city: {
      type: String,
      required: true,
    },
    about: {
      type: String,
      required: true,
      maxlength: 1000,
    },
    profilePhotoUrl: String,
    certificateOrLicenseUrl: String,
    password: {
      type: String,
      required: true,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    licenseNumber: {
      type: String,
      required: true,
    },
    licenseType: {
      type: String,
      required: true,
      enum: [
        'clinical_psychologist',
        'counseling_psychologist',
        'psychiatrist',
        'mental_health_counselor',
      ],
    },
    education: [educationSchema],
    specializations: [
      {
        type: String,
        required: true,
      },
    ],
    yearsOfExperience: {
      type: Number,
      required: true,
      min: 0,
    },
    languages: [
      {
        type: String,
        required: true,
      },
    ],

    sessionDuration: {
      type: Number,
      required: true,
      enum: [30, 50, 80],
    },
    sessionFee: {
      type: Number,
      required: true,
      min: 0,
    },
    sessionFormats: [
      {
        type: String,
        enum: ['in-person', 'video', 'phone'],
        required: true,
      },
    ],

    acceptsInsurance: {
      type: Boolean,
      default: false,
    },
    insuranceProviders: [
      {
        type: String,
      },
    ],

    availability: {
      monday: availabilityDaySchema,
      tuesday: availabilityDaySchema,
      wednesday: availabilityDaySchema,
      thursday: availabilityDaySchema,
      friday: availabilityDaySchema,
      saturday: availabilityDaySchema,
      sunday: availabilityDaySchema,
    },

    acceptingNewClients: {
      type: Boolean,
      default: true,
    },
    ageGroups: [
      {
        type: String,
        enum: ['children', 'teenagers', 'adults', 'seniors'],
      },
    ],
  },
  {
    timestamps: true,
  }
);

PsychologistSchema.index({ specializations: 1 });
PsychologistSchema.index({ languages: 1 });
PsychologistSchema.index({ city: 1, stateOrProvince: 1 });
PsychologistSchema.index({ sessionFee: 1 });

const Psychologist =
  mongoose.models.Psychologist ||
  mongoose.model<IPsychologist>('Psychologist', PsychologistSchema);

export default Psychologist;
