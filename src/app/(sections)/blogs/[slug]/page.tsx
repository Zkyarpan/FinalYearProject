'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Skeleton } from '@/components/ui/skeleton';

interface Blog {
  _id: string;
  title: string;
  content: string;
  blogImage: string;
  category: string;
  tags: string[];
  readTime: number;
  author: {
    name: string;
    avatar: string;
  };
  publishDate: string;
}

interface ApiResponse {
  StatusCode: number;
  IsSuccess: boolean;
  ErrorMessage: string[];
  Result: {
    message: string;
    blog: Blog;
  };
}

const BlogPost = () => {
  const params = useParams();
  const [blog, setBlog] = useState<Blog | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const defaultImage = '/default-image.jpg';
  const defaultAvatar = '/default-avatar.jpg';

  useEffect(() => {
    const fetchBlog = async () => {
      try {
        if (!params?.slug) {
          throw new Error('Blog post not found');
        }

        const res = await fetch(`/api/blogs/${params.slug}`);
        const data: ApiResponse = await res.json();

        if (!res.ok) {
          throw new Error(data.ErrorMessage[0] || 'Failed to load blog post');
        }

        if (!data.IsSuccess || !data.Result.blog) {
          throw new Error('Blog not found');
        }

        setBlog(data.Result.blog);
      } catch (error) {
        console.error('Failed to fetch blog:', error);
        setError(
          error instanceof Error ? error.message : 'Failed to load blog post'
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchBlog();
  }, [params?.slug]);

  if (isLoading) {
    return (
      <main className="min-h-screen">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto space-y-6">
            <Skeleton className="h-12 w-3/4" />
            <div className="flex items-center justify-between border-b border-gray-200 pb-4">
              <div className="flex items-center gap-3">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </div>
              <Skeleton className="h-4 w-24" />
            </div>
            <Skeleton className="h-[500px] w-full rounded-2xl" />
            <div className="space-y-4">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
              <Skeleton className="h-4 w-4/5" />
              <Skeleton className="h-4 w-full" />
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (error || !blog) {
    return (
      <main className="min-h-screen">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              {error || 'Blog post not found'}
            </h1>
            <p className="text-gray-600 mb-8">
              The blog post you're looking for might have been removed or is
              temporarily unavailable.
            </p>
            <Link
              href="/blogs"
              className="text-blue-600 hover:text-blue-800 font-semibold"
            >
              ← Back to all blogs
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen">
      <div className="container mx-auto px-4 py-8">
        <article className="max-w-4xl mx-auto">
          <header className="mb-8">
            <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
              <span>{blog.category}</span>
              <span>•</span>
              <span>{blog.readTime} min read</span>
            </div>

            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              {blog.title}
            </h1>

            <div className="flex items-center justify-between border-b border-gray-200 pb-4">
              <div className="flex items-center gap-3">
                <div className="relative h-10 w-10">
                  <Image
                    src={blog.author.avatar || defaultAvatar}
                    alt={`Profile picture of ${blog.author.name}`}
                    fill
                    className="rounded-full object-cover"
                    sizes="40px"
                  />
                </div>
                <div>
                  <span className="block text-gray-900 font-semibold">
                    {blog.author.name}
                  </span>
                  <span className="block text-gray-500 text-sm">
                    {blog.publishDate}
                  </span>
                </div>
              </div>
              <Link
                href="/blogs"
                className="text-blue-600 hover:text-blue-800 font-semibold"
              >
                ← Back to all blogs
              </Link>
            </div>
          </header>

          <div className="relative h-[500px] w-full mb-8">
            <Image
              src={blog.blogImage || defaultImage}
              alt={`Featured image for ${blog.title}`}
              fill
              className="rounded-2xl object-cover"
              sizes="(max-width: 1024px) 100vw, 1024px"
              priority
            />
          </div>

          <div className="prose prose-lg max-w-none">
            <p className="text-gray-700 leading-relaxed">{blog.content}</p>
          </div>

          {blog.tags && blog.tags.length > 0 && (
            <div className="mt-8 pt-6 border-t border-gray-200">
              <div className="flex flex-wrap gap-2">
                {blog.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}
        </article>
      </div>
    </main>
  );
};

export default BlogPost;
