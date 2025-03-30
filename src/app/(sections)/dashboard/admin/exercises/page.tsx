// app/dashboard/admin/exercises/page.tsx or app/dashboard/psychologist/exercises/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useUserStore } from '@/store/userStore';
import Skeleton from '@/components/common/Skeleton';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import ExerciseForm from '@/components/exercises/exercise-form';

export default function ManageExercisesPage() {
  const router = useRouter();
  const { role } = useUserStore();
  const [exercises, setExercises] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedExercise, setSelectedExercise] = useState(null);

  // Check permission
  useEffect(() => {
    if (role !== 'admin' && role !== 'psychologist') {
      router.push('/dashboard');
    }
  }, [role, router]);

  // Fetch exercises
  useEffect(() => {
    fetchExercises();
  }, []);

  const fetchExercises = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/exercises?all=true');
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

  const handleAddExercise = () => {
    setSelectedExercise(null);
    setIsDialogOpen(true);
  };

  const handleEditExercise = exercise => {
    setSelectedExercise(exercise);
    setIsDialogOpen(true);
  };

  const handleDeleteExercise = async exerciseId => {
    // Implement delete functionality
  };

  const handleSaveExercise = async exerciseData => {
    // Implement save functionality
  };

  return (
    <div className="container py-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Manage Exercises</h1>
          <p className="text-gray-500 dark:text-gray-400">
            {role === 'admin'
              ? 'Manage all mental health exercises'
              : 'Manage your created exercises'}
          </p>
        </div>
        <Button onClick={handleAddExercise}>
          <Plus className="h-4 w-4 mr-2" /> Add Exercise
        </Button>
      </div>

      {/* Exercise listing */}
      {isLoading ? (
        <Skeleton />
      ) : (
        <div className="bg-white dark:bg-[#171717] rounded-lg shadow-sm p-4">
          {/* Table of exercises */}
        </div>
      )}

      {/* Add/Edit dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {selectedExercise ? 'Edit Exercise' : 'Add New Exercise'}
            </DialogTitle>
          </DialogHeader>
          <ExerciseForm
            exercise={selectedExercise}
            onSave={handleSaveExercise}
            onCancel={() => setIsDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
