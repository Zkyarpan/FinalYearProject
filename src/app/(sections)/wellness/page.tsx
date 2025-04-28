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
  Wind,
  Moon,
  Brain,
  Heart,
  Gamepad2,
  Calendar,
  CheckCircle,
  Award,
  Clock,
  Sparkles,
  Sun,
  Plus,
  Star,
  Sunrise,
  Sunset,
  ArrowRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';

// Custom activity card component
interface ActivityStats {
  sessions?: number;
  totalMinutes?: number;
  highScore?: number;
  totalEntries?: number;
}

const ActivityCard = ({
  icon: Icon,
  title,
  description,
  color,
  stats = {} as ActivityStats,
  onClick,
  isNew = false,
}) => {
  return (
    <div
      onClick={onClick}
      className={`relative overflow-hidden rounded-2xl transition-all duration-300 cursor-pointer
                  hover:shadow-lg hover:-translate-y-1 bg-gradient-to-br from-white to-${color}-50 dark:from-gray-800 dark:to-${color}-900/30`}
      style={{ boxShadow: `0 4px 20px rgba(0, 0, 0, 0.05)` }}
    >
      <div className={`absolute top-0 left-0 w-full h-1 bg-${color}-500`}></div>
      {isNew && (
        <span
          className={`absolute top-3 right-3 text-xs font-medium px-2 py-1 rounded-full bg-${color}-500 text-white`}
        >
          NEW
        </span>
      )}
      <div className="p-6">
        <div
          className={`w-14 h-14 rounded-full bg-${color}-500/10 flex items-center justify-center mb-4`}
        >
          <Icon className={`h-7 w-7 text-${color}-500`} />
        </div>

        <h3 className="text-xl font-bold mb-2">{title}</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">
          {description}
        </p>

        {stats.sessions !== undefined && (
          <div className="space-y-4 mb-6">
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-gray-500 dark:text-gray-400">
                  Sessions
                </span>
                <span className="font-medium">{stats.sessions || 0}</span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-gray-100 dark:bg-gray-700 overflow-hidden">
                <div
                  className={`h-full bg-${color}-500 rounded-full`}
                  style={{
                    width: `${Math.min(100, ((stats.sessions || 0) / 20) * 100)}%`,
                  }}
                ></div>
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-gray-500 dark:text-gray-400">
                  {stats.totalMinutes !== undefined
                    ? 'Minutes'
                    : stats.highScore !== undefined
                      ? 'High Score'
                      : stats.totalEntries !== undefined
                        ? 'Entries'
                        : 'Progress'}
                </span>
                <span className="font-medium">
                  {stats.totalMinutes !== undefined
                    ? stats.totalMinutes
                    : stats.highScore !== undefined
                      ? stats.highScore
                      : stats.totalEntries !== undefined
                        ? stats.totalEntries
                        : 0}
                </span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-gray-100 dark:bg-gray-700 overflow-hidden">
                <div
                  className={`h-full bg-${color}-500 rounded-full`}
                  style={{
                    width: `${Math.min(
                      100,
                      (stats.totalMinutes !== undefined
                        ? stats.totalMinutes / 60
                        : stats.highScore !== undefined
                          ? stats.highScore / 500
                          : stats.totalEntries !== undefined
                            ? stats.totalEntries / 20
                            : 0) * 100
                    )}%`,
                  }}
                ></div>
              </div>
            </div>
          </div>
        )}

        <Button
          className={`w-full relative overflow-hidden group bg-${color}-500 hover:bg-${color}-600 text-white font-medium`}
        >
          <span className="relative z-10">Start Activity</span>
          <span
            className={`absolute right-4 opacity-0 group-hover:opacity-100 group-hover:right-2 transition-all duration-300`}
          >
            <ArrowRight className="h-4 w-4" />
          </span>
          <span className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 transition-opacity duration-300"></span>
        </Button>
      </div>
    </div>
  );
};

