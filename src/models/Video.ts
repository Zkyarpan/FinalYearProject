import { Schema, model, models, Document } from "mongoose";

interface ISession extends Document {
  user: Schema.Types.ObjectId;
  psychologist: Schema.Types.ObjectId;
  date: Date;
  status: "scheduled" | "completed" | "canceled";
}

const sessionSchema = new Schema<ISession>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    psychologist: { type: Schema.Types.ObjectId, ref: "User", required: true },
    date: { type: Date, required: true },
    status: {
      type: String,
      enum: ["scheduled", "completed", "canceled"],
      default: "scheduled",
    },
  },
  {
    timestamps: true,
  }
);

export default models.Session || model<ISession>("Session", sessionSchema);
