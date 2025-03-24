'use client';

import { Loader2 as Loader, ArrowRight as RightIcon } from 'lucide-react';
import Book from '@/icons/Book';
import Research from '@/icons/Research';
import Write from '@/icons/Write';
import Readers from '@/icons/Readers';
import { useState } from 'react';
import Link from 'next/link';
 
const ArticlesSection = ({ isAuthenticated, isLoading, handleNavigation }) => {
  const [isWritingLoading, setIsWritingLoading] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);

  const navigate = async path => {
    setIsNavigating(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      handleNavigation(path);
    } finally {
      setIsNavigating(false);
    }
  };

  return (
    <div className="rounded-2xl border border-border p-6 dark:border-[#333333] min-h-[calc(100vh-8rem)] bg-gradient-to-br from-primary/10 to-background">
      <div className="h-full flex flex-col max-w-sm mx-auto space-y-6">
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-center text-foreground main-font">
            Discover expert insights
          </h2>
          <div className="space-y-2">
            <p className="text-sm text-center main-font">
              Access evidence-based articles and research on mental health
              topics. Expand your knowledge and find valuable resources.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="p-4 rounded-xl bg-card/50 border border-border/50">
            <div className="flex flex-col items-start gap-2">
              <Research />
              <h3 className="font-medium text-sm main-font">Research Based</h3>
              <p className="text-xs main-font">
                Evidence-backed articles on the latest mental health studies and
                findings.
              </p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-card/50 border border-border/50">
            <div className="flex flex-col items-start gap-2">
              <Book />
              <h3 className="font-medium text-sm main-font">Expert Articles</h3>
              <p className="text-xs main-font">
                Content written by mental health professionals and researchers.
              </p>
            </div>
          </div>
        </div>

        <div className="flex justify-center items-center gap-6 text-xs">
          <span className="flex items-center gap-2">
            <Write /> 500+ Contributors
          </span>
          <span className="flex items-center gap-2">
            <Readers /> 75k+ Readers
          </span>
        </div>

        <Link
          href="/articles/browse"
          onClick={e => {
            if (isWritingLoading) {
              e.preventDefault();
              return;
            }
            navigate('/articles/browse');
          }}
          className={`bg-primary text-primary-foreground rounded-full px-6 py-2.5 text-sm font-semibold hover:bg-primary/90 transition-colors w-full flex justify-center items-center gap-2 disabled:opacity-50`}
        >
          {isWritingLoading ? (
            <div className="flex items-center gap-2 font-bold">
              <Loader className="h-4 w-4 animate-spin" />
            </div>
          ) : (
            <>
              Browse articles <RightIcon className="w-5 h-5" />
            </>
          )}
        </Link>

        <p className="text-xs text-center text-muted-foreground main-font">
          Explore our curated library of mental health resources
        </p>
      </div>
    </div>
  );
};

export default ArticlesSection;
