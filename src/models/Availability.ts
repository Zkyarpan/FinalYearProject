import mongoose, { Document, Model } from 'mongoose';
const { Schema } = mongoose;

export enum SlotStatus {
  AVAILABLE = 'available',
  BOOKED = 'booked',
  ONGOING = 'ongoing',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

export enum UserRole {
  PSYCHOLOGIST = 'psychologist',
  PATIENT = 'patient',
  ADMIN = 'admin',
}

export interface ITimeSlot {
  _id: mongoose.Types.ObjectId;
  startTime: Date;
  endTime: Date;
  isBooked: boolean;
  status: SlotStatus;
  userId?: mongoose.Types.ObjectId;
  appointmentId?: mongoose.Types.ObjectId;
  lastUpdated: Date;
  createdBy?: string;
  sessionNotes?: string;
}

export interface IPsychologistDetails {
  name?: string;
  specialty?: string;
  profilePhotoUrl?: string;
  sessionFee?: number;
  yearsOfExperience?: number;
  languages?: string[];
  rating?: number;
  totalSessions?: number;
}

export interface IAvailabilityLog {
  timestamp: Date;
  action: string;
  slotId: mongoose.Types.ObjectId;
  status: SlotStatus;
  user: string;
}

export interface IAvailability {
  psychologistId: mongoose.Types.ObjectId;
  daysOfWeek: number[];
  startTime: string;
  endTime: string;
  slots: ITimeSlot[];
  isActive: boolean;
  psychologistDetails?: IPsychologistDetails;
  lastCleanup: Date;
  createdAt: Date;
  updatedAt: Date;
  logs?: IAvailabilityLog[];
  timezone?: string;
}

interface IAvailabilityDocument extends IAvailability, Document {
  getAvailableSlots(): ITimeSlot[];
  getOngoingSlots(): ITimeSlot[];
  getCompletedSlots(startDate: Date, endDate: Date): ITimeSlot[];
  bookSlot(
    slotId: mongoose.Types.ObjectId,
    userId: mongoose.Types.ObjectId,
    appointmentId: mongoose.Types.ObjectId,
    user: string
  ): Promise<boolean>;
}

interface IAvailabilityModel extends Model<IAvailabilityDocument> {
  cleanupPastSlots(user: string): Promise<mongoose.UpdateWriteOpResult>;
  generateReport(startDate: Date, endDate: Date): Promise<any>;
}

// Utility for consistent time formatting
const formatDateTime = (date: Date): string => {
  return date.toISOString().replace('T', ' ').slice(0, 19) + ' UTC';
};

// Schemas
const TimeSlotSchema = new Schema<ITimeSlot>(
  {
    startTime: {
      type: Date,
      required: true,
      index: true,
    },
    endTime: {
      type: Date,
      required: true,
      index: true,
    },
    isBooked: {
      type: Boolean,
      default: false,
      index: true,
    },
    status: {
      type: String,
      enum: Object.values(SlotStatus),
      default: SlotStatus.AVAILABLE,
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    appointmentId: {
      type: Schema.Types.ObjectId,
      ref: 'Appointment',
      index: true,
    },
    lastUpdated: {
      type: Date,
      default: Date.now,
      index: true,
    },
    createdBy: String,
    sessionNotes: String,
  },
  { _id: true }
);

const AvailabilityLogSchema = new Schema<IAvailabilityLog>({
  timestamp: {
    type: Date,
    default: Date.now,
    index: true,
  },
  action: String,
  slotId: {
    type: Schema.Types.ObjectId,
    required: true,
    index: true,
  },
  status: {
    type: String,
    enum: Object.values(SlotStatus),
  },
  user: String,
});

const AvailabilitySchema = new Schema<
  IAvailabilityDocument,
  IAvailabilityModel
>(
  {
    psychologistId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    daysOfWeek: {
      type: [Number],
      required: true,
      validate: {
        validator: (array: number[]) =>
          array.every(num => num >= 0 && num <= 6 && Number.isInteger(num)),
        message: 'Days of week must be integers between 0 and 6',
      },
    },
    startTime: {
      type: String,
      required: true,
      validate: {
        validator: (v: string) => /^([01]\d|2[0-3]):([0-5]\d)$/.test(v),
        message: 'Start time must be in HH:MM format',
      },
    },
    endTime: {
      type: String,
      required: true,
      validate: {
        validator: (v: string) => /^([01]\d|2[0-3]):([0-5]\d)$/.test(v),
        message: 'End time must be in HH:MM format',
      },
    },
    slots: {
      type: [TimeSlotSchema],
      default: [],
      index: true,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    psychologistDetails: {
      name: { type: String, index: true },
      specialty: { type: String, index: true },
      profilePhotoUrl: String,
      sessionFee: {
        type: Number,
        min: [0, 'Session fee cannot be negative'],
        index: true,
      },
      yearsOfExperience: Number,
      languages: [String],
      rating: {
        type: Number,
        min: 0,
        max: 5,
        default: 0,
        index: true,
      },
      totalSessions: {
        type: Number,
        default: 0,
        index: true,
      },
    },
    lastCleanup: {
      type: Date,
      default: Date.now,
      index: true,
    },
    logs: [AvailabilityLogSchema],
    timezone: {
      type: String,
      default: 'UTC',
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
AvailabilitySchema.index({ 'slots.startTime': 1, 'slots.status': 1 });
AvailabilitySchema.index({ 'slots.endTime': 1 });
AvailabilitySchema.index({ 'logs.timestamp': 1 });
AvailabilitySchema.index({ createdAt: 1 });
AvailabilitySchema.index({ updatedAt: 1 });
AvailabilitySchema.index({ 'psychologistDetails.name': 'text' });

// Static method for cleanup
AvailabilitySchema.statics.cleanupPastSlots = async function (
  user: string
): Promise<mongoose.UpdateWriteOpResult> {
  const currentDate = new Date();
  currentDate.setSeconds(0, 0);

  try {
    // 1. Update BOOKED -> ONGOING
    const startingSlots = await this.find({
      'slots.status': SlotStatus.BOOKED,
      'slots.startTime': { $lte: currentDate },
      'slots.endTime': { $gt: currentDate },
    }).populate('psychologistId', 'name email');

    for (const doc of startingSlots) {
      const slotsToStart = doc.slots.filter(
        slot =>
          slot.status === SlotStatus.BOOKED &&
          slot.startTime <= currentDate &&
          slot.endTime > currentDate
      );

      if (slotsToStart.length > 0) {
        for (const slot of slotsToStart) {
          const oldStatus = slot.status;
          slot.status = SlotStatus.ONGOING;
          slot.lastUpdated = currentDate;

          // Add log entry
          if (!doc.logs) doc.logs = [];
          doc.logs.push({
            timestamp: currentDate,
            action: 'STATUS_CHANGE',
            slotId: slot._id,
            status: SlotStatus.ONGOING,
            user: user,
          });

          console.log(`
╔══════════════════════════════════════════════
║ 🟢 SESSION STARTED
║──────────────────────────────────────────────
║ Current Time: ${formatDateTime(currentDate)}
║ Slot ID: ${slot._id}
║ Previous Status: ${oldStatus}
║ New Status: ${slot.status}
║ Start Time: ${formatDateTime(slot.startTime)}
║ End Time: ${formatDateTime(slot.endTime)}
║ Updated By: ${user}
║ Psychologist: ${doc.psychologistDetails?.name || 'Unknown'}
╚══════════════════════════════════════════════`);
        }
        await doc.save();
      }
    }

    // 2. Update ONGOING -> COMPLETED
    const endingSlots = await this.find({
      'slots.status': SlotStatus.ONGOING,
      'slots.endTime': { $lte: currentDate },
    });

    for (const doc of endingSlots) {
      const slotsToEnd = doc.slots.filter(
        slot =>
          slot.status === SlotStatus.ONGOING && slot.endTime <= currentDate
      );

      if (slotsToEnd.length > 0) {
        for (const slot of slotsToEnd) {
          const oldStatus = slot.status;
          slot.status = SlotStatus.COMPLETED;
          slot.lastUpdated = currentDate;

          // Add log entry
          if (!doc.logs) doc.logs = [];
          doc.logs.push({
            timestamp: currentDate,
            action: 'STATUS_CHANGE',
            slotId: slot._id,
            status: SlotStatus.COMPLETED,
            user: user,
          });

          console.log(`
╔══════════════════════════════════════════════
║ 🔵 SESSION COMPLETED
║──────────────────────────────────────────────
║ Current Time: ${formatDateTime(currentDate)}
║ Slot ID: ${slot._id}
║ Previous Status: ${oldStatus}
║ New Status: ${slot.status}
║ Start Time: ${formatDateTime(slot.startTime)}
║ End Time: ${formatDateTime(slot.endTime)}
║ Duration: ${Math.round(
            (slot.endTime.getTime() - slot.startTime.getTime()) / 60000
          )} minutes
║ Updated By: ${user}
║ Psychologist: ${doc.psychologistDetails?.name || 'Unknown'}
╚══════════════════════════════════════════════`);
        }
        await doc.save();
      }
    }

    // 3. Cleanup old slots (after 24 hours)
    const retentionDate = new Date(currentDate);
    retentionDate.setHours(retentionDate.getHours() - 24);

    return await this.updateMany(
      {},
      {
        $pull: {
          slots: {
            $or: [
              {
                status: {
                  $in: [SlotStatus.COMPLETED, SlotStatus.CANCELLED],
                },
                endTime: { $lt: retentionDate },
              },
              {
                status: SlotStatus.AVAILABLE,
                startTime: { $lt: currentDate },
              },
            ],
          },
        },
        $set: { lastCleanup: currentDate },
      }
    );
  } catch (error) {
    console.error(`
╔══════════════════════════════════════════════
║ ❌ ERROR IN CLEANUP
║──────────────────────────────────────────────
║ Time: ${formatDateTime(currentDate)}
║ Error: ${error.message}
║ User: ${user}
╚══════════════════════════════════════════════`);
    throw error;
  }
};

// Setup cleanup interval (production only)
if (
  process.env.NODE_ENV === 'production' &&
  mongoose.connection.readyState === 1
) {
  let cleanupIntervalId: NodeJS.Timeout | undefined;

  const startCleanupInterval = () => {
    if (cleanupIntervalId) {
      clearInterval(cleanupIntervalId);
    }

    console.log(`
╔══════════════════════════════════════════════
║ 🚀 AVAILABILITY SERVICE STARTED
║──────────────────────────────────────────────
║ Time: ${formatDateTime(new Date())}
║ Environment: ${process.env.NODE_ENV}
║ Check Interval: 60 seconds
║ Current User: ${process.env.CURRENT_USER || 'system'}
╚══════════════════════════════════════════════`);

    cleanupIntervalId = setInterval(async () => {
      try {
        await Availability.cleanupPastSlots(
          process.env.CURRENT_USER || 'system'
        );
      } catch (error) {
        console.error(`Cleanup interval error:`, error);
      }
    }, 60 * 1000);
  };

  startCleanupInterval();

  process.on('SIGTERM', () => {
    if (cleanupIntervalId) {
      clearInterval(cleanupIntervalId);
      console.log(`
╔══════════════════════════════════════════════
║ 🛑 AVAILABILITY SERVICE STOPPED
║──────────────────────────────────────────────
║ Time: ${formatDateTime(new Date())}
║ User: ${process.env.CURRENT_USER || 'system'}
╚══════════════════════════════════════════════`);
    }
  });
}

// Create and export model
const Availability =
  (mongoose.models.Availability as IAvailabilityModel) ||
  mongoose.model<IAvailabilityDocument, IAvailabilityModel>(
    'Availability',
    AvailabilitySchema
  );

export default Availability;
