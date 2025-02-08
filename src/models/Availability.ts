import mongoose, { Schema, Document } from 'mongoose';

export interface IAvailability extends Document {
  psychologistId: mongoose.Types.ObjectId;
  daysOfWeek: number[];
  startTime: string;
  endTime: string;
  isActive: boolean;
  psychologistDetails?: {
    name: string;
    specialty?: string;
    profileImage?: string;
  };
  toCalendarEvent(): any;
}

const AvailabilitySchema: Schema = new Schema(
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
        validator: function (v: number[]) {
          return v.every(day => day >= 0 && day <= 6);
        },
        message: 'Days must be between 0 (Sunday) and 6 (Saturday)',
      },
    },
    startTime: {
      type: String,
      required: true,
      validate: {
        validator: function (v: string) {
          return /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(v);
        },
        message: 'Start time must be in HH:mm format',
      },
    },
    endTime: {
      type: String,
      required: true,
      validate: {
        validator: function (v: string) {
          return /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(v);
        },
        message: 'End time must be in HH:mm format',
      },
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    bookedSlots: [
      {
        start: Date,
        end: Date,
        appointmentId: {
          type: Schema.Types.ObjectId,
          ref: 'Appointment',
        },
      },
    ],
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

// Add compound index for efficient queries
AvailabilitySchema.index({ psychologistId: 1, daysOfWeek: 1, isActive: 1 });

// Validate end time is after start time
AvailabilitySchema.pre('save', function (next) {
  const start = new Date(`2000-01-01T${this.startTime}:00`);
  const end = new Date(`2000-01-01T${this.endTime}:00`);

  if (start >= end) {
    next(new Error('End time must be after start time'));
  }
  next();
});

// Method to convert availability to calendar event format
AvailabilitySchema.methods.toCalendarEvent = function () {
  return {
    title: 'Available',
    daysOfWeek: this.daysOfWeek,
    startTime: this.startTime,
    endTime: this.endTime,
    extendedProps: {
      type: 'availability',
      psychologistId: this.psychologistId,
      psychologistName: this.psychologistDetails?.name,
      specialty: this.psychologistDetails?.specialty,
    },
    display: 'background',
    color: 'rgba(59, 130, 246, 0.1)',
  };
};

// Add method to check if slot is available
AvailabilitySchema.methods.isSlotAvailable = function (start: Date, end: Date) {
  return !this.bookedSlots.some(
    slot =>
      (start >= slot.start && start < slot.end) ||
      (end > slot.start && end <= slot.end)
  );
};

const Availability =
  mongoose.models.Availability ||
  mongoose.model<IAvailability>('Availability', AvailabilitySchema);

export default Availability;
