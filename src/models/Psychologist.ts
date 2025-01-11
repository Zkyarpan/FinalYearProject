import mongoose, { Schema, Document } from 'mongoose';

export interface IPsychologist extends Document {
  username: string;
  firstName: string;
  lastName: string;
  email: string;
  country: string;
  role: 'admin' | 'psychologist' | 'user';
  streetAddress: string;
  city: string;
  stateOrProvince: string;
  postalCode: string;
  about: string;
  profilePhotoUrl?: string;
  certificateOrLicenseUrl?: string;
  password: string;
  createdAt: Date;
  updatedAt: Date;
}

const PsychologistSchema: Schema = new Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
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
      default: 'user',
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
    stateOrProvince: {
      type: String,
      required: true,
    },
    postalCode: {
      type: String,
      required: true,
    },
    about: {
      type: String,
      required: true,
      maxlength: 500,
    },
    profilePhotoUrl: {
      type: String,
    },
    certificateOrLicenseUrl: {
      type: String,
    },
    password: {
      type: String,
      required: true,
    },
    isVerified: { type: Boolean, default: false },
  },
  {
    timestamps: true,
  }
);

const Psychologist =
  mongoose.models.Psychologist ||
  mongoose.model<IPsychologist>('Psychologist', PsychologistSchema);

export default Psychologist;
