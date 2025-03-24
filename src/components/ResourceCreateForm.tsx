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
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
  Clock,
  Plus,
  Minus,
  FileVideo,
  Music,
} from 'lucide-react';
import { useUserStore } from '@/store/userStore';
import MediaUrlPreview from './resources/MediaPreviewComponent';

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

const RESOURCE_CATEGORIES = [
  'Breathing',
  'Meditation',
  'Yoga',
  'Exercise',
  'Sleep',
  'Anxiety',
  'Depression',
  'Stress',
  'Mindfulness',
  'Self-care',
  'Other',
];

const DIFFICULTY_LEVELS = [
  { value: 'beginner', label: 'Beginner' },
  { value: 'intermediate', label: 'Intermediate' },
  { value: 'advanced', label: 'Advanced' },
];

const resourceFormSchema = z.object({
  title: z
    .string()
    .min(1, { message: 'Title is required' })
    .max(100, { message: 'Title must be less than 100 characters' }),
  description: z
    .string()
    .min(1, { message: 'Description is required' })
    .max(500, { message: 'Description must be less than 500 characters' }),
  content: z.string().min(1, { message: 'Content is required' }),
  category: z.string().min(1, { message: 'Category is required' }),
  duration: z
    .number()
    .min(1, { message: 'Duration must be at least 1 minute' }),
  difficultyLevel: z
    .string()
    .min(1, { message: 'Difficulty level is required' }),
  tags: z.array(z.string()).optional(),
  steps: z.array(z.string()).optional(),
  mediaUrls: z
    .array(
      z.object({
        type: z.enum(['audio', 'video']),
        url: z.string().url({ message: 'Please enter a valid URL' }),
        title: z.string().optional(),
      })
    )
    .optional(),
});

