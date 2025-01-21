import { Loader2 as Loader, ArrowRight as RightIcon } from 'lucide-react';

import Article from '@/icons/Atricles';
import Research from '@/icons/Research';
import Writer from '@/icons/Write';
import Reader from '@/icons/Readers';

const ArticlesSection = ({ isAuthenticated, isLoading, handleNavigation }) => {
  return (
    <div className="rounded-2xl border border-border p-6 dark:border-[#333333] min-h-[calc(100vh-8rem)] bg-gradient-to-br from-primary/10 to-background">
      <div className="h-full flex flex-col max-w-sm mx-auto space-y-6">
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold text-center text-foreground">
            Explore Mental Health
          </h2>
          <div className="space-y-2">
            <p className="text-sm text-center">
              Discover expert insights, research-based articles, and practical
              guides about mental health and well-being.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="p-4 rounded-xl bg-card/50 border border-border/50">
            <div className="flex flex-col items-start gap-2">
              <Article />
              <h3 className="font-medium text-sm">Expert Articles</h3>
              <p className="text-xs">
                In-depth articles from mental health professionals and
                researchers.
              </p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-card/50 border border-border/50">
            <div className="flex flex-col items-start gap-2">
              <Research />
              <h3 className="font-medium text-sm">Latest Research</h3>
              <p className="text-xs">
                Stay updated with current mental health studies and findings.
              </p>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="flex justify-center items-center gap-6 text-xs">
          <span className="flex items-center gap-2">
            <Writer /> 200+ Writers
          </span>
          <span className="flex items-center gap-2">
            <Reader /> 100k+ Readers
          </span>
        </div>

        <button
          onClick={() => handleNavigation('/articles/browse')}
          className="bg-primary text-primary-foreground rounded-full px-6 py-2.5 text-sm font-semibold hover:bg-primary/90 transition-colors w-full flex justify-center items-center gap-2"
        >
          Browse articles <RightIcon className="w-4 h-4" />
        </button>

        <p className="text-xs text-center italic text-muted-foreground">
          Evidence-based mental health resources at your fingertips
        </p>
      </div>
    </div>
  );
};

export default ArticlesSection;
