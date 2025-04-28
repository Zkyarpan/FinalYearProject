import mongoose from 'mongoose';
const { Schema } = mongoose;

// Schema for individual answers
const UserAnswerSchema = new Schema({
  questionId: {
    type: String,
    required: true,
  },
  questionText: {
    type: String,
    required: true,
  },
  answer: {
    type: mongoose.Schema.Types.Mixed, // Can be number, string, etc.
    required: true,
  },
  answerText: {
    type: String, // For multiple choice, this is the text of the selected option
    required: false,
  },
  score: {
    type: Number,
    default: 0,
  },
});

// Schema for category results
const CategoryResultSchema = new Schema({
  categoryId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
  },
  categoryName: {
    type: String,
    required: true,
  },
  score: {
    type: Number,
    required: true,
  },
  maxPossibleScore: {
    type: Number,
    required: true,
  },
  interpretation: {
    type: String,
    required: false,
  },
});

// Main UserAssessment Schema
const UserAssessmentSchema = new Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  assessmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Assessment',
    required: false,
  },
  assessmentType: {
    type: String,
    required: true,
    default: 'mental-health',
    enum: [
      'mental-health',
      'anxiety',
      'depression',
      'stress',
      'wellbeing',
      'custom',
    ],
  },
  answers: {
    type: [UserAnswerSchema],
    default: [],
  },
  totalScore: {
    type: Number,
    required: true,
  },
  maxPossible: {
    type: Number,
    required: true,
  },
  percentage: {
    type: Number,
    required: true,
    min: 0,
    max: 100,
  },
  severity: {
    type: String,
    required: true,
    enum: ['Minimal', 'Mild', 'Moderate', 'Moderately Severe', 'Severe'],
  },
  categoryResults: {
    type: [CategoryResultSchema],
    default: [],
  },
  feedback: {
    type: String,
    required: true,
  },
  recommendations: {
    type: String,
    required: false,
  },
  notes: {
    type: String,
    required: false,
  },
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false,
  },
  reviewedAt: {
    type: Date,
    required: false,
  },
  reviewNotes: {
    type: String,
    required: false,
  },
  completedAt: {
    type: Date,
    default: Date.now,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Pre-save hook to update timestamps
UserAssessmentSchema.pre('save', function (next) {
  this.updatedAt = new Date();
  next();
});

// Index to improve query performance
UserAssessmentSchema.index({ userId: 1, completedAt: -1 });
UserAssessmentSchema.index({ assessmentType: 1 });
UserAssessmentSchema.index({ severity: 1 });

// Create the model if it doesn't exist already
const UserAssessment =
  mongoose.models.UserAssessment ||
  mongoose.model('UserAssessment', UserAssessmentSchema);

export default UserAssessment;