const ResourceCreateForm = () => {
  const router = useRouter();
  const { _id: userId, isAuthenticated } = useUserStore();
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [immediatelyRender, setImmediatelyRender] = useState(false);

  // Media form state
  const [newMediaUrl, setNewMediaUrl] = useState('');
  const [newMediaTitle, setNewMediaTitle] = useState('');
  const [newMediaType, setNewMediaType] = useState<'audio' | 'video'>('video');

  const [formData, setFormData] = useState<{
    title: string;
    description: string;
    category: string;
    difficultyLevel: string;
    duration: number;
    tags: string[];
    steps: string[];
    mediaUrls: {
      type: 'audio' | 'video';
      url: string;
      title?: string;
    }[];
    resourceImage: File | null;
    imagePreview: string | null;
  }>({
    title: '',
    description: '',
    category: '',
    difficultyLevel: 'beginner',
    duration: 5,
    tags: [],
    steps: [''],
    mediaUrls: [],
    resourceImage: null,
    imagePreview: null,
  });

  // Debug auth state
  useEffect(() => {
    console.log('Auth Debug:', {
      userId,
      isAuthenticated,
      token: getAuthToken(),
      cookies: document.cookie,
    });
  }, [userId, isAuthenticated]);

  useEffect(() => {
    setImmediatelyRender(true);
  }, []);

  const editor = useEditor(
    {
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
    },
    immediatelyRender ? [immediatelyRender] : undefined
  );

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
        resourceImage: file,
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
      resourceImage: null,
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

  const handleDifficultySelect = (difficulty: string) => {
    setFormData({
      ...formData,
      difficultyLevel: difficulty,
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

  // Handle steps
  const addStep = () => {
    setFormData({
      ...formData,
      steps: [...formData.steps, ''],
    });
  };

  const removeStep = (index: number) => {
    const newSteps = [...formData.steps];
    newSteps.splice(index, 1);
    setFormData({
      ...formData,
      steps: newSteps.length > 0 ? newSteps : [''],
    });
  };

  const updateStep = (index: number, value: string) => {
    const newSteps = [...formData.steps];
    newSteps[index] = value;
    setFormData({
      ...formData,
      steps: newSteps,
    });
  };

  // Handle media URLs
  const addMediaUrl = () => {
    if (!newMediaUrl) {
      toast.error('Media URL is required');
      return;
    }

    try {
      // Basic URL validation
      new URL(newMediaUrl);
    } catch (e) {
      toast.error('Please enter a valid URL');
      return;
    }

    // Create the new media object with properly formatted fields
    const newMedia = {
      type: newMediaType,
      url: newMediaUrl,
      // Only include title if it's not empty
      ...(newMediaTitle ? { title: newMediaTitle } : {}),
    };

    console.log('Adding media URL:', newMedia);

    // Update state with the new media URL
    setFormData(prev => ({
      ...prev,
      mediaUrls: [...prev.mediaUrls, newMedia],
    }));

    // Reset input fields
    setNewMediaUrl('');
    setNewMediaTitle('');

    // Show success toast
    toast.success('Media added successfully');
  };

  const removeMediaUrl = (index: number) => {
    const newMediaUrls = [...formData.mediaUrls];
    newMediaUrls.splice(index, 1);
    setFormData({
      ...formData,
      mediaUrls: newMediaUrls,
    });
  };

  const handleSubmit = async () => {
    if (!isAuthenticated) {
      toast.error('You must be logged in to create a resource');
      return;
    }

    setIsSubmitting(true);

    try {
      const content = editor?.getHTML() || '';

      // Clean up steps to remove empty ones
      const nonEmptySteps = formData.steps.filter(
        step => step.trim().length > 0
      );

      // Make sure mediaUrls is properly structured
      const processedMediaUrls = formData.mediaUrls.map(media => ({
        type: media.type,
        url: media.url,
        ...(media.title && media.title.trim()
          ? { title: media.title.trim() }
          : {}),
      }));

      console.log('Processed mediaUrls:', JSON.stringify(processedMediaUrls));

      // Prepare the resource data
      const resourceData = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        content,
        category: formData.category,
        difficultyLevel: formData.difficultyLevel,
        duration: formData.duration,
        tags: formData.tags,
        steps: nonEmptySteps,
        mediaUrls: processedMediaUrls,
      };

      // Validate the data
      const validationResult = resourceFormSchema.safeParse(resourceData);

      if (!validationResult.success) {
        const firstError = validationResult.error.issues[0];
        console.error(
          'Validation error:',
          JSON.stringify(validationResult.error.issues)
        );
        toast.error(firstError.message);
        setIsSubmitting(false);
        return;
      }

      // Get validated data with properly formatted mediaUrls
      const validatedData = {
        ...validationResult.data,
        mediaUrls: processedMediaUrls, // Ensure we use our processed mediaUrls
      };

      console.log(
        'Validated data with mediaUrls:',
        JSON.stringify(validatedData)
      );

      const token = getAuthToken();
      const headers: Record<string, string> = {};

      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      } else if (userId) {
        headers['Authorization'] = `Bearer ${userId}`;
      }

      // If we have an image to upload, use FormData
      if (formData.resourceImage) {
        const formDataToSend = new FormData();
        formDataToSend.append('resourceImage', formData.resourceImage);

        // Serialize ALL our data into the fields parameter
        const fieldsJson = JSON.stringify(validatedData);
        formDataToSend.append('fields', fieldsJson);

        const response = await fetch('/api/resources/create', {
          method: 'POST',
          headers,
          body: formDataToSend,
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(
            result.ErrorMessage?.[0]?.message || 'Failed to create resource'
          );
        }

        toast.success('Resource published successfully!');
        router.push('/resources');
      } else {
        // Direct JSON submission with properly formatted mediaUrls
        const response = await fetch('/api/resources/index', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...headers,
          },
          body: JSON.stringify(validatedData),
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(
            result.ErrorMessage?.[0]?.message || 'Failed to create resource'
          );
        }

        toast.success('Resource published successfully!');
        router.push('/resources');
      }
    } catch (error) {
      console.error('Error creating resource:', error);
      toast.error(
        error instanceof Error ? error.message : 'Failed to create resource'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    const hasContent =
      editor?.getText().length ||
      formData.title ||
      formData.description ||
      formData.resourceImage;

    if (hasContent) {
      setShowCancelDialog(true);
    } else {
      router.back();
    }
  };

  return (
    <div className="min-h-screen">
      <div className="mx-auto px-4">
        <div className="flex justify-between items-center py-8">
          <div>
            <h1 className="text-2xl font-bold ">Create New Resource</h1>
            <p className="text-muted-foreground mt-1">
              Share valuable mental health resources to help others on their
              journey to wellbeing
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
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="min-w-[100px] bg-blue-600 hover:bg-blue-700"
            >
              {isSubmitting ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Publishing...</span>
                </div>
              ) : (
                'Publish'
              )}
            </Button>
          </div>
        </div>

        {/* User status indicator */}
        {!isAuthenticated && (
          <div className="bg-yellow-900/20 p-3 rounded-md mb-6 text-yellow-200 border border-yellow-800">
            <p>
              You must be logged in to publish a resource. Please log in first.
            </p>
          </div>
        )}

        <div className="space-y-8">
          {/* Basic Information */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold ">Basic Information</h2>
            <div className="relative">
              <Input
                type="text"
                placeholder="Resource Title"
                value={formData.title}
                onChange={e =>
                  setFormData({ ...formData, title: e.target.value })
                }
                className="block w-full text-lg bg-transparent focus-visible:ring-blue-500"
                maxLength={100}
              />
              <span className="absolute bottom-2 right-2 text-xs text-muted-foreground">
                {formData.title.length}/100
              </span>
            </div>

            <div className="relative">
              <Textarea
                placeholder="Short description (max 500 characters)"
                value={formData.description}
                onChange={e =>
                  setFormData({ ...formData, description: e.target.value })
                }
                className="block w-full bg-transparent focus-visible:ring-blue-500"
                maxLength={500}
                rows={3}
              />
              <span className="absolute bottom-2 right-2 text-xs text-muted-foreground">
                {formData.description.length}/500
              </span>
            </div>
          </div>

          {/* Featured Image */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold ">Featured Image</h2>
              {!formData.imagePreview && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-2"
                >
                  <ImageIcon className="h-4 w-4" />
                  <span>Upload Image</span>
                </Button>
              )}
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
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-end justify-center p-4">
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                      className="bg-white/80 text-black hover:bg-white"
                    >
                      Change Image
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleRemoveImage}
                      className="bg-red-500/80 text-white hover:bg-red-500 border-transparent"
                    >
                      Remove
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <div
                className="border-2 border-dashed border-gray-600 rounded-lg h-[200px] flex flex-col items-center justify-center gap-4 cursor-pointer hover:border-blue-500 transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                <ImageIcon className="w-8 h-8 text-gray-400" />
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
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={handleImageUpload}
            />
          </div>

          {/* Category, Difficulty and Duration */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-3">
              <h2 className="text-lg font-semibold ">Category</h2>
              <Select
                onValueChange={handleCategorySelect}
                value={formData.category}
              >
                <SelectTrigger className="focus-visible:ring-blue-500">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {RESOURCE_CATEGORIES.map(category => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <div className="flex flex-wrap gap-2 min-h-[40px]">
                {formData.category && (
                  <Badge className="px-3 py-1 text-sm bg-blue-900/50 text-blue-300">
                    {formData.category}
                  </Badge>
                )}
              </div>
            </div>

            <div className="space-y-3">
              <h2 className="text-lg font-semibold ">Difficulty Level</h2>
              <Select
                onValueChange={handleDifficultySelect}
                value={formData.difficultyLevel}
              >
                <SelectTrigger className="focus-visible:ring-blue-500">
                  <SelectValue placeholder="Select difficulty" />
                </SelectTrigger>
                <SelectContent>
                  {DIFFICULTY_LEVELS.map(level => (
                    <SelectItem key={level.value} value={level.value}>
                      {level.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <div className="flex flex-wrap gap-2 min-h-[40px]">
                {formData.difficultyLevel && (
                  <Badge
                    className={`px-3 py-1 text-sm ${
                      formData.difficultyLevel === 'beginner'
                        ? 'bg-green-900/50 text-green-300'
                        : formData.difficultyLevel === 'intermediate'
                        ? 'bg-yellow-900/50 text-yellow-300'
                        : 'bg-red-900/50 text-red-300'
                    }`}
                  >
                    {formData.difficultyLevel.charAt(0).toUpperCase() +
                      formData.difficultyLevel.slice(1)}
                  </Badge>
                )}
              </div>
            </div>

            <div className="space-y-3">
              <h2 className="text-lg font-semibold ">Duration</h2>
              <div className="flex items-center">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() =>
                    setFormData(prev => ({
                      ...prev,
                      duration: Math.max(1, prev.duration - 5),
                    }))
                  }
                  className="rounded-r-none"
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <Input
                  type="number"
                  value={formData.duration}
                  onChange={e =>
                    setFormData({
                      ...formData,
                      duration: Math.max(1, parseInt(e.target.value) || 1),
                    })
                  }
                  min="1"
                  className="min-w-0 rounded-none border-x-0 focus-visible:ring-0 text-center"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() =>
                    setFormData(prev => ({
                      ...prev,
                      duration: prev.duration + 5,
                    }))
                  }
                  className="rounded-l-none"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              <div className="flex items-center justify-center gap-2 text-sm text-gray-400">
                <Clock className="h-4 w-4" />
                <span>
                  {formData.duration < 60
                    ? `${formData.duration} minutes`
                    : `${Math.floor(formData.duration / 60)}h ${
                        formData.duration % 60
                      }m`}
                </span>
              </div>
            </div>
          </div>

          {/* Tags */}
          <div className="space-y-3">
            <h2 className="text-xl font-semibold ">Tags</h2>
            <div className="flex items-center gap-2">
              <Hash className="w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Add tag and press Enter"
                onKeyDown={handleTagInput}
                className="focus-visible:ring-blue-500"
              />
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
              {formData.tags.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  Add tags to help users find your resource
                </p>
              )}
            </div>
          </div>

          {/* Media URLs */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold ">Media (Optional)</h2>
            <p className="text-sm text-muted-foreground">
              Add videos from YouTube, Vimeo, or audio from Spotify, SoundCloud,
              or direct links. Embedded players will be shown to users.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">
                  Type
                </label>
                <Select
                  value={newMediaType}
                  onValueChange={value =>
                    setNewMediaType(value as 'audio' | 'video')
                  }
                >
                  <SelectTrigger className="focus-visible:ring-blue-500">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="video">Video</SelectItem>
                    <SelectItem value="audio">Audio</SelectItem>
                  </SelectContent>
                </Select>

                {newMediaType === 'video' && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    Supports YouTube, Vimeo & direct video links
                  </p>
                )}

                {newMediaType === 'audio' && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    Supports Spotify, SoundCloud & direct audio
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">
                  Title (Optional)
                </label>
                <Input
                  placeholder="Media title"
                  value={newMediaTitle}
                  onChange={e => setNewMediaTitle(e.target.value)}
                  className="focus-visible:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">
                  URL
                </label>
                <div className="flex">
                  <Input
                    placeholder={
                      newMediaType === 'video'
                        ? 'https://youtube.com/watch?v=...'
                        : 'https://open.spotify.com/...'
                    }
                    value={newMediaUrl}
                    onChange={e => setNewMediaUrl(e.target.value)}
                    className="rounded-r-none focus-visible:ring-blue-500"
                  />
                  <Button
                    type="button"
                    onClick={addMediaUrl}
                    className="rounded-l-none bg-blue-600 hover:bg-blue-700"
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>

            {formData.mediaUrls.length > 0 ? (
              <div className="space-y-2 mt-4">
                {formData.mediaUrls.map((media, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg border border-gray-700"
                  >
                    <div className="flex items-center gap-3">
                      {media.type === 'video' ? (
                        <FileVideo className="h-5 w-5 text-blue-400" />
                      ) : (
                        <Music className="h-5 w-5 text-blue-400" />
                      )}
                      <div>
                        <p className="font-medium">
                          {media.title ||
                            (media.type === 'video' ? 'Video' : 'Audio')}
                        </p>
                        <a
                          href={media.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-blue-400 hover:underline"
                        >
                          {media.url}
                        </a>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeMediaUrl(index)}
                      className="text-red-400 hover:text-red-300 hover:bg-red-900/20"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 mt-2 border border-dashed border-gray-700 rounded-md text-center">
                <div className="flex flex-col items-center justify-center space-y-2">
                  {newMediaType === 'video' ? (
                    <FileVideo className="h-8 w-8 text-gray-400" />
                  ) : (
                    <Music className="h-8 w-8 text-gray-400" />
                  )}
                  <p className="text-sm text-muted-foreground">
                    No media added yet. Add videos or audio that complement your
                    resource.
                  </p>
                  <div className="text-xs text-muted-foreground">
                    {newMediaType === 'video' ? (
                      <span>
                        Example: https://www.youtube.com/watch?v=dQw4w9WgXcQ
                      </span>
                    ) : (
                      <span>
                        Example:
                        https://open.spotify.com/track/4cOdK2wGLETKBW3PvgPWqT
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
          {newMediaUrl && (
            <MediaUrlPreview
              url={newMediaUrl}
              type={newMediaType}
              title={newMediaTitle}
            />
          )}

          {/* Steps */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold ">Steps</h2>
              <Button
                type="button"
                onClick={addStep}
                size="sm"
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="w-4 h-4 mr-1" /> Add Step
              </Button>
            </div>

            <div className="space-y-3">
              {formData.steps.map((step, index) => (
                <div key={index} className="flex items-start gap-2">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-900/30 flex items-center justify-center text-blue-300 font-semibold">
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <Textarea
                      value={step}
                      onChange={e => updateStep(index, e.target.value)}
                      placeholder={`Describe step ${index + 1}`}
                      className="min-h-[80px] focus-visible:ring-blue-500"
                    />
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeStep(index)}
                    disabled={formData.steps.length === 1}
                    className="flex-shrink-0 text-red-400 hover:text-red-300 hover:bg-red-900/20"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}

              {formData.steps.length === 0 && (
                <p className="text-center text-sm text-muted-foreground py-3">
                  No steps added yet. Break down your resource into clear steps
                  for users to follow.
                </p>
              )}
            </div>
          </div>

          {/* Content Editor */}
          <div className="space-y-3 overflow-hidden">
            <h2 className="text-xl font-semibold ">Detailed Content</h2>

            <div className="p-2 flex items-center gap-2 bg-gray-800/30 border border-gray-700 rounded-t-md">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => editor?.chain().focus().toggleBold().run()}
                className={editor?.isActive('bold') ? 'bg-gray-700/50' : ''}
              >
                <Bold className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => editor?.chain().focus().toggleItalic().run()}
                className={editor?.isActive('italic') ? 'bg-gray-700/50' : ''}
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
                    ? 'bg-gray-700/50'
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
                    ? 'bg-gray-700/50'
                    : ''
                }
              >
                <Heading2 className="w-4 h-4" />
              </Button>
              <Separator orientation="vertical" className="h-6" />
              <Button
                variant="ghost"
                size="sm"
                onClick={() => editor?.chain().focus().toggleBulletList().run()}
                className={
                  editor?.isActive('bulletList') ? 'bg-gray-700/50' : ''
                }
              >
                <List className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => editor?.chain().focus().toggleCodeBlock().run()}
                className={
                  editor?.isActive('codeBlock') ? 'bg-gray-700/50' : ''
                }
              >
                <Code className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => editor?.chain().focus().toggleBlockquote().run()}
                className={
                  editor?.isActive('blockquote') ? 'bg-gray-700/50' : ''
                }
              >
                <Quote className="w-4 h-4" />
              </Button>
            </div>

            <div className="p-4 border border-gray-700 rounded-b-md">
              <EditorContent editor={editor} />
            </div>
          </div>
        </div>
      </div>

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
              className="bg-red-600 text-white hover:bg-red-700"
            >
              Discard Changes
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ResourceCreateForm;
