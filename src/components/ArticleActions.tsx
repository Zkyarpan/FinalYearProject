'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUserStore } from '@/store/userStore';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle 
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Pencil, Trash, MoreVertical } from 'lucide-react';
import { toast } from 'sonner';

interface ArticleActionsProps {
  articleId: string;
  title: string;
  authorId: string;
  className?: string;
  variant?: 'dropdown' | 'buttons';
}

const ArticleActions = ({ 
  articleId, 
  title, 
  authorId,
  className = '', 
  variant = 'dropdown' 
}: ArticleActionsProps) => {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const { _id: userId } = useUserStore();
  const router = useRouter();
  const isOwner = userId === authorId;

  const handleEdit = () => {
    router.push(`/articles/edit/${articleId}`);
  };

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      
      console.log(`Attempting to delete article: ${articleId}`);
      
      // Get auth token if you're using token-based auth
      const token = localStorage.getItem('accessToken');
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      const response = await fetch(`/api/articles/delete/${articleId}`, {
        method: 'DELETE',
        headers
      });
      
      console.log(`Delete response status: ${response.status}`);
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.ErrorMessage?.[0] || 'Failed to delete article');
      }
      
      toast.success('Article deleted successfully');
      
      // Wait a moment before redirecting to ensure toast is seen
      setTimeout(() => {
        router.push('/articles');
        router.refresh();
      }, 1000);
    } catch (error) {
      console.error('Error deleting article:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to delete article');
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  if (!isOwner) {
    return null;
  }

  if (variant === 'buttons') {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleEdit}
          className="flex items-center gap-1"
        >
          <Pencil className="w-4 h-4" />
          <span>Edit</span>
        </Button>
        <Button 
          variant="destructive" 
          size="sm" 
          onClick={() => setShowDeleteDialog(true)}
          className="flex items-center gap-1"
        >
          <Trash className="w-4 h-4" />
          <span>Delete</span>
        </Button>
        
        <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Article</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete "{title}"? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
              <AlertDialogAction 
                onClick={handleDelete} 
                disabled={isDeleting}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    );
  }

  return (
    <div className={className}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon">
            <MoreVertical className="h-4 w-4" />
            <span className="sr-only">More options</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={handleEdit}>
            <Pencil className="mr-2 h-4 w-4" />
            <span>Edit</span>
          </DropdownMenuItem>
          <DropdownMenuItem 
            onClick={() => setShowDeleteDialog(true)}
            className="text-destructive focus:text-destructive"
          >
            <Trash className="mr-2 h-4 w-4" />
            <span>Delete</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Article</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{title}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete} 
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ArticleActions;