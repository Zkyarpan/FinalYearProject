import { Schema, model, models, Document } from "mongoose";

interface IUser extends Document {
  email: string;
  password: string;
  role: "admin" | "psychologist" | "user";
  isActive: boolean;
  isVerified: boolean;
  verificationCode?: string;
  verificationCodeExpiry?: Date;
  createdAt: Date;
  updatedAt: Date;
  lastLogin?: Date;
}

const userSchema = new Schema<IUser>(
  {
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: {
      type: String,
      enum: ["admin", "psychologist", "user"],
      default: "user",
    },
    isActive: { type: Boolean, default: true },
    isVerified: { type: Boolean, default: false },
    verificationCode: { type: String },
    verificationCodeExpiry: { type: Date },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
    lastLogin: { type: Date },
  },
  {
    timestamps: true,
  }
);

userSchema.pre("save", function (next) {
  this.updatedAt = new Date();
  next();
});

const User = models.User || model<IUser>("User", userSchema);
export default User;
