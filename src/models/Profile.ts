import { Schema, model, models, Document, Types } from "mongoose";

interface IProfile extends Document {
  user: Types.ObjectId;
  name: string;
  image: string;
  address?: string;
  phone?: string;
  age?: number;
  gender?: string;
  profileCompleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const profileSchema = new Schema<IProfile>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    name: { type: String, required: true, trim: true },
    image: { type: String, trim: true },
    address: { type: String, trim: true },
    phone: { type: String, trim: true },
    age: { type: Number, min: 0 },
    gender: {
      type: String,
      enum: ["male", "female", "other"],
      default: "other",
    },
    profileCompleted: { type: Boolean, default: false },
  },
  {
    timestamps: true,
  }
);

const Profile = models.Profile || model<IProfile>("Profile", profileSchema);
export default Profile;
