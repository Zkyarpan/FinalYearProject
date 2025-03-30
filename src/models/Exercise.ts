import mongoose, { Schema, Document } from 'mongoose';

export interface IExercise extends Document {
  title: string;
  description: string;
  type: 'breathing' | 'meditation' | 'mindfulness' | 'relaxation' | 'other';
  duration: number; // in minutes
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  mediaUrl?: string; // video or audio URL
  thumbnailUrl?: string;
  instructions: string[];
  benefits: string[];
  createdBy: mongoose.Types.ObjectId;
  creatorRole: 'admin' | 'psychologist';
  isPublished: boolean;
  isRecommended: boolean;
  tags: string[];
  likes: number;
  completions: number;
  createdAt: Date;
  updatedAt: Date;
}

const ExerciseSchema: Schema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    type: {
      type: String,
      required: true,
      enum: ['breathing', 'meditation', 'mindfulness', 'relaxation', 'other'],
    },
    duration: { type: Number, required: true },
    difficulty: {
      type: String,
      required: true,
      enum: ['beginner', 'intermediate', 'advanced'],
    },
    mediaUrl: { type: String },
    thumbnailUrl: { type: String },
    instructions: { type: [String], required: true },
    benefits: { type: [String], required: true },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    creatorRole: {
      type: String,
      required: true,
      enum: ['admin', 'psychologist'],
    },
    isPublished: { type: Boolean, default: true },
    isRecommended: { type: Boolean, default: false },
    tags: { type: [String], default: [] },
    likes: { type: Number, default: 0 },
    completions: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export default mongoose.models.Exercise ||
  mongoose.model<IExercise>('Exercise', ExerciseSchema);
