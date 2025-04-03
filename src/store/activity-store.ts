// store/activity-store.ts
'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Activity history entry
export interface ActivityHistoryEntry {
  date: string;
  minutes: number;
  exercise?: string;
  score?: number;
  entryLength?: number;
  category?: string;
  [key: string]: any;
}

// Base interface for all activity types
interface BaseActivityStats {
  lastUsed: string | null;
  totalMinutes: number;
  sessions: number;
  streak: number;
  lastStreak: number;
  bestStreak: number;
  history: ActivityHistoryEntry[];
}

// Breathing and meditation activities
export interface BreathingMeditationStats extends BaseActivityStats {
  favoriteExercise: string | null;
}

// Focus games activities
export interface FocusStats extends BaseActivityStats {
  highScore: number;
  totalScore: number;
}

// Gratitude and journaling activities
export interface JournalingStats extends BaseActivityStats {
  totalEntries: number;
}

// Mood tracking activity
export interface MoodStats {
  lastUsed: string | null;
  entries: number;
  history: ActivityHistoryEntry[];
}

// Overall statistics
export interface OverallStats {
  totalMinutes: number;
  totalSessions: number;
  lastActivity: string | null;
  startDate: string;
  activeDays: string[];
  lastUsedDate: string | null;
}

// Daily activity summary
export interface DailySummary {
  day: string;
  date: string;
  minutes: number;
  activities: number;
}

// Activity data for logging
export interface ActivityData {
  minutes?: number;
  exercise?: string;
  score?: number;
  category?: string;
  entryLength?: number;
  [key: string]: any;
}

// Main activities record
export interface ActivitiesRecord {
  breathing: BreathingMeditationStats;
  meditation: BreathingMeditationStats;
  focus: FocusStats;
  gratitude: JournalingStats;
  journaling: JournalingStats;
  mood: MoodStats;
  [key: string]: any;
}

// Main state interface
interface ActivityState {
  activities: ActivitiesRecord;
  stats: OverallStats;
  dailyStreak: number;
  lastUsedDate: string | null;

  // Methods
  logActivity: (activity: string, data: ActivityData) => void;
  getActivityStats: <T>(activity: string) => T;
  getOverallStats: () => OverallStats;
  getDailyStreak: () => number;
  hasCompletedToday: (activity: string) => boolean;
  getWeeklySummary: () => DailySummary[];
  getSuggestedActivity: () => string;
  resetAllData: () => void;
}

// Initial state values
const initialBreathingMeditationStats: BreathingMeditationStats = {
  lastUsed: null,
  totalMinutes: 0,
  sessions: 0,
  streak: 0,
  lastStreak: 0,
  bestStreak: 0,
  favoriteExercise: null,
  history: [],
};

const initialFocusStats: FocusStats = {
  lastUsed: null,
  totalMinutes: 0,
  sessions: 0,
  streak: 0,
  lastStreak: 0,
  bestStreak: 0,
  highScore: 0,
  totalScore: 0,
  history: [],
};

const initialJournalingStats: JournalingStats = {
  lastUsed: null,
  totalMinutes: 0,
  sessions: 0,
  streak: 0,
  lastStreak: 0,
  bestStreak: 0,
  totalEntries: 0,
  history: [],
};

const initialMoodStats: MoodStats = {
  lastUsed: null,
  entries: 0,
  history: [],
};

const initialOverallStats: OverallStats = {
  totalMinutes: 0,
  totalSessions: 0,
  lastActivity: null,
  startDate: new Date().toISOString(),
  activeDays: [],
  lastUsedDate: null,
};

