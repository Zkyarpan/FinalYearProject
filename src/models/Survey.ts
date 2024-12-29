import { Schema, model, models, Document } from "mongoose";

interface ISurvey extends Document {
  user: Schema.Types.ObjectId; 
  questions: {
    question: string;
    answer: string;
  }[];
  createdAt: Date;
}

const surveySchema = new Schema<ISurvey>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    questions: [
      {
        question: { type: String, required: true },
        answer: { type: String, required: true },
      },
    ],
  },
  {
    timestamps: true,
  }
);

export default models.Survey || model<ISurvey>("Survey", surveySchema);
