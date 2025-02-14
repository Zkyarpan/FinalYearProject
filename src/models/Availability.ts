import mongoose, { Document, Model } from 'mongoose';
const { Schema } = mongoose;

// Interfaces
interface ITimeSlot {
  startTime: Date;
  endTime: Date;
  isBooked: boolean;
  _id?: mongoose.Types.ObjectId;
}

interface IPsychologistDetails {
  name?: string;
  specialty?: string;
  profileImage?: string;
}

interface IAvailability extends Document {
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
  getAvailableSlots: () => ITimeSlot[];
  bookSlot: (slotId: mongoose.Types.ObjectId) => boolean;
}

interface IAvailabilityModel extends Model<IAvailability> {
  cleanupPastSlots(): Promise<mongoose.UpdateWriteOpResult>;
}

// Define the TimeSlot schema
const TimeSlotSchema = new Schema<ITimeSlot>(
  {
    startTime: {
      type: Date,
      required: true,
    },
    endTime: {
      type: Date,
      required: true,
    },
    isBooked: {
      type: Boolean,
      default: false,
    },
  },
  { _id: true }
);

const AvailabilitySchema = new Schema<IAvailability>(
  {
    psychologistId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
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
    },
    psychologistDetails: {
      name: String,
      specialty: String,
      profileImage: String,
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
AvailabilitySchema.pre('find', function (this: mongoose.Query<any, any>) {
  // Get current date without minutes and seconds for more accurate comparison
  const currentDate = new Date();
  currentDate.setMinutes(0, 0, 0);

  this.where({
    isActive: true,
    slots: {
      $elemMatch: {
        startTime: { $gte: currentDate },
      },
    },
  });
});

// Pre-save middleware to generate slots
AvailabilitySchema.pre('save', async function (this: IAvailability, next) {
  try {
    if (
      this.isNew ||
      this.isModified('startTime') ||
      this.isModified('endTime') ||
      this.isModified('daysOfWeek')
    ) {
      const currentDate = new Date();
      currentDate.setMinutes(0, 0, 0); // Reset minutes and seconds for accurate comparison

      const generatedSlots: ITimeSlot[] = [];

      // Generate slots only for the current week
      for (const dayOfWeek of this.daysOfWeek) {
        const date = new Date();
        // Calculate days until next occurrence of this day in current week
        const daysUntilNext = (dayOfWeek - date.getDay() + 7) % 7;

        // Only process if the day is today or later this week
        if (daysUntilNext < 7) {
          date.setDate(date.getDate() + daysUntilNext);

          // Parse hours and minutes from startTime and endTime
          const [startHour, startMinute = '0'] = this.startTime
            .split(':')
            .map(Number);
          const [endHour, endMinute = '0'] = this.endTime
            .split(':')
            .map(Number);

          const slotStart = new Date(date);
          slotStart.setHours(startHour, parseInt(startMinute.toString()), 0, 0);

          const slotEnd = new Date(date);
          slotEnd.setHours(endHour, parseInt(endMinute.toString()), 0, 0);

          // Only add slots that are in the future or current hour if within first 5 minutes
          const now = new Date();
          if (
            slotStart >= currentDate &&
            (slotStart.getDate() !== now.getDate() ||
              slotStart.getHours() > now.getHours() ||
              (slotStart.getHours() === now.getHours() &&
                now.getMinutes() <= 5))
          ) {
            generatedSlots.push({
              startTime: slotStart,
              endTime: slotEnd,
              isBooked: false,
            });
          }
        }
      }

      // Sort slots by start time
      generatedSlots.sort(
        (a, b) => a.startTime.getTime() - b.startTime.getTime()
      );

      // Keep existing booked slots that are still valid
      const existingValidBookedSlots = this.slots.filter(
        slot => slot.isBooked && slot.startTime >= currentDate
      );

      // Merge existing booked slots with new generated slots
      this.slots = [...existingValidBookedSlots, ...generatedSlots];
    }

    next();
  } catch (error) {
    next(error as Error);
  }
});

// Static method to clean up past slots
AvailabilitySchema.statics.cleanupPastSlots = async function () {
  const currentDate = new Date();
  currentDate.setMinutes(0, 0, 0);

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
          lastCleanup: new Date(),
        },
      }
    );

    return result;
  } catch (error) {
    console.error('Error cleaning up past slots:', error);
    throw error;
  }
};

// Instance methods
AvailabilitySchema.methods.getAvailableSlots = function (
  this: IAvailability
): ITimeSlot[] {
  const currentDate = new Date();
  currentDate.setMinutes(0, 0, 0);

  return this.slots.filter(
    slot => !slot.isBooked && slot.startTime >= currentDate
  );
};

AvailabilitySchema.methods.bookSlot = function (
  this: IAvailability,
  slotId: mongoose.Types.ObjectId
): boolean {
  const currentDate = new Date();
  currentDate.setMinutes(0, 0, 0);

  const slot = this.slots.find(slot => slot._id?.equals(slotId));

  if (slot && !slot.isBooked && slot.startTime >= currentDate) {
    slot.isBooked = true;
    return true;
  }
  return false;
};

// Indexes
AvailabilitySchema.index({ psychologistId: 1, isActive: 1 });
AvailabilitySchema.index({ 'slots.startTime': 1, 'slots.isBooked': 1 });
AvailabilitySchema.index({ lastCleanup: 1 });

// Create or get the model
const Availability =
  (mongoose.models.Availability as IAvailabilityModel) ||
  mongoose.model<IAvailability, IAvailabilityModel>(
    'Availability',
    AvailabilitySchema
  );

// Setup cleanup interval
if (mongoose.connection.readyState === 1) {
  setInterval(async () => {
    try {
      await Availability.cleanupPastSlots();
      console.log('✅ Past slots cleanup completed');
    } catch (error) {
      console.error('❌ Error during automatic cleanup:', error);
    }
  }, 30 * 60 * 1000); // Run every 30 minutes
}

export default Availability;
