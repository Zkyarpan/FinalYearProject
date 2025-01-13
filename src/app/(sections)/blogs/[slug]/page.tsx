'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

const BlogPost = () => {
  const params = useParams();
  const router = useRouter();
  const [blog, setBlog] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const defaultImage = '/default-image.jpg';
  const defaultAvatar = '/default-avatar.jpg';

  useEffect(() => {
    const fetchBlog = async () => {
      try {
        if (!params?.slug) {
          setError('Blog post not found');
          return;
        }

        const res = await fetch(`/api/blogs/${params.slug}`);
        if (!res.ok) {
          throw new Error(`Failed to fetch blog: ${res.status}`);
        }

        const data = await res.json();
        if (!data.blog) {
          throw new Error('Blog not found');
        }
        setBlog(data.blog);
      } catch (error) {
        console.error('Failed to fetch blog:', error);
        setError('Failed to load blog post');
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
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-3/4"></div>
            <div className="h-96 bg-gray-200 rounded"></div>
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 rounded w-full"></div>
              <div className="h-4 bg-gray-200 rounded w-5/6"></div>
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
              href="/blog"
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
                href="/blog"
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
        </article>
      </div>
    </main>
  );
};

export default BlogPost;
