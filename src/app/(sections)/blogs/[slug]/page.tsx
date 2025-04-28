'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Skeleton } from '@/components/ui/skeleton';
import BlogActions from '@/components/BlogActions';

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
    _id: string;
  };
  publishDate: string;
  isOwner: boolean;
}

interface ErrorMessage {
  message: string;
}

interface ApiResponse {
  StatusCode: number;
  IsSuccess: boolean;
  ErrorMessage: ErrorMessage[];
  Result: {
    message: string;
    blog: Blog;
  } | null;
}

// Function to safely render HTML content
const renderHTML = (htmlContent: string) => {
  return { __html: htmlContent };
};

const BlogPost = () => {
  const params = useParams();
  const [blog, setBlog] = useState<Blog | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const defaultImage = '/default-image.jpg';
  const defaultAvatar = '/default-avatar.jpg';

  useEffect(() => {
    const fetchBlog = async () => {
      setIsLoading(true);
      setError(null);

      try {
        if (!params?.slug) {
          setError('Blog post not found');
          return;
        }

        const res = await fetch(`/api/blogs/${params.slug}`);
        let data: ApiResponse;

        try {
          data = await res.json();
        } catch (parseError) {
          setError('Failed to load blog post');
          return;
        }

        if (!data.IsSuccess) {
          const errorMessage =
            data.ErrorMessage?.[0]?.message || 'Failed to load blog post';
          setError(errorMessage);
          return;
        }

        if (!data.Result?.blog) {
          setError('Blog post not found');
          return;
        }

        setBlog(data.Result.blog);
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Failed to load blog post';
        setError(errorMessage);
        console.error('Blog fetch error:', error);
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
            <Skeleton className="h-12 w-3/4 dark:bg-input" />
            <div className="flex items-center justify-between border-b pb-4 dark:border-[#333333]">
              <div className="flex items-center gap-3">
                <Skeleton className="h-10 w-10 rounded-full dark:bg-input" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-32 dark:bg-input" />
                  <Skeleton className="h-3 w-24 dark:bg-input" />
                </div>
              </div>
              <Skeleton className="h-4 w-24 dark:bg-input" />
            </div>
            <Skeleton className="h-[500px] w-full rounded-2xl dark:bg-input" />
            <div className="space-y-4">
              <Skeleton className="h-4 w-full dark:bg-input" />
              <Skeleton className="h-4 w-5/6 dark:bg-input" />
              <Skeleton className="h-4 w-4/5 dark:bg-input" />
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
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
              {error || 'Blog post not found'}
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mb-8">
              The blog post you're looking for might have been removed or is
              temporarily unavailable.
            </p>
            <Link
              href="/blogs"
              className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-semibold"
            >
              Return to Blogs
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
          <header className="mb-8 relative">
            <BlogActions
              slug={blog._id}
              title={blog.title}
              authorId={blog.author._id}
              className="absolute right-0 top-0"
            />
            <div className="flex items-center gap-2 text-xs mb-3">
              <span>{blog.category}</span>
              <span>•</span>
              <span>{blog.readTime} min read</span>
            </div>
            <h1 className="text-4xl font-bold mb-4">{blog.title}</h1>
            <div className="flex items-center justify-between border-b dark:border-[#333333] pb-4">
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
                  <span className="block font-semibold text-sm">
                    {blog.author.name}
                  </span>
                  <span className="block text-xs">{blog.publishDate}</span>
                </div>
              </div>
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

          <div className="prose prose-lg max-w-none dark:prose-invert">
            {/* Replace the plain text display with dangerouslySetInnerHTML */}
            <div dangerouslySetInnerHTML={renderHTML(blog.content)} />
          </div>

          {blog.tags && blog.tags.length > 0 && (
            <div className="mt-8 pt-6 border-t dark:border-[#333333]">
              <div className="flex flex-wrap gap-2">
                {blog.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-blue-500 dark:bg-blue-500 rounded-full text-sm text-white"
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
