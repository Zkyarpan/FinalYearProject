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
  const currentDate = new Date();
  this.where({
    slots: {
      $elemMatch: {
        startTime: { $gt: currentDate },
      },
    },
  });
});

// Pre-save middleware
AvailabilitySchema.pre('save', async function (this: IAvailability, next) {
  const currentDate = new Date();

  // Clean up past slots
  if (this.slots && this.slots.length > 0) {
    const validSlots = this.slots.filter(slot => slot.startTime > currentDate);
    this.slots = validSlots;
  }

  // Generate new slots if needed
  if (
    this.isNew ||
    this.isModified('startTime') ||
    this.isModified('endTime') ||
    this.isModified('daysOfWeek')
  ) {
    const generatedSlots: ITimeSlot[] = [];

    for (const day of this.daysOfWeek) {
      const date = new Date(currentDate);
      const daysUntilNext = (day - currentDate.getDay() + 7) % 7;

      if (daysUntilNext < 7) {
        date.setDate(currentDate.getDate() + daysUntilNext);

        const [startHour] = this.startTime.split(':').map(Number);
        const [endHour] = this.endTime.split(':').map(Number);

        const slotStart = new Date(date);
        slotStart.setHours(startHour, 0, 0);

        const slotEnd = new Date(date);
        slotEnd.setHours(endHour, 0, 0);

        if (slotStart > currentDate) {
          generatedSlots.push({
            startTime: slotStart,
            endTime: slotEnd,
            isBooked: false,
          });
        }
      }
    }

    this.slots = generatedSlots;
  }

  next();
});

// Static method to clean up past slots
AvailabilitySchema.statics.cleanupPastSlots = async function (
  this: IAvailabilityModel
): Promise<mongoose.UpdateWriteOpResult> {
  const currentDate = new Date();

  try {
    return await this.updateMany(
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
  return this.slots.filter(
    slot => !slot.isBooked && slot.startTime > currentDate
  );
};

AvailabilitySchema.methods.bookSlot = function (
  this: IAvailability,
  slotId: mongoose.Types.ObjectId
): boolean {
  const slot = this.slots.find(slot => slot._id?.equals(slotId));
  const currentDate = new Date();

  if (slot && !slot.isBooked && slot.startTime > currentDate) {
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

// Setup automatic cleanup if database is connected
if (mongoose.connection.readyState === 1) {
  setInterval(async () => {
    try {
      await Availability.cleanupPastSlots();
      console.log('Past slots cleanup completed');
    } catch (error) {
      console.error('Error during automatic cleanup:', error);
    }
  }, 60 * 60 * 1000);
}

export default Availability;
