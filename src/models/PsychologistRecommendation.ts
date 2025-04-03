import mongoose, { Schema, Document } from 'mongoose';

export interface IPsychologistRecommendation extends Document {
  psychologist: mongoose.Types.ObjectId;
  patient: mongoose.Types.ObjectId;
  exercise: mongoose.Types.ObjectId;
  note: string;
  isCompleted: boolean;
  status: 'pending' | 'viewed' | 'started' | 'completed' | 'skipped';
  dueDate?: Date;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const PsychologistRecommendationSchema: Schema = new Schema(
  {
    psychologist: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    exercise: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Exercise',
      required: true,
    },
    note: { type: String, default: '' },
    isCompleted: { type: Boolean, default: false },
    status: {
      type: String,
      enum: ['pending', 'viewed', 'started', 'completed', 'skipped'],
      default: 'pending',
    },
    dueDate: { type: Date },
    completedAt: { type: Date },
  },
  { timestamps: true }
);

export default mongoose.models.PsychologistRecommendation ||
  mongoose.model<IPsychologistRecommendation>(
    'PsychologistRecommendation',
    PsychologistRecommendationSchema
  );