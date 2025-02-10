import mongoose, { Schema, Document } from 'mongoose';

export interface IPayment extends Document {
  userId: mongoose.Types.ObjectId;
  psychologistId: mongoose.Types.ObjectId;
  amount: number;
  currency: string;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  stripePaymentId: string;
  stripePaymentIntentId?: string;
  appointmentId?: mongoose.Types.ObjectId;
  metadata?: Record<string, any>;
  refundReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

const PaymentSchema = new Schema(
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
    amount: {
      type: Number,
      required: true,
    },
    currency: {
      type: String,
      default: 'usd',
    },
    status: {
      type: String,
      enum: ['pending', 'completed', 'failed', 'refunded'],
      default: 'pending',
    },
    stripePaymentId: {
      type: String,
      required: true,
    },
    stripePaymentIntentId: String,
    appointmentId: {
      type: Schema.Types.ObjectId,
      ref: 'Appointment',
    },
    metadata: {
      type: Map,
      of: String,
    },
    refundReason: String,
  },
  {
    timestamps: true,
  }
);

PaymentSchema.index({ stripePaymentId: 1 });
PaymentSchema.index({ userId: 1, status: 1 });
PaymentSchema.index({ psychologistId: 1, status: 1 });

const Payment =
  mongoose.models.Payment || mongoose.model<IPayment>('Payment', PaymentSchema);
export default Payment;
