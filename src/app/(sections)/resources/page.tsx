'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { generateSlug } from '@/helpers/generateSlug';
import { useUserStore } from '@/store/userStore';
import {
  Edit,
  Filter,
  X,
  Search,
  Plus,
  Clock,
  PlayCircle,
  Music,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Skeleton from '@/components/common/Skeleton';
import LoginModal from '@/components/LoginModel';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetClose,
} from '@/components/ui/sheet';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Separator } from '@/components/ui/separator';

// Type definitions
interface Author {
  _id: string;
  name: string;
  avatar: string;
}

interface Resource {
  _id: string;
  title: string;
  description: string;
  content: string;
  category: string;
  resourceImage: string;
  mediaUrls: {
    type: 'audio' | 'video';
    url: string;
    title?: string;
  }[];
  duration: number;
  difficultyLevel: 'beginner' | 'intermediate' | 'advanced';
  steps: string[];
  tags: string[];
  author: Author;
  publishDate: string;
  viewCount: number;
  isOwner?: boolean;
}

// Fallback data based on Resource schema
const FALLBACK_CATEGORIES = [
  { name: 'All', count: 0 },
  { name: 'Breathing', count: 0 },
  { name: 'Meditation', count: 0 },
  { name: 'Yoga', count: 0 },
  { name: 'Exercise', count: 0 },
  { name: 'Sleep', count: 0 },
  { name: 'Anxiety', count: 0 },
  { name: 'Depression', count: 0 },
  { name: 'Stress', count: 0 },
  { name: 'Mindfulness', count: 0 },
  { name: 'Self-care', count: 0 },
  { name: 'Other', count: 0 },
];

const FALLBACK_DIFFICULTIES = [
  { name: 'beginner', count: 0 },
  { name: 'intermediate', count: 0 },
  { name: 'advanced', count: 0 },
];

const FALLBACK_TAGS = [
  { name: 'mindfulness', count: 0 },
  { name: 'meditation', count: 0 },
  { name: 'anxiety', count: 0 },
  { name: 'stress-relief', count: 0 },
  { name: 'self-care', count: 0 },
  { name: 'mental-health', count: 0 },
];

// Helper functions
const getDifficultyBadgeColor = (level: string) => {
  switch (level) {
    case 'beginner':
      return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
    case 'intermediate':
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
    case 'advanced':
      return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
  }
};

const formatDuration = (minutes: number): string => {
  if (minutes < 60) {
    return `${minutes} min`;
  }
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return remainingMinutes > 0
    ? `${hours} hr ${remainingMinutes} min`
    : `${hours} hr`;
};

// Media type icon component
const MediaTypeIcon = ({
  type,
  className = 'h-4 w-4',
}: {
  type: string;
  className?: string;
}) => {
  return type === 'video' ? (
    <PlayCircle className={className} />
  ) : (
    <Music className={className} />
  );
};

