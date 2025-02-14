import mongoose from 'mongoose';
const { Schema } = mongoose;

// Define the TimeSlot schema
const TimeSlotSchema = new Schema(
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

const AvailabilitySchema = new Schema(
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
  },
  {
    timestamps: true,
  }
);

// Pre-save middleware to generate slots for only the next occurrence
AvailabilitySchema.pre('save', async function (next) {
  if (
    this.isNew ||
    this.isModified('startTime') ||
    this.isModified('endTime') ||
    this.isModified('daysOfWeek')
  ) {
    // Get current date
    const currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);

    console.log('Starting slot generation:', {
      currentDate: currentDate.toISOString(),
      daysOfWeek: this.daysOfWeek,
      startTime: this.startTime,
      endTime: this.endTime,
    });

    const generatedSlots: {
      startTime: Date;
      endTime: Date;
      isBooked: boolean;
    }[] = [];

    // Generate slots only for the next occurrence (within one week)
    for (const day of this.daysOfWeek) {
      // Calculate the next occurrence of this day within the next 7 days
      const date = new Date(currentDate);
      const daysUntilNext = (day - currentDate.getDay() + 7) % 7;

      // Only generate if it's within the next 7 days
      if (daysUntilNext < 7) {
        date.setDate(currentDate.getDate() + daysUntilNext);

        // Parse hours
        const [startHour] = this.startTime.split(':').map(Number);
        const [endHour] = this.endTime.split(':').map(Number);

        // Create single slot
        const slotStart = new Date(date);
        slotStart.setHours(startHour, 0, 0);

        const slotEnd = new Date(date);
        slotEnd.setHours(endHour, 0, 0);

        console.log('Creating slot for:', {
          day,
          date: date.toISOString(),
          start: slotStart.toISOString(),
          end: slotEnd.toISOString(),
        });

        if (slotStart > currentDate) {
          generatedSlots.push({
            startTime: slotStart,
            endTime: slotEnd,
            isBooked: false,
          });
        }
      }
    }

    // Clear existing slots and add new ones
    this.set('slots', []);
    this.slots.push(...generatedSlots);

    console.log(
      `Generated ${generatedSlots.length} slot(s) for next week only`
    );
  }
  next();
});

// Method to get available slots
AvailabilitySchema.methods.getAvailableSlots = function () {
  return this.slots.filter(slot => !slot.isBooked);
};

// Method to book a slot
AvailabilitySchema.methods.bookSlot = function (slotId) {
  const slot = this.slots.id(slotId);
  if (slot && !slot.isBooked) {
    slot.isBooked = true;
    return true;
  }
  return false;
};

// Add indexes for better performance
AvailabilitySchema.index({ psychologistId: 1, isActive: 1 });
AvailabilitySchema.index({ 'slots.startTime': 1, 'slots.isBooked': 1 });

// Create or get the model
const Availability =
  mongoose.models.Availability ||
  mongoose.model('Availability', AvailabilitySchema);

export default Availability;
