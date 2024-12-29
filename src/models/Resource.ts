import { Schema, model, models, Document } from "mongoose";

interface IResource extends Document {
  title: string;
  description: string;
  category: string;
  url: string;
}

const resourceSchema = new Schema<IResource>(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    category: { type: String, required: true },
    url: { type: String, required: true },
  },
  {
    timestamps: true,
  }
);

export default models.Resource || model<IResource>("Resource", resourceSchema);
