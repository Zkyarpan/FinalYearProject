import React from 'react';
import { Skeleton } from '@/components/ui/skeleton'; // Ensure this path is correct

const PsychologistProfileHighlightsSkeleton: React.FC = () => {
  return (
    <div className="flex flex-col px-6 gap-6 animate-pulse">
      <div className="relative flex flex-col gap-4 rounded-xl p-4 border shadow-sm">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex gap-2 items-center">
            <Skeleton className="h-5 w-5 rounded-full" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>

        {/* Experience List */}
        <div className="pl-4 space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </div>

        {/* Profile Section */}
        <div className="flex flex-col items-center text-center mt-4">
          {/* Profile Image */}
          <div className="mb-2">
            <Skeleton className="w-10 h-10 rounded-full" />
          </div>

          {/* Text Skeletons */}
          <Skeleton className="h-6 w-48 mb-2" />
          <Skeleton className="h-4 w-64 mb-3" />

          {/* Button Skeleton */}
          <Skeleton className="h-8 w-32 rounded-xl mb-2" />

          {/* Small Text Skeleton */}
          <Skeleton className="h-3 w-48" />
        </div>
      </div>
    </div>
  );
};

export default PsychologistProfileHighlightsSkeleton;
