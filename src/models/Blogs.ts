import { Schema, model, models, Document } from 'mongoose';

interface IBlog extends Document {
  title: string;
  content: string;
  author: Schema.Types.ObjectId;
  category: string;
  tags?: string[];
  createdAt: Date;
  updatedAt: Date;
  isPublished: boolean;
  publishDate: Date;
  readTime: number;
  blogImage: string;
}

const blogSchema = new Schema<IBlog>(
  {
    title: { type: String, required: true, trim: true },
    content: { type: String, required: true },
    author: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    category: { type: String, required: true },
    tags: [{ type: String }],
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
    isPublished: { type: Boolean, default: false },
    publishDate: { type: Date, default: Date.now },
    readTime: { type: Number, required: true },
    blogImage: { type: String, required: true },
  },
  {
    timestamps: true,
  }
);

const Blog = models.Blog || model<IBlog>('Blog', blogSchema);
export default Blog;
