'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Skeleton } from '@/components/ui/skeleton';
import { useUserStore } from '@/store/userStore';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';
import { ArrowRightIcon, Settings2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
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

interface Author {
  _id: string;
  name: string;
  avatar: string;
}

interface Article {
  _id: string;
  title: string;
  content: string;
  articleImage: string;
  category: string;
  tags: string[];
  readTime: number;
  author: Author;
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
    article: Article;
  } | null;
}

// Inline ArticleActions component
const ArticleActions = ({ article }) => {
  const router = useRouter();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Get auth headers helper from user store
  const getAuthHeaders = useUserStore(state => state.getAuthHeaders);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      // Get the auth headers from our store
      const headers = getAuthHeaders ? getAuthHeaders() : {};

      const response = await fetch(`/api/articles/delete/${article._id}`, {
        method: 'DELETE',
        headers,
      });

      if (!response.ok) {
        throw new Error('Failed to delete article');
      }

      toast.success('Article deleted successfully');
      router.push('/articles');
    } catch (error) {
      toast.error('Failed to delete article');
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
            onClick={() => router.push(`/articles/edit/${article._id}`)}
            className="text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            Edit Article
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => setShowDeleteDialog(true)}
            className="text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
          >
            Delete Article
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className="">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-gray-900 dark:text-gray-100">
              Delete Article
            </AlertDialogTitle>
            <AlertDialogDescription className="text-gray-500 dark:text-gray-400">
              Are you sure you want to delete "{article.title}"? This action
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

const ArticleDetail = () => {
  const params = useParams();
  const router = useRouter();

  // Get store helpers for auth
  const {
    _id: userId,
    isAuthenticated,
    getAuthHeaders,
    isResourceOwner,
  } = useUserStore();

  const [article, setArticle] = useState<Article | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isOwner, setIsOwner] = useState(false);

  const defaultImage = '/default-image.jpg';
  const defaultAvatar = '/default-avatar.jpg';

  useEffect(() => {
    const fetchArticle = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // Extract slug safely
        const slug = Array.isArray(params?.slug)
          ? params.slug[0]
          : params?.slug;

        if (!slug) {
          setError('Article not found');
          return;
        }

        // Get auth headers from our store helper if available
        const headers = getAuthHeaders ? getAuthHeaders() : {};
        console.log(`Fetching article with slug: ${slug}`);

        const res = await fetch(`/api/articles/${slug}`, { headers });

        if (!res.ok) {
          console.error(`API response error: ${res.status} ${res.statusText}`);
          throw new Error(
            `Failed to load article: ${res.status} ${res.statusText}`
          );
        }

        let data: ApiResponse;
        try {
          data = await res.json();
        } catch (parseError) {
          console.error('JSON parse error:', parseError);
          setError('Failed to load article - invalid response format');
          return;
        }

        if (!data.IsSuccess) {
          const errorMessage =
            data.ErrorMessage?.[0]?.message || 'Failed to load article';
          console.error('API error:', errorMessage);
          setError(errorMessage);
          return;
        }

        if (!data.Result?.article) {
          console.error('No article data in response');
          setError('Article not found');
          return;
        }

        // Get the article
        const articleData = data.Result.article;

        // Use our store helper to check ownership if available
        const userOwnsArticle = isResourceOwner
          ? isResourceOwner(articleData.author._id)
          : userId === articleData.author._id;

        // If API says not owner but our helper says we own it, override it
        if (!articleData.isOwner && userOwnsArticle) {
          console.log(
            'API says not owner but helper says we own it, overriding'
          );
          articleData.isOwner = true;
        }

        console.log('Article loaded successfully');
        setArticle(articleData);
        setIsOwner(articleData.isOwner || userOwnsArticle);
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Failed to load article';
        console.error('Article fetch error:', error);
        setError(errorMessage);
      } finally {
        setIsLoading(false);
      }
    };

    fetchArticle();
  }, [params?.slug, userId, getAuthHeaders, isResourceOwner]);

  const handleBackNavigation = () => {
    router.push('/articles');
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);

      // Check if date is valid
      if (isNaN(date.getTime())) {
        console.warn('Invalid date:', dateString);
        return dateString;
      }

      // Format as "Month Day, Year"
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch (error) {
      console.error('Date formatting error:', error);
      return dateString;
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

  if (error || !article) {
    return (
      <main className="min-h-screen">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
              {error || 'Article not found'}
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mb-8">
              The article you're looking for might have been removed or is
              temporarily unavailable.
            </p>
            <Link
              href="/articles"
              className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-semibold"
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="mr-1"
              >
                <path
                  d="M19 12H5M5 12L12 19M5 12L12 5"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              Back to Articles
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen">
      {/* Mobile-only back button - similar to StoryPost */}
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
            {/* Show dropdown actions if user owns the article */}
            {isOwner && <ArticleActions article={article} />}

            <div className="flex items-center gap-2 text-xs mb-3">
              {article.category && (
                <span className="px-2 py-1 bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 rounded-full">
                  {article.category}
                </span>
              )}
              <span>•</span>
              <span>{article.readTime} min read</span>
              {isOwner && (
                <span className="px-2 py-1 bg-blue-600 text-white rounded-full ml-2">
                  Your Article
                </span>
              )}
            </div>

            <h1 className="text-4xl font-bold mb-4">{article.title}</h1>

            <div className="flex items-center justify-between border-b dark:border-[#333333] pb-4">
              <div className="flex items-center gap-3">
                <div className="relative h-10 w-10">
                  <Image
                    src={article.author.avatar || defaultAvatar}
                    alt={`Profile picture of ${article.author.name}`}
                    fill
                    className="rounded-full object-cover"
                    sizes="40px"
                  />
                </div>
                <div>
                  <span className="block font-semibold text-sm">
                    {article.author.name || 'Anonymous Author'}
                  </span>
                  <span className="block text-xs">
                    {formatDate(article.publishDate)}
                  </span>
                </div>
              </div>
            </div>
          </header>

          {article.articleImage && (
            <div className="relative h-[500px] w-full mb-8">
              <Image
                src={article.articleImage || defaultImage}
                alt={`Featured image for ${article.title}`}
                fill
                className="rounded-2xl object-cover"
                sizes="(max-width: 1024px) 100vw, 1024px"
                priority
              />
            </div>
          )}

          <div
            className="prose prose-lg max-w-none dark:prose-invert mb-8"
            dangerouslySetInnerHTML={{ __html: article.content }}
          />

          {article.tags && article.tags.length > 0 && (
            <div className="mt-8 pt-6 border-t dark:border-[#333333]">
              <div className="flex flex-wrap gap-2">
                {article.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-blue-500 text-white rounded-full text-sm"
                  >
                    #{tag}
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

export default ArticleDetail;
