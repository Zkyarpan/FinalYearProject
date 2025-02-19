'use client';

import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

export const ProfileSkeleton = () => {
  return (
    <div className="min-h-screen text-white pb-20">
      <div className="max-w-3xl mx-auto px-4 pt-10 space-y-6">
        <div className="flex flex-col items-center space-y-4">
          <Skeleton className="w-32 h-32 rounded-full" />
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-6 w-48" />
        </div>

        <div className="flex justify-center items-center gap-8 mt-6">
          <div className="flex items-center gap-2">
            <Skeleton className="w-5 h-5 rounded-full" />
            <Skeleton className="h-4 w-40" />
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="w-5 h-5 rounded-full" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>

        <div className="flex justify-center">
          <Skeleton className="h-8 w-24 rounded-full" />
        </div>

        <div className="border-b border-gray-800 mt-8">
          <div className="max-w-2xl mx-auto">
            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="overview" disabled>
                  OVERVIEW
                </TabsTrigger>
                <TabsTrigger value="experience" disabled>
                  EXPERIENCE
                </TabsTrigger>
                <TabsTrigger value="education" disabled>
                  EDUCATION
                </TabsTrigger>
                <TabsTrigger value="availability" disabled>
                  AVAILABILITY
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>

        <div className="space-y-4 mt-8">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-[90%]" />
          <Skeleton className="h-4 w-[85%]" />
          <Skeleton className="h-4 w-[95%]" />
        </div>

        <div className="grid grid-cols-3 gap-4 mt-8">
          <div className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-6 w-32" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-6 w-32" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-6 w-32" />
          </div>
        </div>

        <div className="mt-6">
          <Skeleton className="h-5 w-20 mb-3" />
          <div className="flex gap-2">
            <Skeleton className="h-8 w-24 rounded-full" />
            <Skeleton className="h-8 w-24 rounded-full" />
            <Skeleton className="h-8 w-24 rounded-full" />
          </div>
        </div>
      </div>
    </div>
  );
};
