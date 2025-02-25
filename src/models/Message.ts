// models/Message.ts
import mongoose, { Schema, Document } from 'mongoose';

export interface IMessage extends Document {
  conversation: mongoose.Types.ObjectId;
  sender: mongoose.Types.ObjectId;
  receiver: mongoose.Types.ObjectId;
  content: string;
  isRead: boolean;
  readAt: Date | null;
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
    // Who sent the message
    sender: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    // Who should receive the message
    receiver: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    // Message content
    content: {
      type: String,
      required: true,
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
  { timestamps: true }
);

// Create indexes for faster queries
MessageSchema.index({ conversation: 1, createdAt: 1 });
MessageSchema.index({ sender: 1 });
MessageSchema.index({ receiver: 1 });
MessageSchema.index({ isRead: 1 });

export default mongoose.models.Message ||
  mongoose.model<IMessage>('Message', MessageSchema);
