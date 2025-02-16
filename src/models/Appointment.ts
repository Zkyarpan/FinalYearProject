import { Schema, model, models, Document, Types, Model } from 'mongoose';

export enum SessionFormat {
  VIDEO = 'video',
  IN_PERSON = 'in-person',
}

export enum AppointmentStatus {
  CONFIRMED = 'confirmed',
  CANCELED = 'canceled',
  COMPLETED = 'completed',
  ONGOING = 'ongoing',
}

export interface IAppointment extends Document {
  userId: Types.ObjectId;
  psychologistId: Types.ObjectId;
  dateTime: Date;
  endTime: Date;
  duration: number;
  stripePaymentIntentId: string;
  sessionFormat: SessionFormat;
  patientName: string;
  email: string;
  phone: string;
  reasonForVisit: string;
  notes?: string;
  insuranceProvider?: string;
  status: AppointmentStatus;
  createdAt: Date;
  updatedAt: Date;
}

interface IAppointmentMethods {
  isPast(): boolean;
  isUpcoming(): boolean;
  canJoin(): boolean;
  getDurationInMinutes(): number;
  updateStatus(status: AppointmentStatus): Promise<void>;
  updateStatusBasedOnTime(): Promise<void>;
}

interface IAppointmentModel
  extends Model<IAppointment, {}, IAppointmentMethods> {
  findUserAppointments(userId: Types.ObjectId): Promise<IAppointment[]>;
  findPsychologistAppointments(
    psychologistId: Types.ObjectId
  ): Promise<IAppointment[]>;
  findUpcomingAppointments(userId: Types.ObjectId): Promise<IAppointment[]>;
}

const appointmentSchema = new Schema<
  IAppointment,
  IAppointmentModel,
  IAppointmentMethods
>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true,
    },
    psychologistId: {
      type: Schema.Types.ObjectId,
      ref: 'Psychologist',
      required: [true, 'Psychologist ID is required'],
      index: true,
    },
    dateTime: {
      type: Date,
      required: [true, 'Appointment date and time is required'],
      validate: {
        validator: function (value: Date) {
          return value > new Date();
        },
        message: 'Appointment date must be in the future',
      },
      index: true,
    },
    endTime: {
      type: Date,
      required: [true, 'End time is required'],
      validate: {
        validator: function (this: IAppointment, value: Date) {
          return value > this.dateTime;
        },
        message: 'End time must be after start time',
      },
    },
    duration: {
      type: Number,
      required: [true, 'Duration is required'],
      min: [15, 'Duration must be at least 15 minutes'],
      max: [180, 'Duration cannot exceed 180 minutes'],
      validate: {
        validator: function (this: IAppointment, value: number) {
          const duration =
            (this.endTime.getTime() - this.dateTime.getTime()) / (1000 * 60);
          return duration === value;
        },
        message:
          'Duration must match the difference between start and end time',
      },
    },
    stripePaymentIntentId: {
      type: String,
      required: [true, 'Payment intent ID is required'],
      unique: true,
    },
    sessionFormat: {
      type: String,
      enum: Object.values(SessionFormat),
      required: [true, 'Session format is required'],
    },
    patientName: {
      type: String,
      required: [true, 'Patient name is required'],
      trim: true,
      minlength: [2, 'Patient name must be at least 2 characters long'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email'],
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      trim: true,
      match: [/^\+?[\d\s-]{10,}$/, 'Please enter a valid phone number'],
    },
    reasonForVisit: {
      type: String,
      required: [true, 'Reason for visit is required'],
      trim: true,
      minlength: [10, 'Reason must be at least 10 characters long'],
    },
    notes: {
      type: String,
      trim: true,
      default: '',
    },
    insuranceProvider: {
      type: String,
      trim: true,
      default: '',
    },
    status: {
      type: String,
      enum: Object.values(AppointmentStatus),
      default: AppointmentStatus.CONFIRMED,
      index: true,
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      versionKey: false,
      transform: function (doc, ret) {
        ret.id = ret._id;
        delete ret._id;
        return ret;
      },
    },
  }
);

// Instance methods
appointmentSchema.methods.isPast = function (): boolean {
  return this.endTime < new Date();
};

appointmentSchema.methods.isUpcoming = function (): boolean {
  return this.dateTime > new Date();
};

appointmentSchema.methods.canJoin = function (): boolean {
  const now = new Date();
  const joinWindow = 5 * 60 * 1000; // 5 minutes in milliseconds
  return (
    this.status === AppointmentStatus.CONFIRMED &&
    Math.abs(this.dateTime.getTime() - now.getTime()) <= joinWindow
  );
};

appointmentSchema.methods.getDurationInMinutes = function (): number {
  return (this.endTime.getTime() - this.dateTime.getTime()) / (1000 * 60);
};

appointmentSchema.methods.updateStatus = async function (
  status: AppointmentStatus
): Promise<void> {
  this.status = status;
  await this.save();
};

appointmentSchema.methods.updateStatusBasedOnTime =
  async function (): Promise<void> {
    const now = new Date();
    if (this.endTime <= now && this.status !== AppointmentStatus.COMPLETED) {
      this.status = AppointmentStatus.COMPLETED;
      await this.save();
    } else if (
      this.dateTime <= now &&
      this.endTime > now &&
      this.status === AppointmentStatus.CONFIRMED
    ) {
      this.status = AppointmentStatus.ONGOING;
      await this.save();
    }
  };

// Indexes
appointmentSchema.index({ psychologistId: 1, dateTime: 1 });
appointmentSchema.index({ userId: 1, dateTime: 1 });
appointmentSchema.index({ status: 1, dateTime: 1 });

// Pre-save middleware
appointmentSchema.pre('save', function (next) {
  const now = new Date();
  if (this.isNew || this.isModified('dateTime') || this.isModified('endTime')) {
    this.duration = this.getDurationInMinutes();
  }
  if (this.endTime <= now && this.status !== AppointmentStatus.COMPLETED) {
    this.status = AppointmentStatus.COMPLETED;
  } else if (
    this.dateTime <= now &&
    this.endTime > now &&
    this.status === AppointmentStatus.CONFIRMED
  ) {
    this.status = AppointmentStatus.ONGOING;
  }
  next();
});

const Appointment =
  (models.Appointment as IAppointmentModel) ||
  model<IAppointment, IAppointmentModel>('Appointment', appointmentSchema);

export default Appointment;
