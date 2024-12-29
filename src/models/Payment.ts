import { Schema, model, models, Document } from "mongoose";

interface IPayment extends Document {
  user: Schema.Types.ObjectId;
  psychologist: Schema.Types.ObjectId;
  amount: number;
  status: "pending" | "completed" | "failed";
  createdAt: Date;
}

const paymentSchema = new Schema<IPayment>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    psychologist: { type: Schema.Types.ObjectId, ref: "User", required: true },
    amount: { type: Number, required: true },
    status: {
      type: String,
      enum: ["pending", "completed", "failed"],
      default: "pending",
    },
  },
  {
    timestamps: true,
  }
);

export default models.Payment || model<IPayment>("Payment", paymentSchema);
