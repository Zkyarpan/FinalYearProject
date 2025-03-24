'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Skeleton } from '@/components/ui/skeleton';
import { useUserStore } from '@/store/userStore';
import {
  ArrowRightIcon,
  Clock,
  Bookmark,
  Share2,
  ExternalLink,
  Video,
  Music,
} from 'lucide-react';
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
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface MediaUrl {
  type: 'audio' | 'video';
  url: string;
  title?: string;
}

interface Resource {
  _id: string;
  title: string;
  description: string;
  content: string;
  resourceImage: string;
  category: string;
  tags: string[];
  mediaUrls: MediaUrl[];
  duration: number;
  difficultyLevel: 'beginner' | 'intermediate' | 'advanced';
  steps: string[];
  author: {
    name: string;
    avatar: string;
    _id: string;
  };
  publishDate: string;
  viewCount: number;
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
    resource: Resource;
  } | null;
}

// ResourceActions component
const ResourceActions = ({ resource }) => {
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

      const response = await fetch(`/api/resources/delete/${resource._id}`, {
        method: 'DELETE',
        headers,
      });

      if (!response.ok) {
        throw new Error('Failed to delete resource');
      }

      toast.success('Resource deleted successfully');
      router.push('/resources');
    } catch (error) {
      toast.error('Failed to delete resource');
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
            onClick={() => router.push(`/resources/edit/${resource._id}`)}
            className="text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            Edit Resource
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => setShowDeleteDialog(true)}
            className="text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
          >
            Delete Resource
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className="">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-gray-900 dark:text-gray-100">
              Delete Resource
            </AlertDialogTitle>
            <AlertDialogDescription className="text-gray-500 dark:text-gray-400">
              Are you sure you want to delete "{resource.title}"? This action
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

