'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Toaster, toast } from 'sonner';
import {
  BreathingMeditationStats,
  FocusStats,
  JournalingStats,
  useActivityStore,
} from '@/store/activity-store';
import {
  TrendingUp,
  Calendar,
  Timer,
  Award,
  Wind,
  Brain,
  Heart,
  Sparkles,
  Gamepad2,
  AlignJustify,
  Moon,
  BarChart3,
  Compass,
  ListTodo,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';

const WellnessContent = () => {
  const router = useRouter();
  const [isClient, setIsClient] = useState(false);
  const [formattedLastActive, setFormattedLastActive] = useState('Today');
  const [progressAnimation, setProgressAnimation] = useState(0);

  // Get stats from the activity store with proper type annotations
  const stats = useActivityStore(state => state.getOverallStats());
  const dailyStreak = useActivityStore(state => state.getDailyStreak());

  // Explicitly specify the generic type parameters for each getActivityStats call
  const breathingStats = useActivityStore(state =>
    state.getActivityStats<BreathingMeditationStats>('breathing')
  );
  const meditationStats = useActivityStore(state =>
    state.getActivityStats<BreathingMeditationStats>('meditation')
  );
  const focusStats = useActivityStore(state =>
    state.getActivityStats<FocusStats>('focus')
  );
  const gratitudeStats = useActivityStore(state =>
    state.getActivityStats<JournalingStats>('gratitude')
  );

  // Only run date formatting on the client side to avoid hydration mismatch
  useEffect(() => {
    setIsClient(true);

    // Now it's safe to format dates on the client
    if (stats?.lastUsedDate) {
      setFormattedLastActive(formatDate(stats.lastUsedDate));
    }
  }, [stats?.lastUsedDate]);

  // Animate progress bar
  useEffect(() => {
    if (isClient) {
      const timer = setTimeout(() => {
        setProgressAnimation(completionPercentage);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isClient]);

  const formatDate = date => {
    if (!date) return 'Today';

    const d = new Date(date);
    const now = new Date();
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);

    if (d.toDateString() === now.toDateString()) {
      return 'Today';
    } else if (d.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    }

    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  // Calculate total completion percentage
  const totalActivities = 5; // Including the new Wordle game
  const activitiesStarted = [
    breathingStats?.sessions > 0,
    meditationStats?.sessions > 0,
    focusStats?.sessions > 0,
    gratitudeStats?.totalEntries > 0,
    false, // placeholder for Wordle game
  ].filter(Boolean).length;

  const completionPercentage = Math.round(
    (activitiesStarted / totalActivities) * 100
  );

  const handleActivityStart = activityPath => {
    toast.success(`Opening ${activityPath.split('/').pop()}`, {
      description: "Let's improve your mental wellbeing!",
    });
    router.push(activityPath);
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header with welcome message */}
      <div className="py-8 px-6 mb-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold mb-2">Your Wellness Journey</h1>
          <p className="text-muted-foreground">
            Track your progress and build healthy habits for better mental
            wellbeing
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 pb-8">
        {/* Summary Section */}
        <div className="mb-10">
          <div className="flex items-center mb-6">
            <div className="relative h-2 w-full bg-secondary rounded-full overflow-hidden">
              <div
                className="absolute top-0 left-0 h-full bg-primary"
                style={{ width: `${progressAnimation}%` }}
              ></div>
            </div>
            <span className="ml-4 text-lg font-semibold">
              {completionPercentage}%
            </span>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="bg-card border-border shadow-sm">
              <CardContent className="pt-6">
                <div className="flex mb-3">
                  <div className="bg-primary/10 rounded-full p-2 mr-3">
                    <TrendingUp className="h-5 w-5" />
                  </div>
                  <div className="text-muted-foreground text-sm">
                    Total Sessions
                  </div>
                </div>
                <div className="text-3xl font-bold">
                  {stats?.totalSessions || 52}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card border-border shadow-sm">
              <CardContent className="pt-6">
                <div className="flex mb-3">
                  <div className="bg-primary/10 rounded-full p-2 mr-3">
                    <Timer className="h-5 w-5" />
                  </div>
                  <div className="text-muted-foreground text-sm">
                    Minutes Practiced
                  </div>
                </div>
                <div className="text-3xl font-bold">
                  {stats?.totalMinutes || 158}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card border-border shadow-sm">
              <CardContent className="pt-6">
                <div className="flex mb-3">
                  <div className="bg-primary/10 rounded-full p-2 mr-3">
                    <Award className="h-5 w-5" />
                  </div>
                  <div className="text-muted-foreground text-sm">
                    Day Streak
                  </div>
                </div>
                <div className="flex items-end">
                  <div className="text-3xl font-bold">
                    {dailyStreak || 1}
                  </div>
                  {dailyStreak > 0 && isClient && (
                    <div className="ml-2 mb-1 bg-amber-500 text-black text-xs px-2 py-0.5 rounded-full font-semibold">
                      🔥 Active
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card border-border shadow-sm">
              <CardContent className="pt-6">
                <div className="flex mb-3">
                  <div className="bg-primary/10 rounded-full p-2 mr-3">
                    <Calendar className="h-5 w-5" />
                  </div>
                  <div className="text-muted-foreground text-sm">
                    Last Activity
                  </div>
                </div>
                <div className="text-3xl font-bold">
                  {isClient ? formattedLastActive : 'Today'}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Tabs Navigation */}
        <Tabs defaultValue="activities" className="mb-10">
          <TabsList className="mb-6 bg-card w-full justify-start border-b rounded-none p-0 h-auto">
            <TabsTrigger
              value="activities"
              className="py-3 px-6 rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:bg-transparent"
            >
              <ListTodo className="h-4 w-4 mr-2" />
              Activities
            </TabsTrigger>
            <TabsTrigger
              value="recommendations"
              className="py-3 px-6 rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:bg-transparent"
            >
              <Compass className="h-4 w-4 mr-2" />
              Recommendations
            </TabsTrigger>
            <TabsTrigger
              value="progress"
              className="py-3 px-6 rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:bg-transparent"
            >
              <BarChart3 className="h-4 w-4 mr-2" />
              Your Progress
            </TabsTrigger>
          </TabsList>

          {/* Activities Tab */}
          <TabsContent value="activities" className="space-y-6">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center">
                <h2 className="text-2xl font-bold">Wellness Activities</h2>
                <Badge className="ml-3 bg-primary/10 text-xs px-3 py-1 border border-primary/20 text-primary font-semibold">
                  5 activities
                </Badge>
              </div>
              <Button
                variant="ghost"
                className="text-sm text-primary hover:text-primary/80"
              >
                View All <AlignJustify className="ml-2 h-4 w-4" />
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-2 gap-5">
              {/* Breathing Exercises Card */}
              <Card className="bg-card border-border shadow-sm hover:shadow-md transition-shadow">
                <div className="h-1 w-full bg-blue-600"></div>
                <CardContent className="pt-6">
                  <div className="flex flex-col items-center text-center mb-4">
                    <div className="w-14 h-14 rounded-full bg-blue-500/10 flex items-center justify-center mb-3">
                      <Wind className="h-7 w-7 text-blue-500" />
                    </div>
                    <h3 className="font-semibold text-lg">Breathing</h3>
                    <p className="text-muted-foreground text-sm mt-2 mb-4">
                      Guided breathing techniques for stress relief
                    </p>
                  </div>

                  <div className="space-y-3 mb-5">
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Sessions</span>
                      <span className="font-medium">
                        {breathingStats?.sessions || 0}
                      </span>
                    </div>
                    <Progress
                      value={breathingStats?.sessions || 0}
                      max={20}
                      className="h-1 bg-muted"
                    />

                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Minutes</span>
                      <span className="font-medium">
                        {breathingStats?.totalMinutes || 0}
                      </span>
                    </div>
                    <Progress
                      value={breathingStats?.totalMinutes || 0}
                      max={60}
                      className="h-1 bg-muted"
                    />
                  </div>

                  <Button
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                    onClick={() => handleActivityStart('/wellness/breathing')}
                  >
                    Start Activity
                  </Button>
                </CardContent>
              </Card>

              {/* Meditation Card */}
              <Card className="bg-card border-border shadow-sm hover:shadow-md transition-shadow">
                <div className="h-1 w-full bg-indigo-600"></div>
                <CardContent className="pt-6">
                  <div className="flex flex-col items-center text-center mb-4">
                    <div className="w-14 h-14 rounded-full bg-indigo-500/10 flex items-center justify-center mb-3">
                      <Moon className="h-7 w-7 text-indigo-500" />
                    </div>
                    <h3 className="font-semibold text-lg">Meditation</h3>
                    <p className="text-muted-foreground text-sm mt-2 mb-4">
                      Mindfulness practices for relaxation
                    </p>
                  </div>

                  <div className="space-y-3 mb-5">
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Sessions</span>
                      <span className="font-medium">
                        {meditationStats?.sessions || 0}
                      </span>
                    </div>
                    <Progress
                      value={meditationStats?.sessions || 0}
                      max={20}
                      className="h-1 bg-muted"
                    />

                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Minutes</span>
                      <span className="font-medium">
                        {meditationStats?.totalMinutes || 0}
                      </span>
                    </div>
                    <Progress
                      value={meditationStats?.totalMinutes || 0}
                      max={60}
                      className="h-1 bg-muted"
                    />
                  </div>

                  <Button
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white"
                    onClick={() => handleActivityStart('/wellness/meditation')}
                  >
                    Start Activity
                  </Button>
                </CardContent>
              </Card>

              {/* Focus Games Card */}
              <Card className="bg-card border-border shadow-sm hover:shadow-md transition-shadow">
                <div className="h-1 w-full bg-purple-600"></div>
                <CardContent className="pt-6">
                  <div className="flex flex-col items-center text-center mb-4">
                    <div className="w-14 h-14 rounded-full bg-purple-500/10 flex items-center justify-center mb-3">
                      <Brain className="h-7 w-7 text-purple-500" />
                    </div>
                    <h3 className="font-semibold text-lg">Focus Games</h3>
                    <p className="text-muted-foreground text-sm mt-2 mb-4">
                      Games to improve cognitive abilities
                    </p>
                  </div>

                  <div className="space-y-3 mb-5">
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Sessions</span>
                      <span className="font-medium">
                        {focusStats?.sessions || 0}
                      </span>
                    </div>
                    <Progress
                      value={focusStats?.sessions || 0}
                      max={20}
                      className="h-1 bg-muted"
                    />

                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>High Score</span>
                      <span className="font-medium">
                        {focusStats?.highScore || 0}
                      </span>
                    </div>
                    <Progress
                      value={focusStats?.highScore || 0}
                      max={500}
                      className="h-1 bg-muted"
                    />
                  </div>

                  <Button
                    className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                    onClick={() => handleActivityStart('/wellness/focus-games')}
                  >
                    Start Activity
                  </Button>
                </CardContent>
              </Card>

              {/* Gratitude Journal Card */}
              <Card className="bg-card border-border shadow-sm hover:shadow-md transition-shadow">
                <div className="h-1 w-full bg-pink-600"></div>
                <CardContent className="pt-6">
                  <div className="flex flex-col items-center text-center mb-4">
                    <div className="w-14 h-14 rounded-full bg-pink-500/10 flex items-center justify-center mb-3">
                      <Heart className="h-7 w-7 text-pink-500" />
                    </div>
                    <h3 className="font-semibold text-lg">Gratitude</h3>
                    <p className="text-muted-foreground text-sm mt-2 mb-4">
                      Journal to cultivate appreciation
                    </p>
                  </div>

                  <div className="space-y-3 mb-5">
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Entries</span>
                      <span className="font-medium">
                        {gratitudeStats?.totalEntries || 0}
                      </span>
                    </div>
                    <Progress
                      value={gratitudeStats?.totalEntries || 0}
                      max={20}
                      className="h-1 bg-muted"
                    />

                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Streak</span>
                      <span className="font-medium">
                        {gratitudeStats?.streak || 0} days
                      </span>
                    </div>
                    <Progress
                      value={gratitudeStats?.streak || 0}
                      max={10}
                      className="h-1 bg-muted"
                    />
                  </div>

                  <Button
                    className="w-full bg-pink-600 hover:bg-pink-700 text-white"
                    onClick={() => handleActivityStart('/wellness/gratitude')}
                  >
                    Start Activity
                  </Button>
                </CardContent>
              </Card>

              {/* New Wordle Game Card */}
              <Card className="bg-card border-border shadow-sm hover:shadow-md transition-shadow">
                <div className="h-1 w-full bg-emerald-600"></div>
                <CardContent className="pt-6">
                  <div className="flex flex-col items-center text-center mb-4">
                    <div className="w-14 h-14 rounded-full bg-emerald-500/10 flex items-center justify-center mb-3">
                      <Gamepad2 className="h-7 w-7 text-emerald-500" />
                    </div>
                    <h3 className="font-semibold text-lg">Wordle</h3>
                    <p className="text-muted-foreground text-sm mt-2 mb-4">
                      Word puzzle to train your brain
                    </p>
                    <Badge className="bg-emerald-500/10 text-emerald-500 mb-2">
                      New!
                    </Badge>
                  </div>

                  <div className="space-y-3 mb-5">
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Games</span>
                      <span className="font-medium">0</span>
                    </div>
                    <Progress value={0} max={20} className="h-1 bg-muted" />

                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Wins</span>
                      <span className="font-medium">0</span>
                    </div>
                    <Progress value={0} max={10} className="h-1 bg-muted" />
                  </div>

                  <Button
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                    onClick={() => handleActivityStart('/wellness/wordle')}
                  >
                    Start Activity
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Recommendations Tab */}
          <TabsContent value="recommendations">
            <div className="space-y-6">
              <h2 className="text-2xl font-bold mb-6">
                Personalized Recommendations
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Morning Recommendation */}
                <Card className="border-border shadow-sm">
                  <CardHeader>
                    <Badge className="w-fit mb-2 bg-blue-500/10 text-blue-500">
                      Morning Routine
                    </Badge>
                    <CardTitle>Start Your Day Mindfully</CardTitle>
                    <CardDescription>
                      Set a positive tone for your day with these activities
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center gap-3 bg-muted/40 p-3 rounded-lg">
                      <Wind className="h-5 w-5 text-blue-500" />
                      <div>
                        <p className="font-medium">5-Minute Breathing</p>
                        <p className="text-sm text-muted-foreground">
                          Reduce stress and improve focus
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 bg-muted/40 p-3 rounded-lg">
                      <Heart className="h-5 w-5 text-blue-500" />
                      <div>
                        <p className="font-medium">Gratitude Practice</p>
                        <p className="text-sm text-muted-foreground">
                          Write three things you're grateful for
                        </p>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                      onClick={() => handleActivityStart('/wellness/breathing')}
                    >
                      Start Morning Routine
                    </Button>
                  </CardFooter>
                </Card>

                {/* Evening Recommendation */}
                <Card className="border-border shadow-sm">
                  <CardHeader>
                    <Badge className="w-fit mb-2 bg-purple-500/10 text-purple-500">
                      Evening Wind Down
                    </Badge>
                    <CardTitle>Prepare for Restful Sleep</CardTitle>
                    <CardDescription>
                      Calm your mind and body before bedtime
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center gap-3 bg-muted/40 p-3 rounded-lg">
                      <Moon className="h-5 w-5 text-purple-500" />
                      <div>
                        <p className="font-medium">Sleep Meditation</p>
                        <p className="text-sm text-muted-foreground">
                          10-minute guided relaxation
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 bg-muted/40 p-3 rounded-lg">
                      <Sparkles className="h-5 w-5 text-purple-500" />
                      <div>
                        <p className="font-medium">Bedtime Reflection</p>
                        <p className="text-sm text-muted-foreground">
                          Review your day's accomplishments
                        </p>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button
                      className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                      onClick={() =>
                        handleActivityStart('/wellness/meditation')
                      }
                    >
                      Start Evening Routine
                    </Button>
                  </CardFooter>
                </Card>
              </div>

              {/* Featured Activity */}
              <Card className="border-border shadow-sm mt-6">
                <CardHeader>
                  <Badge className="w-fit mb-2 bg-emerald-500/10 text-emerald-500">
                    Featured Activity
                  </Badge>
                  <CardTitle className="flex items-center gap-2">
                    <Gamepad2 className="h-5 w-5 text-emerald-500" />
                    Try Our New Wordle Game
                  </CardTitle>
                  <CardDescription>
                    Challenge your vocabulary and problem-solving skills
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-4">
                    Our new Wordle game combines fun with cognitive benefits:
                  </p>
                  <ul className="space-y-2">
                    <li className="flex items-start gap-2">
                      <div className="mt-1 h-2 w-2 rounded-full bg-emerald-500"></div>
                      <span>Improves vocabulary and language skills</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="mt-1 h-2 w-2 rounded-full bg-emerald-500"></div>
                      <span>Enhances logical thinking and deduction</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="mt-1 h-2 w-2 rounded-full bg-emerald-500"></div>
                      <span>Provides a daily mental challenge</span>
                    </li>
                  </ul>
                </CardContent>
                <CardFooter>
                  <Button
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                    onClick={() => handleActivityStart('/wellness/wordle')}
                  >
                    Try Wordle Now
                  </Button>
                </CardFooter>
              </Card>
            </div>
          </TabsContent>

          {/* Progress Tab */}
          <TabsContent value="progress">
            <div className="space-y-6">
              <h2 className="text-2xl font-bold mb-6">
                Your Wellness Progress
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="border-border shadow-sm">
                  <CardHeader>
                    <CardTitle>Activity Breakdown</CardTitle>
                    <CardDescription>
                      How you're spending your wellness time
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center">
                            <div className="w-3 h-3 rounded-full bg-blue-500 mr-2"></div>
                            <span>Breathing</span>
                          </div>
                          <span className="text-sm text-muted-foreground">
                            {breathingStats?.totalMinutes || 0} min
                          </span>
                        </div>
                        <Progress
                          value={breathingStats?.totalMinutes || 0}
                          max={stats?.totalMinutes || 100}
                          className="h-2"
                        />
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center">
                            <div className="w-3 h-3 rounded-full bg-indigo-500 mr-2"></div>
                            <span>Meditation</span>
                          </div>
                          <span className="text-sm text-muted-foreground">
                            {meditationStats?.totalMinutes || 0} min
                          </span>
                        </div>
                        <Progress
                          value={meditationStats?.totalMinutes || 0}
                          max={stats?.totalMinutes || 100}
                          className="h-2"
                        />
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center">
                            <div className="w-3 h-3 rounded-full bg-purple-500 mr-2"></div>
                            <span>Focus Games</span>
                          </div>
                          <span className="text-sm text-muted-foreground">
                            {focusStats?.sessions || 0} sessions
                          </span>
                        </div>
                        <Progress
                          value={focusStats?.sessions || 0}
                          max={20}
                          className="h-2"
                        />
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center">
                            <div className="w-3 h-3 rounded-full bg-pink-500 mr-2"></div>
                            <span>Gratitude</span>
                          </div>
                          <span className="text-sm text-muted-foreground">
                            {gratitudeStats?.totalEntries || 0} entries
                          </span>
                        </div>
                        <Progress
                          value={gratitudeStats?.totalEntries || 0}
                          max={20}
                          className="h-2"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-border shadow-sm">
                  <CardHeader>
                    <CardTitle>Weekly Goals</CardTitle>
                    <CardDescription>
                      Your progress toward weekly wellness targets
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span>Total Sessions</span>
                          <span className="text-sm text-muted-foreground">
                            {stats?.totalSessions || 0}/10 sessions
                          </span>
                        </div>
                        <Progress
                          value={stats?.totalSessions || 0}
                          max={10}
                          className="h-2"
                        />
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span>Mindfulness Minutes</span>
                          <span className="text-sm text-muted-foreground">
                            {stats?.totalMinutes || 0}/120 minutes
                          </span>
                        </div>
                        <Progress
                          value={stats?.totalMinutes || 0}
                          max={120}
                          className="h-2"
                        />
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span>Activities Tried</span>
                          <span className="text-sm text-muted-foreground">
                            {activitiesStarted}/5 activities
                          </span>
                        </div>
                        <Progress
                          value={activitiesStarted}
                          max={5}
                          className="h-2"
                        />
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span>Daily Streak</span>
                          <span className="text-sm text-muted-foreground">
                            {dailyStreak || 0}/7 days
                          </span>
                        </div>
                        <Progress
                          value={dailyStreak || 0}
                          max={7}
                          className="h-2"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default WellnessContent;
