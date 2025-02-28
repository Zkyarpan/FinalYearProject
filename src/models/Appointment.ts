import mongoose, {
  Schema,
  model,
  models,
  Document,
  Types,
  Model,
} from 'mongoose';

export enum SessionFormat {
  VIDEO = 'video',
  IN_PERSON = 'in-person',
}

export enum AppointmentStatus {
  CONFIRMED = 'confirmed',
  CANCELED = 'canceled',
  COMPLETED = 'completed',
  ONGOING = 'ongoing',
  MISSED = 'missed',
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
  isCanceled: boolean;
  canceledAt?: Date;
  canceledBy?: Types.ObjectId;
  cancelationReason?: string;
  joinedAt?: Date;
  completedAt?: Date;
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
  cancel(userId: Types.ObjectId, reason: string): Promise<void>;
  markAsJoined(): Promise<void>;
  markAsCompleted(): Promise<void>;
}

interface IAppointmentModel
  extends Model<IAppointment, {}, IAppointmentMethods> {
  findUserAppointments(userId: Types.ObjectId): Promise<IAppointment[]>;
  findPsychologistAppointments(
    psychologistId: Types.ObjectId
  ): Promise<IAppointment[]>;
  findUpcomingAppointments(userId: Types.ObjectId): Promise<IAppointment[]>;
  findActiveAppointments(): Promise<IAppointment[]>;
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
    isCanceled: {
      type: Boolean,
      default: false,
      index: true,
    },
    canceledAt: {
      type: Date,
      default: null,
    },
    canceledBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    cancelationReason: {
      type: String,
      trim: true,
      default: null,
    },
    joinedAt: {
      type: Date,
      default: null,
    },
    completedAt: {
      type: Date,
      default: null,
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

// Enhanced instance methods
appointmentSchema.methods.cancel = async function (
  userId: Types.ObjectId,
  reason: string
): Promise<void> {
  const now = new Date();
  this.status = AppointmentStatus.CANCELED;
  this.isCanceled = true;
  this.canceledAt = now;
  this.canceledBy = userId;
  this.cancelationReason = reason;
  await this.save();

  // Release the availability slot
  await mongoose.connection.collection('availabilities').updateOne(
    {
      psychologistId: this.psychologistId,
      'slots.appointmentId': this._id,
    },
    {
      $set: {
        'slots.$.isBooked': false,
        'slots.$.userId': null,
        'slots.$.appointmentId': null,
      },
    }
  );
};

appointmentSchema.methods.markAsJoined = async function (): Promise<void> {
  if (this.status === AppointmentStatus.CONFIRMED) {
    this.status = AppointmentStatus.ONGOING;
    this.joinedAt = new Date();
    await this.save();
  }
};

appointmentSchema.methods.markAsCompleted = async function (): Promise<void> {
  if (this.status === AppointmentStatus.ONGOING) {
    this.status = AppointmentStatus.COMPLETED;
    this.completedAt = new Date();
    await this.save();
  }
};

// Static methods
appointmentSchema.statics.findActiveAppointments = async function (): Promise<
  IAppointment[]
> {
  const now = new Date();
  return this.find({
    status: { $in: [AppointmentStatus.CONFIRMED, AppointmentStatus.ONGOING] },
    dateTime: { $lte: now },
    endTime: { $gt: now },
    isCanceled: false,
  }).populate('userId psychologistId');
};

// Enhanced middleware
appointmentSchema.pre('save', async function (next) {
  const now = new Date();

  // Set duration if needed
  if (this.isNew || this.isModified('dateTime') || this.isModified('endTime')) {
    this.duration = this.getDurationInMinutes();
  }

  // Auto-update status based on time
  if (!this.isCanceled) {
    if (this.endTime <= now) {
      if (this.status !== AppointmentStatus.COMPLETED) {
        this.status = this.joinedAt
          ? AppointmentStatus.COMPLETED
          : AppointmentStatus.MISSED;
        this.completedAt = now;
      }
    } else if (this.dateTime <= now && this.endTime > now) {
      if (this.status === AppointmentStatus.CONFIRMED) {
        this.status = AppointmentStatus.ONGOING;
      }
    }
  }

  next();
});

const Appointment =
  (models.Appointment as IAppointmentModel) ||
  model<IAppointment, IAppointmentModel>('Appointment', appointmentSchema);

export default Appointment;