// Enhanced Media renderer component for audio/video content
// Enhanced Media renderer component for audio/video content
const MediaRenderer = ({ mediaUrls }: { mediaUrls: MediaUrl[] }) => {
  const [activeMediaIndex, setActiveMediaIndex] = useState(0);

  if (!mediaUrls || mediaUrls.length === 0) return null;

  const activeMedia = mediaUrls[activeMediaIndex];

  // Enhanced function to check if URL is a YouTube URL and extract the video ID
  const getYoutubeId = (url: string): string | null => {
    // Support multiple YouTube URL formats
    const regExp =
      /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i;
    const match = url.match(regExp);
    return match ? match[1] : null;
  };

  // Function to check if URL is a Vimeo URL and extract the video ID
  const getVimeoId = (url: string): string | null => {
    const regExp =
      /(?:vimeo\.com\/(?:video\/)?|player\.vimeo\.com\/video\/)([0-9]+)/i;
    const match = url.match(regExp);
    return match ? match[1] : null;
  };

  // Function to check if URL is a Spotify URL
  const getSpotifyEmbedUrl = (url: string): string | null => {
    if (!url.includes('spotify.com')) return null;

    // Convert Spotify URLs to embed format
    // Handle track/album/playlist/episode formats
    let spotifyEmbed: string | null = null;

    if (url.includes('/track/')) {
      const trackId = url.split('/track/')[1]?.split('?')[0];
      if (trackId)
        spotifyEmbed = `https://open.spotify.com/embed/track/${trackId}`;
    } else if (url.includes('/album/')) {
      const albumId = url.split('/album/')[1]?.split('?')[0];
      if (albumId)
        spotifyEmbed = `https://open.spotify.com/embed/album/${albumId}`;
    } else if (url.includes('/playlist/')) {
      const playlistId = url.split('/playlist/')[1]?.split('?')[0];
      if (playlistId)
        spotifyEmbed = `https://open.spotify.com/embed/playlist/${playlistId}`;
    } else if (url.includes('/episode/')) {
      const episodeId = url.split('/episode/')[1]?.split('?')[0];
      if (episodeId)
        spotifyEmbed = `https://open.spotify.com/embed/episode/${episodeId}`;
    }

    return spotifyEmbed;
  };

  // Function to check if URL is a SoundCloud URL
  const isSoundCloudUrl = (url: string): boolean => {
    return url.toLowerCase().includes('soundcloud.com');
  };

  // Function to render the appropriate media player
  const renderMedia = (media: MediaUrl) => {
    // For video content
    if (media.type === 'video') {
      // Check if it's a YouTube URL
      const youtubeId = getYoutubeId(media.url);
      if (youtubeId) {
        return (
          <div className="aspect-video">
            <iframe
              src={`https://www.youtube.com/embed/${youtubeId}`}
              title={media.title || `YouTube Video ${activeMediaIndex + 1}`}
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="w-full h-full rounded-md"
            ></iframe>
          </div>
        );
      }

      // Check if it's a Vimeo URL
      const vimeoId = getVimeoId(media.url);
      if (vimeoId) {
        return (
          <div className="aspect-video">
            <iframe
              src={`https://player.vimeo.com/video/${vimeoId}?h=1080&color=0088cc&title=0&byline=0&portrait=0`}
              title={media.title || `Vimeo Video ${activeMediaIndex + 1}`}
              frameBorder="0"
              allow="autoplay; fullscreen; picture-in-picture"
              allowFullScreen
              className="w-full h-full rounded-md"
            ></iframe>
          </div>
        );
      }

      // For regular video URL
      return (
        <div className="aspect-video">
          <video
            src={media.url}
            controls
            className="w-full h-full rounded-md"
            title={media.title || `Video ${activeMediaIndex + 1}`}
          >
            Your browser does not support the video tag.
          </video>
        </div>
      );
    }

    // For audio content
    else if (media.type === 'audio') {
      // Check if it's a Spotify URL
      const spotifyEmbed = getSpotifyEmbedUrl(media.url);
      if (spotifyEmbed) {
        return (
          <div className="aspect-video">
            <iframe
              src={spotifyEmbed}
              title={media.title || `Spotify Audio ${activeMediaIndex + 1}`}
              frameBorder="0"
              allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
              className="w-full h-full rounded-md"
            ></iframe>
          </div>
        );
      }

      // Check if it's a SoundCloud URL
      if (isSoundCloudUrl(media.url)) {
        return (
          <div className="p-4 bg-gray-800/30 rounded-md">
            <div className="aspect-[4/3]">
              <iframe
                src={`https://w.soundcloud.com/player/?url=${encodeURIComponent(
                  media.url
                )}&color=%23ff5500&auto_play=false&hide_related=false&show_comments=true&show_user=true&show_reposts=false&show_teaser=true&visual=true`}
                title={
                  media.title || `SoundCloud Audio ${activeMediaIndex + 1}`
                }
                frameBorder="0"
                allow="autoplay"
                className="w-full h-full rounded-md"
              ></iframe>
            </div>
          </div>
        );
      }

      // For regular audio URL
      return (
        <div className="p-4 bg-gray-800/30 rounded-md">
          <audio
            src={media.url}
            controls
            className="w-full"
            title={media.title || `Audio ${activeMediaIndex + 1}`}
          >
            Your browser does not support the audio tag.
          </audio>
        </div>
      );
    }

    // If type is unknown
    return (
      <div className="p-4 bg-gray-800/30 rounded-md text-center">
        <p>Unsupported media type</p>
        <a
          href={media.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-400 hover:underline flex items-center justify-center mt-2"
        >
          Open URL <ExternalLink className="ml-1 h-3 w-3" />
        </a>
      </div>
    );
  };

  return (
    <div className="mt-8 space-y-6">
      <h2 className="text-xl font-semibold border-b pb-2 dark:border-[#333333]">
        Media Resources
      </h2>

      <div className="space-y-4">
        {/* Navigation for multiple media items */}
        {mediaUrls.length > 1 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {mediaUrls.map((media, index) => (
              <Button
                key={index}
                variant={index === activeMediaIndex ? 'default' : 'outline'}
                size="sm"
                onClick={() => setActiveMediaIndex(index)}
                className="flex items-center gap-1"
              >
                {media.type === 'video' ? (
                  <>
                    <Video className="h-3 w-3 mr-1" /> Video {index + 1}
                  </>
                ) : (
                  <>
                    <Music className="h-3 w-3 mr-1" /> Audio {index + 1}
                  </>
                )}
              </Button>
            ))}
          </div>
        )}

        {/* Media display card */}
        <Card className="bg-gray-900/30 border border-gray-800">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">
              {activeMedia.title ||
                (activeMedia.type === 'video'
                  ? `Video ${activeMediaIndex + 1}`
                  : `Audio ${activeMediaIndex + 1}`)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {renderMedia(activeMedia)}

            <div className="mt-3 text-xs text-blue-400 flex items-center justify-end">
              <a
                href={activeMedia.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center hover:underline"
              >
                Open in new tab <ExternalLink className="ml-1 h-3 w-3" />
              </a>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

// Steps renderer component
const StepsRenderer = ({ steps }: { steps: string[] }) => {
  if (!steps || steps.length === 0 || (steps.length === 1 && !steps[0]))
    return null;

  return (
    <div className="mt-8 space-y-4">
      <h2 className="text-xl font-semibold border-b pb-2 dark:border-[#333333]">
        Steps to Follow
      </h2>
      <ol className="list-decimal pl-5 space-y-4">
        {steps.map((step, index) => (
          <li key={index} className="pl-2">
            <div className="p-4 bg-gray-800/20 rounded-md border border-gray-800/50">
              {step}
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
};

const ResourcePost = () => {
  const params = useParams();
  const router = useRouter();

  // Get store helpers for auth
  const {
    _id: userId,
    isAuthenticated,
    getAuthHeaders,
    isResourceOwner,
  } = useUserStore();

  const [resource, setResource] = useState<Resource | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isOwner, setIsOwner] = useState(false);

  const defaultImage = '/default-resource.jpg';
  const defaultAvatar = '/default-avatar.jpg';

  useEffect(() => {
    const fetchResource = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // Extract slug safely
        const slug = Array.isArray(params?.slug)
          ? params.slug[0]
          : params?.slug;

        if (!slug) {
          setError('Resource not found');
          return;
        }

        console.log('Fetching resource with slug:', slug);

        // Get auth headers from our store helper
        const headers = getAuthHeaders();

        const res = await fetch(`/api/resources/${slug}`, { headers });

        if (!res.ok) {
          console.error(
            'Error response from server:',
            res.status,
            res.statusText
          );
          setError(`Failed to load resource: ${res.status} ${res.statusText}`);
          return;
        }

        let data: ApiResponse;

        try {
          data = await res.json();
        } catch (parseError) {
          console.error('Failed to parse API response:', parseError);
          setError('Failed to load resource');
          return;
        }

        if (!data.IsSuccess) {
          const errorMessage =
            data.ErrorMessage?.[0]?.message || 'Failed to load resource';
          console.error('API error:', errorMessage);
          setError(errorMessage);
          return;
        }

        if (!data.Result?.resource) {
          console.error('No resource in response');
          setError('Resource not found');
          return;
        }

        // Get the resource
        const resourceData = data.Result.resource;
        console.log('Resource found:', resourceData);

        // Log media URLs specifically to debug
        console.log('Media URLs:', resourceData.mediaUrls);

        // Use our store helper to check ownership
        const userOwnsResource = isResourceOwner(resourceData.author._id);

        // If API says not owner but our helper says we own it, override it
        if (!resourceData.isOwner && userOwnsResource) {
          console.log(
            'API says not owner but helper says we own it, overriding'
          );
          resourceData.isOwner = true;
        }

        // Set resource state
        setResource(resourceData);
        setIsOwner(resourceData.isOwner || userOwnsResource);
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Failed to load resource';
        setError(errorMessage);
        console.error('Resource fetch error:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (params?.slug) {
      fetchResource();
    }
  }, [params, getAuthHeaders, isResourceOwner, userId]);

  const handleBackNavigation = () => {
    router.push('/resources');
  };

  const getDifficultyColor = (level: string) => {
    switch (level) {
      case 'beginner':
        return 'bg-green-500 dark:bg-green-600';
      case 'intermediate':
        return 'bg-blue-500 dark:bg-blue-600';
      case 'advanced':
        return 'bg-purple-500 dark:bg-purple-600';
      default:
        return 'bg-gray-500 dark:bg-gray-600';
    }
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
            <Skeleton className="h-[400px] w-full rounded-2xl dark:bg-input" />
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

  if (error || !resource) {
    return (
      <main className="min-h-screen">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
              {error || 'Resource not found'}
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mb-8">
              The resource you're looking for might have been removed or is
              temporarily unavailable.
            </p>
            <Link
              href="/resources"
              className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-semibold"
            >
              Back to Resources
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
            {/* Show actions if user owns the resource */}
            {isOwner && <ResourceActions resource={resource} />}

            <div className="flex flex-wrap items-center gap-2 text-xs mb-3">
              <span className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded-full">
                {resource.category}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {resource.duration} min
              </span>
              <span>•</span>
              <span
                className={`px-2 py-1 rounded-full text-white capitalize ${getDifficultyColor(
                  resource.difficultyLevel
                )}`}
              >
                {resource.difficultyLevel}
              </span>
              <span>•</span>
              <span>{resource.viewCount} views</span>
            </div>

            <h1 className="text-4xl font-bold mb-4">{resource.title}</h1>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              {resource.description}
            </p>

            <div className="flex items-center justify-between border-b dark:border-[#333333] pb-4">
              <div className="flex items-center gap-3">
                <div className="relative h-10 w-10">
                  <Image
                    src={resource.author.avatar || defaultAvatar}
                    alt={`Profile picture of ${resource.author.name}`}
                    fill
                    className="rounded-full object-cover"
                    sizes="40px"
                  />
                </div>
                <div>
                  <span className="block font-semibold text-sm">
                    {resource.author.name}
                  </span>
                  <span className="block text-xs">{resource.publishDate}</span>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="text-gray-700 dark:text-gray-300"
                >
                  <Bookmark className="h-4 w-4 mr-1" /> Save
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-gray-700 dark:text-gray-300"
                >
                  <Share2 className="h-4 w-4 mr-1" /> Share
                </Button>
              </div>
            </div>
          </header>

          {resource.resourceImage && (
            <div className="relative h-[400px] w-full mb-8">
              <Image
                src={resource.resourceImage || defaultImage}
                alt={`Featured image for ${resource.title}`}
                fill
                className="rounded-2xl object-cover"
                sizes="(max-width: 1024px) 100vw, 1024px"
                priority
              />
            </div>
          )}

          <div className="prose prose-lg max-w-none dark:prose-invert">
            <div dangerouslySetInnerHTML={{ __html: resource.content }}></div>
          </div>

          {/* Steps section */}
          <StepsRenderer steps={resource.steps} />

          {/* Media section */}
          {resource.mediaUrls && resource.mediaUrls.length > 0 && (
            <MediaRenderer mediaUrls={resource.mediaUrls} />
          )}

          {/* Tags section */}
          {resource.tags && resource.tags.length > 0 && (
            <div className="mt-8 pt-6 border-t dark:border-[#333333]">
              <div className="flex flex-wrap gap-2">
                {resource.tags.map((tag, index) => (
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

export default ResourcePost;
