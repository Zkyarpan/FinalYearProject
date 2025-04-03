// components/gratitude/gratitude-journal.tsx - Fixed Version
'use client';

import { useState, useEffect, FC } from 'react';
import {
  Heart,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Check,
  XCircle,
  Book,
  Star,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useActivityStore, JournalingStats } from '@/store/activity-store';

// Sample prompts for gratitude entries
const GRATITUDE_PROMPTS = [
  'What are three small moments from today that you appreciate?',
  'Who is someone that made a positive impact on your life recently?',
  "What is something in your surroundings right now that you're grateful for?",
  "What is a challenge you've overcome that you now feel grateful for?",
  'What is something about your body or health that you appreciate?',
  "What is a skill or ability you have that you're thankful for?",
  'What is something in nature that brings you joy?',
  'What is a recent experience that made you smile?',
  'What piece of technology or tool are you grateful to have access to?',
  'What is a comfort or luxury in your life that you appreciate?',
  "Who is someone you've never met that has positively influenced your life?",
  'What book, movie, or piece of art are you thankful exists?',
  'What opportunity are you grateful to have had?',
  'What is a personality trait of yours that you appreciate?',
  "What is something you're looking forward to that you're grateful for?",
];

interface GratitudeEntry {
  id: string;
  date: string;
  content: string;
  prompt: string;
}

interface GratitudeJournalProps {
  onComplete?: (data: { activity: string; minutes: number }) => void;
}

