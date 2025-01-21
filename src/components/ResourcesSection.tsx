'use client';

import { Loader2 as Loader, ArrowRight as RightIcon } from 'lucide-react';

import Tools from '@/icons/Tools';
import Guide from '@/icons/Support';
import Download from '@/icons/Download';
import Active from '@/icons/Active';

const ResourcesSection = ({ isAuthenticated, isLoading, handleNavigation }) => {
  return (
    <div className="rounded-2xl border border-border p-6 dark:border-[#333333] min-h-[calc(100vh-8rem)] bg-gradient-to-br from-primary/10 to-background">
      <div className="h-full flex flex-col max-w-sm mx-auto space-y-6">
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold text-center text-foreground">
            Helpful Resources
          </h2>
          <div className="space-y-2">
            <p className="text-sm text-center">
              Access practical tools, worksheets, and guides to support your
              mental health journey and daily well-being.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="p-4 rounded-xl bg-card/50 border border-border/50">
            <div className="flex flex-col items-start gap-2">
              <Tools />
              <h3 className="font-medium text-sm">Self-Help Tools</h3>
              <p className="text-xs">
                Interactive worksheets and practical exercises for daily use.
              </p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-card/50 border border-border/50">
            <div className="flex flex-col items-start gap-2">
              <Guide />
              <h3 className="font-medium text-sm">Practice Guides</h3>
              <p className="text-xs">
                Step-by-step guides for managing mental health and wellness.
              </p>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="flex justify-center items-center gap-6 text-xs">
          <span className="flex items-center gap-2">
            <Download /> 10k+ Downloads
          </span>
          <span className="flex items-center gap-2">
            <Active /> 3k+ Active Users
          </span>
        </div>

        <button
          onClick={() => handleNavigation('/resources/explore')}
          className="bg-primary text-primary-foreground rounded-full px-6 py-2.5 text-sm font-semibold hover:bg-primary/90 transition-colors w-full flex justify-center items-center gap-2"
        >
          Explore resources <RightIcon className="w-4 h-4" />
        </button>

        <p className="text-xs text-center italic text-muted-foreground">
          Free mental health resources to support your journey
        </p>
      </div>
    </div>
  );
};

export default ResourcesSection;
