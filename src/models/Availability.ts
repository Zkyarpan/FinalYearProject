import mongoose, { Document, Model } from 'mongoose';
const { Schema } = mongoose;

// Enum for slot status
export enum SlotStatus {
  AVAILABLE = 'available',
  BOOKED = 'booked',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  MISSED = 'missed',
}

// Interface for psychologist details
interface IPsychologistDetails {
  name?: string;
  specialty?: string;
  profilePhotoUrl?: string;
  sessionFee?: number;
}

// Interface for time slots
export interface ITimeSlot {
  _id: mongoose.Types.ObjectId;
  startTime: Date;
  endTime: Date;
  isBooked: boolean;
  status: SlotStatus;
  userId?: mongoose.Types.ObjectId;
  appointmentId?: mongoose.Types.ObjectId;
  lastUpdated: Date;
  sessionStartedAt?: Date; // Track when session actually started
  sessionEndedAt?: Date; // Track when session actually ended
  notes?: string; // Optional notes about the session
}

// Main availability interface
export interface IAvailability {
  psychologistId: mongoose.Types.ObjectId;
  daysOfWeek: number[];
  startTime: string; // Format: "HH:MM"
  endTime: string; // Format: "HH:MM"
  slots: ITimeSlot[];
  historicalSlots: ITimeSlot[];
  isActive: boolean;
  psychologistDetails?: IPsychologistDetails;
  lastCleanup: Date;
  createdAt: Date;
  updatedAt: Date;
  maxSessionOvertime?: number; // Maximum minutes a session can run over (optional)
}

// Document interface for instance methods
interface IAvailabilityDocument extends IAvailability, Document {
  getAvailableSlots(): ITimeSlot[];
  bookSlot(
    slotId: mongoose.Types.ObjectId,
    userId: mongoose.Types.ObjectId,
    appointmentId: mongoose.Types.ObjectId
  ): Promise<boolean>;
  cancelSlot(slotId: mongoose.Types.ObjectId): Promise<boolean>;
  startSession(slotId: mongoose.Types.ObjectId): Promise<boolean>;
  completeSession(
    slotId: mongoose.Types.ObjectId,
    notes?: string
  ): Promise<boolean>;
  markMissed(slotId: mongoose.Types.ObjectId): Promise<boolean>;
}

// Model interface for static methods
interface IAvailabilityModel extends Model<IAvailabilityDocument> {
  cleanupPastSlots(): Promise<mongoose.UpdateWriteOpResult>;
}

// Schema for time slots
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
    },
    appointmentId: {
      type: Schema.Types.ObjectId,
      ref: 'Appointment',
    },
    lastUpdated: {
      type: Date,
      default: Date.now,
    },
    sessionStartedAt: {
      type: Date,
    },
    sessionEndedAt: {
      type: Date,
    },
    notes: {
      type: String,
    },
  },
  { _id: true }
);

// Main availability schema
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
    },
    historicalSlots: {
      type: [TimeSlotSchema],
      default: [],
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    psychologistDetails: {
      name: { type: String },
      specialty: String,
      profilePhotoUrl: String,
      sessionFee: {
        type: Number,
        min: [0, 'Session fee cannot be negative'],
      },
    },
    lastCleanup: {
      type: Date,
      default: Date.now,
    },
    maxSessionOvertime: {
      type: Number,
      min: 0,
      default: 15, // Default 15 minutes overtime allowed
    },
  },
  {
    timestamps: true,
  }
);

// Utility function to generate slots
const generateWeeklySlots = (
  daysOfWeek: number[],
  startTimeStr: string,
  endTimeStr: string,
  currentDate: Date
): ITimeSlot[] => {
  const slots: ITimeSlot[] = [];
  const startOfWeek = new Date(currentDate);
  startOfWeek.setHours(0, 0, 0, 0);
  startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());

  const [startHour, startMinute] = startTimeStr.split(':').map(Number);
  const [endHour, endMinute] = endTimeStr.split(':').map(Number);

  for (const dayOfWeek of daysOfWeek) {
    const date = new Date(startOfWeek);
    date.setDate(date.getDate() + dayOfWeek);

    const slotStart = new Date(date);
    slotStart.setHours(startHour, startMinute, 0, 0);

    const slotEnd = new Date(date);
    slotEnd.setHours(endHour, endMinute, 0, 0);

    if (slotStart >= currentDate) {
      slots.push({
        _id: new mongoose.Types.ObjectId(),
        startTime: slotStart,
        endTime: slotEnd,
        isBooked: false,
        status: SlotStatus.AVAILABLE,
        lastUpdated: new Date(),
      });
    }
  }

  return slots;
};