// Create the store with proper typing
export const useActivityStore = create<ActivityState>()(
  persist(
    (set, get) => ({
      // Activity data by type
      activities: {
        breathing: { ...initialBreathingMeditationStats },
        meditation: { ...initialBreathingMeditationStats },
        focus: { ...initialFocusStats },
        gratitude: { ...initialJournalingStats },
        journaling: { ...initialJournalingStats },
        mood: { ...initialMoodStats },
      },

      // Overall stats
      stats: { ...initialOverallStats },

      // Daily streak tracking
      dailyStreak: 0,
      lastUsedDate: null,

      // Log a new activity session
      logActivity: (activity: string, data: ActivityData): void => {
        const now = new Date();
        const today = now.toISOString().split('T')[0];

        set(state => {
          // Get current activity data
          const currentActivity = state.activities[activity];
          if (!currentActivity) return state; // Skip if activity type doesn't exist

          // Check if we need to update streak
          let streak = currentActivity.streak;
          let bestStreak = currentActivity.bestStreak;

          // Don't calculate streak for mood tracking
          if (activity !== 'mood') {
            // Check if this is a new day compared to lastUsed
            if (currentActivity.lastUsed) {
              const lastDate = new Date(currentActivity.lastUsed)
                .toISOString()
                .split('T')[0];

              if (lastDate !== today) {
                // New day
                const lastDateObj = new Date(lastDate);
                const yesterday = new Date(now);
                yesterday.setDate(yesterday.getDate() - 1);

                // Check if the last activity was yesterday
                if (
                  lastDateObj.toISOString().split('T')[0] ===
                  yesterday.toISOString().split('T')[0]
                ) {
                  streak += 1;
                } else {
                  // Streak broken
                  const lastStreak = streak;
                  streak = 1;

                  if (lastStreak > 0) {
                    currentActivity.lastStreak = lastStreak;
                  }
                }
              }
            } else {
              // First time using this activity
              streak = 1;
            }

            // Update best streak if current streak is better
            bestStreak = Math.max(bestStreak, streak);
          }

          // Calculate total minutes
          const minutes = data.minutes || 0;
          const totalMinutes = (currentActivity.totalMinutes || 0) + minutes;

          // Update overall stats
          const totalSessionsOverall = state.stats.totalSessions + 1;
          const totalMinutesOverall = state.stats.totalMinutes + minutes;

          // Update daily streak
          let dailyStreak = state.dailyStreak;
          const lastUsedDate = state.lastUsedDate;

          if (lastUsedDate) {
            const lastDate = new Date(lastUsedDate).toISOString().split('T')[0];

            if (lastDate !== today) {
              // New day
              const lastDateObj = new Date(lastDate);
              const yesterday = new Date(now);
              yesterday.setDate(yesterday.getDate() - 1);

              // Check if the last activity was yesterday
              if (
                lastDateObj.toISOString().split('T')[0] ===
                yesterday.toISOString().split('T')[0]
              ) {
                dailyStreak += 1;
              } else {
                // Streak broken
                dailyStreak = 1;
              }
            }
          } else {
            // First time using any activity
            dailyStreak = 1;
          }

          // Create new history entry
          const historyEntry: ActivityHistoryEntry = {
            date: now.toISOString(),
            minutes: minutes,
            ...data,
          };

          // Clone the current activity first to avoid type issues
          const updatedActivity = { ...currentActivity };

          // Update common properties
          updatedActivity.lastUsed = now.toISOString();
          updatedActivity.totalMinutes = totalMinutes;
          updatedActivity.sessions = (currentActivity.sessions || 0) + 1;

          // Update streak-related properties for non-mood activities
          if (activity !== 'mood') {
            updatedActivity.streak = streak;
            updatedActivity.bestStreak = bestStreak;
            updatedActivity.history = [
              ...(currentActivity.history || []),
              historyEntry,
            ];
          } else {
            // For mood tracking
            (updatedActivity as MoodStats).entries =
              (updatedActivity as MoodStats).entries + 1;
            updatedActivity.history = [
              ...(currentActivity.history || []),
              historyEntry,
            ];
          }

          // For specific activities, update additional fields
          if (activity === 'breathing' || activity === 'meditation') {
            if (data.exercise) {
              // Update favorite exercise based on frequency
              const exercises = updatedActivity.history
                .filter(h => h.exercise)
                .map(h => h.exercise);

              const exerciseCounts: Record<string, number> = {};
              exercises.forEach(ex => {
                if (ex) exerciseCounts[ex] = (exerciseCounts[ex] || 0) + 1;
              });

              let favoriteExercise: string | null = null;
              let maxCount = 0;

              Object.entries(exerciseCounts).forEach(([ex, count]) => {
                if (count > maxCount) {
                  maxCount = count;
                  favoriteExercise = ex;
                }
              });

              (updatedActivity as BreathingMeditationStats).favoriteExercise =
                favoriteExercise;
            }
          }

          // For focus games, update high score
          if (activity === 'focus' && data.score !== undefined) {
            (updatedActivity as FocusStats).highScore = Math.max(
              (updatedActivity as FocusStats).highScore || 0,
              data.score
            );
            (updatedActivity as FocusStats).totalScore =
              ((updatedActivity as FocusStats).totalScore || 0) + data.score;
          }

          // For journaling and gratitude, count entries
          if (activity === 'gratitude' || activity === 'journaling') {
            (updatedActivity as JournalingStats).totalEntries =
              ((updatedActivity as JournalingStats).totalEntries || 0) + 1;
          }

          // Get current active days
          const activeDaysSet = new Set([
            ...(state.stats.activeDays || []),
            today,
          ]);

          return {
            ...state,
            activities: {
              ...state.activities,
              [activity]: updatedActivity,
            },
            stats: {
              ...state.stats,
              totalMinutes: totalMinutesOverall,
              totalSessions: totalSessionsOverall,
              lastActivity: activity,
              activeDays: Array.from(activeDaysSet),
              lastUsedDate: now.toISOString(),
            },
            dailyStreak: dailyStreak,
            lastUsedDate: now.toISOString(),
          };
        });
      },

      // Fix for the activity-store.ts getActivityStats method
      getActivityStats: <T>(activity: string): T => {
        const activities = get().activities;

        // Create appropriate default objects based on activity type
        let defaultValue: any;

        if (activity === 'breathing' || activity === 'meditation') {
          defaultValue = { ...initialBreathingMeditationStats };
        } else if (activity === 'focus') {
          defaultValue = { ...initialFocusStats };
        } else if (activity === 'gratitude' || activity === 'journaling') {
          defaultValue = { ...initialJournalingStats };
        } else if (activity === 'mood') {
          defaultValue = { ...initialMoodStats };
        } else {
          defaultValue = {};
        }

        // Return actual data if it exists, otherwise return properly typed default
        return (activities[activity] || defaultValue) as T;
      },

      // Get overall stats
      getOverallStats: (): OverallStats => {
        return get().stats;
      },

      // Get daily streak
      getDailyStreak: (): number => {
        return get().dailyStreak;
      },

      // Check if user has completed an activity today
      hasCompletedToday: (activity: string): boolean => {
        const activityData = get().activities[activity];
        if (!activityData || !activityData.lastUsed) return false;

        const today = new Date().toISOString().split('T')[0];
        const lastUsed = new Date(activityData.lastUsed)
          .toISOString()
          .split('T')[0];

        return today === lastUsed;
      },

      // Get weekly activity summary
      getWeeklySummary: (): DailySummary[] => {
        const activities = get().activities;
        const now = new Date();

        // Get start of current week (Sunday)
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - now.getDay());
        startOfWeek.setHours(0, 0, 0, 0);

        // Initialize daily data
        const weekData: DailySummary[] = Array(7)
          .fill(null)
          .map((_, i) => {
            const date = new Date(startOfWeek);
            date.setDate(startOfWeek.getDate() + i);

            return {
              day: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][
                date.getDay()
              ],
              date: date.toISOString().split('T')[0],
              minutes: 0,
              activities: 0,
            };
          });

        // Populate with actual data
        Object.values(activities).forEach(activityData => {
          if (!activityData.history) return;

          activityData.history.forEach(entry => {
            if (!entry.date) return;

            const entryDate = new Date(entry.date);

            // Check if entry falls within current week
            if (entryDate >= startOfWeek && entryDate <= now) {
              const dayIndex = entryDate.getDay(); // 0 = Sunday, 6 = Saturday

              weekData[dayIndex].minutes += entry.minutes || 0;
              weekData[dayIndex].activities += 1;
            }
          });
        });

        return weekData;
      },

      // Check if should suggest an activity (not completed today)
      getSuggestedActivity: (): string => {
        const activities = get().activities;
        const suggestions: string[] = [];

        // Check which activities haven't been done today
        Object.entries(activities).forEach(([activityName, data]) => {
          if (!get().hasCompletedToday(activityName)) {
            suggestions.push(activityName);
          }
        });

        // If all activities completed today, suggest the least frequent one
        if (suggestions.length === 0) {
          const sorted = Object.entries(activities)
            .filter(([key]) => key !== 'mood') // Exclude mood from suggestions
            .sort((a, b) => {
              const sessionsA = a[1].sessions || 0;
              const sessionsB = b[1].sessions || 0;
              return sessionsA - sessionsB;
            });

          return sorted.length > 0 ? sorted[0][0] : 'breathing'; // Default to breathing if no data
        }

        // Otherwise return a random suggestion from the incomplete activities
        return suggestions[Math.floor(Math.random() * suggestions.length)];
      },

      // Reset all data (for testing)
      resetAllData: (): void => {
        set({
          activities: {
            breathing: { ...initialBreathingMeditationStats },
            meditation: { ...initialBreathingMeditationStats },
            focus: { ...initialFocusStats },
            gratitude: { ...initialJournalingStats },
            journaling: { ...initialJournalingStats },
            mood: { ...initialMoodStats },
          },
          stats: { ...initialOverallStats },
          dailyStreak: 0,
          lastUsedDate: null,
        });
      },
    }),
    {
      name: 'mental-wellness-activity-storage',
      version: 1,
    }
  )
);

// Typed convenience helper functions
export const logActivity = (activity: string, data: ActivityData): void =>
  useActivityStore.getState().logActivity(activity, data);

export const getBreathingStats = (): BreathingMeditationStats =>
  useActivityStore
    .getState()
    .getActivityStats<BreathingMeditationStats>('breathing');

export const getMeditationStats = (): BreathingMeditationStats =>
  useActivityStore
    .getState()
    .getActivityStats<BreathingMeditationStats>('meditation');

export const getFocusStats = (): FocusStats =>
  useActivityStore.getState().getActivityStats<FocusStats>('focus');

export const getGratitudeStats = (): JournalingStats =>
  useActivityStore.getState().getActivityStats<JournalingStats>('gratitude');

export const getJournalingStats = (): JournalingStats =>
  useActivityStore.getState().getActivityStats<JournalingStats>('journaling');

export const getOverallStats = (): OverallStats =>
  useActivityStore.getState().getOverallStats();

export const getDailyStreak = (): number =>
  useActivityStore.getState().getDailyStreak();

export const hasCompletedToday = (activity: string): boolean =>
  useActivityStore.getState().hasCompletedToday(activity);

export const resetAllData = (): void =>
  useActivityStore.getState().resetAllData();
