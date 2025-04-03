'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Clock,
  Heart,
  Award,
  CheckCircle,
  User,
  AlertCircle,
} from 'lucide-react';
import { toast } from 'sonner';

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

const statusColors = {
  pending: 'bg-gray-100 text-gray-800',
  viewed: 'bg-blue-100 text-blue-800',
  started: 'bg-yellow-100 text-yellow-800',
  completed: 'bg-green-100 text-green-800',
  skipped: 'bg-red-100 text-red-800',
};

const ExerciseCard = ({
  exercise,
  progress,
  isRecommended = false,
  recommendationId,
  recommendedBy,
  note,
  status,
}) => {
  const router = useRouter();
  const [isLiked, setIsLiked] = useState(progress?.isLiked || false);
  const [likeLoading, setLikeLoading] = useState(false);

  // Safely access exercise properties with fallbacks
  const exerciseTitle = exercise?.title || 'Untitled Exercise';
  const exerciseType = exercise?.type || 'other';
  const exerciseDifficulty = exercise?.difficulty || 'beginner';
  const exerciseDuration = exercise?.duration || 0;
  const exerciseDescription =
    exercise?.description || 'No description available';
  const exerciseId = exercise?._id || '';
  const exerciseThumbnailUrl = exercise?.thumbnailUrl || '';

  const handleLike = async e => {
    e.preventDefault();
    e.stopPropagation();

    try {
      setLikeLoading(true);
      const newLikeState = !isLiked;

      const response = await fetch('/api/exercises/progress', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          exerciseId: exerciseId,
          isLiked: newLikeState,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setIsLiked(newLikeState);
        toast(newLikeState ? 'Added to favorites' : 'Removed from favorites', {
          duration: 2000,
        });
      } else {
        toast(
          'Error: ' + (data.message || 'Failed to update favorite status'),
          {
            duration: 2000,
          }
        );
      }
    } catch (error) {
      console.error('Error updating like status:', error);
      toast('Failed to update favorite status. Please try again.');
    } finally {
      setLikeLoading(false);
    }
  };

  const handleUpdateRecommendationStatus = async newStatus => {
    if (!recommendationId) return;

    try {
      const response = await fetch(
        `/api/exercises/recommendations/${recommendationId}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            status: newStatus,
          }),
        }
      );

      const data = await response.json();

      if (data.success) {
        toast(`Exercise marked as ${newStatus}`);
        router.refresh();
      } else {
        toast('Error: ' + (data.message || 'Failed to update status'), {
          duration: 2000,
        });
      }
    } catch (error) {
      console.error('Error updating recommendation status:', error);
      toast('Failed to update status. Please try again.');
    }
  };

  // Handle missing exercise
  if (!exercise) {
    return (
      <Card className="overflow-hidden h-full flex flex-col hover:shadow-md transition-shadow">
        <div className="aspect-video relative bg-gray-100 flex items-center justify-center">
          <AlertCircle className="text-gray-400" size={64} />
        </div>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Exercise Not Available</CardTitle>
          <CardDescription>This exercise could not be loaded</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden h-full flex flex-col hover:shadow-md transition-shadow">
      <div className="aspect-video relative bg-gray-100">
        {exerciseThumbnailUrl ? (
          <Image
            src={exerciseThumbnailUrl}
            alt={exerciseTitle}
            fill
            className="object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-100">
            <div className="text-gray-400">
              {exerciseType === 'breathing' && (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="64"
                  height="64"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"></path>
                  <path d="M12 6v12"></path>
                  <path d="M16 8H8.5a2.5 2.5 0 0 0 0 5h7a2.5 2.5 0 0 1 0 5H8"></path>
                </svg>
              )}
              {exerciseType === 'meditation' && (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="64"
                  height="64"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M12 22a8 8 0 0 0 8-8c0-5-4-9-8-9s-8 4-8 9a8 8 0 0 0 8 8Z"></path>
                  <path d="M12 5v3"></path>
                  <path d="M10 9a2 2 0 0 1 4 0c0 1.5-2.5 2-2.5 5"></path>
                  <path d="M12 18v.01"></path>
                </svg>
              )}
              {exerciseType === 'mindfulness' && (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="64"
                  height="64"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M12 2a5 5 0 0 0-5 5v14a5 5 0 0 0 10 0V7a5 5 0 0 0-5-5Z"></path>
                  <path d="M12 18a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z"></path>
                </svg>
              )}
              {exerciseType === 'relaxation' && (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="64"
                  height="64"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242"></path>
                  <path d="M16 20v-6"></path>
                  <path d="M8 12v8"></path>
                  <path d="M12 16v4"></path>
                </svg>
              )}
              {exerciseType === 'other' && (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="64"
                  height="64"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"></path>
                  <path d="M9 9h.01"></path>
                  <path d="M15 9h.01"></path>
                  <path d="M8 13h8a4 4 0 0 1 0 8H8a4 4 0 0 1 0-8z"></path>
                </svg>
              )}
            </div>
          </div>
        )}
        {isRecommended && (
          <div className="absolute top-2 left-2">
            <Badge variant="secondary" className="flex items-center gap-1">
              <Award size={12} />
              Recommended
            </Badge>
          </div>
        )}
        {progress?.isCompleted && (
          <div className="absolute top-2 right-2">
            <Badge
              variant="secondary"
              className="bg-green-100 text-green-800 flex items-center gap-1"
            >
              <CheckCircle size={12} />
              Completed
            </Badge>
          </div>
        )}
      </div>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg line-clamp-1">
            {exerciseTitle}
          </CardTitle>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className={isLiked ? 'text-red-500' : 'text-gray-500'}
                  onClick={handleLike}
                  disabled={likeLoading}
                >
                  <Heart size={18} fill={isLiked ? 'currentColor' : 'none'} />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{isLiked ? 'Remove from favorites' : 'Add to favorites'}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <div className="flex flex-wrap gap-2 mt-2">
          <Badge className={typeColors[exerciseType] || typeColors.other}>
            {exerciseType.charAt(0).toUpperCase() + exerciseType.slice(1)}
          </Badge>
          <Badge
            className={
              difficultyColors[exerciseDifficulty] || difficultyColors.beginner
            }
          >
            {exerciseDifficulty.charAt(0).toUpperCase() +
              exerciseDifficulty.slice(1)}
          </Badge>
          <Badge variant="outline" className="flex items-center gap-1">
            <Clock size={12} />
            {exerciseDuration} min
          </Badge>
        </div>
        <CardDescription className="mt-2 line-clamp-2">
          {exerciseDescription}
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-0 pb-2 flex-grow">
        {isRecommended && note && (
          <div className="mt-2 mb-3 p-2 bg-blue-50 dark:bg-blue-900/20 rounded-md text-sm">
            <p className="font-medium mb-1 flex items-center gap-1">
              <User size={14} /> Psychologist Note:
            </p>
            <p className="text-gray-700 dark:text-gray-300">{note}</p>
          </div>
        )}

        {isRecommended && status && (
          <div className="mt-2">
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
              Status:
            </p>
            <Badge className={statusColors[status]}>
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </Badge>
          </div>
        )}

        {progress && progress.progress > 0 && (
          <div className="mt-3">
            <div className="flex justify-between items-center mb-1">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Progress
              </p>
              <p className="text-sm font-medium">{progress.progress}%</p>
            </div>
            <Progress value={progress.progress} className="h-2" />
          </div>
        )}
      </CardContent>
      <CardFooter className="pt-0">
        <div className="w-full">
          {isRecommended ? (
            <div className="grid grid-cols-2 gap-2">
              {status === 'pending' && (
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => handleUpdateRecommendationStatus('viewed')}
                >
                  Mark as Viewed
                </Button>
              )}
              {(status === 'pending' || status === 'viewed') && (
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => handleUpdateRecommendationStatus('started')}
                >
                  Start Exercise
                </Button>
              )}
              {status === 'started' && (
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => handleUpdateRecommendationStatus('completed')}
                >
                  Mark as Complete
                </Button>
              )}
              {status !== 'completed' && status !== 'skipped' && (
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => router.push(`/exercises/${exerciseId}`)}
                >
                  View Details
                </Button>
              )}
            </div>
          ) : (
            <Button
              variant="default"
              size="sm"
              className="w-full"
              onClick={() => router.push(`/exercises/${exerciseId}`)}
            >
              {progress?.isCompleted ? 'Practice Again' : 'Start Exercise'}
            </Button>
          )}
        </div>
      </CardFooter>
    </Card>
  );
};

export default ExerciseCard;
