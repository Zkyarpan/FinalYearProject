import mongoose, { Schema, Document } from 'mongoose';

export interface IPayment extends Document {
  userId: mongoose.Types.ObjectId;
  psychologistId: mongoose.Types.ObjectId;
  appointmentId?: mongoose.Types.ObjectId; // Optional since payment comes first
  stripePaymentId: string;
  amount: number;
  currency: string;
  status: 'pending' | 'success' | 'failed';
  paymentMethod?: string;
  metadata?: {
    appointmentDate?: Date;
    appointmentDuration?: number;
    userEmail?: string;
    userName?: string;
    psychologistName?: string;
  };
}

const PaymentSchema: Schema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    psychologistId: {
      type: Schema.Types.ObjectId,
      ref: 'User', // Assuming psychologists are in Users collection
      required: true,
    },
    appointmentId: {
      type: Schema.Types.ObjectId,
      ref: 'Appointment',
    },
    stripePaymentId: {
      type: String,
      required: true,
      unique: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    currency: {
      type: String,
      default: 'USD',
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'success', 'failed'],
      default: 'pending',
    },
    paymentMethod: {
      type: String, // e.g., 'card', 'bank_transfer'
    },
    metadata: {
      appointmentDate: Date,
      appointmentDuration: Number,
      userEmail: String,
      userName: String,
      psychologistName: String,
    },
  },
  {
    timestamps: true,
  }
);

// Index for efficient queries
PaymentSchema.index({ userId: 1, status: 1 });
PaymentSchema.index({ stripePaymentId: 1 }, { unique: true });

// Virtual populate for user and psychologist details
PaymentSchema.virtual('user', {
  ref: 'User',
  localField: 'userId',
  foreignField: '_id',
  justOne: true,
});

PaymentSchema.virtual('psychologist', {
  ref: 'User',
  localField: 'psychologistId',
  foreignField: '_id',
  justOne: true,
});

// Methods to update status
PaymentSchema.methods.markAsSuccessful = async function () {
  this.status = 'success';
  return this.save();
};

PaymentSchema.methods.markAsFailed = async function () {
  this.status = 'failed';
  return this.save();
};

// Method to link appointment after successful payment
PaymentSchema.methods.linkAppointment = async function (
  appointmentId: mongoose.Types.ObjectId
) {
  this.appointmentId = appointmentId;
  return this.save();
};

const Payment =
  mongoose.models.Payment || mongoose.model<IPayment>('Payment', PaymentSchema);

export default Payment;
