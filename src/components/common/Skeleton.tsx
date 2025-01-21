'use client';
import { Skeleton as UISkeleton } from '@/components/ui/skeleton';

const Skeleton = () => {
  return (
    <div>
      <main className="min-h-screen">
        <div className="container mx-auto px-4 py-8">
          <div className="mb-8">
            <UISkeleton className="h-[400px] w-full rounded-2xl dark:bg-input" />
            <div className="mt-4 space-y-4">
              <UISkeleton className="h-8 w-3/4 dark:bg-input" />
              <UISkeleton className="h-20 w-full dark:bg-input" />
              <div className="flex justify-between">
                <div className="flex items-center gap-2">
                  <UISkeleton className="h-8 w-8 rounded-full dark:bg-input" />
                  <UISkeleton className="h-4 w-24 dark:bg-input" />
                </div>
                <UISkeleton className="h-4 w-20 dark:bg-input" />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="space-y-4">
                <UISkeleton className="h-[200px] w-full rounded-2xl dark:bg-input" />
                <div className="space-y-2">
                  <UISkeleton className="h-6 w-3/4 dark:bg-input" />
                  <UISkeleton className="h-16 w-full dark:bg-input" />
                  <div className="flex justify-between">
                    <div className="flex items-center gap-2">
                      <UISkeleton className="h-6 w-6 rounded-full dark:bg-input" />
                      <UISkeleton className="h-4 w-20 dark:bg-input" />
                    </div>
                    <UISkeleton className="h-4 w-16 dark:bg-input" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Skeleton;
