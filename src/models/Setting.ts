import mongoose, { Schema, Document } from 'mongoose';

export interface ISetting extends Document {
  category: string;
  settings: any;
  createdBy: Schema.Types.ObjectId;
  updatedBy: Schema.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const SettingSchema: Schema = new Schema(
  {
    category: {
      type: String,
      required: true,
      unique: true,
      enum: [
        'system',
        'email',
        'payment',
        'notification',
        'security',
        'content',
        'appointment',
      ],
    },
    settings: {
      type: Schema.Types.Mixed,
      required: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  { timestamps: true }
);

const Setting =
  mongoose.models.Setting || mongoose.model<ISetting>('Setting', SettingSchema);

export default Setting;
