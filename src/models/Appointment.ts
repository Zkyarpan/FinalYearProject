import mongoose, { Schema, Document } from 'mongoose';

export interface IAppointment extends Document {
  userId: mongoose.Types.ObjectId;
  psychologistId: mongoose.Types.ObjectId;
  dateTime: Date;
  duration: number;
  status: 'pending' | 'confirmed' | 'canceled' | 'completed';
  paymentId: mongoose.Types.ObjectId;
  videoCallLink?: string;
}

const AppointmentSchema: Schema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    psychologistId: {
      type: Schema.Types.ObjectId,
      ref: 'Psychologist',
      required: true,
    },
    dateTime: {
      type: Date,
      required: true,
    },
    duration: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'canceled', 'completed'],
      default: 'pending',
    },
    paymentId: {
      type: Schema.Types.ObjectId,
      ref: 'Payment',
      required: true,
    },
    videoCallLink: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

const Appointment =
  mongoose.models.Appointment ||
  mongoose.model<IAppointment>('Appointment', AppointmentSchema);

export default Appointment;
