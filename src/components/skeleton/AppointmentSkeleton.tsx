'use client';

import { Card, CardContent } from '@/components/ui/card';

export const AppointmentSkeleton = () => {
  return (
    <Card className="w-full bg-white dark:bg-[#1c1c1c] p-4 border border-primaryBorder dark:border-[#333333]">
      <CardContent className="p-4 sm:p-6 flex flex-col min-h-[250px]">
        {/* Header skeleton */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-4">
            {/* Avatar skeleton */}
            <div className="h-14 w-14 rounded-full bg-muted dark:bg-input animate-pulse" />
            <div className="space-y-2">
              {/* Name skeleton */}
              <div className="h-6 w-32 bg-muted rounded dark:bg-input animate-pulse" />
              {/* License type skeleton */}
              <div className="h-5 w-24 bg-muted rounded  dark:bg-input animate-pulse" />
            </div>
          </div>
          {/* Status badge skeleton */}
          <div className="h-6 w-20 bg-muted rounded-full dark:bg-input animate-pulse" />
        </div>

        {/* Appointment details skeleton */}
        <div className="space-y-3 mb-4">
          {/* Date */}
          <div className="flex items-center space-x-3">
            <div className="h-5 w-5 bg-muted dark:bg-input rounded animate-pulse" />
            <div className="h-4 w-24 bg-muted  dark:bg-input rounded animate-pulse" />
          </div>
          {/* Time */}
          <div className="flex items-center space-x-3">
            <div className="h-5 w-5 bg-muted dark:bg-input rounded animate-pulse" />
            <div className="h-4 w-32 bg-muted  dark:bg-input rounded animate-pulse" />
          </div>
          {/* Session type */}
          <div className="flex items-center space-x-3">
            <div className="h-5 w-5 bg-muted dark:bg-input rounded animate-pulse" />
            <div className="h-4 w-28 bg-muted dark:bg-input rounded animate-pulse" />
          </div>
        </div>

        {/* Footer skeleton */}
        <div className="mt-auto">
          <div className="flex justify-between items-center">
            {/* Price skeleton */}
            <div className="h-6 w-20 bg-muted dark:bg-input rounded animate-pulse" />
            {/* Action buttons skeleton */}
            <div className="flex space-x-2">
              <div className="h-8 w-20 bg-muted dark:bg-input rounded animate-pulse" />
              <div className="h-8 w-24 bg-muted dark:bg-input rounded animate-pulse" />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
