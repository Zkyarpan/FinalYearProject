import mongoose, { Document, Model } from 'mongoose';
const { Schema } = mongoose;

export interface ITimeSlot {
  _id: mongoose.Types.ObjectId;
  startTime: Date;
  endTime: Date;
  isBooked: boolean;
  userId?: mongoose.Types.ObjectId;
  appointmentId?: mongoose.Types.ObjectId;
}

interface IPsychologistDetails {
  name?: string; // Made optional
  specialty?: string;
  profilePhotoUrl?: string;
  sessionFee?: number;
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
}

interface IAvailabilityDocument extends IAvailability, Document {
  getAvailableSlots(): ITimeSlot[];
  bookSlot(
    slotId: mongoose.Types.ObjectId,
    userId: mongoose.Types.ObjectId,
    appointmentId: mongoose.Types.ObjectId
  ): boolean;
}

interface IAvailabilityModel extends Model<IAvailabilityDocument> {
  cleanupPastSlots(): Promise<mongoose.UpdateWriteOpResult>;
}

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
    },
    isBooked: {
      type: Boolean,
      default: false,
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    appointmentId: {
      type: Schema.Types.ObjectId,
      ref: 'Appointment',
    },
  },
  { _id: true }
);

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
    },
    startTime: {
      type: String,
      required: true,
    },
    endTime: {
      type: String,
      required: true,
    },
    slots: {
      type: [TimeSlotSchema],
      default: [],
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    psychologistDetails: {
      name: { type: String, required: false }, // Made not required
      specialty: String,
      profilePhotoUrl: String,
      sessionFee: Number,
    },
    lastCleanup: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Pre-find middleware
AvailabilitySchema.pre('find', function (next) {
  const currentDate = new Date();
  currentDate.setSeconds(0, 0);

  this.where({
    isActive: true,
    'slots.startTime': { $gte: currentDate },
  });
  next();
});

// Pre-save middleware for slot generation
AvailabilitySchema.pre('save', async function (next) {
  try {
    if (
      this.isNew ||
      this.isModified('startTime') ||
      this.isModified('endTime') ||
      this.isModified('daysOfWeek')
    ) {
      const currentDate = new Date();
      currentDate.setSeconds(0, 0);

      const generatedSlots: ITimeSlot[] = [];

      // Generate slots for the current week
      for (const dayOfWeek of this.daysOfWeek) {
        const date = new Date();
        const daysUntilNext = (dayOfWeek - date.getDay() + 7) % 7;

        if (daysUntilNext < 7) {
          date.setDate(date.getDate() + daysUntilNext);

          // Parse time strings safely
          const startTimeParts = this.startTime.split(':');
          const endTimeParts = this.endTime.split(':');

          const startHour = parseInt(startTimeParts[0], 10);
          const startMinute = parseInt(startTimeParts[1] || '0', 10);
          const endHour = parseInt(endTimeParts[0], 10);
          const endMinute = parseInt(endTimeParts[1] || '0', 10);

          const slotStart = new Date(date);
          slotStart.setHours(startHour, startMinute, 0, 0);

          const slotEnd = new Date(date);
          slotEnd.setHours(endHour, endMinute, 0, 0);

          const now = new Date();
          if (
            slotStart >= currentDate &&
            (slotStart.getDate() !== now.getDate() ||
              slotStart.getHours() > now.getHours() ||
              (slotStart.getHours() === now.getHours() &&
                now.getMinutes() <= 5))
          ) {
            generatedSlots.push({
              _id: new mongoose.Types.ObjectId(),
              startTime: slotStart,
              endTime: slotEnd,
              isBooked: false,
            });
          }
        }
      }

      // Sort slots chronologically
      generatedSlots.sort(
        (a, b) => a.startTime.getTime() - b.startTime.getTime()
      );

      // Preserve existing booked slots
      const existingValidBookedSlots = this.slots.filter(
        slot => slot.isBooked && slot.startTime >= currentDate
      );

      // Merge slots
      this.slots = [...existingValidBookedSlots, ...generatedSlots];
    }

    next();
  } catch (error) {
    next(error as Error);
  }
});

// Instance methods
AvailabilitySchema.methods.getAvailableSlots = function (): ITimeSlot[] {
  const currentDate = new Date();
  currentDate.setSeconds(0, 0);

  return this.slots
    .filter(slot => !slot.isBooked && slot.startTime >= currentDate)
    .sort((a, b) => a.startTime.getTime() - b.startTime.getTime());
};

AvailabilitySchema.methods.bookSlot = function (
  slotId: mongoose.Types.ObjectId,
  userId: mongoose.Types.ObjectId,
  appointmentId: mongoose.Types.ObjectId
): boolean {
  const currentDate = new Date();
  currentDate.setSeconds(0, 0);

  const slot = this.slots.find(slot => slot._id?.equals(slotId));

  if (slot && !slot.isBooked && slot.startTime >= currentDate) {
    slot.isBooked = true;
    slot.userId = userId;
    slot.appointmentId = appointmentId;
    return true;
  }
  return false;
};

// Static method for cleanup
AvailabilitySchema.statics.cleanupPastSlots =
  async function (): Promise<mongoose.UpdateWriteOpResult> {
    const currentDate = new Date();
    currentDate.setSeconds(0, 0);

    try {
      const result = await this.updateMany(
        {},
        {
          $pull: {
            slots: {
              startTime: { $lt: currentDate },
            },
          },
          $set: {
            lastCleanup: currentDate,
          },
        }
      );

      return result;
    } catch (error) {
      console.error('Cleanup error:', error);
      throw error;
    }
  };

// Indexes
AvailabilitySchema.index({ psychologistId: 1, isActive: 1 });
AvailabilitySchema.index({ 'slots.startTime': 1, 'slots.isBooked': 1 });
AvailabilitySchema.index({ lastCleanup: 1 });

// Create model
const Availability =
  (mongoose.models.Availability as IAvailabilityModel) ||
  mongoose.model<IAvailabilityDocument, IAvailabilityModel>(
    'Availability',
    AvailabilitySchema
  );

// Cleanup interval setup (production only)
if (
  process.env.NODE_ENV === 'production' &&
  mongoose.connection.readyState === 1
) {
  let cleanupIntervalId: NodeJS.Timeout | undefined;

  const startCleanupInterval = () => {
    if (cleanupIntervalId) {
      clearInterval(cleanupIntervalId);
    }

    cleanupIntervalId = setInterval(async () => {
      try {
        await Availability.cleanupPastSlots();
        console.log(
          `✅ Slots cleanup completed at ${new Date().toISOString()}`
        );
      } catch (error) {
        console.error('❌ Cleanup error:', error);
      }
    }, 30 * 60 * 1000); // 30 minutes
  };

  // Start cleanup interval
  startCleanupInterval();

  // Cleanup on process termination
  process.on('SIGTERM', () => {
    if (cleanupIntervalId) {
      clearInterval(cleanupIntervalId);
    }
  });
}

export default Availability;