// Static method to cleanup past slots
AvailabilitySchema.statics.cleanupPastSlots =
  async function (): Promise<mongoose.UpdateWriteOpResult> {
    const currentDate = new Date();

    // First update status of expired slots
    const result = await this.updateMany(
      {
        'slots.endTime': { $lt: currentDate },
        'slots.status': {
          $in: [SlotStatus.AVAILABLE, SlotStatus.BOOKED],
        },
      },
      [
        {
          $set: {
            slots: {
              $map: {
                input: '$slots',
                as: 'slot',
                in: {
                  $cond: [
                    {
                      $and: [
                        { $lt: ['$$slot.endTime', currentDate] },
                        {
                          $in: [
                            '$$slot.status',
                            [SlotStatus.AVAILABLE, SlotStatus.BOOKED],
                          ],
                        },
                      ],
                    },
                    {
                      $mergeObjects: [
                        '$$slot',
                        {
                          status: {
                            $cond: [
                              { $eq: ['$$slot.status', SlotStatus.BOOKED] },
                              SlotStatus.MISSED,
                              '$$slot.status',
                            ],
                          },
                          lastUpdated: currentDate,
                        },
                      ],
                    },
                    '$$slot',
                  ],
                },
              },
            },
          },
        },
      ]
    );

    // Then move completed/cancelled/missed slots to historical
    await this.updateMany({}, [
      {
        $set: {
          historicalSlots: {
            $concatArrays: [
              '$historicalSlots',
              {
                $filter: {
                  input: '$slots',
                  as: 'slot',
                  cond: {
                    $and: [
                      { $lt: ['$$slot.endTime', currentDate] },
                      {
                        $in: [
                          '$$slot.status',
                          [
                            SlotStatus.COMPLETED,
                            SlotStatus.CANCELLED,
                            SlotStatus.MISSED,
                          ],
                        ],
                      },
                    ],
                  },
                },
              },
            ],
          },
          slots: {
            $filter: {
              input: '$slots',
              as: 'slot',
              cond: {
                $or: [
                  { $gte: ['$$slot.endTime', currentDate] },
                  { $eq: ['$$slot.status', SlotStatus.IN_PROGRESS] },
                ],
              },
            },
          },
        },
      },
    ]);

    return result;
  };

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

      // Generate slots for the current week
      const generatedSlots = generateWeeklySlots(
        this.daysOfWeek,
        this.startTime,
        this.endTime,
        currentDate
      );

      // Sort slots chronologically
      generatedSlots.sort(
        (a, b) => a.startTime.getTime() - b.startTime.getTime()
      );

      // Keep existing booked and in-progress slots
      const existingValidSlots = this.slots.filter(
        slot =>
          slot.status === SlotStatus.BOOKED ||
          slot.status === SlotStatus.IN_PROGRESS
      );

      // Merge slots
      this.slots = [...existingValidSlots, ...generatedSlots];
    }
    next();
  } catch (error) {
    next(error as Error);
  }
});

// Pre-find middleware
AvailabilitySchema.pre('find', function (next) {
  const currentDate = new Date();

  this.where({
    isActive: true,
    $or: [
      { 'slots.endTime': { $gte: currentDate } },
      { 'slots.status': { $in: [SlotStatus.BOOKED, SlotStatus.IN_PROGRESS] } },
    ],
  });
  next();
});

// Instance method to get available slots
AvailabilitySchema.methods.getAvailableSlots = function (): ITimeSlot[] {
  return this.slots.filter(slot => slot.status === SlotStatus.AVAILABLE);
};

// Instance method to book a slot
AvailabilitySchema.methods.bookSlot = async function (
  slotId: mongoose.Types.ObjectId,
  userId: mongoose.Types.ObjectId,
  appointmentId: mongoose.Types.ObjectId
): Promise<boolean> {
  const slot = this.slots.find(slot => slot._id?.equals(slotId));

  if (slot && slot.status === SlotStatus.AVAILABLE) {
    slot.status = SlotStatus.BOOKED;
    slot.isBooked = true;
    slot.userId = userId;
    slot.appointmentId = appointmentId;
    slot.lastUpdated = new Date();
    await this.save();
    return true;
  }
  return false;
};

// Instance method to start a session
AvailabilitySchema.methods.startSession = async function (
  slotId: mongoose.Types.ObjectId
): Promise<boolean> {
  const slot = this.slots.find(slot => slot._id?.equals(slotId));

  if (slot && slot.status === SlotStatus.BOOKED) {
    slot.status = SlotStatus.IN_PROGRESS;
    slot.sessionStartedAt = new Date();
    slot.lastUpdated = new Date();
    await this.save();
    return true;
  }
  return false;
};

// Instance method to complete a session
AvailabilitySchema.methods.completeSession = async function (
  slotId: mongoose.Types.ObjectId,
  notes?: string
): Promise<boolean> {
  const slot = this.slots.find(slot => slot._id?.equals(slotId));

  if (slot && slot.status === SlotStatus.IN_PROGRESS) {
    slot.status = SlotStatus.COMPLETED;
    slot.sessionEndedAt = new Date();
    if (notes) {
      slot.notes = notes;
    }
    slot.lastUpdated = new Date();
    await this.save();
    return true;
  }
  return false;
};

// Instance method to cancel a slot
AvailabilitySchema.methods.cancelSlot = async function (
  slotId: mongoose.Types.ObjectId
): Promise<boolean> {
  const slot = this.slots.find(slot => slot._id?.equals(slotId));

  if (
    slot &&
    (slot.status === SlotStatus.BOOKED ||
      slot.status === SlotStatus.IN_PROGRESS)
  ) {
    slot.status = SlotStatus.CANCELLED;
    slot.lastUpdated = new Date();
    await this.save();
    return true;
  }
  return false;
};

// Instance method to mark a slot as missed
AvailabilitySchema.methods.markMissed = async function (
  slotId: mongoose.Types.ObjectId
): Promise<boolean> {
  const slot = this.slots.find(slot => slot._id?.equals(slotId));

  if (slot && slot.status === SlotStatus.BOOKED) {
    slot.status = SlotStatus.MISSED;
    slot.lastUpdated = new Date();
    await this.save();
    return true;
  }
  return false;
};

// Indexes
AvailabilitySchema.index({ psychologistId: 1, isActive: 1 });
AvailabilitySchema.index({ 'slots.startTime': 1, 'slots.status': 1 });
AvailabilitySchema.index({ 'slots.lastUpdated': 1 });
AvailabilitySchema.index({
  'historicalSlots.startTime': 1,
  'historicalSlots.status': 1,
});

// Create model
const Availability =
  (mongoose.models.Availability as IAvailabilityModel) ||
  mongoose.model<IAvailabilityDocument, IAvailabilityModel>(
    'Availability',
    AvailabilitySchema
  );

export default Availability;
