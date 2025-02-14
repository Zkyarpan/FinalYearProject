'use client';
import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Clock3, Clock, AlertCircle } from 'lucide-react';
import Add from '@/icons/Add';
import Delete from '@/icons/Delete';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// Types
interface TimeSlot {
  value: string;
  label: string;
}

interface AvailabilitySlot {
  _id: string;
  daysOfWeek: number[];
  startTime: string;
  endTime: string;
}

interface NewAvailability {
  daysOfWeek: number[];
  startTime: string;
  endTime: string;
}

interface DeleteDialogState {
  isOpen: boolean;
  slotId: string | null;
}

interface DaySlot {
  day: number;
  slots: Array<{
    id: string;
    startTime: string;
    endTime: string;
  }>;
}

interface ApiResponse<T> {
  IsSuccess: boolean;
  Result: {
    availability: T;
  };
  ErrorMessage?: string;
}

interface AvailabilitySettingsProps {
  onRefresh?: () => void;
}

const generateTimeSlots = () => {
  const slots: TimeSlot[] = [];
  const startHour = 6; // 6 AM
  const endHour = 21; // 9 PM

  for (let i = startHour; i <= endHour; i++) {
    const hour = i;
    const time = `${hour.toString().padStart(2, '0')}:00`;
    const period = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;

    slots.push({
      value: time,
      label: `${displayHour}:00 ${period}`,
    });
  }

  return slots;
};

// Create the time slots array
const timeSlots: TimeSlot[] = generateTimeSlots();

const DAYS_OF_WEEK = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
] as const;

