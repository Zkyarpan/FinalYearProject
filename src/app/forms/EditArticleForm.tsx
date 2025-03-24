'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import ImageExtension from '@tiptap/extension-image';
import { z } from 'zod';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Bold,
  Italic,
  List,
  Image as ImageIcon,
  Heading1,
  Heading2,
  Quote,
  Code,
  X,
  Loader2,
  Hash,
} from 'lucide-react';
import { cleanContent } from '@/utils/contentCleaner';
import { useUserStore } from '@/store/userStore';

// Helper to get auth token - add this to a separate service file later
const getAuthToken = () => {
  // Try to get from localStorage first (adjust based on your auth implementation)
  if (typeof window !== 'undefined') {
    const token =
      localStorage.getItem('auth_token') || localStorage.getItem('accessToken');
    if (token) return token;

    // Check for token in cookies
    const getCookie = name => {
      const value = `; ${document.cookie}`;
      const parts = value.split(`; ${name}=`);
      if (parts.length === 2) {
        const lastPart = parts.pop();
        return lastPart ? lastPart.split(';').shift() : null;
      }
      return null;
    };

    return getCookie('accessToken');
  }
  return null;
};

const ARTICLE_CATEGORIES = [
  'Anxiety',
  'Depression',
  'Stress',
  'Self-care',
  'Mindfulness',
  'Therapy',
  'General',
];

const articleFormSchema = z.object({
  title: z
    .string()
    .min(1, { message: 'Title is required' })
    .max(100, { message: 'Title must be less than 100 characters' }),
  content: z.string().min(1, { message: 'Content is required' }),
  category: z.string().min(1, { message: 'Category is required' }),
  tags: z.array(z.string()).optional(),
});

interface EditArticleFormProps {
  articleId: string;
}

