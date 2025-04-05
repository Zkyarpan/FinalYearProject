'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Search, Plus } from 'lucide-react';
import { Input } from '@/components/ui/input';

// Fallback categories from the Resource model schema
const FALLBACK_CATEGORIES = [
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

// Fallback difficulty levels from the Resource model schema
const FALLBACK_DIFFICULTIES = ['beginner', 'intermediate', 'advanced'];

// Fallback popular tags
const FALLBACK_TAGS = [
  'mindfulness',
  'meditation',
  'anxiety',
  'stress-relief',
  'self-care',
  'mental-health',
];

interface Category {
  name: string;
  count: number;
}

interface Tag {
  name: string;
  count: number;
}

const ResourcesSection = ({ isAuthenticated, isLoading, handleNavigation }) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [difficulties, setDifficulties] = useState<
    { name: string; count: number }[]
  >([]);
  const [popularTags, setPopularTags] = useState<Tag[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoadingData, setIsLoadingData] = useState(true);

  const router = useRouter();
  const searchParams = useSearchParams();

  // Get current filters from URL
  const currentCategory = searchParams.get('category');
  const currentDifficulty = searchParams.get('difficulty');
  const currentSearch = searchParams.get('search');

  // Initialize search query from URL if present
  useEffect(() => {
    if (currentSearch) {
      setSearchQuery(currentSearch);
    }
  }, [currentSearch]);

  // Fetch categories, difficulties, and tags
  useEffect(() => {
    const fetchData = async () => {
      setIsLoadingData(true);

      try {
        // Fetch categories
        const categoriesPromise = fetch('/api/resources/categories')
          .then(res => {
            if (!res.ok) throw new Error('Failed to fetch categories');
            return res.json();
          })
          .then(data => {
            if (data.Result && data.Result.categories) {
              return [
                { name: 'All', count: data.Result.totalCount || 0 },
                ...data.Result.categories,
              ];
            }
            throw new Error('Invalid category data');
          })
          .catch(err => {
            console.error(err);
            return [
              { name: 'All', count: 0 },
              ...FALLBACK_CATEGORIES.map(cat => ({ name: cat, count: 0 })),
            ];
          });

        // Fetch difficulties
        const difficultiesPromise = fetch('/api/resources/difficulties')
          .then(res => {
            if (!res.ok) throw new Error('Failed to fetch difficulties');
            return res.json();
          })
          .then(data => {
            if (data.Result && data.Result.difficulties) {
              return data.Result.difficulties;
            }
            throw new Error('Invalid difficulty data');
          })
          .catch(err => {
            console.error(err);
            return FALLBACK_DIFFICULTIES.map(diff => ({
              name: diff,
              count: 0,
            }));
          });

        // Fetch popular tags
        const tagsPromise = fetch('/api/resources/tags')
          .then(res => {
            if (!res.ok) throw new Error('Failed to fetch tags');
            return res.json();
          })
          .then(data => {
            if (data.Result && data.Result.tags) {
              return data.Result.tags;
            }
            throw new Error('Invalid tags data');
          })
          .catch(err => {
            console.error(err);
            return FALLBACK_TAGS.map(tag => ({
              name: tag,
              count: 0,
            }));
          });

        // Wait for all requests to complete
        const [fetchedCategories, fetchedDifficulties, fetchedTags] =
          await Promise.all([
            categoriesPromise,
            difficultiesPromise,
            tagsPromise,
          ]);

        setCategories(fetchedCategories);
        setDifficulties(fetchedDifficulties);
        setPopularTags(fetchedTags);
      } catch (error) {
        console.error('Error fetching resource data:', error);

        // Set fallbacks if anything goes wrong
        setCategories([
          { name: 'All', count: 0 },
          ...FALLBACK_CATEGORIES.map(cat => ({ name: cat, count: 0 })),
        ]);

        setDifficulties(
          FALLBACK_DIFFICULTIES.map(diff => ({
            name: diff,
            count: 0,
          }))
        );

        setPopularTags(
          FALLBACK_TAGS.map(tag => ({
            name: tag,
            count: 0,
          }))
        );
      } finally {
        setIsLoadingData(false);
      }
    };

    fetchData();
  }, []);

  const handleCategorySelect = category => {
    let params = new URLSearchParams(searchParams.toString());

    if (category.name === 'All') {
      params.delete('category');
    } else {
      params.set('category', category.name);
    }

    // Keep other existing filters
    router.push(`/resources?${params.toString()}`);
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
  };

  const handleTagSelect = tag => {
    let params = new URLSearchParams(searchParams.toString());
    params.set('tag', tag.name);

    // Keep other existing filters
    router.push(`/resources?${params.toString()}`);
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
  };

  // Get difficulty badge color
  const getDifficultyColor = difficulty => {
    switch (difficulty.toLowerCase()) {
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

  return (
    <div className="w-full flex flex-col gap-6">
      {/* Search Section */}
      <div className="mb-4">
        <h2 className="text-xl font-bold mb-4">Mental Health Resources</h2>
        <p className="text-sm text-muted-foreground mb-4">
          Discover tools, exercises, and guides to support your mental wellbeing
        </p>
      </div>

      {/* Create Resource Button */}
      {isAuthenticated && (
        <div className="mb-6">
          <Button
            onClick={() => handleNavigation('/resources/create')}
            className="w-full"
            disabled={isLoading}
          >
            <Plus className="mr-2 h-4 w-4" /> Create New Resource
          </Button>
        </div>
      )}

      {/* Categories Section */}
      <div className="mb-6">
        <h3 className="font-semibold mb-3 text-sm uppercase tracking-wider text-muted-foreground">
          Categories
        </h3>

        {isLoadingData ? (
          <div className="space-y-2">
            {[1, 2, 3, 4, 5].map(i => (
              <div
                key={i}
                className="h-8 bg-gray-200 dark:bg-gray-800 animate-pulse rounded-md"
              ></div>
            ))}
          </div>
        ) : (
          <ul className="space-y-1.5">
            {categories.map(category => (
              <li key={category.name} className="w-full">
                <button
                  onClick={() => handleCategorySelect(category)}
                  className={`flex items-center justify-between w-full px-3 py-2 rounded-md text-sm transition-colors ${
                    currentCategory === category.name ||
                    (category.name === 'All' && !currentCategory)
                      ? 'bg-primary/10 text-primary font-medium'
                      : 'hover:bg-muted/50'
                  }`}
                >
                  <span className="truncate">{category.name}</span>
                  <Badge variant="outline" className="ml-auto">
                    {category.count}
                  </Badge>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Difficulty Levels */}
      {difficulties.length > 0 && (
        <div className="mb-6">
          <h3 className="font-semibold mb-3 text-sm uppercase tracking-wider text-muted-foreground">
            Difficulty Level
          </h3>
          <div className="flex flex-wrap gap-2">
            {difficulties.map(difficulty => (
              <button
                key={difficulty.name}
                onClick={() => handleDifficultySelect(difficulty)}
                className={`px-3 py-1 rounded-full text-xs ${
                  currentDifficulty === difficulty.name
                    ? 'ring-2 ring-primary ring-offset-1 ring-offset-background'
                    : ''
                } ${getDifficultyColor(difficulty.name)}`}
              >
                {difficulty.name.charAt(0).toUpperCase() +
                  difficulty.name.slice(1)}
                <span className="ml-1.5 text-xs opacity-80">
                  ({difficulty.count})
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Popular Tags */}
      <div>
        <h3 className="font-semibold mb-3 text-sm uppercase tracking-wider text-muted-foreground">
          Popular Tags
        </h3>
        <div className="flex flex-wrap gap-2">
          {isLoadingData
            ? Array(6)
                .fill(0)
                .map((_, i) => (
                  <div
                    key={i}
                    className="h-7 w-20 bg-gray-200 dark:bg-gray-800 animate-pulse rounded-full"
                  ></div>
                ))
            : popularTags.map(tag => (
                <button
                  key={tag.name}
                  onClick={() => handleTagSelect(tag)}
                  className="px-3 py-1 bg-secondary text-secondary-foreground hover:bg-secondary/80 rounded-full text-xs"
                >
                  {tag.name}
                  {tag.count > 0 && (
                    <span className="ml-1 opacity-60">({tag.count})</span>
                  )}
                </button>
              ))}
        </div>
      </div>
    </div>
  );
};

export default ResourcesSection;