const AvailabilitySettings: React.FC<AvailabilitySettingsProps> = ({
  onRefresh,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [availabilitySlots, setAvailabilitySlots] = useState<
    AvailabilitySlot[]
  >([]);
  const [isAddingSlot, setIsAddingSlot] = useState(false);
  const [newAvailability, setNewAvailability] = useState<NewAvailability>({
    daysOfWeek: [],
    startTime: '',
    endTime: '',
  });
  const [deleteDialog, setDeleteDialog] = useState<DeleteDialogState>({
    isOpen: false,
    slotId: null,
  });

  useEffect(() => {
    void fetchAvailability();
  }, []);

  const fetchAvailability = async (): Promise<void> => {
    try {
      const response = await fetch('/api/availability/psychologist');
      const data: ApiResponse<AvailabilitySlot[]> = await response.json();

      if (!response.ok) {
        throw new Error(data.ErrorMessage || 'Failed to fetch availability');
      }

      if (data.IsSuccess) {
        setAvailabilitySlots(data.Result.availability);
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Error loading availability'
      );
    }
  };

  const validateTimeSlot = (startTime: string, endTime: string): boolean => {
    const start = parseInt(startTime.split(':')[0]);
    const end = parseInt(endTime.split(':')[0]);
    return start < end;
  };

  const handleDeleteAvailability = async (): Promise<void> => {
    if (!deleteDialog.slotId) return;

    try {
      setIsLoading(true);
      const response = await fetch(
        `/api/availability/psychologist?id=${deleteDialog.slotId}`,
        { method: 'DELETE' }
      );
      const data: ApiResponse<unknown> = await response.json();

      if (!response.ok) {
        throw new Error(data.ErrorMessage || 'Failed to delete availability');
      }

      if (data.IsSuccess) {
        toast.success('Availability deleted successfully');
        void fetchAvailability();
        onRefresh?.();
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Error deleting availability'
      );
    } finally {
      setIsLoading(false);
      setDeleteDialog({ isOpen: false, slotId: null });
    }
  };

  const getDayName = (dayNum: number): string => {
    return DAYS_OF_WEEK[dayNum];
  };

  const formatTime = (time: string): string => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    return `${hour % 12 || 12}:${minutes} ${hour >= 12 ? 'PM' : 'AM'}`;
  };

  const handleSetAvailability = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();

    try {
      if (newAvailability.daysOfWeek.length === 0) {
        toast.error('Please select at least one day');
        return;
      }

      if (!newAvailability.startTime || !newAvailability.endTime) {
        toast.error('Please select both start and end time');
        return;
      }

      if (
        !validateTimeSlot(newAvailability.startTime, newAvailability.endTime)
      ) {
        toast.error('End time must be after start time');
        return;
      }

      setIsLoading(true);
      const response = await fetch('/api/availability', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newAvailability),
      });

      const data: ApiResponse<unknown> = await response.json();

      if (!response.ok) {
        throw new Error(data.ErrorMessage || 'Failed to set availability');
      }

      if (data.IsSuccess) {
        toast.success('Availability set successfully');
        void fetchAvailability();
        onRefresh?.();
        setIsAddingSlot(false);
        setNewAvailability({
          daysOfWeek: [],
          startTime: '',
          endTime: '',
        });
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Error setting availability'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const groupSlotsByDay = (): DaySlot[] => {
    const daysMap = new Map<number, DaySlot>();

    availabilitySlots.forEach(slot => {
      slot.daysOfWeek.forEach(day => {
        if (!daysMap.has(day)) {
          daysMap.set(day, { day, slots: [] });
        }

        const daySlot = daysMap.get(day)!;
        daySlot.slots.push({
          id: slot._id,
          startTime: slot.startTime,
          endTime: slot.endTime,
        });
      });
    });

    return Array.from(daysMap.values()).sort((a, b) => a.day - b.day);
  };

  return (
    <Card className="w-full mb-10">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <Clock3 className="h-5 w-5" />
          Weekly Availability
        </CardTitle>
        <Button onClick={() => setIsAddingSlot(true)} className="gap-2">
          <Add />
          Add Time Slot
        </Button>
      </CardHeader>

      <CardContent>
        <Tabs defaultValue="weekly" className="space-y-4">
          <TabsList>
            <TabsTrigger value="weekly">Weekly Schedule</TabsTrigger>
          </TabsList>

          <TabsContent value="weekly" className="space-y-4">
            {groupSlotsByDay().map(({ day, slots }) => (
              <Card key={day} className="bg-muted/30">
                <CardHeader className="py-3">
                  <h3 className="font-semibold text-sm">{getDayName(day)}</h3>
                </CardHeader>
                <CardContent className="py-2">
                  <div className="space-y-2">
                    {slots.map((slot, index) => (
                      <div
                        key={`${slot.id}-${index}`}
                        className="flex items-center justify-between bg-background rounded-md p-2"
                      >
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <span>
                            {formatTime(slot.startTime)} -{' '}
                            {formatTime(slot.endTime)}
                          </span>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="hover:bg-destructive/10 hover:text-destructive"
                          onClick={() =>
                            setDeleteDialog({
                              isOpen: true,
                              slotId: slot.id,
                            })
                          }
                        >
                          <Delete />
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>
        </Tabs>

        <Dialog
          open={isAddingSlot}
          onOpenChange={isOpen => {
            if (!isOpen) {
              setIsAddingSlot(false);
              setNewAvailability({
                daysOfWeek: [],
                startTime: '',
                endTime: '',
              });
            }
          }}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Availability Slot</DialogTitle>
              <DialogDescription>
                Set your available time slot for appointments
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSetAvailability} className="space-y-4">
              <div className="space-y-2">
                <Label>Days of Week</Label>
                <div className="flex flex-wrap gap-2">
                  {DAYS_OF_WEEK.map((day, index) => (
                    <Badge
                      key={day}
                      variant={
                        newAvailability.daysOfWeek.includes(index)
                          ? 'default'
                          : 'outline'
                      }
                      className="cursor-pointer"
                      onClick={() => {
                        const updatedDays = newAvailability.daysOfWeek.includes(
                          index
                        )
                          ? newAvailability.daysOfWeek.filter(d => d !== index)
                          : [...newAvailability.daysOfWeek, index];
                        setNewAvailability(prev => ({
                          ...prev,
                          daysOfWeek: updatedDays,
                        }));
                      }}
                    >
                      {day}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Start Time</Label>
                  <Select
                    value={newAvailability.startTime}
                    onValueChange={value =>
                      setNewAvailability(prev => ({
                        ...prev,
                        startTime: value,
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select start time" />
                    </SelectTrigger>
                    <SelectContent>
                      {timeSlots.map(slot => (
                        <SelectItem key={slot.value} value={slot.value}>
                          {slot.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>End Time</Label>
                  <Select
                    value={newAvailability.endTime}
                    onValueChange={value =>
                      setNewAvailability(prev => ({
                        ...prev,
                        endTime: value,
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select end time" />
                    </SelectTrigger>
                    <SelectContent>
                      {timeSlots.map(slot => (
                        <SelectItem key={slot.value} value={slot.value}>
                          {slot.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsAddingSlot(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? 'Saving...' : 'Save Availability'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
        <Dialog
          open={deleteDialog.isOpen}
          onOpenChange={isOpen => {
            if (!isOpen) setDeleteDialog({ isOpen: false, slotId: null });
          }}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-destructive" />
                Delete Availability Slot
              </DialogTitle>
              <DialogDescription className="border border-destructive/50 rounded-md p-2 text-destructive">
                Are you sure you want to delete this availability slot? This
                action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setDeleteDialog({ isOpen: false, slotId: null })}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleDeleteAvailability}
                disabled={isLoading}
              >
                {isLoading ? 'Deleting...' : 'Delete Slot'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};

export default AvailabilitySettings;
