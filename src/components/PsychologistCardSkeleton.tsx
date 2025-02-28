'use client';

import { Skeleton } from '@/components/ui/skeleton';

export const PsychologistCardSkeleton = () => {
  return (
    <div className="w-full space-y-4">
      {[1, 2, 3].map(i => (
        <div key={i} className="w-full p-6 rounded-lg">
          <div className="flex items-start gap-4">
            {/* Avatar Skeleton */}
            <div className="flex-shrink-0">
              <div className="relative">
                <Skeleton className="w-16 h-16 rounded-full" />
                <Skeleton className="absolute -right-1 -bottom-1 w-4 h-4 rounded-full" />
              </div>
            </div>

            {/* Content Skeleton */}
            <div className="flex-1">
              <div className="flex justify-between items-start">
                <div className="space-y-2">
                  <Skeleton className="h-6 w-48" /> {/* Name */}
                  <Skeleton className="h-4 w-36" /> {/* Title */}
                </div>
                <Skeleton className="h-6 w-24 rounded-full" />{' '}
                {/* Available badge */}
              </div>

              {/* Location and Experience */}
              <div className="mt-4 flex items-center gap-4">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-24" />
              </div>

              {/* Specialization Tags */}
              <div className="mt-4 flex flex-wrap gap-2">
                <Skeleton className="h-6 w-20 rounded-full" />
                <Skeleton className="h-6 w-24 rounded-full" />
                <Skeleton className="h-6 w-16 rounded-full" />
              </div>

              {/* Session Info */}
              <div className="mt-4 flex items-center gap-4">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-28" />
              </div>

              {/* Languages */}
              <div className="mt-4 flex items-center gap-2">
                <Skeleton className="h-4 w-16" />
                <div className="flex gap-2">
                  <Skeleton className="h-6 w-20 rounded-full" />
                  <Skeleton className="h-6 w-20 rounded-full" />
                </div>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
