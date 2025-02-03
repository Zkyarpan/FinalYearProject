'use client';

import { Loader2 as Loader, ArrowRight as RightIcon } from 'lucide-react';
import Brain from '@/icons/Brain';
import Heart from '@/icons/Heart';
import Write from '@/icons/Write';
import Readers from '@/icons/Readers';
import { useState } from 'react';

const BlogSection = ({ isAuthenticated, isLoading, handleNavigation }) => {
  const [isWritingLoading, setIsWritingLoading] = useState(false);
  const handleStartWriting = async () => {
    setIsWritingLoading(true);
    await handleNavigation('/blogs/create', true);
    setIsWritingLoading(false);
  };

  return (
    <div className="rounded-2xl border border-border p-6 dark:border-[#333333] min-h-[calc(100vh-8rem)] bg-gradient-to-br from-primary/10 to-background">
      <div className="h-full flex flex-col max-w-sm mx-auto space-y-6">
        <div className="space-y-4">
          <h2 className="text-2xl font-normal italic text-center text-foreground font-instrument">
            Hey, do you write?
          </h2>
          <div className="space-y-2">
            <p className="text-sm text-center">
              Share your thoughts, experiences, and insights with our community.
              Start writing and publishing your own blogs today.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="p-4 rounded-xl bg-card/50 border border-border/50">
            <div className="flex flex-col items-start gap-2">
              <Brain />
              <h3 className="font-medium text-sm">Mental Health</h3>
              <p className="text-xs">
                Share your mental health journey and help others through their
                own path.
              </p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-card/50 border border-border/50">
            <div className="flex flex-col items-start gap-2">
              <Heart />
              <h3 className="font-medium text-sm">Self Care</h3>
              <p className="text-xs">
                Share wellness tips and self-care practices that work for you.
              </p>
            </div>
          </div>
        </div>

        <div className="flex justify-center items-center gap-6 text-xs">
          <span className="flex items-center gap-2">
            <Write /> 1000+ Writers
          </span>
          <span className="flex items-center gap-2">
            <Readers /> 50k+ Readers
          </span>
        </div>

        <button
          onClick={handleStartWriting}
          disabled={isWritingLoading}
          className="bg-primary text-primary-foreground rounded-full px-6 py-2.5 text-sm font-semibold hover:bg-primary/90 transition-colors w-full flex justify-center items-center gap-2 disabled:opacity-50"
        >
          {isWritingLoading ? (
            <Loader className="h-4 w-4 animate-spin" />
          ) : (
            <>
              Start writing <RightIcon className="w-4 h-4" />
            </>
          )}
        </button>

        <p className="text-xs text-center italic text-muted-foreground">
          Join our community of mental health writers
        </p>
      </div>
    </div>
  );
};

export default BlogSection;
