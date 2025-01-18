'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';
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
  blogs: Blog[];
}

const BlogPage = () => {
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const defaultImage = '/default-image.jpg';
  const defaultAvatar = '/default-avatar.jpg';
  const defaultAlt = 'Alternative Image';

  useEffect(() => {
    const fetchBlogs = async () => {
      try {
        const res = await fetch('/api/blogs/index');
        if (!res.ok) {
          throw new Error('Failed to fetch blogs');
        }
        const data: ApiResponse = await res.json();

        if (data.blogs && data.blogs.length > 0) {
          setBlogs(data.blogs);
        } else {
          setBlogs([]);
        }
      } catch (error) {
        console.error('Failed to fetch blogs:', error);
        setError('Failed to load blogs');
      } finally {
        setIsLoading(false);
      }
    };
    fetchBlogs();
  }, []);

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/ /g, '-')
      .replace(/[^\w-]+/g, '');
  };
  if (isLoading) {
    return (
      <main className="min-h-screen">
        <div className="container mx-auto px-4 py-8">
          {/* Featured Post Skeleton */}
          <div className="mb-8">
            <Skeleton className="h-[400px] w-full rounded-2xl" />
            <div className="mt-4 space-y-4">
              <Skeleton className="h-8 w-3/4" />
              <Skeleton className="h-20 w-full" />
              <div className="flex justify-between">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-8 w-8 rounded-full" />
                  <Skeleton className="h-4 w-24" />
                </div>
                <Skeleton className="h-4 w-20" />
              </div>
            </div>
          </div>

          {/* Grid Skeletons */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="space-y-4">
                <Skeleton className="h-[200px] w-full rounded-2xl" />
                <div className="space-y-2">
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-16 w-full" />
                  <div className="flex justify-between">
                    <div className="flex items-center gap-2">
                      <Skeleton className="h-6 w-6 rounded-full" />
                      <Skeleton className="h-4 w-20" />
                    </div>
                    <Skeleton className="h-4 w-16" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">{error}</h1>
            <p className="text-gray-600">Please try again later.</p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen">
      <div className="container mx-auto px-4 py-8">
        <div className="space-y-6">
          {blogs.length > 0 ? (
            <>
              {/* Featured Blog Post */}
              <div className="mb-8">
                <Link
                  href={`/blogs/${generateSlug(blogs[0].title)}`}
                  className="group block overflow-hidden rounded-2xl border border-gray-200 bg-white transition-all hover:shadow-lg"
                >
                  <article className="h-full">
                    <div className="relative h-[400px] w-full">
                      <Image
                        src={blogs[0].blogImage || defaultImage}
                        alt={
                          `Featured image for ${blogs[0].title}` || defaultAlt
                        }
                        fill
                        className="object-cover transition-opacity group-hover:opacity-75"
                        sizes="(max-width: 1024px) 100vw, 1024px"
                        priority
                      />
                    </div>

                    <div className="p-6">
                      <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
                        <span>{blogs[0].category}</span>
                        <span>•</span>
                        <span>{blogs[0].readTime} min read</span>
                      </div>

                      <h2 className="text-2xl font-bold text-gray-900 mb-3">
                        {blogs[0].title}
                      </h2>
                      <p className="text-gray-600 text-lg mb-4">
                        {blogs[0].content}
                      </p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="relative h-8 w-8">
                            <Image
                              src={blogs[0].author.avatar || defaultAvatar}
                              alt={`Profile picture of ${blogs[0].author.name}`}
                              fill
                              className="rounded-full object-cover"
                              sizes="32px"
                            />
                          </div>
                          <span className="text-gray-600 text-sm font-semibold">
                            {blogs[0].author.name}
                          </span>
                        </div>
                        <span className="text-gray-500 text-sm">
                          {blogs[0].publishDate}
                        </span>
                      </div>
                    </div>
                  </article>
                </Link>
              </div>

              {/* Grid of Remaining Blog Posts */}
              {blogs.length > 1 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {blogs.slice(1).map(blog => (
                    <Link
                      key={blog._id}
                      href={`/blogs/${generateSlug(blog.title)}`}
                      className="group block overflow-hidden rounded-2xl border border-gray-200 bg-white transition-all hover:shadow-lg"
                    >
                      <article className="h-full">
                        <div className="relative h-[200px] w-full">
                          <Image
                            src={blog.blogImage || defaultImage}
                            alt={
                              `Featured image for ${blog.title}` || defaultAlt
                            }
                            fill
                            className="object-cover transition-opacity group-hover:opacity-75"
                            sizes="(max-width: 768px) 100vw, 50vw"
                          />
                        </div>

                        <div className="p-4">
                          <div className="flex items-center gap-2 text-xs text-gray-600 mb-2">
                            <span>{blog.category}</span>
                            <span>•</span>
                            <span>{blog.readTime} min read</span>
                          </div>

                          <h2 className="text-gray-900 font-semibold text-lg mb-2">
                            {blog.title}
                          </h2>
                          <p className="text-gray-500 text-sm line-clamp-2 mb-4">
                            {blog.content}
                          </p>

                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className="relative h-6 w-6">
                                <Image
                                  src={blog.author.avatar || defaultAvatar}
                                  alt={`Profile picture of ${blog.author.name}`}
                                  fill
                                  className="rounded-full object-cover"
                                  sizes="24px"
                                />
                              </div>
                              <span className="text-gray-600 text-xs font-semibold">
                                {blog.author.name}
                              </span>
                            </div>
                            <span className="text-gray-500 text-xs">
                              {blog.publishDate}
                            </span>
                          </div>
                        </div>
                      </article>
                    </Link>
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-12">
              <h2 className="text-xl font-semibold text-gray-900">
                No blogs found
              </h2>
              <p className="text-gray-600 mt-2">
                Check back later for new content
              </p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
};

export default BlogPage;
