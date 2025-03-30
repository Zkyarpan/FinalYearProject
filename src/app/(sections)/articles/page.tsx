'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import Skeleton from '@/components/common/Skeleton';
import { generateSlug } from '@/helpers/generateSlug';
import { useUserStore } from '@/store/userStore';
import { useRouter } from 'next/navigation';
import { MessageCircle, Edit, User, Calendar, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import LoginModal from '@/components/LoginModel';

interface Author {
  _id: string;
  name: string;
  avatar: string;
  isOwner?: boolean;
}

interface Article {
  _id: string;
  title: string;
  content: string;
  articleImage: string;
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
    articles: Article[];
    pagination: {
      total: number;
      page: number;
      limit: number;
      pages: number;
    };
  };
}

interface UserProfile {
  _id: string;
  userId: string;
  firstName: string;
  lastName: string;
  image: string;
  address?: string;
  phone: string;
  age: number;
  gender?: string;
  preferredCommunication: 'video' | 'audio' | 'chat' | 'in-person';
  struggles: string[];
  briefBio: string;
  profileCompleted: boolean;
  createdAt: string;
  updatedAt: string;
  metricsOverview: {
    blogCount: number;
    commentCount: number;
    storiesCount: number;
    articleCount?: number;
    lastActive: string;
  };
}

const truncateText = (text: string, maxLength: number) => {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
};

// Format date string nicely
const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

