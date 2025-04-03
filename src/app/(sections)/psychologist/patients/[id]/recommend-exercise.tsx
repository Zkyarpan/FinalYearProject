// app/psychologist/patients/[id]/recommend-exercise.tsx
'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { toast } from 'sonner';
import Skeleton from '@/components/common/Skeleton';
import ExerciseCard from '@/components/exercises/ExerciseCard';

export default function RecommendExercisePage() {
  const { id: patientId } = useParams();
  const router = useRouter();

  interface Patient {
    firstName: string;
    lastName: string;
  }
  const [patient, setPatient] = useState<Patient | null>(null);
  interface Exercise {
    _id: string;
    // Add other exercise properties as needed
  }
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(
    null
  );
  const [note, setNote] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [filters, setFilters] = useState({
    type: '',
    difficulty: '',
    duration: '',
  });

  useEffect(() => {
    fetchPatientData();
    fetchExercises();
  }, []);

  const fetchPatientData = async () => {
    try {
      const response = await fetch(`/api/patients/${patientId}`);
      const data = await response.json();

      if (data.success) {
        setPatient(data.data.patient);
      } else {
        toast.error(data.message || 'Failed to load patient data');
        router.push('/psychologist/patients');
      }
    } catch (error) {
      console.error('Error fetching patient data:', error);
      toast.error('Failed to load patient data');
      router.push('/psychologist/patients');
    }
  };

  const fetchExercises = async () => {
    try {
      const queryParams = new URLSearchParams();
      if (filters.type) queryParams.append('type', filters.type);
      if (filters.difficulty)
        queryParams.append('difficulty', filters.difficulty);
      if (filters.duration) queryParams.append('duration', filters.duration);

      const response = await fetch(`/api/exercises?${queryParams.toString()}`);
      const data = await response.json();

      if (data.success) {
        setExercises(data.data.exercises);
      } else {
        toast.error(data.message || 'Failed to load exercises');
      }
    } catch (error) {
      console.error('Error fetching exercises:', error);
      toast.error('Failed to load exercises');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectExercise = exercise => {
    setSelectedExercise(exercise);
  };

  const handleRecommend = async () => {
    if (!selectedExercise) {
      toast.error('Please select an exercise to recommend');
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch('/api/exercises/recommendations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          patientId,
          exerciseId: selectedExercise._id,
          note,
          dueDate: dueDate || undefined,
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Exercise recommended successfully');
        router.push(`/psychologist/patients/${patientId}`);
      } else {
        toast.error(data.message || 'Failed to recommend exercise');
      }
    } catch (error) {
      console.error('Error recommending exercise:', error);
      toast.error('Failed to recommend exercise');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="container py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Recommend Exercise</h1>
        {patient && (
          <p className="text-gray-500 dark:text-gray-400">
            Recommending exercise for {patient.firstName} {patient.lastName}
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Exercise Selection */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Select Exercise</CardTitle>
              <CardDescription>
                Choose an exercise to recommend to your patient
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[1, 2, 3, 4].map(i => (
                    <Skeleton key={i} />
                  ))}
                </div>
              ) : exercises.length === 0 ? (
                <div className="text-center py-12">
                  <h3 className="text-xl font-medium mb-2">
                    No exercises found
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400 mb-6">
                    Try changing your filters or add new exercises.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {exercises.map(exercise => (
                    <div
                      key={exercise._id}
                      className={`cursor-pointer transition-all ${
                        selectedExercise?._id === exercise._id
                          ? 'ring-2 ring-blue-500 rounded-lg'
                          : ''
                      }`}
                      onClick={() => handleSelectExercise(exercise)}
                    >
                      <ExerciseCard
                        exercise={exercise}
                        progress={0}
                        recommendationId=""
                        recommendedBy=""
                        note=""
                        status="pending"
                      />
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Recommendation Details */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Recommendation Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="note">Note to Patient</Label>
                <Textarea
                  id="note"
                  placeholder="Add some guidance or context for this exercise..."
                  value={note}
                  onChange={e => setNote(e.target.value)}
                  rows={4}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="dueDate">Due Date (Optional)</Label>
                <Input
                  id="dueDate"
                  type="date"
                  value={dueDate}
                  onChange={e => setDueDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>
            </CardContent>
            <CardFooter>
              <Button
                className="w-full"
                onClick={handleRecommend}
                disabled={!selectedExercise || isSaving}
              >
                {isSaving ? 'Recommending...' : 'Recommend Exercise'}
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}