const ResourcesPage = () => {
  // State
  const [resources, setResources] = useState<Resource[]>([]);
  const [categories, setCategories] = useState(FALLBACK_CATEGORIES);
  const [difficulties, setDifficulties] = useState(FALLBACK_DIFFICULTIES);
  const [popularTags, setPopularTags] = useState(FALLBACK_TAGS);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingFilters, setIsLoadingFilters] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);
  const [isFilterExpanded, setIsFilterExpanded] = useState(false);

  // Hooks
  const userId = useUserStore(state => state._id);
  const isAuthenticated = useUserStore(state => state.isAuthenticated);
  const getAuthHeaders = useUserStore(state => state.getAuthHeaders);
  const router = useRouter();
  const searchParams = useSearchParams();

  // Get current filters from URL
  const currentCategory = searchParams.get('category');
  const currentDifficulty = searchParams.get('difficulty');
  const currentTag = searchParams.get('tag');
  const currentSearch = searchParams.get('search');

  // Default image fallbacks
  const defaultImage = '/default-image.jpg';
  const defaultAvatar = '/default-avatar.jpg';
  const defaultAlt = 'Resource Image';

  // Initialize search query from URL if present
  useEffect(() => {
    if (currentSearch) {
      setSearchQuery(currentSearch);
    }
  }, [currentSearch]);

  // Fetch filters safely (with error handling)
  const fetchFilters = async () => {
    setIsLoadingFilters(true);

    try {
      // Try to fetch categories
      try {
        const res = await fetch('/api/resources/categories');
        if (res.ok) {
          const data = await res.json();
          if (data.Result && data.Result.categories) {
            setCategories([
              { name: 'All', count: data.Result.totalCount || 0 },
              ...data.Result.categories,
            ]);
          }
        } else {
          console.warn('Categories API returned non-ok status:', res.status);
        }
      } catch (err) {
        console.warn('Failed to fetch categories:', err);
        // Keeping the fallback categories that were already set
      }

      // Try to fetch difficulties
      try {
        const res = await fetch('/api/resources/difficulties');
        if (res.ok) {
          const data = await res.json();
          if (data.Result && data.Result.difficulties) {
            setDifficulties(data.Result.difficulties);
          }
        } else {
          console.warn('Difficulties API returned non-ok status:', res.status);
        }
      } catch (err) {
        console.warn('Failed to fetch difficulties:', err);
        // Keeping the fallback difficulties that were already set
      }

      // Try to fetch tags
      try {
        const res = await fetch('/api/resources/tags');
        if (res.ok) {
          const data = await res.json();
          if (data.Result && data.Result.tags) {
            setPopularTags(data.Result.tags);
          }
        } else {
          console.warn('Tags API returned non-ok status:', res.status);
        }
      } catch (err) {
        console.warn('Failed to fetch tags:', err);
        // Keeping the fallback tags that were already set
      }
    } catch (error) {
      console.error('Error in fetchFilters:', error);
      // No need to do anything here since we've already set the fallback data
    } finally {
      setIsLoadingFilters(false);
    }
  };

  // Fetch resources safely (with error handling)
  const fetchResources = async (page = 1) => {
    setIsLoading(true);

    try {
      // Build URL with filters
      let url = `/api/resources/index?page=${page}&limit=12`;

      if (currentCategory) {
        url += `&category=${encodeURIComponent(currentCategory)}`;
      }

      if (currentDifficulty) {
        url += `&difficulty=${encodeURIComponent(currentDifficulty)}`;
      }

      if (currentTag) {
        url += `&tag=${encodeURIComponent(currentTag)}`;
      }

      if (currentSearch) {
        url += `&search=${encodeURIComponent(currentSearch)}`;
      }

      // Get auth headers for ownership check
      const headers = getAuthHeaders ? getAuthHeaders() : {};

      const res = await fetch(url, { headers });
      if (!res.ok) {
        throw new Error('Failed to fetch resources');
      }

      const data = await res.json();

      if (data.Result && data.Result.resources.length > 0) {
        setResources(data.Result.resources);
        setTotalPages(data.Result.pagination.pages);
        setCurrentPage(data.Result.pagination.page);
      } else {
        setResources([]);
        setTotalPages(1);
      }
    } catch (error) {
      console.error('Error fetching resources:', error);
      setError('Failed to load resources');
    } finally {
      setIsLoading(false);
    }
  };

  // Initial fetching
  useEffect(() => {
    fetchFilters();

    // Schedule fetchResources after a short delay to reduce concurrent requests
    const timer = setTimeout(() => {
      fetchResources();
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  // Fetch resources when filters change
  useEffect(() => {
    fetchResources(1); // Reset to page 1 when filters change
  }, [currentCategory, currentDifficulty, currentTag, currentSearch]);

  // Page change handler
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    fetchResources(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Filter handlers
  const handleCategorySelect = category => {
    let params = new URLSearchParams(searchParams.toString());

    if (category.name === 'All') {
      params.delete('category');
    } else {
      params.set('category', category.name);
    }

    // Keep other existing filters
    router.push(`/resources?${params.toString()}`);
    setIsMobileFilterOpen(false);
  };

  const handleDifficultySelect = difficulty => {
    let params = new URLSearchParams(searchParams.toString());

    if (currentDifficulty === difficulty.name) {
      params.delete('difficulty');
    } else {
      params.set('difficulty', difficulty.name);
    }

    // Keep other existing filters
    router.push(`/resources?${params.toString()}`);
    setIsMobileFilterOpen(false);
  };

  const handleTagSelect = tag => {
    let params = new URLSearchParams(searchParams.toString());

    if (currentTag === tag.name) {
      params.delete('tag');
    } else {
      params.set('tag', tag.name);
    }

    // Keep other existing filters
    router.push(`/resources?${params.toString()}`);
    setIsMobileFilterOpen(false);
  };

  const handleSearch = e => {
    e.preventDefault();
    let params = new URLSearchParams(searchParams.toString());

    if (searchQuery.trim()) {
      params.set('search', searchQuery.trim());
    } else {
      params.delete('search');
    }

    // Keep other existing filters
    router.push(`/resources?${params.toString()}`);
    setIsMobileFilterOpen(false);
  };

  const handleClearAllFilters = () => {
    router.push('/resources');
    setSearchQuery('');
    setIsMobileFilterOpen(false);
  };

  // Get active filters count for the badge
  const getActiveFiltersCount = () => {
    let count = 0;
    if (currentCategory) count++;
    if (currentDifficulty) count++;
    if (currentTag) count++;
    if (currentSearch) count++;
    return count;
  };

  // Render pagination
  const renderPagination = () => {
    if (totalPages <= 1) return null;

    return (
      <div className="flex justify-center mt-8">
        <div className="flex flex-wrap justify-center gap-2">
          {currentPage > 1 && (
            <Button
              variant="outline"
              onClick={() => handlePageChange(currentPage - 1)}
              className="px-3 py-2"
            >
              Previous
            </Button>
          )}

          {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
            <Button
              key={page}
              variant={currentPage === page ? 'default' : 'outline'}
              onClick={() => handlePageChange(page)}
              className="px-3 py-2"
            >
              {page}
            </Button>
          ))}

          {currentPage < totalPages && (
            <Button
              variant="outline"
              onClick={() => handlePageChange(currentPage + 1)}
              className="px-3 py-2"
            >
              Next
            </Button>
          )}
        </div>
      </div>
    );
  };

  // Loading state
  if (isLoading && resources.length === 0) return <Skeleton />;

  // Error state
  if (error) {
    return (
      <main className="min-h-screen">
        <div className="px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
              {error}
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Please try again later.
            </p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => fetchResources()}
            >
              Try Again
            </Button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 lg:py-8">
        {/* Mobile Header with filters toggle */}
        <div className="md:hidden mb-6">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">
              Resources
            </h1>

            <div className="flex gap-2">
              {isAuthenticated && (
                <Button
                  onClick={() => router.push('/resources/create')}
                  size="sm"
                >
                  <Plus className="mr-1 h-4 w-4" /> Create
                </Button>
              )}

              <Sheet
                open={isMobileFilterOpen}
                onOpenChange={setIsMobileFilterOpen}
              >
                <SheetTrigger asChild>
                  <Button variant="outline" size="sm" className="relative">
                    <Filter className="h-4 w-4 mr-1" />
                    Filters
                    {getActiveFiltersCount() > 0 && (
                      <Badge className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0">
                        {getActiveFiltersCount()}
                      </Badge>
                    )}
                  </Button>
                </SheetTrigger>
                <SheetContent
                  side="left"
                  className="w-[85vw] sm:w-[400px] overflow-auto"
                >
                  <SheetHeader className="mb-4">
                    <SheetTitle className="text-left flex justify-between items-center">
                      <span>Filter Resources</span>
                      {getActiveFiltersCount() > 0 && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleClearAllFilters}
                        >
                          <X className="h-4 w-4 mr-1" /> Clear
                        </Button>
                      )}
                    </SheetTitle>
                  </SheetHeader>

                  {/* Mobile Search */}
                  <form onSubmit={handleSearch} className="relative mb-6">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="search"
                      placeholder="Search resources..."
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-14"
                    />
                    <Button
                      type="submit"
                      size="sm"
                      className="absolute right-1 top-1/2 -translate-y-1/2 h-8"
                    >
                      Search
                    </Button>
                  </form>

                  {/* Active Filters */}
                  {getActiveFiltersCount() > 0 && (
                    <div className="mb-6 p-3 bg-muted/50 rounded-lg">
                      <div className="flex flex-wrap gap-2">
                        <span className="text-sm font-medium">
                          Active filters:
                        </span>

                        {currentCategory && (
                          <Badge
                            variant="secondary"
                            className="flex items-center gap-1"
                          >
                            {currentCategory}
                            <button
                              onClick={() => {
                                let params = new URLSearchParams(
                                  searchParams.toString()
                                );
                                params.delete('category');
                                router.push(`/resources?${params.toString()}`);
                              }}
                              className="ml-1"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </Badge>
                        )}

                        {currentDifficulty && (
                          <Badge
                            variant="secondary"
                            className="flex items-center gap-1"
                          >
                            {currentDifficulty}
                            <button
                              onClick={() => {
                                let params = new URLSearchParams(
                                  searchParams.toString()
                                );
                                params.delete('difficulty');
                                router.push(`/resources?${params.toString()}`);
                              }}
                              className="ml-1"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </Badge>
                        )}

                        {currentTag && (
                          <Badge
                            variant="secondary"
                            className="flex items-center gap-1"
                          >
                            Tag: {currentTag}
                            <button
                              onClick={() => {
                                let params = new URLSearchParams(
                                  searchParams.toString()
                                );
                                params.delete('tag');
                                router.push(`/resources?${params.toString()}`);
                              }}
                              className="ml-1"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </Badge>
                        )}

                        {currentSearch && (
                          <Badge
                            variant="secondary"
                            className="flex items-center gap-1"
                          >
                            "{currentSearch}"
                            <button
                              onClick={() => {
                                let params = new URLSearchParams(
                                  searchParams.toString()
                                );
                                params.delete('search');
                                setSearchQuery('');
                                router.push(`/resources?${params.toString()}`);
                              }}
                              className="ml-1"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Mobile Categories */}
                  <div className="mb-6">
                    <h3 className="font-semibold mb-3 text-sm uppercase">
                      Categories
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {categories.map(category => (
                        <Button
                          key={category.name}
                          variant={
                            currentCategory === category.name ||
                            (category.name === 'All' && !currentCategory)
                              ? 'default'
                              : 'outline'
                          }
                          size="sm"
                          onClick={() => handleCategorySelect(category)}
                        >
                          {category.name}
                          {category.count > 0 && (
                            <Badge variant="secondary" className="ml-2">
                              {category.count}
                            </Badge>
                          )}
                        </Button>
                      ))}
                    </div>
                  </div>

                  <Separator className="mb-6" />

                  {/* Mobile Difficulty */}
                  {difficulties.length > 0 && (
                    <div className="mb-6">
                      <h3 className="font-semibold mb-3 text-sm uppercase">
                        Difficulty
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {difficulties.map(difficulty => (
                          <Button
                            key={difficulty.name}
                            variant={
                              currentDifficulty === difficulty.name
                                ? 'default'
                                : 'outline'
                            }
                            size="sm"
                            onClick={() => handleDifficultySelect(difficulty)}
                            className={`${
                              currentDifficulty !== difficulty.name
                                ? getDifficultyBadgeColor(difficulty.name)
                                : ''
                            }`}
                          >
                            {difficulty.name.charAt(0).toUpperCase() +
                              difficulty.name.slice(1)}
                            {difficulty.count > 0 && (
                              <Badge variant="secondary" className="ml-2">
                                {difficulty.count}
                              </Badge>
                            )}
                          </Button>
                        ))}
                      </div>
                    </div>
                  )}

                  <Separator className="mb-6" />

                  {/* Mobile Tags */}
                  <div>
                    <h3 className="font-semibold mb-3 text-sm uppercase">
                      Popular Tags
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {popularTags.map(tag => (
                        <Button
                          key={tag.name}
                          variant={
                            currentTag === tag.name ? 'default' : 'secondary'
                          }
                          size="sm"
                          onClick={() => handleTagSelect(tag)}
                        >
                          {tag.name}
                          {tag.count > 0 && (
                            <Badge className="ml-2" variant="outline">
                              {tag.count}
                            </Badge>
                          )}
                        </Button>
                      ))}
                    </div>
                  </div>

                  <div className="mt-8">
                    <SheetClose asChild>
                      <Button className="w-full">Apply Filters</Button>
                    </SheetClose>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>

          {/* Mobile Search */}
          <form onSubmit={handleSearch} className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search resources..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-14"
            />
            <Button
              type="submit"
              size="sm"
              className="absolute right-1 top-1/2 -translate-y-1/2 h-8"
            >
              Search
            </Button>
          </form>
        </div>

        {/* Desktop Header */}
        <div className="hidden md:flex md:justify-between md:items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Mental Health Resources
          </h1>

          <div className="flex items-center gap-3">
            {isAuthenticated && (
              <Button onClick={() => router.push('/resources/create')}>
                <Plus className="mr-2 h-4 w-4" /> Create Resource
              </Button>
            )}
          </div>
        </div>

        {/* Filter Bar */}
        <div className="mb-6">
          <Collapsible
            open={isFilterExpanded}
            onOpenChange={setIsFilterExpanded}
            className="border rounded-xl overflow-hidden bg-card"
          >
            <div className="px-4 py-3 flex justify-between items-center">
              <CollapsibleTrigger asChild>
                <Button variant="ghost" className="p-2 h-8">
                  <Filter className="h-4 w-4 mr-2" />
                  Filters
                  {getActiveFiltersCount() > 0 && (
                    <Badge className="ml-2">{getActiveFiltersCount()}</Badge>
                  )}
                  <span className="ml-2">{isFilterExpanded ? '▲' : '▼'}</span>
                </Button>
              </CollapsibleTrigger>

              <div className="flex items-center flex-wrap gap-2">
                {/* Active Filters */}
                {currentCategory && (
                  <Badge variant="outline" className="flex items-center gap-1">
                    Category: {currentCategory}
                    <button
                      onClick={() => {
                        let params = new URLSearchParams(
                          searchParams.toString()
                        );
                        params.delete('category');
                        router.push(`/resources?${params.toString()}`);
                      }}
                    >
                      <X className="h-3 w-3 ml-1" />
                    </button>
                  </Badge>
                )}

                {currentDifficulty && (
                  <Badge variant="outline" className="flex items-center gap-1">
                    Difficulty: {currentDifficulty}
                    <button
                      onClick={() => {
                        let params = new URLSearchParams(
                          searchParams.toString()
                        );
                        params.delete('difficulty');
                        router.push(`/resources?${params.toString()}`);
                      }}
                    >
                      <X className="h-3 w-3 ml-1" />
                    </button>
                  </Badge>
                )}

                {currentTag && (
                  <Badge variant="outline" className="flex items-center gap-1">
                    Tag: {currentTag}
                    <button
                      onClick={() => {
                        let params = new URLSearchParams(
                          searchParams.toString()
                        );
                        params.delete('tag');
                        router.push(`/resources?${params.toString()}`);
                      }}
                    >
                      <X className="h-3 w-3 ml-1" />
                    </button>
                  </Badge>
                )}

                {currentSearch && (
                  <Badge variant="outline" className="flex items-center gap-1">
                    Search: "{currentSearch}"
                    <button
                      onClick={() => {
                        let params = new URLSearchParams(
                          searchParams.toString()
                        );
                        params.delete('search');
                        setSearchQuery('');
                        router.push(`/resources?${params.toString()}`);
                      }}
                    >
                      <X className="h-3 w-3 ml-1" />
                    </button>
                  </Badge>
                )}

                {getActiveFiltersCount() > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleClearAllFilters}
                  >
                    Clear All
                  </Button>
                )}
              </div>
            </div>

            <CollapsibleContent className="border-t">
              <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Categories */}
                <div>
                  <h3 className="font-semibold mb-2 text-sm">Categories</h3>
                  <div className="flex flex-wrap gap-2">
                    {categories.slice(0, 8).map(category => (
                      <Button
                        key={category.name}
                        variant={
                          currentCategory === category.name ||
                          (category.name === 'All' && !currentCategory)
                            ? 'default'
                            : 'outline'
                        }
                        size="sm"
                        onClick={() => handleCategorySelect(category)}
                      >
                        {category.name}
                        {category.count > 0 && (
                          <Badge variant="secondary" className="ml-1">
                            {category.count}
                          </Badge>
                        )}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Difficulty */}
                <div>
                  <h3 className="font-semibold mb-2 text-sm">Difficulty</h3>
                  <div className="flex flex-wrap gap-2">
                    {difficulties.map(difficulty => (
                      <Button
                        key={difficulty.name}
                        variant={
                          currentDifficulty === difficulty.name
                            ? 'default'
                            : 'outline'
                        }
                        size="sm"
                        onClick={() => handleDifficultySelect(difficulty)}
                        className={`${
                          currentDifficulty !== difficulty.name
                            ? getDifficultyBadgeColor(difficulty.name)
                            : ''
                        }`}
                      >
                        {difficulty.name.charAt(0).toUpperCase() +
                          difficulty.name.slice(1)}
                        {difficulty.count > 0 && (
                          <Badge variant="secondary" className="ml-1">
                            {difficulty.count}
                          </Badge>
                        )}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Tags */}
                <div>
                  <h3 className="font-semibold mb-2 text-sm">Popular Tags</h3>
                  <div className="flex flex-wrap gap-2">
                    {popularTags.slice(0, 6).map(tag => (
                      <Button
                        key={tag.name}
                        variant={
                          currentTag === tag.name ? 'default' : 'secondary'
                        }
                        size="sm"
                        onClick={() => handleTagSelect(tag)}
                      >
                        {tag.name}
                        {tag.count > 0 && (
                          <Badge variant="outline" className="ml-1">
                            {tag.count}
                          </Badge>
                        )}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>
        </div>

        {/* Mobile Create FAB */}
        {isAuthenticated && (
          <div className="fixed bottom-6 right-6 z-10 md:hidden">
            <Button
              onClick={() => router.push('/resources/create')}
              size="icon"
              className="h-14 w-14 rounded-full shadow-lg"
            >
              <Plus className="h-6 w-6" />
            </Button>
          </div>
        )}

        {/* Resource Content - Simple Grid Layout */}
        <div className="space-y-8">
          {resources.length > 0 ? (
            <>
              {/* Resources Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {resources.map(resource => (
                  <Card
                    key={resource._id}
                    className="overflow-hidden h-full flex flex-col"
                  >
                    {/* Note: Generating link with just the slug to match your requirement */}
                    <Link
                      href={`/resources/${generateSlug(resource.title)}`}
                      className="group flex flex-col flex-1"
                    >
                      <div className="relative aspect-[16/10] w-full">
                        <Image
                          src={resource.resourceImage || defaultImage}
                          alt={`Image for ${resource.title}` || defaultAlt}
                          fill
                          className="object-cover transition-opacity group-hover:opacity-90"
                          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        />

                        {/* Media indicator */}
                        {resource.mediaUrls &&
                          resource.mediaUrls.length > 0 && (
                            <div className="absolute top-2 right-2 bg-black/70 rounded-md p-1.5 text-white text-xs">
                              <MediaTypeIcon
                                type={resource.mediaUrls[0].type}
                                className="h-3.5 w-3.5"
                              />
                            </div>
                          )}

                        {/* Category badge */}
                        <div className="absolute left-2 top-2">
                          <Badge className="text-xs">{resource.category}</Badge>
                        </div>

                        {/* Difficulty badge */}
                        <div className="absolute left-2 bottom-2">
                          <Badge
                            className={`text-xs ${getDifficultyBadgeColor(resource.difficultyLevel)}`}
                          >
                            {resource.difficultyLevel.charAt(0).toUpperCase() +
                              resource.difficultyLevel.slice(1)}
                          </Badge>
                        </div>

                        {/* Duration badge */}
                        <div className="absolute right-2 bottom-2">
                          <Badge
                            variant="outline"
                            className="bg-black/60 text-white border-0 text-xs flex items-center gap-1"
                          >
                            <Clock className="h-3 w-3" />
                            {formatDuration(resource.duration)}
                          </Badge>
                        </div>
                      </div>

                      <CardContent className="p-3 pt-4 flex-grow">
                        <h3 className="font-medium text-base mb-1 line-clamp-1 group-hover:text-primary transition-colors">
                          {resource.title}
                        </h3>

                        <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                          {resource.description}
                        </p>

                        {resource.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {resource.tags.slice(0, 2).map((tag, index) => (
                              <span
                                key={index}
                                className="text-xs text-muted-foreground"
                              >
                                #{tag}
                              </span>
                            ))}
                            {resource.tags.length > 2 && (
                              <span className="text-xs text-muted-foreground">
                                +{resource.tags.length - 2}
                              </span>
                            )}
                          </div>
                        )}
                      </CardContent>

                      <CardFooter className="p-3 pt-3 mt-auto border-t flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5">
                          <div className="relative h-5 w-5 rounded-full overflow-hidden">
                            <Image
                              src={resource.author.avatar || defaultAvatar}
                              alt={resource.author.name}
                              fill
                              className="object-cover"
                              sizes="20px"
                            />
                          </div>
                          <span className="text-xs font-medium truncate max-w-[80px]">
                            {resource.author.name}
                          </span>
                        </div>

                        {resource.isOwner && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="p-1 h-6 w-6"
                            onClick={e => {
                              e.stopPropagation();
                              e.preventDefault();
                              router.push(`/resources/edit/${resource._id}`);
                            }}
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                        )}
                      </CardFooter>
                    </Link>
                  </Card>
                ))}
              </div>

              {/* Pagination */}
              {renderPagination()}
            </>
          ) : (
            <div className="text-center py-16 px-4 rounded-xl border border-dashed">
              <div className="max-w-md mx-auto">
                <h2 className="text-xl font-semibold mb-4">
                  No resources found
                </h2>
                <p className="text-muted-foreground mb-6">
                  {getActiveFiltersCount() > 0
                    ? 'No resources match your current filters. Try adjusting your selections or clearing the filters.'
                    : 'Be the first to share your mental health resources with the community.'}
                </p>

                {getActiveFiltersCount() > 0 ? (
                  <Button onClick={handleClearAllFilters}>
                    Clear All Filters
                  </Button>
                ) : isAuthenticated ? (
                  <Button onClick={() => router.push('/resources/create')}>
                    <Plus className="mr-2 h-4 w-4" /> Create a Resource
                  </Button>
                ) : (
                  <Button onClick={() => setShowLoginModal(true)}>
                    Log in to Create Resources
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      <LoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
      />
    </main>
  );
};

export default ResourcesPage;
