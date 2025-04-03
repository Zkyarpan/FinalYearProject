'use client';

// app/exercises/page.tsx
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  ChevronDown,
  Clock,
  Heart,
  ThumbsUp,
  Filter,
  Activity,
} from 'lucide-react';
import { toast } from 'sonner';
import Skeleton from '@/components/common/Skeleton';
import SpinnerLoader from '@/components/SpinnerLoader';
import { useUserStore } from '@/store/userStore';
import ExerciseCard from '@/components/exercises/ExerciseCard';
import ExerciseFilter from '@/components/exercises/exercise-filter';

export default function ExercisesPage() {
  const router = useRouter();
  const { isAuthenticated, _id: userId } = useUserStore();

  const [activeTab, setActiveTab] = useState('all');
  const [exercises, setExercises] = useState<Exercise[]>([]);
  interface Exercise {
    _id: string;
    title: string;
    type: string;
    difficulty: string;
    duration: number;
    description: string;
  }

  interface Recommendation {
    _id: string;
    exercise: Exercise;
    psychologist: any;
    note: string;
    status: string;
  }

  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [userProgress, setUserProgress] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [filters, setFilters] = useState({
    type: '',
    difficulty: '',
    duration: '',
  });

  useEffect(() => {
    if (isAuthenticated) {
      fetchExercises();
    } else {
      // If not authenticated, redirect to login
      setIsRedirecting(true);
      setTimeout(() => {
        router.push('/login');
      }, 500);
    }
  }, [isAuthenticated, filters]);

  const fetchExercises = async () => {
    try {
      setIsLoading(true);

      // Build query string from filters
      const queryParams = new URLSearchParams();
      if (filters.type) queryParams.append('type', filters.type);
      if (filters.difficulty)
        queryParams.append('difficulty', filters.difficulty);
      if (filters.duration) queryParams.append('duration', filters.duration);

      // Fetch exercises
      const response = await fetch(`/api/exercises?${queryParams.toString()}`);
      const data = await response.json();

      console.log('API Response:', data); // Debugging

      // Handle API response format
      if (data.IsSuccess) {
        setExercises(data.Result?.exercises || []);
        console.log('Exercises loaded:', data.Result?.exercises?.length || 0);
      } else {
        toast.error(data.ErrorMessage?.[0] || 'Failed to load exercises');
      }

      // Fetch user progress - update this logic too
      try {
        const progressResponse = await fetch('/api/exercises/progress');
        const progressData = await progressResponse.json();

        if (progressData.IsSuccess) {
          // Transform to object with exercise ID as key
          const progressMap = {};
          if (progressData.Result && progressData.Result.progress) {
            progressData.Result.progress.forEach(p => {
              if (p && p.exercise && p.exercise._id) {
                progressMap[p.exercise._id] = p;
              }
            });
          }
          setUserProgress(progressMap);
        }
      } catch (progressError) {
        console.error('Error fetching user progress:', progressError);
      }

      // Fetch recommendations with the same pattern
      try {
        const recsResponse = await fetch('/api/exercises/recommendations');
        const recsData = await recsResponse.json();

        if (recsData.IsSuccess) {
          setRecommendations(recsData.Result?.recommendations || []);
        }
      } catch (recError) {
        console.error('Error fetching recommendations:', recError);
      }

      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching exercises:', error);
      toast.error('Failed to load exercises. Please try again later.');
      setIsLoading(false);
    }
  };

  const handleFilterChange = newFilters => {
    setFilters(newFilters);
  };

  // Safely transform recommendation data
  type RecommendedExercise = Exercise & {
    recommendationId: string;
    recommendedBy: any;
    note: string;
    status: string;
  };

  const getRecommendedExercises = (): RecommendedExercise[] => {
    if (!recommendations || recommendations.length === 0) return [];

    const result: RecommendedExercise[] = [];

    for (const rec of recommendations) {
      // Skip if recommendation or its exercise is missing
      if (!rec || !rec.exercise) continue;

      // Skip completed or skipped recommendations
      if (rec.status === 'completed' || rec.status === 'skipped') continue;

      result.push({
        ...rec.exercise,
        _id: rec.exercise._id || '',
        title: rec.exercise.title || 'Untitled Exercise',
        type: rec.exercise.type || 'other',
        difficulty: rec.exercise.difficulty || 'beginner',
        duration: rec.exercise.duration || 0,
        description: rec.exercise.description || '',
        recommendationId: rec._id || '',
        recommendedBy: rec.psychologist || null,
        note: rec.note || '',
        status: rec.status || 'pending',
      });
    }

    return result;
  };

  const getCompletedExercises = () => {
    if (!exercises || exercises.length === 0) return [];

    return exercises.filter(ex => {
      if (!ex || !ex._id) return false;
      return userProgress[ex._id]?.isCompleted;
    });
  };

  if (isRedirecting) {
    return <SpinnerLoader isLoading={true} />;
  }

  if (!isAuthenticated) {
    return (
      <div className="py-10">
        <div className="text-center">
          <h1 className="text-3xl font-bold">Sign in to access exercises</h1>
          <p className="mt-4 text-gray-500 dark:text-gray-400">
            Please sign in to view and track your mental health exercises.
          </p>
          <Button className="mt-6" onClick={() => router.push('/auth/login')}>
            Sign In
          </Button>
        </div>
      </div>
    );
  }

  const recommendedExercises = getRecommendedExercises();
  const completedExercises = getCompletedExercises();

  return (
    <div className="py-6">
      <div className="flex flex-col md:flex-row justify-between items-start gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold mb-2">Mental Health Exercises</h1>
          <p className="text-gray-500 dark:text-gray-400">
            Explore mental health exercises to support your wellbeing journey.
          </p>
        </div>
        <ExerciseFilter onFilterChange={handleFilterChange} />
      </div>

      <Tabs
        defaultValue="all"
        value={activeTab}
        onValueChange={setActiveTab}
        className="w-full"
      >
        <TabsList className="mb-6">
          <TabsTrigger value="all" className="flex gap-2">
            <Activity size={16} />
            <span>All Exercises</span>
          </TabsTrigger>
          {recommendedExercises.length > 0 && (
            <TabsTrigger value="recommended" className="flex gap-2">
              <ThumbsUp size={16} />
              <span>Recommended</span>
              <Badge variant="secondary" className="ml-1">
                {recommendedExercises.length}
              </Badge>
            </TabsTrigger>
          )}
          <TabsTrigger value="completed" className="flex gap-2">
            <Heart size={16} />
            <span>Completed</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="pt-2">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <Card key={i} className="overflow-hidden">
                  <div className="aspect-video relative">
                    <Skeleton />
                  </div>
                  <CardHeader>
                    <Skeleton />
                    <Skeleton />
                  </CardHeader>
                  <CardFooter>
                    <Skeleton />
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : exercises.length === 0 ? (
            <div className="text-center py-12">
              <h3 className="text-xl font-medium mb-2">No exercises found</h3>
              <p className="text-gray-500 dark:text-gray-400 mb-6">
                Try changing your filters or check back later for new exercises.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {exercises.map(exercise => (
                <ExerciseCard
                  key={exercise._id || `exercise-${Math.random()}`}
                  exercise={exercise}
                  progress={userProgress[exercise._id]}
                  recommendationId={null}
                  recommendedBy={null}
                  note=""
                  status="none"
                />
              ))}
            </div>
          )}
        </TabsContent>

        {recommendedExercises.length > 0 && (
          <TabsContent value="recommended" className="pt-2">
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3].map(i => (
                  <Card key={i} className="overflow-hidden">
                    <Skeleton />
                    <CardHeader>
                      <Skeleton />
                      <Skeleton />
                    </CardHeader>
                    <CardFooter>
                      <Skeleton />
                    </CardFooter>
                  </Card>
                ))}
              </div>
            ) : recommendedExercises.length === 0 ? (
              <div className="text-center py-12">
                <h3 className="text-xl font-medium mb-2">No recommendations</h3>
                <p className="text-gray-500 dark:text-gray-400 mb-6">
                  You don't have any pending recommended exercises from your
                  psychologist.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {recommendedExercises.map(exercise => (
                  <ExerciseCard
                    key={
                      `${exercise._id}-${exercise.recommendationId}` ||
                      `rec-${Math.random()}`
                    }
                    exercise={exercise}
                    progress={userProgress[exercise._id]}
                    isRecommended={true}
                    recommendationId={exercise.recommendationId}
                    recommendedBy={exercise.recommendedBy}
                    note={exercise.note}
                    status={exercise.status}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        )}

        <TabsContent value="completed" className="pt-2">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map(i => (
                <Card key={i} className="overflow-hidden">
                  <Skeleton />
                  <CardHeader>
                    <Skeleton />
                    <Skeleton />
                  </CardHeader>
                  <CardFooter>
                    <Skeleton />
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : completedExercises.length === 0 ? (
            <div className="text-center py-12">
              <h3 className="text-xl font-medium mb-2">
                No completed exercises
              </h3>
              <p className="text-gray-500 dark:text-gray-400 mb-6">
                You haven't completed any exercises yet. Start your wellbeing
                journey today!
              </p>
              <Button onClick={() => setActiveTab('all')}>
                Explore Exercises
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {completedExercises.map(exercise => (
                <ExerciseCard
                  key={exercise._id || `completed-${Math.random()}`}
                  exercise={exercise}
                  progress={userProgress[exercise._id]}
                  recommendationId={null}
                  recommendedBy={null}
                  note=""
                  status="none"
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
