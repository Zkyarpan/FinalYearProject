// // models/Message.ts
// import mongoose, { Schema, Document } from 'mongoose';

// export interface IMessage extends Document {
//   conversation: mongoose.Types.ObjectId;
//   sender: mongoose.Types.ObjectId;
//   senderModel: string;
//   senderId: string;
//   receiver: mongoose.Types.ObjectId;
//   receiverModel: string;
//   receiverId: string;
//   content: string;
//   isRead: boolean;
//   readAt: Date | null;
//   attachments: Array<{
//     url: string;
//     type: string;
//     name: string;
//   }>;
//   createdAt: Date;
//   updatedAt: Date;
// }

// const MessageSchema: Schema = new Schema(
//   {
//     // Reference to the conversation this message belongs to
//     conversation: {
//       type: Schema.Types.ObjectId,
//       ref: 'Conversation',
//       required: true,
//     },
//     // Who sent the message - with dynamic reference
//     sender: {
//       type: Schema.Types.ObjectId,
//       refPath: 'senderModel',
//       required: true,
//     },
//     // Model type for sender (User or Psychologist)
//     senderModel: {
//       type: String,
//       required: true,
//       enum: ['User', 'Psychologist'],
//       default: 'User',
//     },
//     // Store the sender ID as a string for easier access
//     senderId: {
//       type: String,
//       required: function () {
//         return !this.sender;
//       },
//     },
//     // Who should receive the message - with dynamic reference
//     receiver: {
//       type: Schema.Types.ObjectId,
//       refPath: 'receiverModel',
//       required: true,
//     },
//     // Model type for receiver (User or Psychologist)
//     receiverModel: {
//       type: String,
//       required: true,
//       enum: ['User', 'Psychologist'],
//       default: 'Psychologist',
//     },
//     // Store the receiver ID as a string for easier access
//     receiverId: {
//       type: String,
//       required: function () {
//         return !this.receiver;
//       },
//     },
//     // Message content
//     content: {
//       type: String,
//       required: true,
//     },
//     // Whether the message has been read
//     isRead: {
//       type: Boolean,
//       default: false,
//     },
//     // When the message was read
//     readAt: {
//       type: Date,
//       default: null,
//     },
//     // Optional attachments (for future use)
//     attachments: [
//       {
//         url: String,
//         type: String,
//         name: String,
//       },
//     ],
//   },
//   {
//     timestamps: true,
//     toJSON: { virtuals: true },
//     toObject: { virtuals: true },
//   }
// );

// // Pre-save middleware to ensure IDs are set
// MessageSchema.pre('save', function (next) {
//   // Set senderId if not already set
//   if (!this.senderId && this.sender) {
//     this.senderId = this.sender.toString();
//   }

//   // Set receiverId if not already set
//   if (!this.receiverId && this.receiver) {
//     this.receiverId = this.receiver.toString();
//   }

//   next();
// });

// // Create indexes for faster queries
// MessageSchema.index({ conversation: 1, createdAt: 1 });
// MessageSchema.index({ sender: 1 });
// MessageSchema.index({ receiver: 1 });
// MessageSchema.index({ isRead: 1 });
// MessageSchema.index({ senderId: 1 });
// MessageSchema.index({ receiverId: 1 });

// export default mongoose.models.Message ||
//   mongoose.model<IMessage>('Message', MessageSchema);

// models/Message.ts
import mongoose, { Schema, Document } from 'mongoose';

// Add a type for call events
export type MessageType = 'text' | 'call';
export type CallStatus = 'started' | 'ended' | 'missed' | 'rejected';

export interface IMessage extends Document {
  conversation: mongoose.Types.ObjectId;
  sender: mongoose.Types.ObjectId;
  senderModel: string;
  senderId: string;
  receiver: mongoose.Types.ObjectId;
  receiverModel: string;
  receiverId: string;
  content: string;
  isRead: boolean;
  readAt: Date | null;
  // New fields for call events
  type: MessageType;
  callData?: {
    status: CallStatus;
    duration?: number; // Duration in seconds
    callType: 'audio' | 'video';
    startTime?: Date;
    endTime?: Date;
  };
  attachments: Array<{
    url: string;
    type: string;
    name: string;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

const MessageSchema: Schema = new Schema(
  {
    // Reference to the conversation this message belongs to
    conversation: {
      type: Schema.Types.ObjectId,
      ref: 'Conversation',
      required: true,
    },
    // Who sent the message - with dynamic reference
    sender: {
      type: Schema.Types.ObjectId,
      refPath: 'senderModel',
      required: true,
    },
    // Model type for sender (User or Psychologist)
    senderModel: {
      type: String,
      required: true,
      enum: ['User', 'Psychologist'],
      default: 'User',
    },
    // Store the sender ID as a string for easier access
    senderId: {
      type: String,
      required: function () {
        return !this.sender;
      },
    },
    // Who should receive the message - with dynamic reference
    receiver: {
      type: Schema.Types.ObjectId,
      refPath: 'receiverModel',
      required: true,
    },
    // Model type for receiver (User or Psychologist)
    receiverModel: {
      type: String,
      required: true,
      enum: ['User', 'Psychologist'],
      default: 'Psychologist',
    },
    // Store the receiver ID as a string for easier access
    receiverId: {
      type: String,
      required: function () {
        return !this.receiver;
      },
    },
    // Message content
    content: {
      type: String,
      required: true,
    },
    // Type of message (text or call)
    type: {
      type: String,
      enum: ['text', 'call'],
      default: 'text',
    },
    // Data specific to call events
    callData: {
      status: {
        type: String,
        enum: ['started', 'ended', 'missed', 'rejected'],
      },
      duration: Number, // Duration in seconds
      callType: {
        type: String,
        enum: ['audio', 'video'],
      },
      startTime: Date,
      endTime: Date,
    },
    // Whether the message has been read
    isRead: {
      type: Boolean,
      default: false,
    },
    // When the message was read
    readAt: {
      type: Date,
      default: null,
    },
    // Optional attachments (for future use)
    attachments: [
      {
        url: String,
        type: String,
        name: String,
      },
    ],
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Pre-save middleware to ensure IDs are set
MessageSchema.pre('save', function (next) {
  // Set senderId if not already set
  if (!this.senderId && this.sender) {
    this.senderId = this.sender.toString();
  }

  // Set receiverId if not already set
  if (!this.receiverId && this.receiver) {
    this.receiverId = this.receiver.toString();
  }

  next();
});

// Create indexes for faster queries
MessageSchema.index({ conversation: 1, createdAt: 1 });
MessageSchema.index({ sender: 1 });
MessageSchema.index({ receiver: 1 });
MessageSchema.index({ isRead: 1 });
MessageSchema.index({ senderId: 1 });
MessageSchema.index({ receiverId: 1 });
MessageSchema.index({ type: 1 }); // Index for message type

export default mongoose.models.Message ||
  mongoose.model<IMessage>('Message', MessageSchema);
