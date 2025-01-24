'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
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
import { useUserStore } from '@/store/userStore';

const BLOG_CATEGORIES = [
  'Mental Health',
  'Anxiety',
  'Depression',
  'Stress Management',
  'Mindfulness',
  'Relationships',
  'Self-Care',
  'Therapy',
  'Wellness',
  'Personal Growth',
];

const blogFormSchema = z.object({
  title: z
    .string()
    .min(1, { message: 'Title is required' })
    .max(100, { message: 'Title must be less than 100 characters' }),
  content: z.string().min(1, { message: 'Content is required' }),
  category: z.string().min(1, { message: 'At least one category is required' }),
  additionalCategories: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
});

const BlogEditPage = ({ slug }: { slug: string }) => {
  const router = useRouter();
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { _id: userId, isAuthenticated } = useUserStore();
  const [immediatelyRender, setImmediatelyRender] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    selectedCategories: [] as string[],
    tags: [] as string[],
    imageFile: null as File | null,
    imagePreview: null as string | null,
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
      Image.configure({
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
    const fetchBlogData = async () => {
      if (!slug || !userId) {
        console.warn('Missing required data:', { slug, userId });
        return;
      }

      try {
        // Log the fetch attempt
        console.log('Fetching blog data:', {
          slug,
          userId,
          isAuthenticated,
        });

        const response = await fetch(`/api/blogs/${slug}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${userId}`,
          },
          cache: 'no-store',
        });

        // Log the response status
        console.log('Response status:', response.status);

        if (!response.ok) {
          const errorData = await response.json();
          console.error('Error response:', errorData);
          throw new Error(
            errorData.ErrorMessage?.[0] || 'Failed to fetch blog data'
          );
        }

        const data = await response.json();
        console.log('Fetched data:', data);

        // Check if data has the expected structure
        if (!data.Result?.blog) {
          throw new Error('Invalid blog data structure');
        }

        const blogData = data.Result.blog;

        // Update form data
        setFormData({
          title: blogData.title || '',
          selectedCategories: [
            blogData.category,
            ...(blogData.additionalCategories || []),
          ].filter(Boolean),
          tags: blogData.tags || [],
          imageFile: null,
          imagePreview: blogData.blogImage || null,
        });

        // Set editor content if available
        if (editor && blogData.content) {
          editor.commands.setContent(blogData.content);
        }

        setImmediatelyRender(true);
        setIsLoading(false);
      } catch (error) {
        console.error('Error details:', error);
        toast.error(
          error instanceof Error ? error.message : 'Failed to load blog data'
        );
        router.push('/blogs');
      }
    };

    // Only fetch if we have both editor and auth
    if (editor && isAuthenticated && userId) {
      fetchBlogData();
    }
  }, [slug, editor, userId, isAuthenticated, router]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData(prev => ({
        ...prev,
        imageFile: file,
        imagePreview: URL.createObjectURL(file),
      }));
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
    if (!formData.selectedCategories.includes(category)) {
      setFormData({
        ...formData,
        selectedCategories: [...formData.selectedCategories, category],
      });
    }
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
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!slug || !userId) {
      toast.error('Missing required data');
      return;
    }

    setIsSubmitting(true);
    try {
      // Log the data we're about to send
      console.log('Preparing update for blog:', {
        slug,
        userId,
        title: formData.title,
      });

      const formDataToSend = new FormData();

      // Create fields object
      const fieldsData = {
        title: formData.title,
        content: editor?.getHTML() || '',
        category: formData.selectedCategories[0] || '',
        tags: formData.tags,
        additionalCategories: formData.selectedCategories.slice(1),
      };

      // Log the complete fields data
      console.log('Fields data:', fieldsData);

      // Convert fields to JSON string and append to FormData
      formDataToSend.append('fields', JSON.stringify(fieldsData));

      if (formData.imageFile) {
        formDataToSend.append('blogImage', formData.imageFile);
      }

      // Make sure we're using the correct URL
      const updateUrl = `/api/blogs/${slug}`;
      console.log('Sending PATCH request to:', updateUrl);

      const response = await fetch(updateUrl, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${userId}`,
        },
        body: formDataToSend,
      });

      console.log('Update response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Update error details:', errorData);
        throw new Error(errorData.ErrorMessage?.[0] || 'Failed to update blog');
      }

      const data = await response.json();
      console.log('Update success:', data);

      toast.success('Blog updated successfully!');
      router.push('/blogs');
      router.refresh();
    } catch (error) {
      console.error('Update error:', error);
      toast.error(
        error instanceof Error ? error.message : 'Failed to update blog'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background py-8 relative">
      {isLoading ? (
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : (
        <div className="max-w-[1000px] mx-auto px-4">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-2xl font-bold">Edit Blog Post</h1>
              <p className="text-muted-foreground mt-1">
                Update your blog post content
              </p>
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setShowCancelDialog(true)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="min-w-[100px]"
              >
                {isSubmitting ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Updating...</span>
                  </div>
                ) : (
                  'Update'
                )}
              </Button>
            </div>
          </div>

          <div className="grid gap-8">
            <div className="space-y-6">
              <div className="space-y-4 bg-card p-6 rounded-lg border shadow-sm">
                <div className="relative">
                  <Input
                    type="text"
                    placeholder="Your Blog Title"
                    value={formData.title}
                    onChange={e =>
                      setFormData({ ...formData, title: e.target.value })
                    }
                    className="text-4xl border-none bg-transparent placeholder:text-muted-foreground/50 focus-visible:ring-0"
                    maxLength={100}
                  />
                  <span className="absolute bottom-2 right-2 text-xs text-muted-foreground">
                    {formData.title.length}/100
                  </span>
                </div>
              </div>

              <div className="bg-card p-6 rounded-lg border shadow-sm space-y-4">
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
                      accept="image/*"
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
                          className="text-white border-white hover:text-white"
                          onClick={() => fileInputRef.current?.click()}
                        >
                          Change Image
                        </Button>
                      </label>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleRemoveImage}
                        className="text-white border-white  hover:border-red-400 hover:text-red-400"
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
                <div className="bg-card p-6 rounded-lg border shadow-sm space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold">Categories</h2>
                    <Select onValueChange={handleCategorySelect}>
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Add category" />
                      </SelectTrigger>
                      <SelectContent>
                        {BLOG_CATEGORIES.map(category => (
                          <SelectItem key={category} value={category}>
                            {category}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex flex-wrap gap-2 min-h-[40px]">
                    {formData.selectedCategories.map(category => (
                      <Badge
                        key={category}
                        variant="secondary"
                        className="px-3 py-1 text-sm"
                      >
                        {category}
                        <button
                          onClick={() =>
                            setFormData({
                              ...formData,
                              selectedCategories:
                                formData.selectedCategories.filter(
                                  c => c !== category
                                ),
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

                <div className="bg-card p-6 rounded-lg border shadow-sm space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold">Tags</h2>
                    <div className="flex items-center gap-2">
                      <Hash className="w-4 h-4 text-muted-foreground" />
                      <Input
                        placeholder="Add tag and press Enter"
                        onKeyDown={handleTagInput}
                        className="w-[180px]"
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

              <div className="bg-card rounded-lg border shadow-sm overflow-hidden">
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
                      editor?.isActive('heading', { level: 1 })
                        ? 'bg-muted'
                        : ''
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
                      editor?.isActive('heading', { level: 2 })
                        ? 'bg-muted'
                        : ''
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
      )}

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
    </div>
  );
};

export default BlogEditPage;
