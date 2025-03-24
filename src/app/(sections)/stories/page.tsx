'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import Skeleton from '@/components/common/Skeleton';
import { generateSlug } from '@/helpers/generateSlug';
import { useUserStore } from '@/store/userStore';
import { useRouter } from 'next/navigation';

interface Author {
  _id: string;
  name: string;
  avatar: string;
  isOwner?: boolean;
}

interface Story {
  _id: string;
  title: string;
  content: string;
  storyImage: string;
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
    stories: Story[];
  };
}

const truncateText = (text: string, maxLength: number) => {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
};

const StoryOwnershipTag = ({
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

  return <span className={`${baseClasses} ${style}`}>Your Story</span>;
};

const StoriesPage = () => {
  const [stories, setStories] = useState<Story[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const userId = useUserStore(state => state._id);
  const isAuthenticated = useUserStore(state => state.isAuthenticated);
  const router = useRouter();

  const defaultImage = '/default-image.jpg';
  const defaultAvatar = '/default-avatar.jpg';
  const defaultAlt = 'Alternative Image';

  useEffect(() => {
    const fetchStories = async () => {
      try {
        const res = await fetch('/api/stories/index');
        if (!res.ok) {
          throw new Error('Failed to fetch stories');
        }
        const data: ApiResponse = await res.json();

        if (data.Result && data.Result.stories.length > 0) {
          const storiesWithOwnership = data.Result.stories.map(story => ({
            ...story,
            isOwner: isAuthenticated && userId === story.author?._id,
          }));
          setStories(storiesWithOwnership);
        } else {
          setStories([]);
        }
      } catch (error) {
        setError('Failed to load stories');
      } finally {
        setIsLoading(false);
      }
    };
    fetchStories();
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
        <div className="flex justify-between items-center mb-8">
          {isAuthenticated && (
            <button
              onClick={() => {
                router.push('/stories/create');
              }}
              className="mb-2 group flex items-center justify-center font-semibold border transition-all ease-in duration-75 whitespace-nowrap text-center select-none disabled:shadow-none disabled:opacity-50 disabled:cursor-not-allowed gap-x-1 active:shadow-none text-sm leading-5 rounded-xl py-1.5 h-8 px-4 bg-blue-600 text-white border-blue-500 hover:bg-blue-700 disabled:bg-blue-400 disabled:border-blue-400 shadow-sm"
            >
              Share Your Story
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
          {stories.length > 0 ? (
            <>
              <div className="mb-8">
                <Link
                  href={`/stories/${generateSlug(stories[0].title)}`}
                  className="group block overflow-hidden rounded-2xl border bg-white dark:bg-[#171717] transition-all hover:shadow-lg dark:border-[#333333]"
                >
                  <article className="h-full relative">
                    <div className="relative h-[400px] w-full">
                      <Image
                        src={stories[0].storyImage || defaultImage}
                        alt={
                          `Featured image for ${stories[0].title}` || defaultAlt
                        }
                        fill
                        className="object-cover transition-opacity group-hover:opacity-75"
                        sizes="(max-width: 1024px) 100vw, 1024px"
                        priority
                      />
                    </div>
                    <div className="p-6">
                      <div className="flex items-center gap-2 text-xs mb-3">
                        <span>{stories[0].category}</span>
                        <span>•</span>
                        <span>{stories[0].readTime} min read</span>
                        <StoryOwnershipTag
                          isOwner={stories[0].isOwner ?? false}
                        />
                      </div>

                      <h2 className="text-xl font-bold mb-3">
                        {stories[0].title}
                      </h2>
                      <p className="text-sm mb-4 line-clamp-3">
                        {truncateText(stories[0].content, 200)}
                      </p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="relative h-8 w-8">
                            <Image
                              src={stories[0].author.avatar || defaultAvatar}
                              alt={`Profile picture of ${stories[0].author.name}`}
                              fill
                              className="rounded-full object-cover"
                              sizes="32px"
                            />
                          </div>
                          <span className="text-sm font-semibold">
                            {stories[0].author.name}
                          </span>
                        </div>
                        <span className="text-xs">
                          {stories[0].publishDate}
                        </span>
                      </div>
                    </div>
                  </article>
                </Link>
              </div>

              {stories.length > 1 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {stories.slice(1).map(story => (
                    <Link
                      key={story._id}
                      href={`/stories/${generateSlug(story.title)}`}
                      className="group block overflow-hidden rounded-2xl border bg-white dark:bg-[#171717] transition-all hover:shadow-lg"
                    >
                      <article className="h-full relative">
                        <div className="relative h-[200px] w-full">
                          <Image
                            src={story.storyImage || defaultImage}
                            alt={
                              `Featured image for ${story.title}` || defaultAlt
                            }
                            fill
                            className="object-cover transition-opacity group-hover:opacity-75"
                            sizes="(max-width: 768px) 100vw, 50vw"
                          />
                        </div>
                        <div className="p-4">
                          <div className="flex items-center justify-between mb-2 text-xs">
                            <div className="flex items-center gap-2">
                              <span>{story.category}</span>
                              <span>•</span>
                              <span>{story.readTime} min read</span>
                            </div>
                            <StoryOwnershipTag
                              isOwner={story.isOwner ?? false}
                              size="small"
                            />
                          </div>

                          <h2 className="font-semibold text-lg mb-2">
                            {story.title}
                          </h2>
                          <p className="text-sm line-clamp-2 mb-4">
                            {truncateText(story.content, 120)}
                          </p>

                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className="relative h-6 w-6">
                                <Image
                                  src={story.author.avatar || defaultAvatar}
                                  alt={`Profile picture of ${story.author.name}`}
                                  fill
                                  className="rounded-full object-cover"
                                  sizes="24px"
                                />
                              </div>
                              <span className="text-xs font-semibold">
                                {story.author.name}
                              </span>
                            </div>
                            <span className="text-xs">{story.publishDate}</span>
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
              <h2 className="text-xl font-semibold">No stories found</h2>
              <p className="mt-2">
                Be the first to share your mental health journey
              </p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
};

export default StoriesPage;
