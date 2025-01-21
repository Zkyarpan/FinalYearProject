'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import Skeleton from '@/components/common/Skeleton';
import generateSlug from '@/helpers/generateSlug';
import BlogActions from '@/components/BlogActions';
import { useUserStore } from '@/store/userStore';

interface Author {
  _id: string;
  name: string;
  avatar: string;
}

interface Blog {
  _id: string;
  title: string;
  content: string;
  blogImage: string;
  category: string;
  tags: string[];
  readTime: number | string;
  author: Author;
  publishDate: string;
}

interface ApiResponse {
  StatusCode: number;
  IsSuccess: boolean;
  ErrorMessage: string[];
  Result: {
    blogs: Blog[];
  };
}

const truncateText = (text: string, maxLength: number) => {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
};

const BlogPage = () => {
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const userId = useUserStore(state => state._id);
  const isAuthenticated = useUserStore(state => state.isAuthenticated);

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

        if (data.Result && data.Result.blogs.length > 0) {
          const blogsWithOwnership = data.Result.blogs.map(blog => ({
            ...blog,
            isOwner: isAuthenticated && userId === blog.author?._id,
          }));
          setBlogs(data.Result.blogs);
        } else {
          setBlogs([]);
        }
      } catch (error) {
        setError('Failed to load blogs');
      } finally {
        setIsLoading(false);
      }
    };
    fetchBlogs();
  }, []);

  if (isLoading) {
    return <Skeleton />;
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
              <div className="mb-8">
                <Link
                  href={`/blogs/${generateSlug(blogs[0].title)}`}
                  className="group block overflow-hidden rounded-2xl border bg-white dark:bg-[#171717] transition-all hover:shadow-lg"
                >
                  <article className="h-full relative">
                    {' '}
                    <BlogActions
                      slug={blogs[0]._id}
                      title={blogs[0].title}
                      authorId={blogs[0].author._id}
                      className="z-20"
                    />
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
                      <div className="flex items-center gap-2 text-xs mb-3">
                        <span>{blogs[0].category}</span>
                        <span>•</span>
                        <span>{blogs[0].readTime} min read</span>
                      </div>

                      <h2 className="text-xl font-bold mb-3">
                        {blogs[0].title}
                      </h2>
                      <p className="text-sm mb-4 line-clamp-3">
                        {truncateText(blogs[0].content, 200)}
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
                          <span className="text-sm font-semibold">
                            {blogs[0].author.name}
                          </span>
                        </div>
                        <span className="text-xs">{blogs[0].publishDate}</span>
                      </div>
                    </div>
                  </article>
                </Link>
              </div>

              {blogs.length > 1 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {blogs.slice(1).map(blog => (
                    <Link
                      key={blog._id}
                      href={`/blogs/${generateSlug(blog.title)}`}
                      className="group block overflow-hidden rounded-2xl border  bg-white dark:bg-[#171717] transition-all hover:shadow-lg"
                    >
                      <article className="h-full relative">
                        {' '}
                        <BlogActions
                          slug={blog._id}
                          title={blog.title}
                          authorId={blog.author._id}
                        />
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
                          <div className="flex items-center gap-2 text-xs  mb-2">
                            <span>{blog.category}</span>
                            <span>•</span>
                            <span>{blog.readTime} min read</span>
                          </div>

                          <h2 className="font-semibold text-lg mb-2">
                            {blog.title}
                          </h2>
                          <p className="text-sm line-clamp-2 mb-4">
                            {truncateText(blog.content, 120)}
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
                              <span className="text-xs font-semibold">
                                {blog.author.name}
                              </span>
                            </div>
                            <span className="text-xs">{blog.publishDate}</span>
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
              <h2 className="text-xl font-semibold">No blogs found</h2>
              <p className="mt-2">Check back later for new content</p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
};

export default BlogPage;
