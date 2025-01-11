import { Schema, model, models, Document } from 'mongoose';

interface IUser extends Document {
  email: string;
  password: string;
  role: 'admin' | 'psychologist' | 'user';
  isActive: boolean;
  isVerified: boolean;
  verificationCode?: string;
  verificationCodeExpiry?: Date;
  createdAt: Date;
  updatedAt: Date;
  lastLogin?: Date;
}

const userSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    password: {
      type: String,
      required: true,
      select: false,
    },
    role: {
      type: String,
      enum: ['admin', 'psychologist', 'user'],
      default: 'user',
      index: true,
    },
    isActive: { type: Boolean, default: true },
    isVerified: { type: Boolean, default: false },
    verificationCode: { type: String },
    verificationCodeExpiry: { type: Date },
    lastLogin: { type: Date },
  },
  {
    timestamps: true,
  }
);

const User = models.User || model<IUser>('User', userSchema);
export default User;
