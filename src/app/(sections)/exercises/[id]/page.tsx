'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

import { toast } from 'sonner';
import Skeleton from '@/components/common/Skeleton';
import SpinnerLoader from '@/components/SpinnerLoader';
import { useUserStore } from '@/store/userStore';
import {
  Clock,
  Heart,
  ThumbsUp,
  Award,
  CheckCircle,
  ArrowLeft,
  Play,
  Pause,
  RotateCcw,
  ChevronUp,
  ChevronDown,
  User,
  AlertCircle,
} from 'lucide-react';

// Define type-safe color mappings
const typeColors = {
  breathing: 'bg-blue-100 text-blue-800',
  meditation: 'bg-purple-100 text-purple-800',
  mindfulness: 'bg-green-100 text-green-800',
  relaxation: 'bg-indigo-100 text-indigo-800',
  other: 'bg-gray-100 text-gray-800',
};

const difficultyColors = {
  beginner: 'bg-green-100 text-green-800',
  intermediate: 'bg-yellow-100 text-yellow-800',
  advanced: 'bg-red-100 text-red-800',
};

export default function ExerciseDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { isAuthenticated, _id: userId } = useUserStore();

  // Exercise state with safe defaults
  const [exercise, setExercise] = useState({
    _id: '',
    title: '',
    description: '',
    type: 'other',
    difficulty: 'beginner',
    duration: 0,
    instructions: [],
    benefits: [],
    mediaUrl: '',
    thumbnailUrl: '',
  });

  interface Progress {
    isCompleted: boolean;
    progress: number;
    timesCompleted: number;
    lastCompletedAt?: string;
    notes?: string;
    isLiked?: boolean;
  }

  const [progress, setProgress] = useState<Progress | null>({
    isCompleted: false,
    progress: 0,
    timesCompleted: 0,
  });
  interface Recommendation {
    _id: string;
    status: string;
    note?: string;
    exercise?: {
      _id: string;
    };
  }

  const [recommendation, setRecommendation] = useState<Recommendation | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [isLiked, setIsLiked] = useState(false);
  const [notes, setNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);

  // Exercise timer state
  const [isPlaying, setIsPlaying] = useState(false);
  const [timer, setTimer] = useState(0);
  const [maxTime, setMaxTime] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);
  const [showInstructions, setShowInstructions] = useState(true);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isAuthenticated && id) {
      fetchExerciseData();
    } else if (!isAuthenticated) {
      setIsRedirecting(true);
      setTimeout(() => {
        router.push('/auth/login');
      }, 500);
    }
  }, [isAuthenticated, id, router]);

  const fetchExerciseData = async () => {
    try {
      setLoading(true);

      // Fetch exercise details
      const response = await fetch(`/api/exercises/${id}`);
      const data = await response.json();
      console.log('Exercise data response:', data); // Add for debugging

      if (data.IsSuccess && data.Result && data.Result.exercise) {
        const exerciseData = data.Result.exercise;

        // Safely set exercise data with defaults
        setExercise({
          _id: exerciseData._id || '',
          title: exerciseData.title || 'Untitled Exercise',
          description: exerciseData.description || '',
          type: exerciseData.type || 'other',
          difficulty: exerciseData.difficulty || 'beginner',
          duration: exerciseData.duration || 0,
          instructions: exerciseData.instructions || [],
          benefits: exerciseData.benefits || [],
          mediaUrl: exerciseData.mediaUrl || '',
          thumbnailUrl: exerciseData.thumbnailUrl || '',
        });

        // Safely set max time
        setMaxTime((exerciseData.duration || 0) * 60); // Convert minutes to seconds

        // Fetch user progress
        try {
          const progressResponse = await fetch('/api/exercises/progress');
          const progressData = await progressResponse.json();

          if (
            progressData.IsSuccess &&
            progressData.Result &&
            progressData.Result.progress
          ) {
            const userExerciseProgress = progressData.Result.progress.find(
              p => p.exercise && p.exercise._id === id
            );

            if (userExerciseProgress) {
              setProgress(userExerciseProgress);
              setIsLiked(userExerciseProgress.isLiked || false);
              setNotes(userExerciseProgress.notes || '');
            }
          }
        } catch (progressError) {
          console.error('Error fetching progress:', progressError);
        }

        // Fetch recommendations
        try {
          const recsResponse = await fetch('/api/exercises/recommendations');
          const recsData = await recsResponse.json();

          if (
            recsData.IsSuccess &&
            recsData.Result &&
            recsData.Result.recommendations
          ) {
            const exerciseRecommendation = recsData.Result.recommendations.find(
              r => r.exercise && r.exercise._id === id
            );

            if (exerciseRecommendation) {
              setRecommendation(exerciseRecommendation);
            }
          }
        } catch (recError) {
          console.error('Error fetching recommendations:', recError);
        }
      } else {
        toast.error(
          data.ErrorMessage?.[0] || 'Failed to load exercise details'
        );
        setTimeout(() => {
          router.push('/exercises');
        }, 2000);
      }

      setLoading(false);
    } catch (error) {
      console.error('Error fetching exercise details:', error);
      toast.error('Failed to load exercise details. Please try again later.');
      setLoading(false);
      setTimeout(() => {
        router.push('/exercises');
      }, 2000);
    }
  };

  // Timer functions
  const startTimer = () => {
    if (isPlaying) return;

    setIsPlaying(true);
    intervalRef.current = setInterval(() => {
      setTimer(prev => {
        if (prev >= maxTime) {
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
          }
          setIsPlaying(false);
          markAsCompleted();
          return prev;
        }
        return prev + 1;
      });
    }, 1000);
  };

  const pauseTimer = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      setIsPlaying(false);
    }
  };

  const resetTimer = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    setIsPlaying(false);
    setTimer(0);
  };

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  const formatTime = seconds => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
  };

  const markAsCompleted = async () => {
    if (!id) return;

    try {
      setIsSaving(true);

      const response = await fetch('/api/exercises/progress', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          exerciseId: id,
          isCompleted: true,
          progress: 100,
          notes: notes,
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Exercise completed successfully!');
        setProgress({
          ...(progress || {}),
          isCompleted: true,
          progress: 100,
          timesCompleted: (progress?.timesCompleted || 0) + 1,
        });

        // If this was a recommendation, update its status
        if (recommendation && recommendation._id) {
          updateRecommendationStatus('completed');
        }
      } else {
        toast.error(data.message || 'Failed to mark exercise as completed');
      }
    } catch (error) {
      console.error('Error marking as completed:', error);
      toast.error('Failed to mark exercise as completed');
    } finally {
      setIsSaving(false);
    }
  };

  const handleLike = async () => {
    if (!id) return;

    try {
      const newLikeState = !isLiked;

      const response = await fetch('/api/exercises/progress', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          exerciseId: id,
          isLiked: newLikeState,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setIsLiked(newLikeState);
        toast(newLikeState ? 'Added to favorites' : 'Removed from favorites');
      } else {
        toast.error(data.message || 'Failed to update favorite status');
      }
    } catch (error) {
      console.error('Error updating like status:', error);
      toast.error('Failed to update favorite status');
    }
  };

  const saveNotes = async () => {
    if (!id) return;

    try {
      setIsSaving(true);

      const response = await fetch('/api/exercises/progress', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          exerciseId: id,
          notes: notes,
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Notes saved successfully');
      } else {
        toast.error(data.message || 'Failed to save notes');
      }
    } catch (error) {
      console.error('Error saving notes:', error);
      toast.error('Failed to save notes');
    } finally {
      setIsSaving(false);
    }
  };

  const updateRecommendationStatus = async status => {
    if (!recommendation || !recommendation._id) return;

    try {
      const response = await fetch(
        `/api/exercises/recommendations/${recommendation._id}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            status,
          }),
        }
      );

      const data = await response.json();

      if (data.success) {
        toast.success(`Status updated to ${status}`);
        setRecommendation({
          ...recommendation,
          status,
        });
      } else {
        toast.error(data.message || 'Failed to update status');
      }
    } catch (error) {
      console.error('Error updating recommendation status:', error);
      toast.error('Failed to update recommendation status');
    }
  };

  if (isRedirecting) {
    return <SpinnerLoader isLoading={true} />;
  }

  if (loading) {
    return (
      <div className="mx-auto py-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-6">
            <Skeleton />
            <Skeleton />
          </div>

          <div className="bg-white dark:bg-[#171717] rounded-lg shadow-sm p-6 mb-6">
            <div className="aspect-video relative w-full mb-4">
              <Skeleton />
            </div>

            <Skeleton />
            <Skeleton />
            <Skeleton />
            <Skeleton />

            <div className="flex gap-2 mt-4">
              <Skeleton />
              <Skeleton />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto py-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6 flex items-center">
          <Button
            variant="ghost"
            size="sm"
            className="mr-4"
            onClick={() => router.push('/exercises')}
          >
            <ArrowLeft className="h-4 w-4 mr-1" /> Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{exercise.title}</h1>
            <div className="flex flex-wrap gap-2 mt-2 items-center">
              <Badge className={typeColors[exercise.type] || typeColors.other}>
                {exercise.type.charAt(0).toUpperCase() + exercise.type.slice(1)}
              </Badge>
              <Badge
                className={
                  difficultyColors[exercise.difficulty] ||
                  difficultyColors.beginner
                }
              >
                {exercise.difficulty.charAt(0).toUpperCase() +
                  exercise.difficulty.slice(1)}
              </Badge>
              <Badge variant="outline" className="flex items-center gap-1">
                <Clock size={12} />
                {exercise.duration} min
              </Badge>

              <Button
                variant="ghost"
                size="sm"
                className={isLiked ? 'text-red-500' : 'text-gray-500'}
                onClick={handleLike}
              >
                <Heart
                  className="h-4 w-4 mr-1"
                  fill={isLiked ? 'currentColor' : 'none'}
                />
                {isLiked ? 'Favorited' : 'Add to Favorites'}
              </Button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Main Content - Exercise */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Exercise Description</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="aspect-video relative w-full mb-4 bg-gray-100 dark:bg-gray-800 rounded-md overflow-hidden">
                  {exercise.mediaUrl ? (
                    exercise.mediaUrl.includes('youtube') ||
                    exercise.mediaUrl.includes('youtu.be') ? (
                      <iframe
                        src={exercise.mediaUrl.replace('watch?v=', 'embed/')}
                        className="w-full h-full"
                        title={exercise.title}
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      ></iframe>
                    ) : (
                      <div className="w-full h-full">
                        <video
                          className="w-full h-full object-contain"
                          controls
                          poster={exercise.thumbnailUrl}
                        >
                          <source src={exercise.mediaUrl} type="video/mp4" />
                          Your browser does not support the video tag.
                        </video>
                      </div>
                    )
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <div className="text-gray-400 flex flex-col items-center">
                        <AlertCircle size={64} className="mb-2" />
                        <p>No media available</p>
                      </div>
                    </div>
                  )}
                </div>

                <p className="text-gray-700 dark:text-gray-300 mb-4">
                  {exercise.description}
                </p>

                <Accordion
                  type="single"
                  collapsible
                  className="w-full"
                  defaultValue="benefits"
                >
                  <AccordionItem value="benefits">
                    <AccordionTrigger>Benefits</AccordionTrigger>
                    <AccordionContent>
                      <ul className="list-disc pl-5 space-y-1">
                        {exercise.benefits && exercise.benefits.length > 0 ? (
                          exercise.benefits.map((benefit, index) => (
                            <li key={index}>{benefit}</li>
                          ))
                        ) : (
                          <li>Improve your mental wellbeing</li>
                        )}
                      </ul>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-0 flex flex-row items-center justify-between">
                <CardTitle>Practice Exercise</CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowInstructions(!showInstructions)}
                >
                  {showInstructions ? (
                    <>
                      <ChevronUp className="h-4 w-4 mr-1" /> Hide Instructions
                    </>
                  ) : (
                    <>
                      <ChevronDown className="h-4 w-4 mr-1" /> Show Instructions
                    </>
                  )}
                </Button>
              </CardHeader>
              <CardContent>
                {showInstructions && (
                  <div className="mb-6 space-y-4">
                    <h3 className="text-lg font-medium">Instructions</h3>
                    {exercise.instructions &&
                    exercise.instructions.length > 0 ? (
                      <ol className="list-decimal pl-5 space-y-2">
                        {exercise.instructions.map((instruction, index) => (
                          <li
                            key={index}
                            className={
                              currentStep === index
                                ? 'font-semibold bg-blue-50 dark:bg-blue-900/20 p-2 rounded'
                                : ''
                            }
                          >
                            {instruction}
                          </li>
                        ))}
                      </ol>
                    ) : (
                      <p className="text-gray-500 dark:text-gray-400">
                        Follow along with the guided exercise at your own pace.
                      </p>
                    )}
                  </div>
                )}

                <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4 text-center">
                  <div className="mb-4">
                    <p className="text-3xl font-bold mb-2">
                      {formatTime(timer)}
                    </p>
                    <Progress value={(timer / maxTime) * 100} className="h-2" />
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      {formatTime(timer)} / {formatTime(maxTime)}
                    </p>
                  </div>

                  <div className="flex justify-center gap-2">
                    {!isPlaying ? (
                      <Button
                        onClick={startTimer}
                        className="flex items-center"
                      >
                        <Play className="h-4 w-4 mr-2" />
                        {timer === 0 ? 'Start' : 'Resume'}
                      </Button>
                    ) : (
                      <Button
                        onClick={pauseTimer}
                        variant="outline"
                        className="flex items-center"
                      >
                        <Pause className="h-4 w-4 mr-2" /> Pause
                      </Button>
                    )}

                    {timer > 0 && (
                      <Button
                        onClick={resetTimer}
                        variant="outline"
                        className="flex items-center"
                      >
                        <RotateCcw className="h-4 w-4 mr-2" /> Reset
                      </Button>
                    )}
                  </div>
                </div>

                {(timer >= maxTime || (progress && progress.isCompleted)) && (
                  <div className="mt-4 bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                    <div className="flex items-center mb-2">
                      <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                      <p className="font-medium">Well done!</p>
                    </div>
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      You've completed this exercise.
                    </p>
                  </div>
                )}

                <div className="mt-6">
                  <label
                    htmlFor="notes"
                    className="block text-sm font-medium mb-2"
                  >
                    Your Notes
                  </label>
                  <Textarea
                    id="notes"
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    placeholder="Write your thoughts, feelings, or observations about this exercise..."
                    className="min-h-[150px]"
                  />
                  <div className="flex justify-end mt-2">
                    <Button size="sm" onClick={saveNotes} disabled={isSaving}>
                      {isSaving ? 'Saving...' : 'Save Notes'}
                    </Button>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button
                  variant="ghost"
                  onClick={() => router.push('/exercises')}
                >
                  <ArrowLeft className="h-4 w-4 mr-2" /> Back to Exercises
                </Button>

                {!(progress && progress.isCompleted) && (
                  <Button onClick={markAsCompleted} disabled={isSaving}>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Mark as Completed
                  </Button>
                )}
              </CardFooter>
            </Card>
          </div>

          {/* Sidebar - Stats & Info */}
          <div className="space-y-6">
            {recommendation && (
              <Card>
                <CardHeader className="bg-blue-50 dark:bg-blue-900/20">
                  <CardTitle className="flex items-center text-base">
                    <User className="h-4 w-4 mr-2" />
                    Recommended by Your Psychologist
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4">
                  {recommendation.note && (
                    <div className="mb-4">
                      <h4 className="text-sm font-medium mb-1">
                        Notes from your psychologist:
                      </h4>
                      <p className="text-sm text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-800 p-3 rounded">
                        {recommendation.note}
                      </p>
                    </div>
                  )}

                  <div className="mb-4">
                    <h4 className="text-sm font-medium mb-1">Status:</h4>
                    <Badge
                      className={`${
                        recommendation.status === 'completed'
                          ? 'bg-green-100 text-green-800'
                          : recommendation.status === 'started'
                            ? 'bg-yellow-100 text-yellow-800'
                            : recommendation.status === 'viewed'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {recommendation.status
                        ? recommendation.status.charAt(0).toUpperCase() +
                          recommendation.status.slice(1)
                        : 'Pending'}
                    </Badge>
                  </div>

                  <div className="space-y-2">
                    {recommendation.status === 'pending' && (
                      <Button
                        size="sm"
                        className="w-full"
                        onClick={() => updateRecommendationStatus('viewed')}
                      >
                        Mark as Viewed
                      </Button>
                    )}

                    {(recommendation.status === 'pending' ||
                      recommendation.status === 'viewed') && (
                      <Button
                        size="sm"
                        className="w-full"
                        onClick={() => updateRecommendationStatus('started')}
                      >
                        Start Exercise
                      </Button>
                    )}

                    {recommendation.status === 'started' && (
                      <Button
                        size="sm"
                        className="w-full"
                        onClick={() => updateRecommendationStatus('completed')}
                      >
                        Mark as Complete
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <CardTitle>Your Progress</CardTitle>
              </CardHeader>
              <CardContent>
                {progress ? (
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Completion Status
                        </p>
                        <Badge
                          variant={progress.isCompleted ? 'default' : 'outline'}
                        >
                          {progress.isCompleted ? 'Completed' : 'In Progress'}
                        </Badge>
                      </div>
                      <Progress
                        value={progress.progress || 0}
                        className="h-2"
                      />
                    </div>

                    <div className="flex justify-between py-2 border-b dark:border-gray-700">
                      <p className="text-sm">Times Completed</p>
                      <p className="font-medium">
                        {progress.timesCompleted || 0}
                      </p>
                    </div>

                    {progress.lastCompletedAt && (
                      <div className="flex justify-between py-2 border-b dark:border-gray-700">
                        <p className="text-sm">Last Completed</p>
                        <p className="font-medium">
                          {new Date(
                            progress.lastCompletedAt
                          ).toLocaleDateString()}
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <p className="text-gray-500 dark:text-gray-400 mb-2">
                      You haven't started this exercise yet
                    </p>
                    <Button size="sm" onClick={startTimer}>
                      Start Now
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Related Exercises</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-4">
                  <p className="text-gray-500 dark:text-gray-400 mb-4">
                    Coming soon!
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => router.push('/exercises')}
                  >
                    Browse All Exercises
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
