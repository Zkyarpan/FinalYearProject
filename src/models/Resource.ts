import { Schema, model, models, Document, Types } from 'mongoose';

export interface IResource extends Document {
  title: string;
  description: string;
  category: string;
  content: string;
  resourceImage: string;
  mediaUrls: {
    type: 'audio' | 'video';
    url: string;
    title?: string;
  }[];
  duration: number; // in minutes
  difficultyLevel: 'beginner' | 'intermediate' | 'advanced';
  steps: string[];
  tags: string[];
  author: Types.ObjectId;
  authorType: 'user' | 'psychologist' | 'admin';
  isPublished: boolean;
  viewCount: number;
  publishDate: Date;
  createdAt: Date;
  updatedAt: Date;
}

const ResourceSchema = new Schema<IResource>(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      maxlength: [100, 'Title cannot exceed 100 characters'],
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
      maxlength: [500, 'Description cannot exceed 500 characters'],
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      enum: [
        'Breathing',
        'Meditation',
        'Yoga',
        'Exercise',
        'Sleep',
        'Anxiety',
        'Depression',
        'Stress',
        'Mindfulness',
        'Self-care',
        'Other',
      ],
    },
    content: {
      type: String,
      required: [true, 'Content is required'],
      trim: true,
    },
    resourceImage: {
      type: String,
      default: '',
    },
    mediaUrls: [
      {
        type: {
          type: String,
          enum: ['audio', 'video'],
          required: true,
        },
        url: {
          type: String,
          required: true,
        },
        title: {
          type: String,
        },
      },
    ],
    duration: {
      type: Number,
      default: 5,
      min: [1, 'Duration must be at least 1 minute'],
    },
    difficultyLevel: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced'],
      default: 'beginner',
    },
    steps: [
      {
        type: String,
        trim: true,
      },
    ],
    tags: [
      {
        type: String,
        trim: true,
      },
    ],
    author: {
      type: Schema.Types.ObjectId,
      refPath: 'authorType',
      required: true,
    },
    authorType: {
      type: String,
      required: true,
      enum: ['user', 'psychologist', 'admin'],
      default: 'admin',
    },
    isPublished: {
      type: Boolean,
      default: true,
    },
    viewCount: {
      type: Number,
      default: 0,
    },
    publishDate: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

// Create slug from title
ResourceSchema.pre('save', function (next) {
  if (this.isModified('title')) {
    this.set(
      'slug',
      this.title
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^\w-]+/g, '')
    );
  }
  next();
});

const Resource =
  models.Resource || model<IResource>('Resource', ResourceSchema);

export default Resource;
