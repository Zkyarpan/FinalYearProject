'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Heart, Calendar, Star, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// Import your GratitudeJournal component
import GratitudeJournal from '@/components/gratitude/gratitude-journal';

// Import from your store once implemented
import { useActivityStore } from '@/store/activity-store';

export default function GratitudePage() {
  const router = useRouter();

  // Handle gratitude entry completion
  const handleEntryComplete = data => {
    console.log('Gratitude entry completed:', data);
    // In a real implementation, you would use your activity store here
    // activityStore.logActivity('gratitude', data);
  };

  return (
    <div className="mx-auto px-4 py-8">
      <Button
        variant="ghost"
        className="mb-6"
        onClick={() => router.push('/wellness')}
      >
        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Wellness
      </Button>

      {/* Hero section */}
      <div className="relative bg-card rounded-md mb-10">
        <div className="absolute inset-0 bg-[url('/gratitude-pattern.svg')] opacity-10"></div>
        <div className="py-12 px-6 sm:px-8 relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl font-extrabold mb-4">Gratitude Journal</h1>
            <p className="text-xl opacity-90 max-w-2xl mx-auto">
              Cultivate positivity and appreciation through regular gratitude
              practice.
            </p>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-8">
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                <div className="text-3xl font-bold">7</div>
                <div className="text-sm opacity-80">Total Entries</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                <div className="text-3xl font-bold">4</div>
                <div className="text-sm opacity-80">Day Streak</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                <div className="text-3xl font-bold">Today</div>
                <div className="text-sm opacity-80">Last Entry</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <Card className="border-0 shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Heart className="h-5 w-5 text-rose-500" /> Your Gratitude
                Journal
              </CardTitle>
              <CardDescription>
                Take a moment each day to reflect on what you're thankful for
              </CardDescription>
            </CardHeader>
            <CardContent>
              <GratitudeJournal onComplete={handleEntryComplete} />
            </CardContent>
          </Card>
        </div>

        <div>
          <Card className="border-0 shadow-md sticky top-8">
            <CardHeader className="bg-gradient-to-r from-rose-100 to-pink-100 dark:from-rose-900/30 dark:to-pink-900/30">
              <CardTitle className="flex items-center text-xl">
                <Sparkles className="h-5 w-5 mr-2" /> Benefits of Gratitude
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                Scientific research has shown that practicing gratitude
                regularly can:
              </p>

              <ul className="space-y-3">
                <li className="flex gap-2">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400 flex items-center justify-center">
                    <Star className="h-3 w-3" />
                  </div>
                  <span>Improve your mood and overall happiness</span>
                </li>
                <li className="flex gap-2">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400 flex items-center justify-center">
                    <Star className="h-3 w-3" />
                  </div>
                  <span>Reduce symptoms of stress and anxiety</span>
                </li>
                <li className="flex gap-2">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400 flex items-center justify-center">
                    <Star className="h-3 w-3" />
                  </div>
                  <span>Enhance sleep quality and duration</span>
                </li>
                <li className="flex gap-2">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400 flex items-center justify-center">
                    <Star className="h-3 w-3" />
                  </div>
                  <span>Strengthen your relationships</span>
                </li>
                <li className="flex gap-2">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400 flex items-center justify-center">
                    <Star className="h-3 w-3" />
                  </div>
                  <span>Build resilience during difficult times</span>
                </li>
              </ul>

              <div className="mt-6 p-4 bg-rose-50 dark:bg-rose-900/20 rounded-lg">
                <p className="text-sm font-medium mb-2">Pro Tip</p>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  For maximum benefit, try to be specific about what you're
                  grateful for and why it matters to you.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
