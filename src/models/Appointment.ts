import mongoose, { Schema, Document } from 'mongoose';

export interface IAppointment extends Document {
  psychologist: mongoose.Types.ObjectId;
  client: mongoose.Types.ObjectId;
  date: Date;
  startTime: string;
  duration: 30 | 50 | 80;
  status: 'pending' | 'confirmed' | 'canceled' | 'completed';
  sessionLink?: string;
  paymentStatus: 'pending' | 'completed' | 'failed';
  paymentId?: string;
  amount: number;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const AppointmentSchema = new Schema({
  psychologist: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Psychologist',
    required: true,
  },
  client: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  date: {
    type: Date,
    required: true,
  },
  startTime: {
    type: String,
    required: true,
  },
  duration: {
    type: Number,
    enum: [30, 50, 80],
    required: true,
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'canceled', 'completed'],
    default: 'pending',
  },
  sessionLink: String,
  paymentStatus: {
    type: String,
    enum: ['pending', 'completed', 'failed'],
    default: 'pending',
  },
  paymentId: String,
  amount: {
    type: Number,
    required: true,
  },
  notes: String,
}, {
  timestamps: true
});

// Indexes for common queries
AppointmentSchema.index({ psychologist: 1, date: 1 });
AppointmentSchema.index({ client: 1, date: 1 });
AppointmentSchema.index({ status: 1 });
AppointmentSchema.index({ paymentStatus: 1 });

const Appointment = mongoose.models.Appointment || 
  mongoose.model<IAppointment>('Appointment', AppointmentSchema);

export default Appointment;