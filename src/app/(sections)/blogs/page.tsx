'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';

interface Blog {
  _id: string;
  title: string;
  content: string;
  blogImage: string;
  author: {
    name: string;
    avatar: string;
  };
  publishDate: string;
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
        const data = await res.json();
        setBlogs(data);
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
          <div className="animate-pulse space-y-6">
            <div className="h-[400px] bg-gray-200 rounded-2xl"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[1, 2, 3, 4].map(i => (
                <div
                  key={i}
                  className="h-[300px] bg-gray-200 rounded-2xl"
                ></div>
              ))}
            </div>
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
          {blogs.length > 0 && (
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
                      />
                    </div>

                    <div className="p-6">
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
                          <span className="text-gray-600 text-sm font-semibold uppercase">
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
                          alt={`Featured image for ${blog.title}` || defaultAlt}
                          fill
                          className="object-cover transition-opacity group-hover:opacity-75"
                          sizes="(max-width: 768px) 100vw, 50vw"
                        />
                      </div>

                      <div className="p-4">
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
                            <span className="text-gray-600 text-xs font-semibold uppercase">
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
            </>
          )}
        </div>
      </div>
    </main>
  );
};

export default BlogPage;
