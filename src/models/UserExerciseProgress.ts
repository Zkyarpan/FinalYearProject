import mongoose, { Schema, Document } from 'mongoose';

export interface IUserExerciseProgress extends Document {
  user: mongoose.Types.ObjectId;
  exercise: mongoose.Types.ObjectId;
  isCompleted: boolean;
  progress: number; // 0-100%
  timesCompleted: number;
  isLiked: boolean;
  notes: string;
  lastCompletedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const UserExerciseProgressSchema: Schema = new Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    exercise: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Exercise',
      required: true,
    },
    isCompleted: { type: Boolean, default: false },
    progress: { type: Number, default: 0, min: 0, max: 100 },
    timesCompleted: { type: Number, default: 0 },
    isLiked: { type: Boolean, default: false },
    notes: { type: String, default: '' },
    lastCompletedAt: { type: Date },
  },
  { timestamps: true }
);

// Create a compound index to ensure one progress document per user-exercise pair
UserExerciseProgressSchema.index({ user: 1, exercise: 1 }, { unique: true });

export default mongoose.models.UserExerciseProgress ||
  mongoose.model<IUserExerciseProgress>('UserExerciseProgress', UserExerciseProgressSchema);