const ArticleOwnershipTag = ({
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

  return <span className={`${baseClasses} ${style}`}>Your Article</span>;
};

const ArticlesPage = () => {
  const [articles, setArticles] = useState<Article[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showLoginModal, setShowLoginModal] = useState(false);

  const userId = useUserStore(state => state._id);
  const isAuthenticated = useUserStore(state => state.isAuthenticated);
  const getAuthHeaders = useUserStore(state => state.getAuthHeaders);
  const router = useRouter();

  const defaultImage = '/default-image.jpg';
  const defaultAvatar = '/default-avatar.jpg';
  const defaultAlt = 'Article Image';

  const fetchArticles = async (page = 1) => {
    setIsLoading(true);
    try {
      let url = `/api/articles/index?page=${page}&limit=10`;

      // Get auth headers for ownership check
      const headers = getAuthHeaders ? getAuthHeaders() : {};

      const res = await fetch(url, { headers });
      if (!res.ok) {
        throw new Error('Failed to fetch articles');
      }
      const data: ApiResponse = await res.json();

      if (data.Result && data.Result.articles.length > 0) {
        const articlesWithOwnership = data.Result.articles.map(article => ({
          ...article,
          isOwner: isAuthenticated && userId === article.author?._id,
        }));
        setArticles(articlesWithOwnership);
        setTotalPages(data.Result.pagination.pages);
        setCurrentPage(data.Result.pagination.page);
      } else {
        setArticles([]);
      }
    } catch (error) {
      setError('Failed to load articles');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchArticles();
  }, [userId, isAuthenticated]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    fetchArticles(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleAuthorClick = (author: Author, e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    router.push(`/user/${author._id}`);
  };

  const renderPagination = () => {
    if (totalPages <= 1) return null;

    return (
      <div className="flex justify-center mt-8">
        <div className="flex space-x-2">
          {currentPage > 1 && (
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              className="px-4 py-2 rounded-lg border bg-white dark:bg-[#171717] hover:bg-gray-50 dark:hover:bg-[#222222]"
            >
              Previous
            </button>
          )}
          {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
            <button
              key={page}
              onClick={() => handlePageChange(page)}
              className={`px-4 py-2 rounded-lg border ${
                currentPage === page
                  ? 'bg-blue-600 text-white'
                  : 'bg-white dark:bg-[#171717] hover:bg-gray-50 dark:hover:bg-[#222222]'
              }`}
            >
              {page}
            </button>
          ))}
          {currentPage < totalPages && (
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              className="px-4 py-2 rounded-lg border bg-white dark:bg-[#171717] hover:bg-gray-50 dark:hover:bg-[#222222]"
            >
              Next
            </button>
          )}
        </div>
      </div>
    );
  };

  if (isLoading) return <Skeleton />;
  if (error) {
    return (
      <main className="min-h-screen">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
              {error}
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Please try again later.
            </p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen">
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Mental Health Articles
          </h1>
          {isAuthenticated && (
            <button
              onClick={() => {
                router.push('/articles/create');
              }}
              className="mb-2 group flex items-center justify-center font-semibold border transition-all ease-in duration-75 whitespace-nowrap text-center select-none disabled:shadow-none disabled:opacity-50 disabled:cursor-not-allowed gap-x-1 active:shadow-none text-sm leading-5 rounded-xl py-1.5 h-8 px-4 bg-blue-600 text-white border-blue-500 hover:bg-blue-700 disabled:bg-blue-400 disabled:border-blue-400 shadow-sm"
            >
              Write an Article
              <span className="-mr-1">
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M5 12H19.5833M19.5833 12L12.5833 5M19.5833 12L12.5833 19"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    vectorEffect="non-scaling-stroke"
                  ></path>
                </svg>
              </span>
            </button>
          )}
        </div>

        <div className="space-y-6">
          {articles.length > 0 ? (
            <>
              <div className="mb-8">
                <Link
                  href={`/articles/${generateSlug(articles[0].title)}`}
                  className="group block overflow-hidden rounded-2xl border bg-white dark:bg-[#171717] transition-all hover:shadow-lg dark:border-[#333333]"
                >
                  <article className="h-full relative">
                    <div className="relative h-[400px] w-full">
                      <Image
                        src={articles[0].articleImage || defaultImage}
                        alt={
                          `Featured image for ${articles[0].title}` ||
                          defaultAlt
                        }
                        fill
                        className="object-cover transition-opacity group-hover:opacity-75"
                        sizes="(max-width: 1024px) 100vw, 1024px"
                        priority
                      />
                    </div>
                    <div className="p-6">
                      <div className="flex items-center gap-2 text-xs mb-3">
                        <span>{articles[0].category}</span>
                        <span>•</span>
                        <span>{articles[0].readTime} min read</span>
                        <ArticleOwnershipTag
                          isOwner={articles[0].isOwner ?? false}
                        />
                      </div>

                      <h2 className="text-xl font-bold mb-3 text-gray-900 dark:text-gray-100">
                        {articles[0].title}
                      </h2>
                      <p className="text-sm mb-4 line-clamp-3 text-gray-700 dark:text-gray-300">
                        {truncateText(articles[0].content, 200)}
                      </p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div
                            className="relative h-8 w-8 cursor-pointer"
                            onClick={e => {
                              e.preventDefault();
                              e.stopPropagation();
                              handleAuthorClick(articles[0].author);
                            }}
                          >
                            <Image
                              src={articles[0].author.avatar || defaultAvatar}
                              alt={`Profile picture of ${articles[0].author.name}`}
                              fill
                              className="rounded-full object-cover hover:opacity-80 transition-opacity"
                              sizes="32px"
                            />
                          </div>
                          <span
                            className="text-sm font-semibold text-gray-900 dark:text-gray-100 hover:underline cursor-pointer"
                            onClick={e => {
                              e.preventDefault();
                              e.stopPropagation();
                              handleAuthorClick(articles[0].author);
                            }}
                          >
                            {articles[0].author.name}
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {articles[0].publishDate}
                          </span>
                          {articles[0].isOwner && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="p-1 h-auto"
                              onClick={e => {
                                e.stopPropagation();
                                e.preventDefault();
                                router.push(
                                  `/articles/edit/${articles[0]._id}`
                                );
                              }}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </article>
                </Link>
              </div>

              {articles.length > 1 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {articles.slice(1).map(article => (
                    <Link
                      key={article._id}
                      href={`/articles/${generateSlug(article.title)}`}
                      className="group block overflow-hidden rounded-2xl border bg-white dark:bg-[#171717] transition-all hover:shadow-lg dark:border-[#333333]"
                    >
                      <article className="h-full relative">
                        <div className="relative h-[200px] w-full">
                          <Image
                            src={article.articleImage || defaultImage}
                            alt={
                              `Featured image for ${article.title}` ||
                              defaultAlt
                            }
                            fill
                            className="object-cover transition-opacity group-hover:opacity-75"
                            sizes="(max-width: 768px) 100vw, 50vw"
                          />
                        </div>
                        <div className="p-4">
                          <div className="flex items-center justify-between mb-2 text-xs">
                            <div className="flex items-center gap-2">
                              <span>{article.category}</span>
                              <span>•</span>
                              <span>{article.readTime} min read</span>
                            </div>
                            <ArticleOwnershipTag
                              isOwner={article.isOwner ?? false}
                              size="small"
                            />
                          </div>

                          <h2 className="font-semibold text-lg mb-2 text-gray-900 dark:text-gray-100">
                            {article.title}
                          </h2>
                          <p className="text-sm line-clamp-2 mb-4 text-gray-700 dark:text-gray-300">
                            {truncateText(article.content, 120)}
                          </p>

                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div
                                className="relative h-6 w-6 cursor-pointer"
                                onClick={e => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  handleAuthorClick(article.author);
                                }}
                              >
                                <Image
                                  src={article.author.avatar || defaultAvatar}
                                  alt={`Profile picture of ${article.author.name}`}
                                  fill
                                  className="rounded-full object-cover hover:opacity-80 transition-opacity"
                                  sizes="24px"
                                />
                              </div>
                              <span
                                className="text-xs font-semibold text-gray-900 dark:text-gray-100 hover:underline cursor-pointer"
                                onClick={e => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  handleAuthorClick(article.author);
                                }}
                              >
                                {article.author.name}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-gray-500 dark:text-gray-400">
                                {article.publishDate}
                              </span>
                              {article.isOwner && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="p-1 h-auto"
                                  onClick={e => {
                                    e.stopPropagation();
                                    e.preventDefault();
                                    router.push(
                                      `/articles/edit/${article._id}`
                                    );
                                  }}
                                >
                                  <Edit className="w-4 h-4" />
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      </article>
                    </Link>
                  ))}
                </div>
              )}

              {renderPagination()}
            </>
          ) : (
            <div className="text-center py-12">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                No articles found
              </h2>
              <p className="mt-2 text-gray-600 dark:text-gray-400">
                Be the first to share your mental health insights
              </p>
              {isAuthenticated && (
                <button
                  onClick={() => router.push('/articles/create')}
                  className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Create an Article
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </main>
  );
};

export default ArticlesPage;
