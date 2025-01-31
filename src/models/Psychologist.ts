// import mongoose, { Schema, Document } from 'mongoose';

// export interface IPsychologist extends Document {
//   username: string;
//   firstName: string;
//   lastName: string;
//   email: string;
//   country: string;
//   role: 'admin' | 'psychologist' | 'user';
//   streetAddress: string;
//   city: string;
//   stateOrProvince: string;
//   postalCode: string;
//   about: string;
//   profilePhotoUrl?: string;
//   certificateOrLicenseUrl?: string;
//   password: string;
//   createdAt: Date;
//   updatedAt: Date;
// }

// const PsychologistSchema: Schema = new Schema(
//   {
//     username: {
//       type: String,
//       required: true,
//       unique: true,
//       trim: true,
//     },
//     firstName: {
//       type: String,
//       required: true,
//       trim: true,
//     },
//     lastName: {
//       type: String,
//       required: true,
//       trim: true,
//     },
//     email: {
//       type: String,
//       required: true,
//       unique: true,
//       trim: true,
//       match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address.'],
//     },
//     country: {
//       type: String,
//       required: true,
//     },
//     role: {
//       type: String,
//       enum: ['admin', 'psychologist', 'user'],
//       default: 'user',
//       index: true,
//     },
//     streetAddress: {
//       type: String,
//       required: true,
//     },
//     city: {
//       type: String,
//       required: true,
//     },
//     stateOrProvince: {
//       type: String,
//       required: true,
//     },
//     postalCode: {
//       type: String,
//       required: true,
//     },
//     about: {
//       type: String,
//       required: true,
//       maxlength: 500,
//     },
//     profilePhotoUrl: {
//       type: String,
//     },
//     certificateOrLicenseUrl: {
//       type: String,
//     },
//     password: {
//       type: String,
//       required: true,
//     },
//     isVerified: { type: Boolean, default: false },
//   },
//   {
//     timestamps: true,
//   }
// );

// const Psychologist =
//   mongoose.models.Psychologist ||
//   mongoose.model<IPsychologist>('Psychologist', PsychologistSchema);

// export default Psychologist;

import mongoose, { Schema, Document } from 'mongoose';

export interface IPsychologist extends Document {
  firstName: string;
  lastName: string;
  userType: 'admin' | 'psychologist' | 'user';
  expertises: string[];
  rating: number;
  reviewCount: number;
  city: string;
  state: string;
  experience: string;
  nextAvailable: string;
  photoUrl: string;
  featured: boolean;
  bio: string;
  education: string;
  certifications: string[];
  languages: string[];
  insurances: string[];
  sessionTypes: string[];
  sessionFee: string;
  availableSlots: [{ time: string; date: string }];
  email: string;
}

const availableSlotSchema = new Schema(
  {
    time: { type: String, required: true },
    date: { type: String, required: true },
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
    userType: {
      type: String,
      required: true,
      enum: ['admin', 'psychologist', 'user'],
      index: true,
    },
    expertises: [
      {
        type: String,
        required: true,
      },
    ],
    rating: {
      type: Number,
      required: true,
    },
    reviewCount: {
      type: Number,
      required: true,
    },
    city: {
      type: String,
      required: true,
    },
    state: {
      type: String,
      required: true,
    },
    experience: {
      type: String,
      required: true,
    },
    nextAvailable: {
      type: String,
      required: true,
    },
    photoUrl: {
      type: String,
      required: true,
    },
    featured: {
      type: Boolean,
      required: true,
    },
    bio: {
      type: String,
      required: true,
      maxlength: 1000,
    },
    education: {
      type: String,
      required: true,
    },
    certifications: [
      {
        type: String,
        required: true,
      },
    ],
    languages: [
      {
        type: String,
        required: true,
      },
    ],
    insurances: [
      {
        type: String,
        required: true,
      },
    ],
    sessionTypes: [
      {
        type: String,
        required: true,
      },
    ],
    sessionFee: {
      type: String,
      required: true,
    },
    availableSlots: [availableSlotSchema],
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address.'],
    },
  },
  {
    timestamps: true,
  }
);

const Psychologist =
  mongoose.models.Psychologist ||
  mongoose.model<IPsychologist>('Psychologist', PsychologistSchema);

export default Psychologist;
