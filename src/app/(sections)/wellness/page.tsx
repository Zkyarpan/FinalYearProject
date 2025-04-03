'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  BreathingMeditationStats,
  FocusStats,
  JournalingStats,
  useActivityStore,
} from '@/store/activity-store';

const WellnessContent = () => {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isClient, setIsClient] = useState(false);
  const [formattedLastActive, setFormattedLastActive] = useState('Today');

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

    // This is a dependency array - re-run this effect if stats.lastUsedDate changes
  }, [stats?.lastUsedDate]);

  const formatDate = (date: string) => {
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
  const totalActivities = 4;
  const activitiesStarted = [
    breathingStats?.sessions > 0,
    meditationStats?.sessions > 0,
    focusStats?.sessions > 0,
    gratitudeStats?.totalEntries > 0,
  ].filter(Boolean).length;

  const completionPercentage = Math.round(
    (activitiesStarted / totalActivities) * 100
  );

  return (
    <div className="min-h-screen text-white">
      {/* Header with welcome message */}
      <div className="bg-gradient-to-r from-blue-900 to-purple-900 py-8 px-6 rounded-b-3xl shadow-xl">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold mb-2">Your Wellness Journey</h1>
          <p className="text-blue-200 mb-8">
            Track your progress and build healthy habits
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Summary Section */}
        <div className="mb-10">
          <div className="flex items-center mb-6">
            <div className="relative h-3 w-full bg-gray-700 rounded-full overflow-hidden">
              <div
                className="absolute top-0 left-0 h-full bg-gradient-to-r from-blue-500 to-indigo-500"
                style={{ width: `${completionPercentage}%` }}
              ></div>
            </div>
            <span className="ml-4 text-lg font-semibold text-white">
              {completionPercentage}%
            </span>
          </div>

          {/* Stats Cards - with subtle animations and improved visuals */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-6 shadow-lg hover:shadow-blue-900/20 hover:translate-y-[-2px] transition-all duration-300">
              <div className="flex mb-3">
                <div className="bg-blue-500 bg-opacity-20 rounded-full p-2 mr-3">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6 text-blue-400"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M22 12h-4l-3 9L9 3l-3 9H2"></path>
                  </svg>
                </div>
                <div className="text-gray-400 text-sm">Total Sessions</div>
              </div>
              <div className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-300">
                {stats?.totalSessions || 76}
              </div>
            </div>

            <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-6 shadow-lg hover:shadow-indigo-900/20 hover:translate-y-[-2px] transition-all duration-300">
              <div className="flex mb-3">
                <div className="bg-indigo-500 bg-opacity-20 rounded-full p-2 mr-3">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6 text-indigo-400"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <circle cx="12" cy="12" r="10"></circle>
                    <polyline points="12 6 12 12 16 14"></polyline>
                  </svg>
                </div>
                <div className="text-gray-400 text-sm">Minutes Practiced</div>
              </div>
              <div className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-300">
                {stats?.totalMinutes || 97}
              </div>
            </div>

            <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-6 shadow-lg hover:shadow-purple-900/20 hover:translate-y-[-2px] transition-all duration-300">
              <div className="flex mb-3">
                <div className="bg-purple-500 bg-opacity-20 rounded-full p-2 mr-3">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6 text-purple-400"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <circle cx="12" cy="8" r="7"></circle>
                    <polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"></polyline>
                  </svg>
                </div>
                <div className="text-gray-400 text-sm">Day Streak</div>
              </div>
              <div className="flex items-end">
                <div className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-300">
                  {dailyStreak || 1}
                </div>
                {dailyStreak > 0 && isClient && (
                  <div className="ml-2 mb-1 bg-yellow-500 text-gray-900 text-xs px-2 py-0.5 rounded-full font-semibold">
                    🔥 Active
                  </div>
                )}
              </div>
            </div>

            <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-6 shadow-lg hover:shadow-pink-900/20 hover:translate-y-[-2px] transition-all duration-300">
              <div className="flex mb-3">
                <div className="bg-pink-500 bg-opacity-20 rounded-full p-2 mr-3">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6 text-pink-400"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <rect
                      x="3"
                      y="4"
                      width="18"
                      height="18"
                      rx="2"
                      ry="2"
                    ></rect>
                    <line x1="16" y1="2" x2="16" y2="6"></line>
                    <line x1="8" y1="2" x2="8" y2="6"></line>
                    <line x1="3" y1="10" x2="21" y2="10"></line>
                  </svg>
                </div>
                <div className="text-gray-400 text-sm">Last Activity</div>
              </div>
              <div className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-pink-400 to-red-300">
                {isClient ? formattedLastActive : 'Today'}
              </div>
            </div>
          </div>
        </div>

        {/* Daily Recommendation */}
        <div className="bg-gradient-to-r from-blue-800 to-indigo-900 p-6 rounded-2xl mb-10 shadow-lg relative overflow-hidden">
          <div className="absolute right-0 bottom-0 opacity-10">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="180"
              height="180"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M9.59 4.59A2 2 0 1 1 11 8H2m10.59 11.41A2 2 0 1 0 14 16H2m15.73-8.27A2.5 2.5 0 1 1 19.5 12H2"></path>
            </svg>
          </div>
          <h2 className="text-xl font-bold mb-2">Today's Recommendation</h2>
          <p className="text-blue-200 mb-4">
            Start your day with 5 minutes of guided breathing to reduce stress
            and improve focus.
          </p>
          <button
            className="bg-white text-indigo-900 font-medium py-3 px-6 rounded-xl shadow-lg hover:shadow-indigo-500/40 hover:bg-opacity-95 transition-all duration-200"
            onClick={() => router.push('/wellness/breathing')}
          >
            Start Breathing Exercise
          </button>
        </div>

        {/* Activities Header with new design */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center">
            <h2 className="text-2xl font-bold text-white">
              Wellness Activities
            </h2>
            <span className="ml-3 bg-gray-800 text-xs px-3 py-1 rounded-full border border-gray-700 text-blue-300 font-semibold">
              4 activities
            </span>
          </div>
          <button className="text-sm text-blue-400 hover:text-blue-300 transition-colors">
            View All
          </button>
        </div>

        {/* Activities Grid - with modern card design */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
          {/* Breathing Exercises */}
          <div className="bg-gray-800 rounded-2xl shadow-lg overflow-hidden group hover:shadow-blue-900/30 transition-all duration-300 hover:translate-y-[-3px]">
            <div className="bg-blue-500 bg-opacity-10 h-3 w-full"></div>
            <div className="p-5">
              <div className="flex items-center mb-4">
                <div className="bg-blue-500 bg-opacity-20 rounded-xl p-3 mr-3">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6 text-blue-400"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M9.59 4.59A2 2 0 1 1 11 8H2m10.59 11.41A2 2 0 1 0 14 16H2m15.73-8.27A2.5 2.5 0 1 1 19.5 12H2"></path>
                  </svg>
                </div>
                <h3 className="font-medium text-lg text-white">
                  Breathing Exercises
                </h3>
              </div>

              <p className="text-sm text-gray-400 mb-6">
                Guided breathing techniques to reduce stress and improve focus
              </p>

              <div className="flex justify-between text-xs text-gray-400 mb-5">
                <div className="flex items-center gap-1">
                  <div className="bg-gray-700 rounded-full p-1">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-3 w-3 text-blue-300"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M22 12h-4l-3 9L9 3l-3 9H2"></path>
                    </svg>
                  </div>
                  <span className="font-medium">
                    {breathingStats?.sessions || 0} Sessions
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="bg-gray-700 rounded-full p-1">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-3 w-3 text-blue-300"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <circle cx="12" cy="12" r="10"></circle>
                      <polyline points="12 6 12 12 16 14"></polyline>
                    </svg>
                  </div>
                  <span className="font-medium">
                    {breathingStats?.totalMinutes || 0} Minutes
                  </span>
                </div>
              </div>

              <button
                className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white py-3 px-4 rounded-xl font-medium text-sm transition-all duration-200 flex justify-center items-center gap-2 group-hover:shadow-lg"
                onClick={() => router.push('/wellness/breathing')}
              >
                Start Activity
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="9 18 15 12 9 6"></polyline>
                </svg>
              </button>
            </div>
          </div>

          {/* Guided Meditation */}
          <div className="bg-gray-800 rounded-2xl shadow-lg overflow-hidden group hover:shadow-indigo-900/30 transition-all duration-300 hover:translate-y-[-3px]">
            <div className="bg-indigo-500 bg-opacity-10 h-3 w-full"></div>
            <div className="p-5">
              <div className="flex items-center mb-4">
                <div className="bg-indigo-500 bg-opacity-20 rounded-xl p-3 mr-3">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6 text-indigo-400"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
                  </svg>
                </div>
                <h3 className="font-medium text-lg text-white">
                  Guided Meditation
                </h3>
              </div>

              <p className="text-sm text-gray-400 mb-6">
                Mindfulness practices for relaxation and mental clarity
              </p>

              <div className="flex justify-between text-xs text-gray-400 mb-5">
                <div className="flex items-center gap-1">
                  <div className="bg-gray-700 rounded-full p-1">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-3 w-3 text-indigo-300"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M22 12h-4l-3 9L9 3l-3 9H2"></path>
                    </svg>
                  </div>
                  <span className="font-medium">
                    {meditationStats?.sessions || 0} Sessions
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="bg-gray-700 rounded-full p-1">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-3 w-3 text-indigo-300"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <circle cx="12" cy="12" r="10"></circle>
                      <polyline points="12 6 12 12 16 14"></polyline>
                    </svg>
                  </div>
                  <span className="font-medium">
                    {meditationStats?.totalMinutes || 0} Minutes
                  </span>
                </div>
              </div>

              <button
                className="w-full bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white py-3 px-4 rounded-xl font-medium text-sm transition-all duration-200 flex justify-center items-center gap-2 group-hover:shadow-lg"
                onClick={() => router.push('/wellness/meditation')}
              >
                Start Activity
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="9 18 15 12 9 6"></polyline>
                </svg>
              </button>
            </div>
          </div>

          {/* Focus Games */}
          <div className="bg-gray-800 rounded-2xl shadow-lg overflow-hidden group hover:shadow-purple-900/30 transition-all duration-300 hover:translate-y-[-3px]">
            <div className="bg-purple-500 bg-opacity-10 h-3 w-full"></div>
            <div className="p-5">
              <div className="flex items-center mb-4">
                <div className="bg-purple-500 bg-opacity-20 rounded-xl p-3 mr-3">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6 text-purple-400"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
                    <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
                    <line x1="12" y1="22.08" x2="12" y2="12"></line>
                  </svg>
                </div>
                <h3 className="font-medium text-lg text-white">Focus Games</h3>
              </div>

              <p className="text-sm text-gray-400 mb-6">
                Interactive games to improve attention and cognitive abilities
              </p>

              <div className="flex justify-between text-xs text-gray-400 mb-5">
                <div className="flex items-center gap-1">
                  <div className="bg-gray-700 rounded-full p-1">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-3 w-3 text-purple-300"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <line x1="18" y1="20" x2="18" y2="10"></line>
                      <line x1="12" y1="20" x2="12" y2="4"></line>
                      <line x1="6" y1="20" x2="6" y2="14"></line>
                    </svg>
                  </div>
                  <span className="font-medium">
                    High Score: {focusStats?.highScore || 410}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="bg-gray-700 rounded-full p-1">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-3 w-3 text-purple-300"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M22 12h-4l-3 9L9 3l-3 9H2"></path>
                    </svg>
                  </div>
                  <span className="font-medium">
                    {focusStats?.sessions || 75} Sessions
                  </span>
                </div>
              </div>

              <button
                className="w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 text-white py-3 px-4 rounded-xl font-medium text-sm transition-all duration-200 flex justify-center items-center gap-2 group-hover:shadow-lg"
                onClick={() => router.push('/wellness/focus-games')}
              >
                Start Activity
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="9 18 15 12 9 6"></polyline>
                </svg>
              </button>
            </div>
          </div>

          {/* Gratitude Journal */}
          <div className="bg-gray-800 rounded-2xl shadow-lg overflow-hidden group hover:shadow-pink-900/30 transition-all duration-300 hover:translate-y-[-3px]">
            <div className="bg-pink-500 bg-opacity-10 h-3 w-full"></div>
            <div className="p-5">
              <div className="flex items-center mb-4">
                <div className="bg-pink-500 bg-opacity-20 rounded-xl p-3 mr-3">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6 text-pink-400"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                  </svg>
                </div>
                <h3 className="font-medium text-lg text-white">
                  Gratitude Journal
                </h3>
              </div>

              <p className="text-sm text-gray-400 mb-6">
                Daily practice to cultivate appreciation and positivity
              </p>

              <div className="flex justify-between text-xs text-gray-400 mb-5">
                <div className="flex items-center gap-1">
                  <div className="bg-gray-700 rounded-full p-1">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-3 w-3 text-pink-300"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <line x1="12" y1="5" x2="12" y2="19"></line>
                      <line x1="5" y1="12" x2="19" y2="12"></line>
                    </svg>
                  </div>
                  <span className="font-medium">
                    {gratitudeStats?.totalEntries || 1} Entries
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="bg-gray-700 rounded-full p-1">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-3 w-3 text-pink-300"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <circle cx="12" cy="8" r="7"></circle>
                      <polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"></polyline>
                    </svg>
                  </div>
                  <span className="font-medium">
                    {gratitudeStats?.streak || 1} Day Streak
                  </span>
                </div>
              </div>

              <button
                className="w-full bg-gradient-to-r from-pink-600 to-pink-700 hover:from-pink-500 hover:to-pink-600 text-white py-3 px-4 rounded-xl font-medium text-sm transition-all duration-200 flex justify-center items-center gap-2 group-hover:shadow-lg"
                onClick={() => router.push('/wellness/gratitude')}
              >
                Start Activity
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="9 18 15 12 9 6"></polyline>
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WellnessContent;
