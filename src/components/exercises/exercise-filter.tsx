'use client';

// components/exercises/exercise-filter.tsx
import { useState } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Filter, X } from 'lucide-react';

const types = [
  { label: 'All Types', value: '' },
  { label: 'Breathing', value: 'breathing' },
  { label: 'Meditation', value: 'meditation' },
  { label: 'Mindfulness', value: 'mindfulness' },
  { label: 'Relaxation', value: 'relaxation' },
  { label: 'Other', value: 'other' },
];

const difficulties = [
  { label: 'All Difficulties', value: '' },
  { label: 'Beginner', value: 'beginner' },
  { label: 'Intermediate', value: 'intermediate' },
  { label: 'Advanced', value: 'advanced' },
];

const durations = [
  { label: 'All Durations', value: '' },
  { label: 'Quick (≤5 min)', value: '<=5' },
  { label: 'Short (6-15 min)', value: '6-15' },
  { label: 'Medium (16-30 min)', value: '16-30' },
  { label: 'Long (>30 min)', value: '>30' },
];

const ExerciseFilter = ({ onFilterChange }) => {
  const [filters, setFilters] = useState({
    type: '',
    difficulty: '',
    duration: '',
  });

  const [activeFilters, setActiveFilters] = useState(0);

  const handleFilterSelect = (filterType, value) => {
    const newFilters = { ...filters, [filterType]: value };
    setFilters(newFilters);

    // Count active filters
    const count = Object.values(newFilters).filter(Boolean).length;
    setActiveFilters(count);

    // Notify parent component
    if (onFilterChange) {
      onFilterChange(newFilters);
    }
  };

  const clearAllFilters = () => {
    const clearedFilters = {
      type: '',
      difficulty: '',
      duration: '',
    };
    setFilters(clearedFilters);
    setActiveFilters(0);

    if (onFilterChange) {
      onFilterChange(clearedFilters);
    }
  };

  const getFilterLabel = (filterType, value) => {
    if (!value) return '';

    let options;
    switch (filterType) {
      case 'type':
        options = types;
        break;
      case 'difficulty':
        options = difficulties;
        break;
      case 'duration':
        options = durations;
        break;
      default:
        return value;
    }

    const option = options.find(opt => opt.value === value);
    return option ? option.label : value;
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="flex items-center gap-2 dark:bg-[#171717] border dark:border-[#333333]"
          >
            <Filter size={16} />
            <span>Filter</span>
            {activeFilters > 0 && (
              <Badge
                variant="secondary"
                className="ml-1 h-5 w-5 p-0 flex items-center justify-center"
              >
                {activeFilters}
              </Badge>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          className="w-56 dark:bg-[#171717] border dark:border-[#333333]"
        >
          <DropdownMenuLabel>Filter Exercises</DropdownMenuLabel>
          <DropdownMenuSeparator />

          <DropdownMenuGroup>
            <DropdownMenuLabel className="text-xs font-normal text-gray-500 dark:text-gray-400 pt-2">
              Type
            </DropdownMenuLabel>
            {types.map(type => (
              <DropdownMenuItem
                key={`type-${type.value}`}
                className={`${filters.type === type.value ? 'bg-blue-500/10 text-blue-500' : ''} cursor-pointer`}
                onClick={() => handleFilterSelect('type', type.value)}
              >
                {type.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuGroup>

          <DropdownMenuSeparator />

          <DropdownMenuGroup>
            <DropdownMenuLabel className="text-xs font-normal text-gray-500 dark:text-gray-400 pt-2">
              Difficulty
            </DropdownMenuLabel>
            {difficulties.map(difficulty => (
              <DropdownMenuItem
                key={`difficulty-${difficulty.value}`}
                className={`${filters.difficulty === difficulty.value ? 'bg-blue-500/10 text-blue-500' : ''} cursor-pointer`}
                onClick={() =>
                  handleFilterSelect('difficulty', difficulty.value)
                }
              >
                {difficulty.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuGroup>

          <DropdownMenuSeparator />

          <DropdownMenuGroup>
            <DropdownMenuLabel className="text-xs font-normal text-gray-500 dark:text-gray-400 pt-2">
              Duration
            </DropdownMenuLabel>
            {durations.map(duration => (
              <DropdownMenuItem
                key={`duration-${duration.value}`}
                className={`${filters.duration === duration.value ? 'bg-blue-500/10 text-blue-500' : ''} cursor-pointer`}
                onClick={() => handleFilterSelect('duration', duration.value)}
              >
                {duration.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuGroup>

          {activeFilters > 0 && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={clearAllFilters}
                className="text-red-500 cursor-pointer"
              >
                Clear all filters
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Active filter badges */}
      {activeFilters > 0 && (
        <div className="flex flex-wrap gap-2">
          {filters.type && (
            <Badge
              variant="outline"
              className="flex items-center gap-1 border dark:border-[#333333]"
            >
              {getFilterLabel('type', filters.type)}
              <Button
                variant="ghost"
                size="icon"
                className="h-4 w-4 p-0 ml-1 text-gray-500 hover:text-gray-700"
                onClick={() => handleFilterSelect('type', '')}
              >
                <X size={12} />
              </Button>
            </Badge>
          )}
          {filters.difficulty && (
            <Badge
              variant="outline"
              className="flex items-center gap-1 border dark:border-[#333333]"
            >
              {getFilterLabel('difficulty', filters.difficulty)}
              <Button
                variant="ghost"
                size="icon"
                className="h-4 w-4 p-0 ml-1 text-gray-500 hover:text-gray-700"
                onClick={() => handleFilterSelect('difficulty', '')}
              >
                <X size={12} />
              </Button>
            </Badge>
          )}
          {filters.duration && (
            <Badge
              variant="outline"
              className="flex items-center gap-1 border dark:border-[#333333]"
            >
              {getFilterLabel('duration', filters.duration)}
              <Button
                variant="ghost"
                size="icon"
                className="h-4 w-4 p-0 ml-1 text-gray-500 hover:text-gray-700"
                onClick={() => handleFilterSelect('duration', '')}
              >
                <X size={12} />
              </Button>
            </Badge>
          )}
          {activeFilters > 1 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs text-gray-500 hover:text-gray-700"
              onClick={clearAllFilters}
            >
              Clear all
            </Button>
          )}
        </div>
      )}
    </div>
  );
};

export default ExerciseFilter;
