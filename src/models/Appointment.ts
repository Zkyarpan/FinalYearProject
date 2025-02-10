import { Schema, model, models, Document } from 'mongoose';

interface IAppointment extends Document {
  userId: Schema.Types.ObjectId;
  psychologistId: Schema.Types.ObjectId;
  dateTime: Date;
  endTime: Date;
  duration: number;
  stripePaymentIntentId: string;
  sessionFormat: 'video' | 'in-person';
  patientName: string;
  email: string;
  phone: string;
  reasonForVisit: string;
  notes?: string;
  insuranceProvider?: string;
  status: 'pending' | 'confirmed' | 'canceled' | 'completed';
  createdAt: Date;
  updatedAt: Date;
}

const appointmentSchema = new Schema<IAppointment>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    psychologistId: {
      type: Schema.Types.ObjectId,
      ref: 'Psychologist',
      required: true,
      index: true,
    },
    dateTime: {
      type: Date,
      required: true,
      index: true,
    },
    endTime: {
      type: Date,
      required: true,
    },
    duration: {
      type: Number,
      required: true,
    },
    stripePaymentIntentId: {
      type: String,
      required: true,
    },
    sessionFormat: {
      type: String,
      required: true,
      enum: ['video', 'in-person'],
    },
    patientName: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
    },
    phone: {
      type: String,
      required: true,
    },
    reasonForVisit: {
      type: String,
      required: true,
    },
    notes: {
      type: String,
      default: '',
    },
    insuranceProvider: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'canceled', 'completed'],
      default: 'confirmed',
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Create compound indexes for common queries
appointmentSchema.index({ psychologistId: 1, dateTime: 1 });
appointmentSchema.index({ userId: 1, dateTime: 1 });

const Appointment =
  models.Appointment || model<IAppointment>('Appointment', appointmentSchema);

export default Appointment;