// Suggestion card component
const SuggestionCard = ({ time, title, activities, color, icon: Icon }) => {
  return (
    <div
      className={`rounded-2xl overflow-hidden bg-white dark:bg-gray-800 shadow-md border border-${color}-100 dark:border-${color}-900/30`}
    >
      <div
        className={`px-6 py-5 border-b border-${color}-100 dark:border-${color}-800/30 flex items-center gap-4`}
      >
        <div
          className={`w-10 h-10 rounded-full bg-${color}-500/10 flex items-center justify-center`}
        >
          <Icon className={`h-5 w-5 text-${color}-500`} />
        </div>
        <div>
          <div className={`text-sm font-medium text-${color}-500 mb-1`}>
            {time}
          </div>
          <h3 className="text-lg font-bold">{title}</h3>
        </div>
      </div>

      <div className="px-6 py-4 space-y-3">
        {activities.map((activity, index) => (
          <div key={index} className="flex items-center gap-3">
            <div
              className={`w-8 h-8 rounded-full bg-${color}-500/10 flex items-center justify-center flex-shrink-0`}
            >
              {activity.icon}
            </div>
            <div>
              <div className="font-medium text-sm">{activity.name}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                {activity.description}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="px-6 pb-5 pt-2">
        <Button
          className={`w-full bg-${color}-500 hover:bg-${color}-600 text-white font-medium`}
        >
          Start Routine
        </Button>
      </div>
    </div>
  );
};

// Define the trend interface
interface TrendData {
  icon: string;
  value: string;
  color: string;
}

// Stat card component
const StatCard = ({
  icon: Icon,
  title,
  value,
  color,
  suffix = '',
  trend = null as TrendData | null,
}) => {
  return (
    <div className="rounded-2xl bg-white  shadow-md overflow-hidden">
      <div className="p-5">
        <div className="flex justify-between items-start mb-4">
          <div
            className={`w-10 h-10 rounded-full bg-${color}-500/10 flex items-center justify-center`}
          >
            <Icon className={`h-5 w-5 text-${color}-500`} />
          </div>
          {trend && (
            <Badge
              className={`text-xs font-medium bg-${trend.color}-500/10 text-${trend.color}-500 px-2 py-1`}
            >
              {trend.icon} {trend.value}
            </Badge>
          )}
        </div>

        <div className="space-y-1">
          <div className="text-sm text-gray-500 dark:text-gray-400">
            {title}
          </div>
          <div className="text-2xl font-bold flex items-baseline">
            {value}
            {suffix && (
              <span className="text-sm text-gray-500 dark:text-gray-400 ml-1">
                {suffix}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const WellnessContent = () => {
  const router = useRouter();
  const [isClient, setIsClient] = useState(false);
  const [formattedLastActive, setFormattedLastActive] = useState('Today');
  const [selectedCategory, setSelectedCategory] = useState('all');

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

  // Only run date formatting on the client side to avoid hydration mismatch
  useEffect(() => {
    setIsClient(true);

    // Now it's safe to format dates on the client
    if (stats?.lastUsedDate) {
      setFormattedLastActive(formatDate(stats.lastUsedDate));
    }
  }, [stats?.lastUsedDate]);

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

  const handleActivityStart = activityPath => {
    toast.success(`Opening ${activityPath.split('/').pop()}`, {
      description: "Let's improve your mental wellbeing!",
      position: 'top-center',
    });
    router.push(activityPath);
  };

  // Calculate percentage for achievements
  const achievementPercentage = Math.floor(
    (activitiesStarted / totalActivities) * 100
  );

  return (
    <div className="min-h-screen">
      {/* Header with glass effect */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-700 opacity-80 dark:from-blue-800 dark:to-indigo-900"></div>

        {/* Decorative elements */}
        <div className="absolute -top-12 -right-12 w-64 h-64 rounded-full bg-indigo-500 opacity-20 blur-3xl"></div>
        <div className="absolute top-20 -left-12 w-48 h-48 rounded-full bg-blue-400 opacity-20 blur-3xl"></div>

        <div className="relative container mx-auto px-6 py-16">
          <div className="max-w-2xl">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Your Wellness Sanctuary
            </h1>
            <p className="text-blue-100 text-lg mb-6">
              Take a mindful break to nurture your mental wellbeing and build
              lasting healthy habits
            </p>

            <div className="flex flex-wrap gap-3">
              <Button
                className="bg-white text-blue-700 hover:bg-blue-50 font-medium"
                onClick={() => handleActivityStart('/wellness/meditation')}
              >
                <Moon className="h-4 w-4 mr-2" />
                Try Meditation
              </Button>
              <Button
                variant="ghost"
                className="bg-blue-700/20 text-white hover:bg-blue-700/30"
                onClick={() => handleActivityStart('/wellness/breathing')}
              >
                <Wind className="h-4 w-4 mr-2" />
                Quick Breathing
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* User progress panel with glass effect */}
      <div className="container mx-auto px-6 -mt-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-12">
          <div className="md:col-span-3 bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg relative overflow-hidden">
            <div className="absolute -right-6 -top-6 w-32 h-32 rounded-full bg-blue-100/50 dark:bg-blue-900/20"></div>
            <div className="absolute -left-6 -bottom-6 w-24 h-24 rounded-full bg-indigo-100/50 dark:bg-indigo-900/20"></div>

            <div className="relative">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold">Your Journey Progress</h2>
                <Badge className="bg-blue-500/10 text-blue-500 font-medium px-3 py-1.5">
                  {completionPercentage}% Complete
                </Badge>
              </div>

              <div className="h-2 w-full bg-gray-100 dark:bg-gray-700 rounded-full mb-6 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full transition-all duration-1000 ease-out"
                  style={{ width: `${completionPercentage}%` }}
                ></div>
              </div>

              {/* Achievements/milestones */}
              <div className="relative">
                <div className="absolute top-3 left-0 w-full h-0.5 bg-gray-100 dark:bg-gray-700"></div>
                <div className="flex justify-between relative z-10">
                  {[0, 25, 50, 75, 100].map(milestone => (
                    <div
                      key={milestone}
                      className={`flex flex-col items-center ${milestone <= completionPercentage ? 'opacity-100' : 'opacity-50'}`}
                    >
                      <div
                        className={`w-6 h-6 rounded-full flex items-center justify-center mb-2
                                   ${
                                     milestone <= completionPercentage
                                       ? 'bg-indigo-600 text-white'
                                       : 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500'
                                   }`}
                      >
                        {milestone <= completionPercentage ? (
                          <CheckCircle className="h-4 w-4" />
                        ) : null}
                      </div>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {milestone}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard
                  icon={CheckCircle}
                  title="Sessions Completed"
                  value={stats?.totalSessions || 52}
                  color="blue"
                  trend={{ icon: '↑', value: '8% more', color: 'green' }}
                />

                <StatCard
                  icon={Clock}
                  title="Mindfulness Minutes"
                  value={stats?.totalMinutes || 158}
                  suffix="min"
                  color="indigo"
                />

                <StatCard
                  icon={Award}
                  title="Current Streak"
                  value={dailyStreak || 1}
                  suffix="days"
                  color="amber"
                  trend={{ icon: '🔥', value: 'Active', color: 'amber' }}
                />

                <StatCard
                  icon={Calendar}
                  title="Last Activity"
                  value={isClient ? formattedLastActive : 'Today'}
                  color="violet"
                />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg relative overflow-hidden">
            <div className="absolute -right-6 -bottom-6 w-24 h-24 rounded-full bg-amber-100/50 dark:bg-amber-900/20"></div>

            <div className="relative">
              <h2 className="text-xl font-bold mb-4">Daily Challenge</h2>

              <div className="mb-6">
                <div className="w-16 h-16 rounded-full bg-amber-500/10 flex items-center justify-center mb-4 mx-auto">
                  <Star className="h-8 w-8 text-amber-500" />
                </div>

                <div className="text-center mb-4">
                  <h3 className="font-bold">Mindful Reflection</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Complete today for +1 to your streak
                  </p>
                </div>
              </div>

              <Button className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-medium">
                Start Challenge
              </Button>
            </div>
          </div>
        </div>

        {/* Activity Categories */}
        <div className="mb-10">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">Wellness Activities</h2>
            <div className="flex overflow-x-auto scrollbar-hide space-x-2">
              {['all', 'mindfulness', 'focus', 'reflection', 'games'].map(
                category => (
                  <Button
                    key={category}
                    variant={
                      selectedCategory === category ? 'default' : 'outline'
                    }
                    className={`${
                      selectedCategory === category
                        ? 'bg-blue-600 text-white'
                        : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300'
                    } rounded-full text-sm`}
                    onClick={() => setSelectedCategory(category)}
                  >
                    {category.charAt(0).toUpperCase() + category.slice(1)}
                  </Button>
                )
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <ActivityCard
              icon={Wind}
              title="Breathing Exercises"
              description="Guided techniques to reduce stress and find calm"
              color="blue"
              stats={breathingStats || { sessions: 0, totalMinutes: 0 }}
              onClick={() => handleActivityStart('/wellness/breathing')}
            />

            <ActivityCard
              icon={Moon}
              title="Meditation"
              description="Mindfulness practices for inner peace and clarity"
              color="indigo"
              stats={meditationStats || { sessions: 0, totalMinutes: 0 }}
              onClick={() => handleActivityStart('/wellness/meditation')}
            />

            <ActivityCard
              icon={Brain}
              title="Focus Games"
              description="Train your mind with cognitive challenges"
              color="purple"
              stats={focusStats || { sessions: 0, highScore: 0 }}
              onClick={() => handleActivityStart('/wellness/focus-games')}
            />

            <ActivityCard
              icon={Heart}
              title="Gratitude Journal"
              description="Cultivate appreciation and positive thinking"
              color="pink"
              stats={gratitudeStats || { sessions: 0, totalEntries: 0 }}
              onClick={() => handleActivityStart('/wellness/gratitude')}
            />

            <ActivityCard
              icon={Gamepad2}
              title="Wordle Game"
              description="Word puzzles to stimulate your vocabulary"
              color="emerald"
              stats={{ sessions: 0 }}
              onClick={() => handleActivityStart('/wellness/wordle')}
              isNew={true}
            />

            {/* Empty card for adding more activities */}
            <div
              className="rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-700 flex flex-col items-center justify-center p-6 cursor-pointer hover:border-blue-500 dark:hover:border-blue-500 transition-colors"
              onClick={() => toast.info('More activities coming soon!')}
            >
              <div className="w-14 h-14 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
                <Plus className="h-7 w-7 text-gray-400 dark:text-gray-500" />
              </div>
              <h3 className="text-lg font-medium text-gray-600 dark:text-gray-400">
                Discover More
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-500 text-center mt-2">
                New wellness activities coming soon
              </p>
            </div>
          </div>
        </div>

        {/* Personalized Suggestions */}
        <div className="mb-10">
          <h2 className="text-2xl font-bold mb-6">Personalized Routines</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <SuggestionCard
              time="Morning Routine"
              title="Start Your Day Mindfully"
              color="amber"
              icon={Sunrise}
              activities={[
                {
                  icon: <Wind className="h-4 w-4 text-amber-500" />,
                  name: '5-Minute Breathing',
                  description: 'Energize your body and clear your mind',
                },
                {
                  icon: <Heart className="h-4 w-4 text-amber-500" />,
                  name: 'Gratitude Practice',
                  description: "Write down three things you're grateful for",
                },
              ]}
            />

            <SuggestionCard
              time="Evening Wind Down"
              title="Prepare for Restful Sleep"
              color="indigo"
              icon={Sunset}
              activities={[
                {
                  icon: <Moon className="h-4 w-4 text-indigo-500" />,
                  name: 'Sleep Meditation',
                  description: '10-minute guided relaxation',
                },
                {
                  icon: <Sparkles className="h-4 w-4 text-indigo-500" />,
                  name: 'Reflection Journal',
                  description: "Review your day's achievements",
                },
              ]}
            />
          </div>
        </div>

        {/* Featured Activity */}
        <div className="mb-10">
          <div className="bg-gradient-to-r from-emerald-500 to-teal-600 rounded-2xl overflow-hidden shadow-lg">
            <div className="p-8 md:p-10 relative">
              <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full -mt-12 -mr-12"></div>
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-white opacity-5 rounded-full -mb-12 -ml-12"></div>

              <div className="md:flex items-center justify-between relative z-10">
                <div className="mb-6 md:mb-0 md:mr-8">
                  <Badge className="bg-white/20 text-white font-medium mb-4">
                    New Feature
                  </Badge>
                  <h2 className="text-3xl font-bold text-white mb-3">
                    Challenge Your Mind with Wordle
                  </h2>
                  <p className="text-emerald-100 text-lg mb-6">
                    Train your brain with our daily word puzzle game. Enhance
                    vocabulary while having fun!
                  </p>
                  <Button
                    className="bg-white text-emerald-600 hover:bg-emerald-50 font-medium px-6"
                    onClick={() => handleActivityStart('/wellness/wordle')}
                  >
                    Try Wordle Now
                  </Button>
                </div>

                <div className="bg-white/10 rounded-xl p-6 backdrop-blur-sm border border-white/20 w-full md:w-auto">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center">
                      <Gamepad2 className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-white font-bold text-lg">
                        Wordle Benefits
                      </h3>
                      <p className="text-emerald-100 text-sm">
                        Mental exercise in just minutes
                      </p>
                    </div>
                  </div>

                  <ul className="space-y-3">
                    <li className="flex items-start text-emerald-100">
                      <CheckCircle className="h-5 w-5 mr-2 text-emerald-300 flex-shrink-0 mt-0.5" />
                      <span>Boosts vocabulary and word recognition</span>
                    </li>
                    <li className="flex items-start text-emerald-100">
                      <CheckCircle className="h-5 w-5 mr-2 text-emerald-300 flex-shrink-0 mt-0.5" />
                      <span>Improves logical thinking and deduction</span>
                    </li>
                    <li className="flex items-start text-emerald-100">
                      <CheckCircle className="h-5 w-5 mr-2 text-emerald-300 flex-shrink-0 mt-0.5" />
                      <span>Creates a daily moment of focus</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer with tips */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-md mb-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center">
              <Sparkles className="h-5 w-5 text-blue-500" />
            </div>
            <h2 className="text-xl font-bold">Wellness Tip of the Day</h2>
          </div>

          <p className="text-gray-700 dark:text-gray-300">
            "Taking just 5 minutes to practice mindfulness each day can
            significantly reduce stress levels and improve focus. Try
            incorporating a quick breathing exercise into your morning routine
            to set a positive tone for the day."
          </p>
        </div>
      </div>
    </div>
  );
};

export default WellnessContent;
