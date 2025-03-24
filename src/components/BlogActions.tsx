'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Settings2 } from 'lucide-react';
import { useUserStore } from '@/store/userStore';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
import { toast } from 'sonner';
import { fetchWithAuth, isResourceOwner } from '@/services/authService';

interface BlogActionsProps {
  slug: string;
  title: string;
  authorId: string;
  className?: string;
}

const BlogActions = ({
  slug,
  title,
  authorId,
  className = '',
}: BlogActionsProps) => {
  const router = useRouter();
  const { _id: userId, isAuthenticated } = useUserStore();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isOwner, setIsOwner] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    // Check ownership whenever relevant props change
    setIsOwner(isResourceOwner(authorId));

    // Debug information
    console.log('BlogActions - Ownership check:', {
      authorId,
      userId,
      isAuthenticated,
      isOwner: isResourceOwner(authorId),
    });
  }, [authorId, userId, isAuthenticated]);

  // Don't render the component if user isn't the owner
  if (!isAuthenticated || !isOwner) return null;

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      // Use the auth service to ensure proper authorization headers
      const response = await fetchWithAuth(`/api/blogs/${slug}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.ErrorMessage?.[0] || 'Failed to delete blog');
      }

      toast.success('Blog deleted successfully');
      setShowDeleteDialog(false);
      router.push('/blogs');
      router.refresh();
    } catch (error) {
      console.error('Delete error:', error);
      toast.error(
        error instanceof Error ? error.message : 'Failed to delete blog'
      );
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className={`absolute right-2 top-2 z-20 ${className}`}>
      <DropdownMenu>
        <DropdownMenuTrigger className="p-2 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors focus:outline-none">
          <Settings2 className="h-5 w-5 text-gray-700 dark:text-gray-300" />
        </DropdownMenuTrigger>

        <DropdownMenuContent
          align="end"
          className="w-40 bg-white dark:bg-gray-800 border dark:border-gray-700"
        >
          <DropdownMenuItem
            onClick={() => router.push(`/blogs/edit/${slug}`)}
            className="text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            Edit Blog
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => setShowDeleteDialog(true)}
            className="text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
          >
            Delete Blog
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className="bg-white dark:bg-gray-800 border dark:border-gray-700">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-gray-900 dark:text-gray-100">
              Delete Blog Post
            </AlertDialogTitle>
            <AlertDialogDescription className="text-gray-500 dark:text-gray-400">
              Are you sure you want to delete "{title}"? This action cannot be
              undone.
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
              {isDeleting ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Deleting...
                </div>
              ) : (
                'Delete'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default BlogActions;
