'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import Skeleton from '@/components/common/Skeleton';
import { generateSlug } from '@/helpers/generateSlug';
import { useUserStore } from '@/store/userStore';
import { useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { MessageCircle, Edit, Clock, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import LoginModal from '@/components/LoginModel';

interface Author {
  _id: string;
  name: string;
  avatar: string;
}

interface Resource {
  _id: string;
  title: string;
  description: string;
  content: string;
  category: string;
  resourceImage: string;
  mediaUrls: {
    type: 'audio' | 'video';
    url: string;
    title?: string;
  }[];
  duration: number;
  difficultyLevel: 'beginner' | 'intermediate' | 'advanced';
  steps: string[];
  tags: string[];
  author: Author;
  publishDate: string;
  viewCount: number;
  isOwner?: boolean;
}

interface ApiResponse {
  StatusCode: number;
  IsSuccess: boolean;
  ErrorMessage: string[];
  Result: {
    resources: Resource[];
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
    resourceCount?: number;
    lastActive: string;
  };
}

const getDifficultyBadgeColor = (level: string) => {
  switch (level) {
    case 'beginner':
      return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
    case 'intermediate':
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
    case 'advanced':
      return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
  }
};

const formatDuration = (minutes: number): string => {
  if (minutes < 60) {
    return `${minutes} min`;
  }
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return remainingMinutes > 0
    ? `${hours} hr ${remainingMinutes} min`
    : `${hours} hr`;
};

const truncateText = (text: string, maxLength: number) => {
  if (!text) return '';
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

const OwnershipTag = ({
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

  return <span className={`${baseClasses} ${style}`}>Your Resource</span>;
};

const ResourcesPage = () => {
  const [resources, setResources] = useState<Resource[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedDifficulty, setSelectedDifficulty] = useState<string | null>(
    null
  );
  const [showLoginModal, setShowLoginModal] = useState(false);

  const userId = useUserStore(state => state._id);
  const isAuthenticated = useUserStore(state => state.isAuthenticated);
  const getAuthHeaders = useUserStore(state => state.getAuthHeaders);
  const router = useRouter();

  const defaultImage = '/default-image.jpg';
  const defaultAvatar = '/default-avatar.jpg';
  const defaultAlt = 'Resource Image';

  const categories = [
    'All',
    'Breathing',
    'Meditation',
    'Yoga',
    'Exercise',
    'Sleep',
    'Anxiety',
    'Depression',
    'Stress',
    'Mindfulness',
    'Self-care',
    'Other',
  ];

  const difficultyLevels = ['All', 'beginner', 'intermediate', 'advanced'];

  const fetchResources = async (page = 1) => {
    setIsLoading(true);
    try {
      let url = `/api/resources/index?page=${page}&limit=10`;

      if (selectedCategory && selectedCategory !== 'All') {
        url += `&category=${selectedCategory}`;
      }

      if (selectedDifficulty && selectedDifficulty !== 'All') {
        url += `&difficulty=${selectedDifficulty}`;
      }

      // Get auth headers for ownership check
      const headers = getAuthHeaders ? getAuthHeaders() : {};

      const res = await fetch(url, { headers });
      if (!res.ok) {
        throw new Error('Failed to fetch resources');
      }
      const data: ApiResponse = await res.json();

      if (data.Result && data.Result.resources.length > 0) {
        setResources(data.Result.resources);
        setTotalPages(data.Result.pagination.pages);
        setCurrentPage(data.Result.pagination.page);
      } else {
        setResources([]);
      }
    } catch (error) {
      setError('Failed to load resources');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchResources();
  }, [userId, isAuthenticated, selectedCategory, selectedDifficulty]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    fetchResources(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category === 'All' ? null : category);
    setCurrentPage(1);
  };

  const handleDifficultyChange = (difficulty: string) => {
    setSelectedDifficulty(difficulty === 'All' ? null : difficulty);
    setCurrentPage(1);
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
        <div className="px-4 py-8">
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
      <div className="mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4 md:mb-0">
            Mental Health Resources
          </h1>
          {isAuthenticated && (
            <button
              onClick={() => {
                router.push('/resources/create');
              }}
              className="mb-2 group flex items-center justify-center font-semibold border transition-all ease-in duration-75 whitespace-nowrap text-center select-none disabled:shadow-none disabled:opacity-50 disabled:cursor-not-allowed gap-x-1 active:shadow-none text-sm leading-5 rounded-xl py-1.5 h-8 px-4 bg-blue-600 text-white border-blue-500 hover:bg-blue-700 disabled:bg-blue-400 disabled:border-blue-400 shadow-sm"
            >
              Create Resource
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

        {/* Filter Section */}
        <div className="mb-8 flex flex-col md:flex-row gap-4">
          <div className="flex flex-wrap gap-2">
            <span className="font-medium text-gray-700 dark:text-gray-300 self-center">
              Category:
            </span>
            {categories.map(category => (
              <button
                key={category}
                onClick={() => handleCategoryChange(category)}
                className={`px-3 py-1 rounded-full text-sm transition-colors ${
                  (category === 'All' && !selectedCategory) ||
                  selectedCategory === category
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-800 dark:bg-[#333333] dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-[#444444]'
                }`}
              >
                {category}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap gap-2">
            <span className="font-medium text-gray-700 dark:text-gray-300 self-center">
              Difficulty:
            </span>
            {difficultyLevels.map(level => (
              <button
                key={level}
                onClick={() => handleDifficultyChange(level)}
                className={`px-3 py-1 rounded-full text-sm transition-colors ${
                  (level === 'All' && !selectedDifficulty) ||
                  selectedDifficulty === level
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-800 dark:bg-[#333333] dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-[#444444]'
                }`}
              >
                {level.charAt(0).toUpperCase() + level.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          {resources.length > 0 ? (
            <>
              <div className="mb-8">
                <Link
                  href={`/resources/${generateSlug(resources[0].title)}`}
                  className="group block overflow-hidden rounded-2xl border bg-white dark:bg-[#171717] transition-all hover:shadow-lg dark:border-[#333333]"
                >
                  <article className="h-full relative">
                    <div className="relative h-[400px] w-full">
                      <Image
                        src={resources[0].resourceImage || defaultImage}
                        alt={
                          `Featured image for ${resources[0].title}` ||
                          defaultAlt
                        }
                        fill
                        className="object-cover transition-opacity group-hover:opacity-75"
                        sizes="(max-width: 1024px) 100vw, 1024px"
                        priority
                      />
                    </div>
                    <div className="p-6">
                      <div className="flex flex-wrap items-center gap-2 text-xs mb-3">
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 rounded-full">
                          {resources[0].category}
                        </span>
                        <span
                          className={`px-2 py-1 rounded-full ${getDifficultyBadgeColor(
                            resources[0].difficultyLevel
                          )}`}
                        >
                          {resources[0].difficultyLevel
                            .charAt(0)
                            .toUpperCase() +
                            resources[0].difficultyLevel.slice(1)}
                        </span>
                        <span>•</span>
                        <span>{formatDuration(resources[0].duration)}</span>
                        <OwnershipTag isOwner={resources[0].isOwner ?? false} />
                      </div>

                      <h2 className="text-xl font-bold mb-3 text-gray-900 dark:text-gray-100">
                        {resources[0].title}
                      </h2>
                      <p className="text-sm mb-4 line-clamp-3 text-gray-700 dark:text-gray-300">
                        {truncateText(resources[0].description, 200)}
                      </p>

                      {resources[0].tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-4">
                          {resources[0].tags.slice(0, 3).map((tag, index) => (
                            <span
                              key={index}
                              className="px-2 py-0.5 bg-gray-100 dark:bg-[#333333] text-gray-800 dark:text-gray-200 rounded-full text-xs"
                            >
                              #{tag}
                            </span>
                          ))}
                          {resources[0].tags.length > 3 && (
                            <span className="px-2 py-0.5 bg-gray-100 dark:bg-[#333333] text-gray-800 dark:text-gray-200 rounded-full text-xs">
                              +{resources[0].tags.length - 3} more
                            </span>
                          )}
                        </div>
                      )}

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div
                            className="relative h-8 w-8 cursor-pointer"
                            onClick={e => {
                              e.preventDefault();
                              e.stopPropagation();
                              handleAuthorClick(resources[0].author);
                            }}
                          >
                            <Image
                              src={resources[0].author.avatar || defaultAvatar}
                              alt={`Profile picture of ${resources[0].author.name}`}
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
                              handleAuthorClick(resources[0].author);
                            }}
                          >
                            {resources[0].author.name}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                          <span>{resources[0].publishDate}</span>
                          <span>•</span>
                          <span>{resources[0].viewCount} views</span>
                          {resources[0].isOwner && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="p-1 h-auto"
                              onClick={e => {
                                e.stopPropagation();
                                e.preventDefault();
                                router.push(
                                  `/resources/edit/${resources[0]._id}`
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

              {resources.length > 1 && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {resources.slice(1).map(resource => (
                    <Link
                      key={resource._id}
                      href={`/resources/${generateSlug(resource.title)}`}
                      className="group block h-full overflow-hidden rounded-2xl border bg-white dark:bg-[#171717] transition-all hover:shadow-lg dark:border-[#333333]"
                    >
                      <article className="h-full relative">
                        <div className="relative h-[200px] w-full">
                          <Image
                            src={resource.resourceImage || defaultImage}
                            alt={
                              `Featured image for ${resource.title}` ||
                              defaultAlt
                            }
                            fill
                            className="object-cover transition-opacity group-hover:opacity-75"
                            sizes="(max-width: 768px) 100vw, 50vw"
                          />

                          {/* Media type indicator */}
                          {resource.mediaUrls &&
                            resource.mediaUrls.length > 0 && (
                              <div className="absolute top-2 right-2 bg-black bg-opacity-60 rounded-full p-1">
                                {resource.mediaUrls[0].type === 'video' ? (
                                  <svg
                                    width="20"
                                    height="20"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="text-white"
                                  >
                                    <path
                                      d="M8 6.82001V17.18C8 17.97 8.87 18.45 9.54 18.02L17.68 12.84C18.3 12.45 18.3 11.55 17.68 11.15L9.54 5.98001C8.87 5.55001 8 6.03001 8 6.82001Z"
                                      fill="currentColor"
                                    />
                                  </svg>
                                ) : (
                                  <svg
                                    width="20"
                                    height="20"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="text-white"
                                  >
                                    <path
                                      d="M12 3V21M3 12H21"
                                      stroke="currentColor"
                                      strokeWidth="2"
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                    />
                                  </svg>
                                )}
                              </div>
                            )}
                        </div>
                        <div className="p-4">
                          <div className="flex flex-wrap items-center justify-between mb-2 text-xs">
                            <div className="flex flex-wrap items-center gap-1 mb-1">
                              <span className="px-2 py-0.5 bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 rounded-full">
                                {resource.category}
                              </span>
                              <span
                                className={`px-2 py-0.5 rounded-full ${getDifficultyBadgeColor(
                                  resource.difficultyLevel
                                )}`}
                              >
                                {resource.difficultyLevel
                                  .charAt(0)
                                  .toUpperCase() +
                                  resource.difficultyLevel.slice(1)}
                              </span>
                            </div>
                            <OwnershipTag
                              isOwner={resource.isOwner ?? false}
                              size="small"
                            />
                          </div>

                          <h2 className="font-semibold text-lg mb-2 text-gray-900 dark:text-gray-100">
                            {resource.title}
                          </h2>
                          <p className="text-sm line-clamp-2 mb-3 text-gray-700 dark:text-gray-300">
                            {truncateText(resource.description, 100)}
                          </p>

                          {resource.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1 mb-3">
                              {resource.tags.slice(0, 2).map((tag, index) => (
                                <span
                                  key={index}
                                  className="px-2 py-0.5 bg-gray-100 dark:bg-[#333333] text-gray-800 dark:text-gray-200 rounded-full text-xs"
                                >
                                  #{tag}
                                </span>
                              ))}
                              {resource.tags.length > 2 && (
                                <span className="px-2 py-0.5 bg-gray-100 dark:bg-[#333333] text-gray-800 dark:text-gray-200 rounded-full text-xs">
                                  +{resource.tags.length - 2} more
                                </span>
                              )}
                            </div>
                          )}

                          <div className="flex items-center justify-between mt-auto">
                            <div className="flex items-center gap-2">
                              <div
                                className="relative h-6 w-6 cursor-pointer"
                                onClick={e => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  handleAuthorClick(resource.author);
                                }}
                              >
                                <Image
                                  src={resource.author.avatar || defaultAvatar}
                                  alt={`Profile picture of ${resource.author.name}`}
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
                                  handleAuthorClick(resource.author);
                                }}
                              >
                                {resource.author.name}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                              <span>{formatDuration(resource.duration)}</span>
                              <span>•</span>
                              <span>{resource.viewCount} views</span>
                              {resource.isOwner && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="p-1 h-auto"
                                  onClick={e => {
                                    e.stopPropagation();
                                    e.preventDefault();
                                    router.push(
                                      `/resources/edit/${resource._id}`
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
                No resources found
              </h2>
              <p className="mt-2 text-gray-600 dark:text-gray-400">
                {selectedCategory || selectedDifficulty
                  ? 'No resources match your current filters. Try adjusting your selections.'
                  : 'Be the first to share your mental health resources.'}
              </p>
              {isAuthenticated && (
                <button
                  onClick={() => router.push('/resources/create')}
                  className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Create a Resource
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </main>
  );
};

export default ResourcesPage;
