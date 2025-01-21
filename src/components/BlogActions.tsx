'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Settings2 } from 'lucide-react';
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
  const userId = useUserStore(state => state._id);
  const isAuthenticated = useUserStore(state => state.isAuthenticated);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isOwner, setIsOwner] = useState(false);

  useEffect(() => {
    setIsOwner(isAuthenticated && userId === authorId);
    console.log('BlogActions auth check:', {
      isAuthenticated,
      userId,
      authorId,
      isOwner,
    });
  }, [isAuthenticated, userId, authorId]);

  if (!isAuthenticated || !isOwner) {
    return null;
  }

  const handleEdit = (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent the Link component's navigation
    e.stopPropagation(); // Stop event bubbling
    console.log('Editing blog with ID:', slug);
    router.push(`/blogs/edit/${slug}`);
  };

  const handleDelete = async () => {
    try {
      const response = await fetch(`/api/blogs/${slug}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to delete blog');
      }

      toast.success('Blog deleted successfully');
      router.refresh();
      router.push('/blogs');
    } catch (error) {
      console.error('Error deleting blog:', error);
      toast.error(
        error instanceof Error ? error.message : 'Failed to delete blog'
      );
    }
  };

  return (
    <>
      <div
        className={`absolute right-2 top-2 z-20 bg-white dark:bg-gray-800 rounded-full shadow-sm ${className}`}
        onClick={e => e.stopPropagation()} // Stop event bubbling
      >
        <DropdownMenu>
          <DropdownMenuTrigger className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-all duration-200 focus:outline-none">
            <Settings2 className="h-5 w-5 text-gray-600 dark:text-gray-300" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-40">
            <DropdownMenuItem
              onClick={handleEdit}
              className="flex items-center px-3 py-2 text-sm cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              Edit Blog
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => setShowDeleteDialog(true)}
              className="flex items-center px-3 py-2 text-sm cursor-pointer text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
            >
              Delete Blog
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Blog Post</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{title}&quot;? This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default BlogActions;
