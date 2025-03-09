import mongoose, { Schema, Document, Model } from 'mongoose';

// Interface for call history document
export interface ICallHistory extends Document {
  from: mongoose.Types.ObjectId;
  fromModel: 'User' | 'Psychologist';
  to: mongoose.Types.ObjectId;
  toModel: 'User' | 'Psychologist';
  conversationId: mongoose.Types.ObjectId;
  callType: 'audio' | 'video';
  status: 'ended' | 'missed' | 'rejected';
  duration: number;
  startedAt: Date;
  endedAt: Date;
  createdAt: Date;
  updatedAt: Date;
  // Virtual fields
  fromUser?: any;
  toUser?: any;
}

const CallHistorySchema = new Schema(
  {
    // From party - can be either a user or psychologist
    from: {
      type: Schema.Types.ObjectId,
      required: true,
      index: true,
    },
    fromModel: {
      type: String,
      enum: ['User', 'Psychologist'],
      required: true,
    },

    // To party - can be either a user or psychologist
    to: {
      type: Schema.Types.ObjectId,
      required: true,
      index: true,
    },
    toModel: {
      type: String,
      enum: ['User', 'Psychologist'],
      required: true,
    },

    conversationId: {
      type: Schema.Types.ObjectId,
      ref: 'Conversation',
      required: true,
      index: true,
    },

    callType: {
      type: String,
      enum: ['audio', 'video'],
      required: true,
    },

    status: {
      type: String,
      enum: ['ended', 'missed', 'rejected'],
      required: true,
      index: true,
    },

    duration: {
      type: Number,
      default: 0,
    }, // in seconds

    startedAt: {
      type: Date,
      required: true,
      index: true,
    },

    endedAt: {
      type: Date,
      required: true,
    },

    // Add additional metadata field for flexibility
    metadata: {
      type: Map,
      of: Schema.Types.Mixed,
      default: () => new Map(),
    },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt automatically
    toJSON: { virtuals: true }, // Include virtuals when converting to JSON
    toObject: { virtuals: true }, // Include virtuals when converting to object
  }
);

// Add compound indexes for common query patterns
CallHistorySchema.index({ conversationId: 1, startedAt: -1 });
CallHistorySchema.index({ from: 1, to: 1 });
CallHistorySchema.index({ startedAt: -1 });

// Add virtual fields for better referencing
CallHistorySchema.virtual('fromUser', {
  ref: function (this: ICallHistory) {
    return this.fromModel;
  },
  localField: 'from',
  foreignField: '_id',
  justOne: true,
});

CallHistorySchema.virtual('toUser', {
  ref: function (this: ICallHistory) {
    return this.toModel;
  },
  localField: 'to',
  foreignField: '_id',
  justOne: true,
});

// Add helper methods
CallHistorySchema.methods.getDurationFormatted = function () {
  const duration = this.duration;
  const minutes = Math.floor(duration / 60);
  const seconds = duration % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

// Check if model already exists to prevent overwriting during hot reloads
const CallHistory: Model<ICallHistory> =
  (mongoose.models.CallHistory as Model<ICallHistory>) ||
  mongoose.model<ICallHistory>('CallHistory', CallHistorySchema);

export default CallHistory;