const EditArticleForm = ({ articleId }: EditArticleFormProps) => {
  const router = useRouter();
  const { _id: userId, isAuthenticated } = useUserStore();
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);
  const [formData, setFormData] = useState<{
    title: string;
    category: string;
    tags: string[];
    imageFile: File | null;
    imagePreview: string | null;
    originalImage: string | null;
  }>({
    title: '',
    category: '',
    tags: [],
    imageFile: null,
    imagePreview: null,
    originalImage: null,
  });

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        paragraph: {
          HTMLAttributes: {
            class: 'my-paragraph-class',
          },
        },
        heading: {
          levels: [1, 2, 3],
        },
      }),
      ImageExtension.configure({
        HTMLAttributes: {
          class: 'rounded-lg max-w-full',
        },
      }),
    ],
    content: '',
    editorProps: {
      attributes: {
        class:
          'prose prose-lg max-w-none focus:outline-none min-h-[300px] dark:prose-invert',
      },
    },
  });

  useEffect(() => {
    const fetchArticle = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/articles/edit/${articleId}`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.ErrorMessage?.[0] || 'Failed to fetch article');
        }

        const article = data.Result.article;

        setFormData({
          title: article.title,
          category: article.category,
          tags: article.tags || [],
          imageFile: null,
          imagePreview: article.articleImage || null,
          originalImage: article.articleImage || null,
        });

        // Set editor content after fetching
        if (editor) {
          editor.commands.setContent(article.content);
        }

        setInitialLoadComplete(true);
        setIsLoading(false);
      } catch (error) {
        console.error('Error fetching article:', error);
        toast.error(
          error instanceof Error ? error.message : 'Failed to fetch article'
        );
        setIsLoading(false);
      }
    };

    if (articleId && editor) {
      fetchArticle();
    }
  }, [articleId, editor]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Check file type
      if (!file.type.match(/^image\/(jpeg|jpg|png|webp)$/i)) {
        toast.error('Please upload a valid image (JPEG, PNG, or WebP)');
        return;
      }

      // Check file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image size should be less than 5MB');
        return;
      }

      setFormData(prev => ({
        ...prev,
        imageFile: file,
      }));

      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({
          ...prev,
          imagePreview: reader.result as string,
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setFormData(prev => ({
      ...prev,
      imageFile: null,
      imagePreview: null,
    }));
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleCategorySelect = (category: string) => {
    setFormData({
      ...formData,
      category,
    });
  };

  const handleTagInput = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && (e.target as HTMLInputElement).value) {
      const newTag = (e.target as HTMLInputElement).value.trim();
      if (!formData.tags.includes(newTag)) {
        setFormData({
          ...formData,
          tags: [...formData.tags, newTag],
        });
      }
      (e.target as HTMLInputElement).value = '';
      e.preventDefault(); // Prevent form submission
    }
  };

  const handleSubmit = async () => {
    if (!isAuthenticated) {
      toast.error('You must be logged in to update this article');
      return;
    }

    setIsSubmitting(true);

    const rawContent = editor?.getHTML() || '';
    const cleanedContent = cleanContent(rawContent);

    const fieldsData = {
      title: formData.title.trim(),
      content: cleanedContent,
      category: formData.category,
      tags: formData.tags,
    };

    const validationResult = articleFormSchema.safeParse(fieldsData);

    if (!validationResult.success) {
      const firstError = validationResult.error.issues[0];
      toast.error(firstError.message);
      setIsSubmitting(false);
      return;
    }

    try {
      const formDataToSend = new FormData();
      formDataToSend.append('fields', JSON.stringify(validationResult.data));

      if (formData.imageFile) {
        formDataToSend.append('articleImage', formData.imageFile);
      }

      // Get auth token for request
      const token = getAuthToken();
      const headers: HeadersInit = {};

      // Add authorization header if token exists
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      // Add user ID as fallback (this is not secure but matches your current setup)
      if (userId && !token) {
        headers['Authorization'] = `Bearer ${userId}`;
      }

      const response = await fetch(`/api/articles/edit/${articleId}`, {
        method: 'PATCH',
        headers,
        body: formDataToSend,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.ErrorMessage?.[0]?.message || 'Failed to update article'
        );
      }

      toast.success('Article updated successfully!');
      router.push('/articles');
    } catch (error) {
      console.error('Error updating article:', error);
      toast.error(
        error instanceof Error ? error.message : 'Failed to update article'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!isAuthenticated || !articleId) {
      toast.error('You must be logged in to delete this article');
      return;
    }

    setIsSubmitting(true);

    try {
      // Get auth token for request
      const token = getAuthToken();
      const headers: HeadersInit = {};

      // Add authorization header if token exists
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      // Add user ID as fallback
      if (userId && !token) {
        headers['Authorization'] = `Bearer ${userId}`;
      }

      const response = await fetch(`/api/articles/delete/${articleId}`, {
        method: 'DELETE',
        headers,
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(
          result.ErrorMessage?.[0]?.message || 'Failed to delete article'
        );
      }

      toast.success('Article deleted successfully!');
      router.push('/articles');
    } catch (error) {
      console.error('Error deleting article:', error);
      toast.error(
        error instanceof Error ? error.message : 'Failed to delete article'
      );
    } finally {
      setIsSubmitting(false);
      setShowDeleteDialog(false);
    }
  };

  const handleCancel = () => {
    // Check if there are unsaved changes
    const titleChanged =
      initialLoadComplete && formData.title !== formData.title;
    const categoryChanged =
      initialLoadComplete && formData.category !== formData.category;
    const tagsChanged =
      initialLoadComplete &&
      JSON.stringify(formData.tags) !== JSON.stringify(formData.tags);
    const imageChanged =
      initialLoadComplete && formData.imagePreview !== formData.originalImage;
    const contentChanged = editor && editor.getHTML() !== editor.getHTML();

    if (
      titleChanged ||
      categoryChanged ||
      tagsChanged ||
      imageChanged ||
      contentChanged
    ) {
      setShowCancelDialog(true);
    } else {
      router.back();
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background py-8 flex justify-center items-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading article...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-8 relative">
      <div className="max-w-[1000px] mx-auto px-4">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold">Edit Article</h1>
            <p className="text-muted-foreground mt-1">
              Update your article for the mental health community
            </p>
          </div>
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={handleCancel}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => setShowDeleteDialog(true)}
              disabled={isSubmitting}
            >
              Delete
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="min-w-[100px]"
            >
              {isSubmitting ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Saving...</span>
                </div>
              ) : (
                'Save Changes'
              )}
            </Button>
          </div>
        </div>

        {/* User status indicator */}
        {!isAuthenticated && (
          <div className="bg-yellow-100 dark:bg-yellow-900 p-3 rounded-md mb-6 text-yellow-800 dark:text-yellow-200">
            <p>
              You must be logged in to edit this article. Please log in first.
            </p>
          </div>
        )}

        <div className="grid gap-8">
          <div className="space-y-6">
            <div className="space-y-4 dark:bg-input bg-card p-6 rounded-lg border shadow-sm">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Your Article Title"
                  value={formData.title}
                  onChange={e =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  className="block w-full rounded-none px-3 py-2 text-1xl bg-transparent placeholder:text-[hsl(var(--muted-foreground))] focus:outline-none border-none border-b-2 border-gray-300 focus:border-blue-500"
                  maxLength={100}
                />
                <span className="absolute bottom-2 right-2 text-xs text-muted-foreground">
                  {formData.title.length}/100
                </span>
              </div>
            </div>

            <div className="bg-card dark:bg-input p-6 rounded-lg border shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Featured Image</h2>
                <label className="flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-lg cursor-pointer hover:bg-primary/20 transition-colors">
                  <ImageIcon className="w-4 h-4" />
                  <span className="text-sm font-medium">
                    {formData.imagePreview ? 'Change Image' : 'Upload Image'}
                  </span>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={handleImageUpload}
                  />
                </label>
              </div>
              {formData.imagePreview ? (
                <div className="relative group">
                  <img
                    src={
                      typeof formData.imagePreview === 'string'
                        ? formData.imagePreview
                        : undefined
                    }
                    alt="Preview"
                    className="w-full h-[400px] object-cover rounded-lg"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center gap-4">
                    <label className="cursor-pointer">
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-black dark:text-white border-white"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        Change Image
                      </Button>
                    </label>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleRemoveImage}
                      className="text-red border-white"
                    >
                      Remove
                    </Button>
                  </div>
                </div>
              ) : (
                <div
                  className="border-2 border-dashed rounded-lg h-[200px] flex flex-col items-center justify-center gap-4 cursor-pointer hover:border-primary/50 transition-colors"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <ImageIcon className="w-8 h-8 text-muted-foreground" />
                  <div className="text-center">
                    <p className="text-muted-foreground font-medium">
                      Drag and drop an image or click to upload
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Recommended: 1200×630px or larger
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-card dark:bg-input p-6 rounded-lg border shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold">Category</h2>
                  <Select
                    onValueChange={handleCategorySelect}
                    value={formData.category || undefined}
                  >
                    <SelectTrigger className="w-[180px] border dark:border-white">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {ARTICLE_CATEGORIES.map(category => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex flex-wrap gap-2 min-h-[40px]">
                  {formData.category && (
                    <Badge variant="secondary" className="px-3 py-1 text-sm">
                      {formData.category}
                      <button
                        onClick={() =>
                          setFormData({
                            ...formData,
                            category: '',
                          })
                        }
                        className="ml-2 hover:text-destructive"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  )}
                </div>
              </div>

              <div className="bg-card dark:bg-input p-6 rounded-lg border shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold">Tags</h2>
                  <div className="flex items-center gap-2">
                    <Hash className="w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Add tag and press Enter"
                      onKeyDown={handleTagInput}
                      className="w-[180px] border dark:border-white"
                    />
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 min-h-[40px]">
                  {formData.tags.map(tag => (
                    <Badge
                      key={tag}
                      variant="outline"
                      className="px-3 py-1 text-sm"
                    >
                      #{tag}
                      <button
                        onClick={() =>
                          setFormData({
                            ...formData,
                            tags: formData.tags.filter(t => t !== tag),
                          })
                        }
                        className="ml-2 hover:text-destructive"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>
            </div>

            <div className="dark:bg-input rounded-lg border shadow-sm overflow-hidden">
              <div className="border-b p-2 flex items-center gap-2 bg-muted/50">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => editor?.chain().focus().toggleBold().run()}
                  className={editor?.isActive('bold') ? 'bg-muted' : ''}
                >
                  <Bold className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => editor?.chain().focus().toggleItalic().run()}
                  className={editor?.isActive('italic') ? 'bg-muted' : ''}
                >
                  <Italic className="w-4 h-4" />
                </Button>
                <Separator orientation="vertical" className="h-6" />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    editor?.chain().focus().toggleHeading({ level: 1 }).run()
                  }
                  className={
                    editor?.isActive('heading', { level: 1 }) ? 'bg-muted' : ''
                  }
                >
                  <Heading1 className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    editor?.chain().focus().toggleHeading({ level: 2 }).run()
                  }
                  className={
                    editor?.isActive('heading', { level: 2 }) ? 'bg-muted' : ''
                  }
                >
                  <Heading2 className="w-4 h-4" />
                </Button>
                <Separator orientation="vertical" className="h-6" />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    editor?.chain().focus().toggleBulletList().run()
                  }
                  className={editor?.isActive('bulletList') ? 'bg-muted' : ''}
                >
                  <List className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    editor?.chain().focus().toggleCodeBlock().run()
                  }
                  className={editor?.isActive('codeBlock') ? 'bg-muted' : ''}
                >
                  <Code className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    editor?.chain().focus().toggleBlockquote().run()
                  }
                  className={editor?.isActive('blockquote') ? 'bg-muted' : ''}
                >
                  <Quote className="w-4 h-4" />
                </Button>
                <Separator orientation="vertical" className="h-6" />
              </div>

              <div className="p-6">
                <EditorContent editor={editor} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Cancel Dialog */}
      <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Discard Changes?</AlertDialogTitle>
            <AlertDialogDescription>
              You have unsaved changes. Are you sure you want to leave? This
              action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => router.back()}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Discard Changes
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Article?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this article? This action cannot
              be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete Article
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default EditArticleForm;
