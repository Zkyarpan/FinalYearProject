import mongoose, { Document, Model } from 'mongoose';
const { Schema } = mongoose;

export enum SlotStatus {
  AVAILABLE = 'available',
  BOOKED = 'booked',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  MISSED = 'missed',
}

export enum SessionDuration {
  THIRTY_MIN = 30,
  FORTY_FIVE_MIN = 45,
  ONE_HOUR = 60,
  NINETY_MIN = 90,
  TWO_HOURS = 120,
}

interface IPsychologistDetails {
  name?: string;
  specialty?: string;
  profilePhotoUrl?: string;
  sessionFee?: number;
}

export interface ITimeSlot {
  _id: mongoose.Types.ObjectId;
  startTime: Date;
  endTime: Date;
  duration: number;
  isBooked: boolean;
  status: SlotStatus;
  userId?: mongoose.Types.ObjectId;
  appointmentId?: mongoose.Types.ObjectId;
  lastUpdated: Date;
  sessionStartedAt?: Date;
  sessionEndedAt?: Date;
  notes?: string;
  timePeriods?: string[];
  timezone?: string;
  rawStartTime?: string;
  rawEndTime?: string;
}

export interface IAvailability {
  psychologistId: mongoose.Types.ObjectId;
  daysOfWeek: number[];
  startTime: string;
  endTime: string;
  timePeriods?: string[];
  duration: number;
  slots: ITimeSlot[];
  historicalSlots: ITimeSlot[];
  isActive: boolean;
  psychologistDetails?: IPsychologistDetails;
  lastCleanup: Date;
  createdAt: Date;
  updatedAt: Date;
  maxSessionOvertime?: number;
  timezone: string;
}

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
    duration: {
      type: Number,
      required: true,
      validate: {
        validator: function (value: number) {
          const validDurations = Object.values(SessionDuration)
            .filter(v => typeof v === 'number')
            .map(v => Number(v));
          return validDurations.includes(Number(value));
        },
        message: props =>
          `${props.value} is not a valid session duration. Valid values are: 30, 45, 60, 90, 120 minutes`,
      },
      default: 60,
    },
    timePeriods: {
      type: [String],
      enum: ['MORNING', 'AFTERNOON', 'EVENING', 'NIGHT'],
      default: [],
    },
    timezone: {
      type: String,
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
    duration: {
      type: Number,
      required: true,
      validate: {
        validator: function (value: number) {
          const validDurations = Object.values(SessionDuration)
            .filter(v => typeof v === 'number')
            .map(v => Number(v));
          return validDurations.includes(Number(value));
        },
        message: props =>
          `${props.value} is not a valid session duration. Valid values are: 30, 45, 60, 90, 120 minutes`,
      },
      default: 60,
    },
    timePeriods: {
      type: [String],
      enum: ['MORNING', 'AFTERNOON', 'EVENING', 'NIGHT'],
      default: [],
    },
    timezone: {
      type: String,
      required: true,
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

// Helper function to calculate end time based on start time and duration
const calculateEndTime = (startTime: Date, durationMinutes: number): Date => {
  const endTime = new Date(startTime);
  endTime.setMinutes(endTime.getMinutes() + durationMinutes);
  return endTime;
};

// Utility function to generate slots with durations
const generateWeeklySlots = (
  daysOfWeek: number[],
  startTimeStr: string,
  endTimeStr: string,
  duration: number,
  currentDate: Date,
  timezone: string
): ITimeSlot[] => {
  console.log('🎯 Starting slot generation with:', {
    daysOfWeek,
    startTimeStr,
    endTimeStr,
    duration,
    currentDate: currentDate.toISOString(),
    timezone,
  });

  const slots: ITimeSlot[] = [];
  const startOfWeek = new Date(currentDate);
  startOfWeek.setHours(0, 0, 0, 0);
  startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());

  const [startHour, startMinute] = startTimeStr.split(':').map(Number);
  const [endHour, endMinute] = endTimeStr.split(':').map(Number);

  console.log('📅 Week starts at:', startOfWeek.toISOString());

  for (const dayOfWeek of daysOfWeek) {
    const currentSlotDate = new Date(startOfWeek);
    currentSlotDate.setDate(startOfWeek.getDate() + dayOfWeek);

    let currentTime = new Date(currentSlotDate);
    currentTime.setHours(startHour, startMinute, 0, 0);

    const dayEndTime = new Date(currentSlotDate);
    dayEndTime.setHours(endHour, endMinute, 0, 0);

    console.log(`🕒 Generating slots for day ${dayOfWeek}:`, {
      date: currentSlotDate.toISOString(),
      startTime: currentTime.toISOString(),
      endTime: dayEndTime.toISOString(),
    });

    // Generate slots until we reach end time
    while (currentTime < dayEndTime) {
      const slotEndTime = new Date(currentTime.getTime() + duration * 60000);

      // Only add slot if it fits within the time window
      if (slotEndTime <= dayEndTime && currentTime >= currentDate) {
        const slot: ITimeSlot = {
          _id: new mongoose.Types.ObjectId(),
          startTime: new Date(currentTime),
          endTime: new Date(slotEndTime),
          duration,
          isBooked: false,
          status: SlotStatus.AVAILABLE,
          lastUpdated: new Date(),
          timezone,
          rawStartTime: startTimeStr,
          rawEndTime: endTimeStr,
          timePeriods: getTimePeriod(currentTime.getHours()),
        };

        slots.push(slot);
        console.log(`✅ Created slot:`, {
          start: slot.startTime.toISOString(),
          end: slot.endTime.toISOString(),
          duration: slot.duration,
        });
      }

      currentTime = slotEndTime;
    }
  }

  console.log(`📊 Generated ${slots.length} total slots`);
  return slots;
};

// Helper function to determine time period
const getTimePeriod = (hour: number): string[] => {
  if (hour >= 0 && hour <= 11) return ['MORNING'];
  if (hour >= 12 && hour <= 16) return ['AFTERNOON'];
  if (hour >= 17 && hour <= 20) return ['EVENING'];
  return ['NIGHT'];
};

// Static method to cleanup past slots
AvailabilitySchema.statics.cleanupPastSlots =
  async function (): Promise<mongoose.UpdateWriteOpResult> {
    const currentDate = new Date();
    const oneWeekAgo = new Date(currentDate);
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7); // Set to 7 days ago

    // Only update status of slots older than a week
    const result = await this.updateMany(
      {
        'slots.endTime': { $lt: oneWeekAgo }, // Changed from currentDate to oneWeekAgo
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
                        { $lt: ['$$slot.endTime', oneWeekAgo] },
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

    // Move only slots older than a week to historical
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
                      { $lt: ['$$slot.endTime', oneWeekAgo] }, // Changed to oneWeekAgo
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
                  { $gte: ['$$slot.endTime', oneWeekAgo] }, // Keep slots newer than a week
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
    console.log('⚡ Pre-save middleware triggered');

    if (
      this.isNew ||
      this.isModified('startTime') ||
      this.isModified('endTime') ||
      this.isModified('daysOfWeek') ||
      this.isModified('duration')
    ) {
      console.log('📝 Generating new slots due to changes in:', {
        isNew: this.isNew,
        modifiedPaths: this.modifiedPaths(),
      });

      const currentDate = new Date();
      currentDate.setSeconds(0, 0);

      // Generate slots for the current week
      const generatedSlots = generateWeeklySlots(
        this.daysOfWeek,
        this.startTime,
        this.endTime,
        this.duration,
        currentDate,
        this.timezone
      );

      console.log(`🎲 Generated ${generatedSlots.length} new slots`);

      // Keep existing booked and in-progress slots
      const existingValidSlots = this.slots.filter(
        slot =>
          slot.status === SlotStatus.BOOKED ||
          slot.status === SlotStatus.IN_PROGRESS
      );

      console.log(
        `🔒 Keeping ${existingValidSlots.length} existing booked/in-progress slots`
      );

      // Merge and sort slots
      this.slots = [...existingValidSlots, ...generatedSlots].sort(
        (a, b) => a.startTime.getTime() - b.startTime.getTime()
      );

      console.log(`✨ Final slot count: ${this.slots.length}`);
    } else {
      console.log('💤 No relevant changes, skipping slot generation');
    }

    next();
  } catch (error) {
    console.error('❌ Error in pre-save middleware:', error);
    next(error as Error);
  }
});

