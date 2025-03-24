import mongoose, { Schema, Document } from 'mongoose';

export interface IArticle extends Document {
  title: string;
  content: string;
  articleImage: string;
  category: string;
  tags: string[];
  readTime: number;
  author: mongoose.Types.ObjectId;
  authorType: 'user' | 'psychologist';
  publishDate: Date;
  isPublished: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ArticleSchema = new Schema<IArticle>(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      maxlength: [100, 'Title cannot exceed 100 characters'],
    },
    content: {
      type: String,
      required: [true, 'Content is required'],
      trim: true,
    },
    articleImage: {
      type: String,
      default: '',
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      enum: [
        'Anxiety',
        'Depression',
        'Stress',
        'Self-care',
        'Mindfulness',
        'Therapy',
        'General',
      ],
    },
    tags: [
      {
        type: String,
        trim: true,
      },
    ],
    readTime: {
      type: Number,
      default: 5,
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: 'authorType',
      required: true,
    },
    authorType: {
      type: String,
      required: true,
      enum: ['user', 'psychologist'],
    },
    isPublished: {
      type: Boolean,
      default: true,
    },
    publishDate: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

// Calculate read time based on content length before saving
ArticleSchema.pre('save', function (next) {
  if (this.isModified('content')) {
    // Average reading speed: 200 words per minute
    const wordCount = this.content.split(/\s+/).length;
    this.readTime = Math.ceil(wordCount / 200);
  }
  next();
});

const Article =
  mongoose.models.Article || mongoose.model<IArticle>('Article', ArticleSchema);

export default Article;