const GratitudeJournal: FC<GratitudeJournalProps> = ({ onComplete }) => {
  const [entries, setEntries] = useState<GratitudeEntry[]>([]);
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [showEntryDialog, setShowEntryDialog] = useState<boolean>(false);
  const [newEntry, setNewEntry] = useState<string>('');
  const [dailyPrompt, setDailyPrompt] = useState<string>('');
  const [activeTab, setActiveTab] = useState<string>('journal');
  const [showCompletionDialog, setShowCompletionDialog] =
    useState<boolean>(false);

  // Get activity logging function and check if completed today
  const logActivity = useActivityStore(state => state.logActivity);
  const hasCompletedToday = useActivityStore(state =>
    state.hasCompletedToday('gratitude')
  );

  // Get gratitude stats with proper type annotation and handle undefined values
  const gratitudeStats = useActivityStore(state =>
    state.getActivityStats<JournalingStats>('gratitude')
  );

  // Load entries from localStorage on mount
  useEffect(() => {
    const storedEntries = localStorage.getItem('gratitude-entries');
    if (storedEntries) {
      setEntries(JSON.parse(storedEntries));
    }

    // Get random prompt
    const randomPrompt =
      GRATITUDE_PROMPTS[Math.floor(Math.random() * GRATITUDE_PROMPTS.length)];
    setDailyPrompt(randomPrompt);
  }, []);

  // Save entries to localStorage when updated
  useEffect(() => {
    if (entries.length > 0) {
      localStorage.setItem('gratitude-entries', JSON.stringify(entries));
    }
  }, [entries]);

  // Format date for display
  const formatDate = (date: string | Date): string => {
    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  // Get entries for the current date
  const getEntriesForDate = (date: Date): GratitudeEntry[] => {
    const day = new Date(date).setHours(0, 0, 0, 0);
    return entries.filter(
      entry => new Date(entry.date).setHours(0, 0, 0, 0) === day
    );
  };

  // Navigate to previous day
  const goToPreviousDay = (): void => {
    const newDate = new Date(currentDate);
    newDate.setDate(currentDate.getDate() - 1);
    setCurrentDate(newDate);
  };

  // Navigate to next day
  const goToNextDay = (): void => {
    const newDate = new Date(currentDate);
    newDate.setDate(currentDate.getDate() + 1);
    setCurrentDate(newDate);
  };

  // Add new entry
  const addEntry = (): void => {
    if (newEntry.trim() === '') return;

    const entry: GratitudeEntry = {
      id: Date.now().toString(),
      date: new Date().toISOString(),
      content: newEntry.trim(),
      prompt: dailyPrompt,
    };

    setEntries([entry, ...entries]);
    setNewEntry('');
    setShowEntryDialog(false);

    // Show completion dialog
    setShowCompletionDialog(true);

    // Log the activity
    logActivity('gratitude', {
      minutes: 5,
      entryLength: newEntry.trim().length,
    });

    // Call onComplete callback if provided
    if (onComplete) {
      onComplete({
        activity: 'gratitude',
        minutes: 5,
      });
    }

    // Get new random prompt for next time
    const randomPrompt =
      GRATITUDE_PROMPTS[Math.floor(Math.random() * GRATITUDE_PROMPTS.length)];
    setDailyPrompt(randomPrompt);
  };

  // Delete an entry
  const deleteEntry = (id: string): void => {
    if (confirm('Are you sure you want to delete this entry?')) {
      setEntries(entries.filter(entry => entry.id !== id));
    }
  };

  // Check if there's an entry for today
  const hasTodaysEntry = (): boolean => {
    const today = new Date().setHours(0, 0, 0, 0);
    return entries.some(
      entry => new Date(entry.date).setHours(0, 0, 0, 0) === today
    );
  };

  // Get calendar days for current month
  interface CalendarDay {
    day: number | null;
    date?: string;
    hasEntry: boolean;
  }

  const getCalendarDays = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    // Get first day of month and number of days
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();

    // Get day of week of first day (0 = Sunday, 1 = Monday, etc.)
    let firstDayOfWeek = firstDay.getDay();
    // Adjust for Monday as first day (0 = Monday, 6 = Sunday)
    firstDayOfWeek = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1;

    const days: CalendarDay[] = [];

    // Add empty days for start of month
    for (let i = 0; i < firstDayOfWeek; i++) {
      days.push({ day: null, hasEntry: false });
    }

    // Add days of month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day).toISOString();
      const hasEntry = entries.some(entry => {
        const entryDate = new Date(entry.date);
        return (
          entryDate.getDate() === day &&
          entryDate.getMonth() === month &&
          entryDate.getFullYear() === year
        );
      });

      days.push({ day, date, hasEntry });
    }

    return days;
  };

  // Get month name for display
  const getMonthName = (): string => {
    return currentDate.toLocaleDateString('en-US', {
      month: 'long',
      year: 'numeric',
    });
  };

  // Render the current date's entries or a message if none exist
  const renderCurrentDateEntries = () => {
    const dateEntries = getEntriesForDate(currentDate);

    if (dateEntries.length === 0) {
      const isToday =
        new Date(currentDate).setHours(0, 0, 0, 0) ===
        new Date().setHours(0, 0, 0, 0);

      return (
        <div className="text-center p-8 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <Heart className="h-16 w-16 mx-auto text-rose-400 mb-4" />
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            {isToday
              ? "You haven't added a gratitude entry for today yet."
              : 'No gratitude entries for this day.'}
          </p>
          {isToday && (
            <Button
              className="bg-gradient-to-r from-rose-500 to-pink-500"
              onClick={() => setShowEntryDialog(true)}
            >
              Add Today's Entry
            </Button>
          )}
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {dateEntries.map(entry => (
          <Card key={entry.id} className="border">
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <div className="flex items-center">
                  <Heart className="h-4 w-4 text-rose-500 mr-2" />
                  <CardTitle className="text-base">
                    {new Date(entry.date).toLocaleTimeString('en-US', {
                      hour: 'numeric',
                      minute: '2-digit',
                    })}
                  </CardTitle>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => deleteEntry(entry.id)}
                  className="h-8 w-8 p-0"
                >
                  <XCircle className="h-4 w-4 text-gray-400 hover:text-gray-600" />
                </Button>
              </div>
              {entry.prompt && (
                <div className="text-xs text-gray-500 italic mt-1">
                  Prompt: {entry.prompt}
                </div>
              )}
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                {entry.content}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="journal">Journal</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
        </TabsList>

        <TabsContent value="journal" className="pt-4">
          <div className="flex justify-between items-center mb-4">
            <Button variant="outline" size="sm" onClick={goToPreviousDay}>
              <ChevronLeft className="h-4 w-4" />
            </Button>

            <h3 className="text-lg font-medium">
              {formatDate(currentDate)}
              {new Date(currentDate).setHours(0, 0, 0, 0) ===
                new Date().setHours(0, 0, 0, 0) && (
                <Badge className="ml-2 bg-rose-500">Today</Badge>
              )}
            </h3>

            <Button
              variant="outline"
              size="sm"
              onClick={goToNextDay}
              disabled={new Date(currentDate) >= new Date()}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          {renderCurrentDateEntries()}

          <div className="flex justify-center mt-8">
            {new Date(currentDate).setHours(0, 0, 0, 0) ===
              new Date().setHours(0, 0, 0, 0) &&
              !hasTodaysEntry() && (
                <Button
                  className="bg-gradient-to-r from-rose-500 to-pink-500"
                  onClick={() => setShowEntryDialog(true)}
                >
                  <Heart className="h-4 w-4 mr-2" /> Add Gratitude Entry
                </Button>
              )}
          </div>
        </TabsContent>

        <TabsContent value="insights" className="pt-4">
          <div className="space-y-6">
            {/* Calendar View */}
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-lg flex items-center">
                    <Calendar className="h-5 w-5 mr-2 text-rose-500" />{' '}
                    {getMonthName()}
                  </CardTitle>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 w-8 p-0"
                      onClick={() => {
                        const newDate = new Date(currentDate);
                        newDate.setMonth(currentDate.getMonth() - 1);
                        setCurrentDate(newDate);
                      }}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 w-8 p-0"
                      onClick={() => {
                        const newDate = new Date(currentDate);
                        newDate.setMonth(currentDate.getMonth() + 1);
                        setCurrentDate(newDate);
                      }}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-7 gap-1 mb-2">
                  {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, i) => (
                    <div key={i} className="text-center text-sm text-gray-500">
                      {day}
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-7 gap-1">
                  {getCalendarDays().map((day, i) => (
                    <div
                      key={i}
                      className={`h-10 flex items-center justify-center rounded-md text-sm
                        ${!day.day ? 'text-gray-300 dark:text-gray-700' : 'cursor-pointer'}
                        ${day.hasEntry ? 'bg-rose-100 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400' : ''}
                        ${
                          day.day &&
                          day.date &&
                          new Date(day.date).setHours(0, 0, 0, 0) ===
                            new Date(currentDate).setHours(0, 0, 0, 0)
                            ? 'ring-2 ring-rose-300 dark:ring-rose-700'
                            : ''
                        }
                        hover:bg-gray-100 dark:hover:bg-gray-800
                      `}
                      onClick={() => {
                        if (day.day && day.date) {
                          setCurrentDate(new Date(day.date));
                          setActiveTab('journal');
                        }
                      }}
                    >
                      {day.day}
                      {day.hasEntry && (
                        <div className="w-1.5 h-1.5 rounded-full bg-rose-500 absolute bottom-1"></div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Stats Overview */}
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center">
                  <Book className="h-5 w-5 mr-2 text-indigo-500" /> Your
                  Gratitude Stats
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 text-center">
                    <div className="text-2xl font-bold">{entries.length}</div>
                    <div className="text-xs text-gray-500">Total Entries</div>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 text-center">
                    <div className="text-2xl font-bold">
                      {gratitudeStats?.streak || 0}
                    </div>
                    <div className="text-xs text-gray-500">Day Streak</div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between items-center text-sm">
                    <span>This Week</span>
                    <span>
                      {
                        entries.filter(entry => {
                          const entryDate = new Date(entry.date);
                          const startOfWeek = new Date();
                          startOfWeek.setDate(
                            startOfWeek.getDate() - startOfWeek.getDay()
                          );
                          return entryDate >= startOfWeek;
                        }).length
                      }{' '}
                      entries
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span>This Month</span>
                    <span>
                      {
                        entries.filter(entry => {
                          const entryDate = new Date(entry.date);
                          const now = new Date();
                          return (
                            entryDate.getMonth() === now.getMonth() &&
                            entryDate.getFullYear() === now.getFullYear()
                          );
                        }).length
                      }{' '}
                      entries
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span>Best Streak</span>
                    <span>{gratitudeStats?.bestStreak || 0} days</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Benefits of Gratitude */}
            <Card className="border-0 shadow-sm bg-gradient-to-r from-rose-50 to-pink-50 dark:from-rose-900/20 dark:to-pink-900/20">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center">
                  <Sparkles className="h-5 w-5 mr-2 text-rose-500" /> Benefits
                  of Gratitude
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                  Regular gratitude practice has been shown to have numerous
                  mental health benefits:
                </p>
                <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-2 list-disc pl-5">
                  <li>Increases happiness and positive mood</li>
                  <li>Reduces symptoms of depression</li>
                  <li>Improves sleep quality</li>
                  <li>Enhances empathy and reduces aggression</li>
                  <li>Builds resilience and reduces stress</li>
                  <li>Strengthens relationships</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* New Entry Dialog */}
      <Dialog open={showEntryDialog} onOpenChange={setShowEntryDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Heart className="h-5 w-5 text-rose-500" /> Today's Gratitude
              Entry
            </DialogTitle>
            <DialogDescription>
              Take a moment to reflect on what you're grateful for today.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <div className="mb-4 p-3 bg-rose-50 dark:bg-rose-900/20 rounded-lg">
              <p className="text-sm font-medium mb-1">Today's Prompt:</p>
              <p className="text-gray-700 dark:text-gray-300">{dailyPrompt}</p>
            </div>

            <Textarea
              value={newEntry}
              onChange={e => setNewEntry(e.target.value)}
              placeholder="What are you grateful for today?"
              className="w-full h-40"
            />
          </div>

          <DialogFooter className="flex gap-2">
            <Button variant="outline" onClick={() => setShowEntryDialog(false)}>
              Cancel
            </Button>
            <Button
              className="bg-gradient-to-r from-rose-500 to-pink-500"
              onClick={addEntry}
              disabled={newEntry.trim() === ''}
            >
              <Check className="h-4 w-4 mr-2" /> Save Entry
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Completion Dialog */}
      <Dialog
        open={showCompletionDialog}
        onOpenChange={setShowCompletionDialog}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Heart className="h-5 w-5 text-rose-500" /> Gratitude Entry Added!
            </DialogTitle>
            <DialogDescription>
              Taking time for gratitude is a powerful practice for wellbeing.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4 text-center">
            <div className="mb-6">
              <div className="w-20 h-20 mx-auto rounded-full bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400 flex items-center justify-center">
                <Sparkles className="h-10 w-10" />
              </div>
            </div>

            {/* Fixed the streak access with optional chaining and fallback value */}
            {(gratitudeStats?.streak || 0) > 1 && (
              <div className="mb-4 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg inline-block">
                <p className="text-sm font-medium flex items-center gap-1">
                  <Star className="h-4 w-4 text-amber-500" />
                  {gratitudeStats?.streak || 0} Day Streak!
                </p>
              </div>
            )}

            <p className="text-gray-600 dark:text-gray-300 mb-4">
              By practicing gratitude, you're building resilience and training
              your mind to notice the positive aspects of life.
            </p>
          </div>

          <DialogFooter>
            <Button
              className="w-full bg-gradient-to-r from-rose-500 to-pink-500"
              onClick={() => setShowCompletionDialog(false)}
            >
              <Check className="h-4 w-4 mr-2" /> Continue
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default GratitudeJournal;
