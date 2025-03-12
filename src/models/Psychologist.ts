import mongoose, { Schema, Document } from 'mongoose';

// Define interfaces for stronger typing
export interface ISlot {
  id: string;
  startTime: string;
  originalStartTime: string;
  endTime: string;
  originalEndTime: string;
  date: string;
  duration: number;
  timePeriods: string[];
  isBooked?: boolean;
}

export interface IAvailabilityDay {
  available: boolean;
  startTime?: string;
  endTime?: string;
  slots?: ISlot[];
}

export interface IPsychologist extends Document {
  // Personal Information
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  country: string;
  city: string;
  streetAddress: string;
  about: string;

  // Professional Details
  role: 'admin' | 'psychologist' | 'user';
  licenseNumber: string;
  licenseType:
    | 'clinical_psychologist'
    | 'counseling_psychologist'
    | 'psychiatrist'
    | 'mental_health_counselor'
    | 'school_psychologist'
    | 'neuropsychologist'
    | 'health_psychologist'
    | 'forensic_psychologist';

  // Media and Verification
  profilePhotoUrl?: string;
  certificateOrLicenseUrl?: string;
  password: string;
  isVerified: boolean;

  // Admin Approval
  approvalStatus: 'pending' | 'approved' | 'rejected';
  adminFeedback?: string;
  approvedAt?: Date;
  rejectedAt?: Date;

  // Professional Background
  education: {
    degree: string;
    university: string;
    graduationYear: number;
  }[];
  specializations: string[];
  yearsOfExperience: number;
  languages: string[];

  // Session Details
  sessionDuration: 30 | 50 | 80;
  sessionFee: number;
  sessionFormats: ('in-person' | 'video' | 'phone')[];

  // Insurance and Clients
  acceptsInsurance: boolean;
  insuranceProviders?: string[];
  acceptingNewClients: boolean;
  ageGroups: ('children' | 'teenagers' | 'adults' | 'seniors')[];

  // Availability
  availability: {
    monday: IAvailabilityDay;
    tuesday: IAvailabilityDay;
    wednesday: IAvailabilityDay;
    thursday: IAvailabilityDay;
    friday: IAvailabilityDay;
    saturday: IAvailabilityDay;
    sunday: IAvailabilityDay;
  };

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

// Slot Schema
const SlotSchema: Schema = new Schema(
  {
    id: {
      type: String,
      required: true,
    },
    startTime: {
      type: String,
      required: true,
    },
    originalStartTime: {
      type: String,
      required: true,
    },
    endTime: {
      type: String,
      required: true,
    },
    originalEndTime: {
      type: String,
      required: true,
    },
    date: {
      type: String,
      required: true,
    },
    duration: {
      type: Number,
      required: true,
    },
    timePeriods: [
      {
        type: String,
        enum: ['MORNING', 'AFTERNOON', 'EVENING', 'NIGHT'],
      },
    ],
    isBooked: {
      type: Boolean,
      default: false,
    },
  },
  { _id: false }
);

// Availability Day Schema
const AvailabilityDaySchema: Schema = new Schema(
  {
    available: {
      type: Boolean,
      default: false,
    },
    startTime: {
      type: String,
    },
    endTime: {
      type: String,
    },
    slots: [SlotSchema],
  },
  { _id: false }
);

// Main Psychologist Schema
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
    fullName: {
      type: String,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address.'],
    },
    country: {
      type: String,
      required: true,
    },
    city: {
      type: String,
      required: true,
    },
    streetAddress: {
      type: String,
      required: true,
    },
    about: {
      type: String,
      required: true,
      maxlength: 1000,
    },
    role: {
      type: String,
      enum: ['admin', 'psychologist', 'user'],
      default: 'psychologist',
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
        'school_psychologist',
        'neuropsychologist',
        'health_psychologist',
        'forensic_psychologist',
      ],
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
    // Admin approval fields
    approvalStatus: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
    adminFeedback: {
      type: String,
    },
    approvedAt: {
      type: Date,
    },
    rejectedAt: {
      type: Date,
    },
    education: [
      {
        degree: {
          type: String,
          required: true,
        },
        university: {
          type: String,
          required: true,
        },
        graduationYear: {
          type: Number,
          required: true,
        },
      },
    ],
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
    insuranceProviders: [String],
    availability: {
      monday: AvailabilityDaySchema,
      tuesday: AvailabilityDaySchema,
      wednesday: AvailabilityDaySchema,
      thursday: AvailabilityDaySchema,
      friday: AvailabilityDaySchema,
      saturday: AvailabilityDaySchema,
      sunday: AvailabilityDaySchema,
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
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Pre-save middleware to create full name
PsychologistSchema.pre('save', function (next) {
  this.fullName = `Dr. ${this.firstName} ${this.lastName}`;
  next();
});

// Indexes for performance
PsychologistSchema.index({
  specializations: 1,
  languages: 1,
  city: 1,
  sessionFee: 1,
  approvalStatus: 1, // Add index for approval status for faster filtering
});

const Psychologist =
  mongoose.models.Psychologist ||
  mongoose.model('Psychologist', PsychologistSchema);

export default Psychologist;
