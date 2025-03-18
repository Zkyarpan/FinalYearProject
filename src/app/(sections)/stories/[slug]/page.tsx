'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Skeleton } from '@/components/ui/skeleton';
import { useUserStore } from '@/store/userStore';
import { ArrowRightIcon } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Settings2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface Story {
  _id: string;
  title: string;
  content: string;
  storyImage: string;
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
    story: Story;
  } | null;
}

// Inline StoryActions component - can be moved to a separate file later
const StoryActions = ({ story }) => {
  const router = useRouter();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Get auth headers helper from user store
  const getAuthHeaders = useUserStore(state => state.getAuthHeaders);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      // Get the auth headers from our store
      const headers = getAuthHeaders();

      const response = await fetch(`/api/stories/delete/${story._id}`, {
        method: 'DELETE',
        headers,
      });

      if (!response.ok) {
        throw new Error('Failed to delete story');
      }

      toast.success('Story deleted successfully');
      router.push('/stories');
    } catch (error) {
      toast.error('Failed to delete story');
      console.error(error);
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  return (
    <div className="absolute right-2 top-2 z-20">
      <DropdownMenu>
        <DropdownMenuTrigger className="">
          <Settings2 className="h-5 w-5 text-gray-700 dark:text-gray-300" />
        </DropdownMenuTrigger>

        <DropdownMenuContent
          align="end"
          className="w-40 border dark:border-[#333333]"
        >
          <DropdownMenuItem
            onClick={() => router.push(`/stories/edit/${story._id}`)}
            className="text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            Edit Story
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => setShowDeleteDialog(true)}
            className="text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
          >
            Delete Story
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className="">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-gray-900 dark:text-gray-100">
              Delete Story
            </AlertDialogTitle>
            <AlertDialogDescription className="text-gray-500 dark:text-gray-400">
              Are you sure you want to delete "{story.title}"? This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              disabled={isDeleting}
              className="bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 hover:bg-gray-200 dark:hover:bg-gray-600"
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-red-600 text-white hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-600"
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

const StoryPost = () => {
  const params = useParams();
  const router = useRouter();

  // Get store helpers for auth
  const {
    _id: userId,
    isAuthenticated,
    getAuthHeaders,
    isResourceOwner,
  } = useUserStore();

  const [story, setStory] = useState<Story | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isOwner, setIsOwner] = useState(false);

  const defaultImage = '/default-image.jpg';
  const defaultAvatar = '/default-avatar.jpg';

  useEffect(() => {
    const fetchStory = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // Extract slug safely
        const slug = Array.isArray(params?.slug)
          ? params.slug[0]
          : params?.slug;

        if (!slug) {
          setError('Story not found');
          return;
        }

        // Get auth headers from our store helper
        const headers = getAuthHeaders();
        console.log('Fetching story with headers:', headers);

        const res = await fetch(`/api/stories/${slug}`, { headers });
        let data: ApiResponse;

        try {
          data = await res.json();
        } catch (parseError) {
          setError('Failed to load story');
          return;
        }

        if (!data.IsSuccess) {
          const errorMessage =
            data.ErrorMessage?.[0]?.message || 'Failed to load story';
          setError(errorMessage);
          return;
        }

        if (!data.Result?.story) {
          setError('Story not found');
          return;
        }

        // Get the story
        const storyData = data.Result.story;

        // Use our store helper to check ownership
        const userOwnsStory = isResourceOwner(storyData.author._id);

        // If API says not owner but our helper says we own it, override it
        if (!storyData.isOwner && userOwnsStory) {
          console.log(
            'API says not owner but helper says we own it, overriding'
          );
          storyData.isOwner = true;
        }

        // Set story state
        setStory(storyData);
        setIsOwner(storyData.isOwner || userOwnsStory);

        // Debug - log the actual ownership status for verification
        console.log('Story ownership:', {
          storyId: storyData._id,
          authorId: storyData.author._id,
          userId,
          apiSaysOwner: storyData.isOwner,
          userOwnsStory,
          finalOwnerStatus: storyData.isOwner || userOwnsStory,
        });
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Failed to load story';
        setError(errorMessage);
        console.error('Story fetch error:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (params?.slug) {
      fetchStory();
    }
  }, [params, getAuthHeaders, isResourceOwner, userId]);

  const handleBackNavigation = () => {
    router.push('/stories');
  };

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

  if (error || !story) {
    return (
      <main className="min-h-screen">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
              {error || 'Story not found'}
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mb-8">
              The story you're looking for might have been removed or is
              temporarily unavailable.
            </p>
            <Link
              href="/stories"
              className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-semibold"
            >
              Back to Stories
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen">
      {/* Mobile-only back button */}
      <div className="flex items-center mb-4 lg:hidden">
        <button
          type="button"
          onClick={handleBackNavigation}
          className="mr-2 justify-center shrink-0 flex items-center font-semibold border transition-all ease-in duration-75 whitespace-nowrap text-center select-none disabled:shadow-none disabled:opacity-50 disabled:cursor-not-allowed gap-x-1 active:shadow-none text-sm leading-5 rounded-xl py-1.5 h-8 w-8 text-gray-900 bg-gray-100 border-gray-200 dark:bg-input dark:border-[hsl(var(--border))] hover:dark:bg-[#505050] dark:disabled:bg-gray-800 dark:disabled:hover:bg-gray-800 shadow-sm hover:shadow-md"
        >
          <ArrowRightIcon className="h-4 w-4 rotate-180 dark:text-white" />
        </button>
      </div>

      <div className="container mx-auto px-4 py-8">
        <article className="max-w-4xl mx-auto">
          <header className="mb-8 relative">
            {/* Show actions if user owns the story */}
            {isOwner && <StoryActions story={story} />}

            <div className="flex items-center gap-2 text-xs mb-3">
              <span>{story.category}</span>
              <span>•</span>
              <span>{story.readTime} min read</span>
            </div>

            <h1 className="text-4xl font-bold mb-4">{story.title}</h1>
            <div className="flex items-center justify-between border-b dark:border-[#333333] pb-4">
              <div className="flex items-center gap-3">
                <div className="relative h-10 w-10">
                  <Image
                    src={story.author.avatar || defaultAvatar}
                    alt={`Profile picture of ${story.author.name}`}
                    fill
                    className="rounded-full object-cover"
                    sizes="40px"
                  />
                </div>
                <div>
                  <span className="block font-semibold text-sm">
                    {story.author.name}
                  </span>
                  <span className="block text-xs">{story.publishDate}</span>
                </div>
              </div>
            </div>
          </header>

          <div className="relative h-[500px] w-full mb-8">
            <Image
              src={story.storyImage || defaultImage}
              alt={`Featured image for ${story.title}`}
              fill
              className="rounded-2xl object-cover"
              sizes="(max-width: 1024px) 100vw, 1024px"
              priority
            />
          </div>

          <div className="prose prose-lg max-w-none dark:prose-invert">
            <p className="leading-relaxed whitespace-pre-wrap">
              {story.content}
            </p>
          </div>

          {story.tags && story.tags.length > 0 && (
            <div className="mt-8 pt-6 border-t dark:border-[#333333]">
              <div className="flex flex-wrap gap-2">
                {story.tags.map((tag, index) => (
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

export default StoryPost;
