import mongoose from 'mongoose';
const { Schema } = mongoose;

const StorySchema = new Schema(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      maxlength: [100, 'Title cannot be more than 100 characters'],
    },
    content: {
      type: String,
      required: [true, 'Content is required'],
    },
    storyImage: {
      type: String,
      default: '',
    },
    imagePublicId: {
      type: String,
      default: '',
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      enum: [
        'Recovery',
        'Anxiety',
        'Depression',
        'Self-Care',
        'Mindfulness',
        'Personal Growth',
        'Therapy',
        'Wellness',
        'Relationships',
        'Other',
      ],
    },
    tags: {
      type: [String],
      default: [],
    },
    readTime: {
      type: Number,
      default: 1,
    },
    publishDate: {
      type: Date,
      default: Date.now,
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Author is required'],
    },
    isPublished: {
      type: Boolean,
      default: true,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Create model only if it doesn't exist already
const Story = mongoose.models.Story || mongoose.model('Story', StorySchema);

export default Story;
