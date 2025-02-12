'use client';

import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';

const AccountPageSkeleton = () => {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-4xl mx-auto px-4">
        <div className="rounded-xl p-6 mb-6">
          <div className="space-y-6">
            <div className="p-6 rounded-xl">
              <div className="flex flex-col items-center">
                {/* Profile Image Skeleton */}
                <div className="relative mb-6">
                  <Skeleton className="w-32 h-32 rounded-full" />
                </div>

                {/* Name Skeleton */}
                <div className="text-center flex-1">
                  <Skeleton className="h-8 w-48 mx-auto mb-2" />
                </div>
              </div>
            </div>

            {/* Profile Info Card */}
            <div className="p-6 rounded-xl border dark:border-[#333333] shadow-sm">
              <div className="space-y-6">
                {/* Age and Gender */}
                <div className="flex justify-center gap-8 pb-6 border-b">
                  <div className="text-center">
                    <Skeleton className="h-4 w-16 mb-2" />
                    <Skeleton className="h-3 w-8 mx-auto" />
                  </div>
                  <div className="text-center">
                    <Skeleton className="h-4 w-16 mb-2" />
                    <Skeleton className="h-3 w-12 mx-auto" />
                  </div>
                </div>

                {/* Areas of Focus */}
                <div className="space-y-3">
                  <Skeleton className="h-4 w-32 mx-auto mb-4" />
                  <div className="grid grid-cols-2 gap-3">
                    <Skeleton className="h-10 w-full rounded-xl" />
                    <Skeleton className="h-10 w-full rounded-xl" />
                    <Skeleton className="h-10 w-full rounded-xl" />
                    <Skeleton className="h-10 w-full rounded-xl" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Info Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Contact Information */}
            <div className="rounded-xl shadow-sm p-6 border dark:border-[#333333]">
              <Skeleton className="h-6 w-48 mb-6" />
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-5 w-5" />
                  <Skeleton className="h-4 w-32" />
                </div>
                <div className="flex items-center gap-3">
                  <Skeleton className="h-5 w-5" />
                  <Skeleton className="h-4 w-48" />
                </div>
              </div>
            </div>

            {/* Emergency Contact */}
            <div className="rounded-xl shadow-sm p-6 border dark:border-[#333333]">
              <Skeleton className="h-6 w-48 mb-6" />
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-5 w-5" />
                  <Skeleton className="h-4 w-32" />
                </div>
                <div className="flex items-center gap-3">
                  <Skeleton className="h-5 w-5" />
                  <Skeleton className="h-4 w-32" />
                </div>
              </div>
            </div>

            {/* Therapy Preferences */}
            <div className="rounded-xl shadow-sm p-6 border dark:border-[#333333]">
              <Skeleton className="h-6 w-48 mb-6" />
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-5 w-5" />
                  <Skeleton className="h-4 w-48" />
                </div>
                <div className="flex items-center gap-3">
                  <Skeleton className="h-5 w-5" />
                  <Skeleton className="h-4 w-36" />
                </div>
              </div>
            </div>

            {/* About Me */}
            <div className="rounded-xl shadow-sm p-6 border dark:border-[#333333]">
              <Skeleton className="h-6 w-32 mb-6" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AccountPageSkeleton;
