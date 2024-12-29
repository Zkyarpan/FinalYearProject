import { Schema, model, models, Document } from "mongoose";

interface IChat extends Document {
  sender: Schema.Types.ObjectId;
  receiver: Schema.Types.ObjectId;
  message: string;
  isRead: boolean;
  createdAt: Date;
}

const chatSchema = new Schema<IChat>(
  {
    sender: { type: Schema.Types.ObjectId, ref: "User", required: true },
    receiver: { type: Schema.Types.ObjectId, ref: "User", required: true },
    message: { type: String, required: true },
    isRead: { type: Boolean, default: false },
  },
  {
    timestamps: true,
  }
);

export default models.Chat || model<IChat>("Chat", chatSchema);
