'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
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
import { Button } from '@/components/ui/button';
import { Settings2, Loader2 } from 'lucide-react';
import { useUserStore } from '@/store/userStore';

interface StoryActionsProps {
  slug: string;
  title: string;
  authorId: string;
  className?: string;
}

const StoryActions = ({
  slug,
  title,
  authorId,
  className = '',
}: StoryActionsProps) => {
  const router = useRouter();
  const { getAuthHeaders } = useUserStore();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      // Get auth headers from the store
      const headers = getAuthHeaders();

      const response = await fetch(`/api/stories/${slug}`, {
        method: 'DELETE',
        headers,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(
          error.ErrorMessage?.[0]?.message || 'Failed to delete story'
        );
      }

      toast.success('Story deleted successfully');
      setShowDeleteDialog(false);
      router.push('/stories');
      router.refresh();
    } catch (error) {
      console.error('Delete error:', error);
      toast.error(
        error instanceof Error
          ? error.message
          : 'Failed to delete story. Check the API route configuration.'
      );
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className={`absolute right-2 top-2 z-20 ${className}`}>
      <DropdownMenu>
        <DropdownMenuTrigger className="">
          <Settings2 className="h-5 w-5 text-gray-700 dark:text-gray-300" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-40 ">
          <DropdownMenuItem
            onClick={() => router.push(`/stories/edit/${slug}`)}
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
        <AlertDialogContent className="border-0 shadow-lg max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">
              Delete Story
            </AlertDialogTitle>
            <AlertDialogDescription className="text-slate-300">
              Are you sure you want to delete "{title}"? This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              disabled={isDeleting}
              className="text-white hover:bg-slate-600 border-0"
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-red-600 text-white hover:bg-red-700 border-0"
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

export default StoryActions;
