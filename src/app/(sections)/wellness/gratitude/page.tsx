'use client';

import { useState, useEffect } from 'react';
import {
  Heart,
  Calendar,
  Star,
  Sparkles,
  Trophy,
  CheckCircle2,
  CloudLightning,
  Sun,
  ChevronLeft,
  ChevronRight,
  Trash2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

// Import from your store
import { useActivityStore, logActivity } from '@/store/activity-store';

// Simple Gratitude Journal Component
const GratitudeJournal = ({ onComplete }) => {
  const [entries, setEntries] = useState(['']);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleEntryChange = (index, value) => {
    const newEntries = [...entries];
    newEntries[index] = value;
    setEntries(newEntries);
  };

  const addEntry = () => {
    if (entries.length < 5) {
      setEntries([...entries, '']);
      toast.info('New entry field added', {
        description: 'You can add up to 5 gratitude entries per day',
      });
    } else {
      toast.warning('Maximum entries reached', {
        description: 'You can add up to 5 gratitude entries per day',
      });
    }
  };

  const removeEntry = index => {
    if (entries.length > 1) {
      const newEntries = entries.filter((_, i) => i !== index);
      setEntries(newEntries);
    }
  };

  const handleSubmit = () => {
    // Validate entries - filter out empty ones
    const validEntries = entries.filter(entry => entry.trim() !== '');

    if (validEntries.length === 0) {
      toast.error('Please add at least one gratitude entry', {
        description:
          'Taking a moment to reflect on what youre grateful for can improve your wellbeing',
      });
      return;
    }

    setIsSubmitting(true);

    // Simulate API call
    setTimeout(() => {
      onComplete({
        entries: validEntries,
        date: new Date().toISOString(),
      });

      // Reset form after submission
      setEntries(['']);
      setIsSubmitting(false);
    }, 800);
  };

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-border p-4">
        <h3 className="font-medium mb-4">What are you grateful for today?</h3>

        {entries.map((entry, index) => (
          <div key={index} className="flex gap-2 mb-3">
            <Textarea
              value={entry}
              onChange={e => handleEntryChange(index, e.target.value)}
              placeholder={`I'm grateful for...`}
              className="min-h-[80px]"
            />
            {entries.length > 1 && (
              <Button
                variant="ghost"
                size="icon"
                className="h-10 w-10 rounded-full flex-shrink-0 text-muted-foreground hover:text-destructive"
                onClick={() => removeEntry(index)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        ))}

        <div className="flex justify-between mt-4">
          <Button
            variant="outline"
            className="text-rose-600 border-rose-200 hover:bg-rose-50 dark:border-rose-900 dark:text-rose-400 dark:hover:bg-rose-950"
            onClick={addEntry}
            disabled={entries.length >= 5}
          >
            Add Another Entry
          </Button>
          <Button
            className="bg-rose-600 hover:bg-rose-700 text-white"
            onClick={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Saving...' : 'Save Journal Entries'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default function GratitudePage() {
  const [activeTab, setActiveTab] = useState('today');
  const [streakVisible, setStreakVisible] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [confirmDialog, setConfirmDialog] = useState(false);
  const [entryToDelete, setEntryToDelete] = useState(null);

  // Get stats from your activity store
  const gratitudeStats = useActivityStore(state =>
    state.getActivityStats<any>('gratitude')
  );

  // Local stats - would be replaced by your store in production
  const [stats, setStats] = useState({
    totalEntries: 7,
    streak: 4,
    lastEntry: 'Today',
    recentEntries: [
      {
        date: new Date().toISOString(),
        entries: [
          'A supportive conversation with a friend',
          'The beautiful sunset I saw on my walk today',
          'Making progress on my wellness goals',
        ],
      },
      {
        date: new Date(Date.now() - 86400000).toISOString(), // Yesterday
        entries: [
          'My morning coffee ritual',
          'Finding time to read a few pages of my book',
          'Having a healthy dinner',
        ],
      },
      {
        date: new Date(Date.now() - 86400000 * 3).toISOString(), // 3 days ago
        entries: [
          'Quality time with family',
          'A productive meeting at work',
          'My comfortable home',
        ],
      },
    ],
  });

  // Simulate streak animation on page load
  useEffect(() => {
    const timer = setTimeout(() => {
      setStreakVisible(true);
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  // Handle navigation between dates
  const navigateDate = direction => {
    const newDate = new Date(selectedDate);
    newDate.setDate(selectedDate.getDate() + direction);
    setSelectedDate(newDate);
  };

  // Handle gratitude entry completion
  const handleEntryComplete = data => {
    console.log('Gratitude entry completed:', data);

    // Update local stats
    setStats(prev => ({
      ...prev,
      totalEntries: prev.totalEntries + 1,
      streak: prev.streak + 1,
      lastEntry: 'Today',
      recentEntries: [
        {
          date: new Date().toISOString(),
          entries: data.entries,
        },
        ...prev.recentEntries,
      ],
    }));

    // Show success toast
    toast.success('Gratitude entry saved!', {
      description: 'Taking time for gratitude is a powerful wellness practice.',
      icon: <CheckCircle2 className="h-4 w-4 text-green-500" />,
    });

    // In a real implementation, you would use your activity store here
    logActivity('gratitude', {
      entryCount: data.entries.length,
      date: new Date().toISOString(),
    });
  };

  // Format date for display
  const formatDate = dateString => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
      });
    }
  };

  // Handle entry deletion
  const handleDeleteEntry = index => {
    setEntryToDelete(index);
    setConfirmDialog(true);
  };

  // Confirm deletion
  const confirmDeleteEntry = () => {
    if (entryToDelete !== null) {
      setStats(prev => ({
        ...prev,
        recentEntries: prev.recentEntries.filter((_, i) => i !== entryToDelete),
      }));

      toast.success('Entry deleted', {
        description: 'Your gratitude entry has been removed',
      });

      setConfirmDialog(false);
      setEntryToDelete(null);
    }
  };

  // Get a motivational quote
  const getQuote = () => {
    const quotes = [
      'Gratitude turns what we have into enough.',
      'Appreciation is a wonderful thing; it makes what is excellent in others belong to us as well.',
      'When I started counting my blessings, my whole life turned around.',
      'Gratitude is the healthiest of all human emotions.',
      'The more grateful I am, the more beauty I see.',
    ];
    return quotes[Math.floor(Math.random() * quotes.length)];
  };

  return (
    <div className="mx-auto px-4 py-8">
      {/* Hero section */}
      <div className="relative bg-card rounded-md mb-10 overflow-hidden border dark:border-[#333333] shadow-sm">
     
        <div className="py-12 px-6 sm:px-8 relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl font-extrabold mb-4">Gratitude Journal</h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Cultivate positivity and appreciation through regular gratitude
              practice.
            </p>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-8">
              <div className="border dark:border-[#333333] rounded-lg p-4">
                <div className="text-3xl font-bold">{stats.totalEntries}</div>
                <div className="text-sm text-muted-foreground">
                  Total Entries
                </div>
              </div>
              <div className="relative border dark:border-[#333333] rounded-lg p-4 overflow-hidden">
                <div className="text-3xl font-bold">{stats.streak}</div>
                <div className="text-sm text-muted-foreground">Day Streak</div>
                {streakVisible && stats.streak >= 3 && (
                  <div className="absolute -right-4 -top-4 rotate-45 bg-amber-500 text-white text-xs px-8 shadow-sm">
                    🔥 STREAK
                  </div>
                )}
              </div>
              <div className="border dark:border-[#333333] rounded-lg p-4">
                <div className="text-3xl font-bold">{stats.lastEntry}</div>
                <div className="text-sm text-muted-foreground">Last Entry</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <Card className="border-border shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Heart className="h-5 w-5 text-rose-500" /> Your Gratitude
                    Journal
                  </CardTitle>
                  <CardDescription>
                    Take a moment each day to reflect on what you're thankful
                    for
                  </CardDescription>
                </div>
                <Badge className="bg-rose-500 text-white" variant="secondary">
                  <Calendar className="h-3 w-3 mr-1" />
                  {new Date().toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                  })}
                </Badge>
              </div>

              <Tabs
                value={activeTab}
                onValueChange={setActiveTab}
                className="mt-4"
              >
                <TabsList className="w-full justify-start mb-4">
                  <TabsTrigger
                    value="today"
                    className="data-[state=active]:bg-rose-100 data-[state=active]:text-rose-700 dark:data-[state=active]:bg-rose-900/20 dark:data-[state=active]:text-rose-300"
                  >
                    Today's Entry
                  </TabsTrigger>
                  <TabsTrigger
                    value="history"
                    className="data-[state=active]:bg-rose-100 data-[state=active]:text-rose-700 dark:data-[state=active]:bg-rose-900/20 dark:data-[state=active]:text-rose-300"
                  >
                    Past Entries
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="today" className="pt-2">
                  <div className="p-4 bg-rose-50 dark:bg-rose-500/10 rounded-lg mb-6">
                    <p className="flex items-center text-sm font-medium text-rose-800 dark:text-rose-300 mb-1">
                      <Sun className="h-4 w-4 mr-2" />
                      Daily Inspiration
                    </p>
                    <p className="text-rose-800/80 dark:text-rose-400/80 italic">
                      "{getQuote()}"
                    </p>
                  </div>

                  <GratitudeJournal onComplete={handleEntryComplete} />
                </TabsContent>

                <TabsContent value="history">
                  <div className="flex justify-between items-center mb-6">
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => navigateDate(-1)}
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <div className="bg-rose-50 dark:bg-rose-900/20 rounded-md px-4 py-1.5 text-sm flex items-center justify-center text-rose-700 dark:text-rose-300 font-medium">
                        {selectedDate.toLocaleDateString('en-US', {
                          weekday: 'long',
                          month: 'long',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                        {selectedDate.toDateString() ===
                          new Date().toDateString() && (
                          <Badge className="ml-2 bg-rose-500 text-white text-xs">
                            Today
                          </Badge>
                        )}
                      </div>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => navigateDate(1)}
                        disabled={
                          selectedDate.toDateString() ===
                          new Date().toDateString()
                        }
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-6">
                    {stats.recentEntries.length > 0 ? (
                      stats.recentEntries.map((entry, index) => (
                        <div
                          key={index}
                          className="border border-border rounded-lg p-4"
                        >
                          <div className="flex items-center justify-between mb-3">
                            <h3 className="font-medium text-rose-600 dark:text-rose-400 flex items-center">
                              <Calendar className="h-4 w-4 mr-2" />
                              {formatDate(entry.date)}
                            </h3>
                            <div className="flex items-center gap-2">
                              {index === 0 && (
                                <Badge variant="outline" className="text-xs">
                                  Latest
                                </Badge>
                              )}
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                onClick={() => handleDeleteEntry(index)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                          <ul className="space-y-2">
                            {entry.entries.map((item, i) => (
                              <li
                                key={i}
                                className="pl-4 border-l-2 border-rose-200 dark:border-rose-800"
                              >
                                <p>{item}</p>
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))
                    ) : (
                      <div className="text-center p-8 text-muted-foreground">
                        <p>No previous entries yet. Start journaling today!</p>
                      </div>
                    )}
                  </div>
                </TabsContent>
              </Tabs>
            </CardHeader>
          </Card>
        </div>

        <div>
          <Card className="border-border shadow-sm sticky top-8">
            <CardHeader className="">
              <CardTitle className="flex items-center text-xl">
                <Sparkles className="h-5 w-5 mr-2 text-rose-500" /> Benefits of
                Gratitude
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <p className="text-muted-foreground mb-6">
                Scientific research has shown that practicing gratitude
                regularly can:
              </p>

              <ul className="space-y-3">
                <li className="flex gap-2">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-rose-500/10 text-rose-500 flex items-center justify-center">
                    <Star className="h-3 w-3" />
                  </div>
                  <span>Improve your mood and overall happiness</span>
                </li>
                <li className="flex gap-2">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-rose-500/10 text-rose-500 flex items-center justify-center">
                    <Star className="h-3 w-3" />
                  </div>
                  <span>Reduce symptoms of stress and anxiety</span>
                </li>
                <li className="flex gap-2">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-rose-500/10 text-rose-500 flex items-center justify-center">
                    <Star className="h-3 w-3" />
                  </div>
                  <span>Enhance sleep quality and duration</span>
                </li>
                <li className="flex gap-2">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-rose-500/10 text-rose-500 flex items-center justify-center">
                    <Star className="h-3 w-3" />
                  </div>
                  <span>Strengthen your relationships</span>
                </li>
                <li className="flex gap-2">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-rose-500/10 text-rose-500 flex items-center justify-center">
                    <Star className="h-3 w-3" />
                  </div>
                  <span>Build resilience during difficult times</span>
                </li>
              </ul>

              <div className="mt-6 p-4 border dark:border-[#333333] rounded-lg">
                <p className="text-sm font-medium mb-2">Pro Tip</p>
                <p className="text-sm text-muted-foreground">
                  For maximum benefit, try to be specific about what you're
                  grateful for and why it matters to you.
                </p>
              </div>

              <div className="mt-6">
                <Button
                  variant="outline"
                  className="w-full border-rose-200 text-rose-600 hover:bg-rose-50 dark:border-rose-900 dark:text-rose-400 dark:hover:bg-rose-950"
                  onClick={() => {
                    toast('Daily Reminder Set', {
                      description:
                        "We'll remind you to practice gratitude daily",
                      icon: (
                        <CloudLightning className="h-4 w-4 text-purple-500" />
                      ),
                    });
                  }}
                >
                  <Calendar className="h-4 w-4 mr-2" />
                  Set Daily Reminder
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Confirmation Dialog */}
      <Dialog open={confirmDialog} onOpenChange={setConfirmDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              Are you sure you want to delete this entry?
            </DialogTitle>
            <DialogDescription>
              This action cannot be undone. This entry will be permanently
              removed from your journal.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex space-x-2 sm:justify-end">
            <Button variant="outline" onClick={() => setConfirmDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDeleteEntry}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