// Pre-validate middleware to ensure end time is after start time
AvailabilitySchema.pre('validate', function (next) {
  // Parse the time strings into hours and minutes
  const [startHours, startMinutes] = this.startTime.split(':').map(Number);
  const [endHours, endMinutes] = this.endTime.split(':').map(Number);

  // Convert to total minutes for easy comparison
  const startTimeMinutes = startHours * 60 + startMinutes;
  const endTimeMinutes = endHours * 60 + endMinutes;

  // Check if end time is after start time
  if (endTimeMinutes <= startTimeMinutes) {
    return next(new Error('End time must be after start time'));
  }

  // Check if the time slot is long enough for the selected duration
  const timeSlotDuration = endTimeMinutes - startTimeMinutes;
  if (timeSlotDuration < this.duration) {
    return next(
      new Error(
        `Time slot must be at least ${this.duration} minutes long for the selected session duration`
      )
    );
  }

  next();
});

// Pre-find middleware
AvailabilitySchema.pre('find', function (next) {
  const currentDate = new Date();
  const oneWeekFromNow = new Date(currentDate);
  oneWeekFromNow.setDate(oneWeekFromNow.getDate() + 7);

  this.where({
    isActive: true,
    $or: [
      { 'slots.endTime': { $lte: oneWeekFromNow } },
      { 'slots.status': { $in: [SlotStatus.BOOKED, SlotStatus.IN_PROGRESS] } },
    ],
  });
  next();
});

// Indexes
AvailabilitySchema.index({ psychologistId: 1, isActive: 1 });
AvailabilitySchema.index({ 'slots.startTime': 1, 'slots.status': 1 });
AvailabilitySchema.index({ 'slots.duration': 1 });
AvailabilitySchema.index({ 'slots.lastUpdated': 1 });
AvailabilitySchema.index({
  'historicalSlots.startTime': 1,
  'historicalSlots.status': 1,
});
AvailabilitySchema.index({ duration: 1 });

// Create model
const Availability =
  (mongoose.models.Availability as IAvailabilityModel) ||
  mongoose.model<IAvailabilityDocument, IAvailabilityModel>(
    'Availability',
    AvailabilitySchema
  );

export default Availability;
