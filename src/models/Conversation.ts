// models/Conversation.ts
import mongoose, { Schema, Document } from 'mongoose';

export interface IConversation extends Document {
  participants: mongoose.Types.ObjectId[];
  user: mongoose.Types.ObjectId;
  psychologist: mongoose.Types.ObjectId;
  isActive: boolean;
  lastMessage: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const ConversationSchema: Schema = new Schema(
  {
    // Array of all participants (user and psychologist)
    participants: [
      {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
      },
    ],
    // Specific reference to user
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    // Specific reference to psychologist
    psychologist: {
      type: Schema.Types.ObjectId,
      ref: 'Psychologist',
      required: true,
    },
    // Whether the conversation is active
    isActive: {
      type: Boolean,
      default: true,
    },
    // Reference to the last message
    lastMessage: {
      type: Schema.Types.ObjectId,
      ref: 'Message',
    },
  },
  { timestamps: true }
);

// Create indexes for faster queries
ConversationSchema.index({ participants: 1 });
ConversationSchema.index({ user: 1 });
ConversationSchema.index({ psychologist: 1 });
ConversationSchema.index({ updatedAt: -1 });

export default mongoose.models.Conversation ||
  mongoose.model<IConversation>('Conversation', ConversationSchema);
