import mongoose from 'mongoose';
const { Schema } = mongoose;

// Option Schema for multiple choice questions
const OptionSchema = new Schema({
  text: {
    type: String,
    required: true,
    trim: true
  },
  value: {
    type: Number,
    required: true
  }
});

// Question Schema
const QuestionSchema = new Schema({
  questionText: {
    type: String,
    required: true,
    trim: true
  },
  questionType: {
    type: String,
    enum: ['multiple-choice', 'slider', 'text'],
    default: 'multiple-choice'
  },
  required: {
    type: Boolean,
    default: true
  },
  order: {
    type: Number,
    required: true
  },
  options: {
    type: [OptionSchema],
    default: [],
    validate: {
      validator: function(v) {
        return this.questionType !== 'multiple-choice' || (Array.isArray(v) && v.length > 0);
      },
      message: props => 'Multiple-choice questions must have at least one option!'
    }
  },
  minValue: {
    type: Number,
    default: 0,
    validate: {
      validator: function(v) {
        return this.questionType !== 'slider' || v !== undefined;
      },
      message: props => 'Slider questions must have a minimum value!'
    }
  },
  maxValue: {
    type: Number,
    default: 10,
    validate: {
      validator: function(v) {
        return this.questionType !== 'slider' || v !== undefined;
      },
      message: props => 'Slider questions must have a maximum value!'
    }
  },
  step: {
    type: Number,
    default: 1
  }
});

// Category Schema (sections of the assessment)
const CategorySchema = new Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  order: {
    type: Number,
    required: true
  },
  questions: {
    type: [QuestionSchema],
    default: [],
    validate: {
      validator: function(v) {
        return Array.isArray(v) && v.length > 0;
      },
      message: props => 'Each category must have at least one question!'
    }
  }
});

// Scoring Range Schema (for interpreting results)
const ScoringRangeSchema = new Schema({
  minScore: {
    type: Number,
    required: true
  },
  maxScore: {
    type: Number,
    required: true
  },
  label: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  recommendations: {
    type: String,
    trim: true
  }
});

// Main Assessment Schema
const AssessmentSchema = new Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  type: {
    type: String,
    enum: ['mental-health', 'anxiety', 'depression', 'stress', 'wellbeing', 'custom'],
    default: 'mental-health'
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  isPublished: {
    type: Boolean,
    default: false
  },
  version: {
    type: Number,
    default: 1
  },
  categories: {
    type: [CategorySchema],
    default: [],
    validate: {
      validator: function(v) {
        return Array.isArray(v) && v.length > 0;
      },
      message: props => 'Assessment must have at least one category!'
    }
  },
  scoringRanges: {
    type: [ScoringRangeSchema],
    default: [],
    validate: {
      validator: function(v) {
        // If assessment is published, it should have scoring ranges
        return !this.isPublished || (Array.isArray(v) && v.length > 0);
      },
      message: props => 'Published assessments must have at least one scoring range!'
    }
  },
  totalQuestions: {
    type: Number,
    default: function() {
      return this.categories.reduce((sum, category) => sum + category.questions.length, 0);
    }
  },
  estimatedTimeMinutes: {
    type: Number,
    default: function() {
      return Math.ceil(this.totalQuestions * 0.5); // Roughly 30 seconds per question
    }
  },
  tags: [{
    type: String,
    trim: true
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Pre-save middleware to update timestamps and calculated fields
AssessmentSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  
  // Calculate total questions
  this.totalQuestions = this.categories.reduce(
    (sum, category) => sum + category.questions.length, 0
  );
  
  // Update estimated time
  this.estimatedTimeMinutes = Math.ceil(this.totalQuestions * 0.5);
  
  next();
});

// Add compound index for faster searching
AssessmentSchema.index({ title: 'text', description: 'text', tags: 'text' });

// Create the model if it doesn't exist already
const Assessment = mongoose.models.Assessment || mongoose.model('Assessment', AssessmentSchema);

export default Assessment;