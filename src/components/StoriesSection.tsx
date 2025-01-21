'use client';

import { Loader2 as Loader, ArrowRight as RightIcon } from 'lucide-react';

import Stories from '@/icons/Stories';
import Journey from '@/icons/Journey';
import Author from '@/icons/Author';
import Community from '@/icons/Community';

const StoriesSection = ({ isAuthenticated, isLoading, handleNavigation }) => {
  return (
    <div className="rounded-2xl border border-border p-6 dark:border-[#333333] min-h-[calc(100vh-8rem)] bg-gradient-to-br from-primary/10 to-background">
      <div className="h-full flex flex-col max-w-sm mx-auto space-y-6">
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold text-center text-foreground">
            Share Your Story
          </h2>
          <div className="space-y-2">
            <p className="text-sm text-center">
              Every story matters. Share your mental health journey and inspire
              others in their path to wellness and healing.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="p-4 rounded-xl bg-card/50 border border-border/50">
            <div className="flex flex-col items-start gap-2">
              <Stories />
              <h3 className="font-medium text-sm">Personal Stories</h3>
              <p className="text-xs">
                Share your experiences and connect with others on similar
                journeys.
              </p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-card/50 border border-border/50">
            <div className="flex flex-col items-start gap-2">
              <Journey />
              <h3 className="font-medium text-sm">Recovery Journey</h3>
              <p className="text-xs">
                Document your progress and inspire others with your healing
                path.
              </p>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="flex justify-center items-center gap-6 text-xs">
          <span className="flex items-center gap-2">
            <Author /> 2000+ Stories
          </span>
          <span className="flex items-center gap-2">
            <Community /> 30k+ Readers
          </span>
        </div>

        <button
          onClick={() => handleNavigation('/stories/create')}
          className="bg-primary text-primary-foreground rounded-full px-6 py-2.5 text-sm font-semibold hover:bg-primary/90 transition-colors w-full flex justify-center items-center gap-2"
        >
          Share your story <RightIcon className="w-4 h-4" />
        </button>

        <p className="text-xs text-center italic text-muted-foreground">
          Join our community of mental health storytellers
        </p>
      </div>
    </div>
  );
};

export default StoriesSection;
