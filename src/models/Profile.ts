import { Schema, model, models, Document, Types } from 'mongoose';

interface IProfile extends Document {
  userId: Types.ObjectId;
  firstName: string;
  lastName: string;
  image: string;
  address?: string;
  phone: string;
  age: number;
  gender?: string;
  emergencyContact: string;
  emergencyPhone: string;
  therapyHistory: 'yes' | 'no';
  preferredCommunication: 'video' | 'audio' | 'chat' | 'in-person';
  struggles: string[];
  briefBio: string;
  profileCompleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const profileSchema = new Schema<IProfile>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    image: { type: String, trim: true },
    address: { type: String, trim: true },
    phone: { type: String, required: true, trim: true },
    age: { type: Number, min: 0, required: true },
    gender: {
      type: String,
      enum: ['male', 'female', 'other'],
      default: 'other',
    },
    emergencyContact: { type: String, required: true },
    emergencyPhone: { type: String, required: true },
    therapyHistory: {
      type: String,
      enum: ['yes', 'no'],
      required: true,
    },
    preferredCommunication: {
      type: String,
      enum: ['video', 'audio', 'chat', 'in-person'],
      required: true,
    },
    struggles: { type: [String], required: true },
    briefBio: { type: String, required: true },
    profileCompleted: { type: Boolean, default: false },
  },
  {
    timestamps: true,
  }
);

const Profile = models.Profile || model<IProfile>('Profile', profileSchema);
export default Profile;
