'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Skeleton from '@/components/common/Skeleton';
import { generateSlug } from '@/helpers/generateSlug';
import { useUserStore } from '@/store/userStore';

interface Author {
  _id: string;
  name: string;
  avatar: string;
  isOwner?: boolean;
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
  isOwner?: boolean;
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

// This function will safely render HTML content as HTML
const renderHTML = (htmlContent: string) => {
  return { __html: htmlContent };
};

// Function to strip HTML tags for truncated previews
const stripHtmlTags = (html: string) => {
  return html.replace(/<\/?[^>]+(>|$)/g, '');
};

const BlogOwnershipTag = ({
  isOwner,
  size = 'default',
}: {
  isOwner: boolean;
  size?: 'small' | 'default';
}) => {
  if (!isOwner) return null;

  // Base classes for all sizes
  const baseClasses =
    'inline-flex items-center font-medium shadow rounded-full';

  // Dynamic classes based on size prop
  const styles = {
    small: 'px-2 py-0.5 text-xs bg-blue-600 text-white',
    default: 'px-3 py-1 text-sm bg-blue-600 text-white',
  };

  // Choose style based on size
  const style = styles[size];

  return <span className={`${baseClasses} ${style}`}>Your Blog</span>;
};

const AuthorProfile = ({ author }: { author: Author }) => {
  const [showPopover, setShowPopover] = useState(false);
  const [popoverTimeout, setPopoverTimeout] = useState<NodeJS.Timeout | null>(
    null
  );
  const router = useRouter();
  const defaultAvatar = '/default-avatar.jpg';

  const handleMouseEnter = () => {
    if (popoverTimeout) clearTimeout(popoverTimeout);
    setShowPopover(true);
  };

  const handleMouseLeave = () => {
    const timeout = setTimeout(() => {
      setShowPopover(false);
    }, 300);
    setPopoverTimeout(timeout);
  };

  const handleAuthorClick = (e: React.MouseEvent) => {
    e.preventDefault();
    router.push(`/user/${author._id}`);
  };

  useEffect(() => {
    return () => {
      if (popoverTimeout) clearTimeout(popoverTimeout);
    };
  }, [popoverTimeout]);

  return (
    <div className="flex items-center gap-2 relative">
      <div
        className="relative h-6 w-6 cursor-pointer"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <Image
          src={author.avatar || defaultAvatar}
          alt={`Profile picture of ${author.name}`}
          fill
          className="rounded-full object-cover"
          sizes="24px"
        />
      </div>
      <span
        onClick={handleAuthorClick}
        className="text-xs font-semibold hover:underline cursor-pointer transition-all"
      >
        {author.name}
      </span>
    </div>
  );
};

const FeaturedAuthorProfile = ({ author }: { author: Author }) => {
  const [showPopover, setShowPopover] = useState(false);
  const [popoverTimeout, setPopoverTimeout] = useState<NodeJS.Timeout | null>(
    null
  );
  const router = useRouter();
  const defaultAvatar = '/default-avatar.jpg';

  const handleMouseEnter = () => {
    if (popoverTimeout) clearTimeout(popoverTimeout);
    setShowPopover(true);
  };

  const handleMouseLeave = () => {
    const timeout = setTimeout(() => {
      setShowPopover(false);
    }, 300);
    setPopoverTimeout(timeout);
  };

  const handleAuthorClick = (e: React.MouseEvent) => {
    e.preventDefault();
    router.push(`/user/${author._id}`);
  };

  useEffect(() => {
    return () => {
      if (popoverTimeout) clearTimeout(popoverTimeout);
    };
  }, [popoverTimeout]);

  return (
    <div className="flex items-center gap-3 relative">
      <div
        className="relative h-8 w-8 cursor-pointer"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <Image
          src={author.avatar || defaultAvatar}
          alt={`Profile picture of ${author.name}`}
          fill
          className="rounded-full object-cover"
          sizes="32px"
        />
      </div>
      <span
        onClick={handleAuthorClick}
        className="text-sm font-semibold hover:underline cursor-pointer transition-all"
      >
        {author.name}
      </span>
    </div>
  );
};

const BlogPage = () => {
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const userId = useUserStore(state => state._id);
  const isAuthenticated = useUserStore(state => state.isAuthenticated);

  const defaultImage = '/default-image.jpg';
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
          setBlogs(blogsWithOwnership);
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
  }, [userId, isAuthenticated]);

  if (isLoading) return <Skeleton />;
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
                  className="group block overflow-hidden rounded-2xl border bg-white dark:bg-[#171717] transition-all hover:shadow-lg dark:border-[#333333]"
                >
                  <article className="h-full relative">
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
                        <BlogOwnershipTag isOwner={blogs[0].isOwner ?? false} />
                      </div>

                      <h2 className="text-xl font-bold mb-3">
                        {blogs[0].title}
                      </h2>
                      {/* Use a stripped version of HTML content for the preview */}
                      <p className="text-sm mb-4 line-clamp-3">
                        {truncateText(stripHtmlTags(blogs[0].content), 200)}
                      </p>
                      <div className="flex items-center justify-between">
                        <FeaturedAuthorProfile author={blogs[0].author} />
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
                      className="group block overflow-hidden rounded-2xl border bg-white dark:bg-[#171717] transition-all hover:shadow-lg"
                    >
                      <article className="h-full relative">
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
                          <div className="flex items-center justify-between mb-2 text-xs">
                            <div className="flex items-center gap-2">
                              <span>{blog.category}</span>
                              <span>•</span>
                              <span>{blog.readTime} min read</span>
                            </div>
                            <BlogOwnershipTag
                              isOwner={blog.isOwner ?? false}
                              size="small"
                            />
                          </div>

                          <h2 className="font-semibold text-lg mb-2">
                            {blog.title}
                          </h2>
                          {/* Use a stripped version of HTML content for the preview */}
                          <p className="text-sm line-clamp-2 mb-4">
                            {truncateText(stripHtmlTags(blog.content), 120)}
                          </p>

                          <div className="flex items-center justify-between">
                            <AuthorProfile author={blog.author} />
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
