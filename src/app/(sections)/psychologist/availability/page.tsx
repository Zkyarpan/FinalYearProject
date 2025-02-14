'use client';

import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import {
  Clock3,
  Clock,
  AlertCircle,
  Calendar,
  Info,
  CalendarClock,
} from 'lucide-react';
import Add from '@/icons/Add';
import Delete from '@/icons/Delete';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
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
import { Tabs, TabsContent } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';

// Types remain the same as your original code...
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
  const [currentTime, setCurrentTime] = useState(new Date());
  const [newAvailability, setNewAvailability] = useState<NewAvailability>({
    daysOfWeek: [],
    startTime: '',
    endTime: '',
  });
  const [deleteDialog, setDeleteDialog] = useState<DeleteDialogState>({
    isOpen: false,
    slotId: null,
  });

  // Update current time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    void fetchAvailability();
  }, []);

  const getCurrentDayInfo = () => {
    const now = new Date();
    const dayName = DAYS_OF_WEEK[now.getDay()];
    const date = now.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    const time = now.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
    return { dayName, date, time };
  };

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

  const validateTimeSlot = (
    startTime: string,
    endTime: string,
    selectedDays: number[]
  ): boolean => {
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinutes = now.getMinutes();
    const currentDay = now.getDay();

    const [startHour, startMinutes] = startTime.split(':').map(Number);
    const [endHour, endMinutes] = endTime.split(':').map(Number);

    // Validate end time is after start time
    if (startHour >= endHour) {
      toast.error('End time must be after start time');
      return false;
    }

    // Check if any selected day is before current day in the current week
    const hasInvalidDay = selectedDays.some(day => {
      if (day < currentDay) {
        return true;
      } else if (day === currentDay) {
        // For current day, check if selected time is in the past
        if (
          startHour < currentHour ||
          (startHour === currentHour && startMinutes <= currentMinutes)
        ) {
          return true;
        }
      }
      return false;
    });

    if (hasInvalidDay) {
      toast.error('Cannot schedule availability in the past');
      return false;
    }

    // Validate that slots are exactly 1 hour
    const startTimeInMinutes = startHour * 60 + startMinutes;
    const endTimeInMinutes = endHour * 60 + endMinutes;
    const durationInHours = (endTimeInMinutes - startTimeInMinutes) / 60;

    if (durationInHours !== 1) {
      toast.error('Time slots must be exactly 1 hour');
      return false;
    }

    return true;
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
        !validateTimeSlot(
          newAvailability.startTime,
          newAvailability.endTime,
          newAvailability.daysOfWeek
        )
      ) {
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

    // Initialize map with empty slots for each day
    DAYS_OF_WEEK.forEach((_, index) => {
      daysMap.set(index, { day: index, slots: [] });
    });

    // Populate with available slots
    availabilitySlots.forEach(slot => {
      slot.daysOfWeek.forEach(day => {
        const daySlot = daysMap.get(day)!;
        daySlot.slots.push({
          id: slot._id,
          startTime: slot.startTime,
          endTime: slot.endTime,
        });
      });
    });

    // Sort slots within each day by start time
    daysMap.forEach(daySlot => {
      daySlot.slots.sort((a, b) => {
        const timeA = a.startTime.split(':').map(Number);
        const timeB = b.startTime.split(':').map(Number);
        if (timeA[0] !== timeB[0]) {
          return timeA[0] - timeB[0];
        }
        return timeA[1] - timeB[1];
      });
    });

    // Convert map to array and sort by day
    return Array.from(daysMap.values()).sort((a, b) => a.day - b.day);
  };

  const formatTime = (time: string): string => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    return `${hour % 12 || 12}:${minutes} ${hour >= 12 ? 'PM' : 'AM'}`;
  };

  const handleDeleteAvailability = async (): Promise<void> => {
    if (!deleteDialog.slotId) return;

    try {
      setIsLoading(true);
      const response = await fetch(`/api/availability/${deleteDialog.slotId}`, {
        method: 'DELETE',
      });

      const data: ApiResponse<unknown> = await response.json();

      if (!response.ok) {
        throw new Error(data.ErrorMessage || 'Failed to delete availability');
      }

      if (data.IsSuccess) {
        toast.success('Availability slot removed successfully');
        void fetchAvailability();
        onRefresh?.();
        setDeleteDialog({ isOpen: false, slotId: null });
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Error deleting availability'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const getDayName = (dayNum: number): string => {
    return DAYS_OF_WEEK[dayNum];
  };

  const { dayName, date, time } = getCurrentDayInfo();

  return (
    <div className="space-y-6 mt-5">
      <Card className="bg-primary/5 border-primary/50 dark:border-primary/50">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <CalendarClock className="h-5 w-5" />
                <h3 className="font-semibold text-lg">{dayName}</h3>
              </div>
              <p className="text-sm">{date}</p>
              <p className="text-2xl font-bold main-font">{time}</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-medium">Current Time Zone</p>
              <p className="font-medium">
                {Intl.DateTimeFormat().resolvedOptions().timeZone}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="w-full">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 border-b">
          <div className="space-y-1">
            <CardTitle className="text-xl font-semibold flex items-center gap-2">
              <Clock3 className="h-6 w-6" />
              Consultation Hours
            </CardTitle>
            <CardDescription>
              Set your weekly availability for patient consultations
            </CardDescription>
          </div>
          <Button
            onClick={() => setIsAddingSlot(true)}
            className="gap-2 bg-primary hover:bg-primary/90"
          >
            <Add />
            Add Time Slot
          </Button>
        </CardHeader>

        <CardContent className="pt-6">
          <Tabs defaultValue="weekly" className="space-y-6">
            <TabsContent value="weekly" className="space-y-4">
              <Alert
                variant="default"
                className="border bg-primary/5 dark:bg-input"
              >
                <AlertDescription className="flex gap-2">
                  Your schedule automatically repeats weekly. All times are
                  shown in your local timezone (
                  {Intl.DateTimeFormat().resolvedOptions().timeZone}).
                </AlertDescription>
              </Alert>

              {groupSlotsByDay().length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 px-4 border-2 border-dashed rounded-lg bg-muted/30">
                  <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium text-muted-foreground mb-2">
                    No Availability Set
                  </h3>
                  <p className="text-sm text-muted-foreground text-center mb-4 max-w-md">
                    You haven't set any consultation hours yet. Add your
                    available time slots to start accepting appointments.
                  </p>
                  <Button
                    onClick={() => setIsAddingSlot(true)}
                    className="gap-2"
                  >
                    <Add />
                    Set Your Hours
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {groupSlotsByDay().map(({ day, slots }) => (
                    <Card
                      key={day}
                      className={`bg-card hover:bg-accent/5 transition-colors ${
                        day === currentTime.getDay() ? 'border-primary/50' : ''
                      }`}
                    >
                      <CardHeader className="py-3 px-4">
                        <h3 className="font-semibold text-sm flex items-center gap-2">
                          <div
                            className={`h-2 w-2 rounded-full ${
                              day === currentTime.getDay()
                                ? 'bg-primary animate-pulse'
                                : 'bg-primary/50'
                            }`}
                          />
                          {getDayName(day)}
                          {day === currentTime.getDay() && (
                            <Badge variant="outline" className="ml-2">
                              Today
                            </Badge>
                          )}
                        </h3>
                      </CardHeader>
                      <CardContent className="py-2 px-4">
                        <div className="space-y-2">
                          {slots.map((slot, index) => (
                            <div
                              key={`${slot.id}-${index}`}
                              className="flex items-center justify-between bg-background rounded-lg p-3 border border-border/50 hover:border-primary/30 transition-colors"
                            >
                              <div className="flex items-center gap-3">
                                <Clock className="h-4 w-4 text-primary" />
                                <span className="font-medium">
                                  {formatTime(slot.startTime)} -{' '}
                                  {formatTime(slot.endTime)}
                                </span>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="hover:bg-destructive/10 hover:text-destructive transition-colors"
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
                </div>
              )}
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
            <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Clock3 className="h-5 w-5 text-primary" />
                  Set Weekly Hours
                </DialogTitle>
                <DialogDescription className="pt-2">
                  Set your recurring weekly consultation hours. These hours will
                  repeat every week.
                </DialogDescription>
              </DialogHeader>

              <div className="border rounded-md p-4 my-4 bg-muted/30">
                <div className="flex items-center gap-2 text-sm mb-2">
                  <Info className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Current Time:</span>
                  <span>{currentTime.toLocaleTimeString()}</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Time slots must be scheduled for future times only
                </p>
              </div>

              <form onSubmit={handleSetAvailability} className="space-y-6">
                <div className="space-y-4">
                  <Label className="text-base font-medium">
                    Available Days
                  </Label>
                  <div className="flex flex-wrap gap-2">
                    {DAYS_OF_WEEK.map((day, index) => {
                      const isPastDay = index < currentTime.getDay();
                      const isToday = index === currentTime.getDay();

                      return (
                        <Badge
                          key={day}
                          variant={
                            newAvailability.daysOfWeek.includes(index)
                              ? 'default'
                              : 'outline'
                          }
                          className={`cursor-pointer transition-colors px-3 py-1.5 ${
                            isPastDay ? 'opacity-50 cursor-not-allowed' : ''
                          }`}
                          onClick={() => {
                            if (!isPastDay) {
                              const updatedDays =
                                newAvailability.daysOfWeek.includes(index)
                                  ? newAvailability.daysOfWeek.filter(
                                      d => d !== index
                                    )
                                  : [...newAvailability.daysOfWeek, index];
                              setNewAvailability(prev => ({
                                ...prev,
                                daysOfWeek: updatedDays,
                              }));
                            }
                          }}
                        >
                          {day}
                          {isToday && (
                            <span className="ml-1 text-xs">(Today)</span>
                          )}
                        </Badge>
                      );
                    })}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Start Time</Label>
                    <Select
                      value={newAvailability.startTime}
                      onValueChange={value => {
                        const [hour] = value.split(':').map(Number);
                        const endHour = (hour + 1).toString().padStart(2, '0');

                        setNewAvailability(prev => ({
                          ...prev,
                          startTime: value,
                          endTime: `${endHour}:00`,
                        }));
                      }}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select time" />
                      </SelectTrigger>
                      <SelectContent className="max-h-[300px] dark:bg-input">
                        {timeSlots.map(slot => {
                          const [hour] = slot.value.split(':').map(Number);

                          const isLastHour = hour >= 21;
                          const isPastTime =
                            newAvailability.daysOfWeek.includes(
                              currentTime.getDay()
                            ) && hour <= currentTime.getHours();

                          const isDisabled = isLastHour || isPastTime;

                          return (
                            <SelectItem
                              key={slot.value}
                              value={slot.value}
                              disabled={isDisabled}
                              className={isDisabled ? 'opacity-50' : ''}
                            >
                              {slot.label}
                              {isPastTime && ' (Past)'}
                              {isLastHour && ' (Last hour)'}
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium">End Time</Label>
                    <Select
                      value={newAvailability.endTime}
                      disabled={!newAvailability.startTime}
                    >
                      <SelectTrigger className="w-full ">
                        <SelectValue placeholder="Auto-set to 1 hour later" />
                      </SelectTrigger>
                      <SelectContent className="dark:bg-input">
                        {newAvailability.startTime && (
                          <SelectItem value={newAvailability.endTime}>
                            {(() => {
                              const [hour] = newAvailability.endTime
                                .split(':')
                                .map(Number);
                              const displayHour = hour % 12 || 12;
                              const period = hour >= 12 ? 'PM' : 'AM';
                              return `${displayHour}:00 ${period}`;
                            })()}
                          </SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Alert variant="default" className="mt-4">
                  <div className="flex items-center gap-2">
                    <Info className="h-4 w-4 flex-shrink-0" />
                    <AlertDescription>
                      Slots must be exactly 1 hour long and cannot be scheduled
                      in the past.
                    </AlertDescription>
                  </div>
                </Alert>

                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsAddingSlot(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={
                      isLoading ||
                      !newAvailability.startTime ||
                      !newAvailability.endTime ||
                      newAvailability.daysOfWeek.length === 0
                    }
                    className="gap-2"
                  >
                    {isLoading ? (
                      <>
                        <Clock className="h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      'Save Hours'
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>

          {/* Delete Confirmation Dialog */}
          <Dialog
            open={deleteDialog.isOpen}
            onOpenChange={isOpen => {
              if (!isOpen) setDeleteDialog({ isOpen: false, slotId: null });
            }}
          >
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-destructive">
                  <AlertCircle className="h-5 w-5" />
                  Remove Time Slot
                </DialogTitle>
                <div className="border-l-4 border-destructive bg-destructive/5 p-4 mt-2 rounded-md">
                  <DialogDescription asChild>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <div className="font-medium text-destructive">
                          Warning:
                        </div>
                        <div className="text-sm text-muted-foreground">
                          This will permanently remove these consultation hours
                          from your weekly schedule.
                        </div>
                      </div>
                      <ul className="text-sm text-muted-foreground space-y-1">
                        <li className="flex items-center gap-2">
                          <span className="h-1 w-1 rounded-full bg-muted-foreground"></span>
                          Any pending appointments will need to be rescheduled
                        </li>
                        <li className="flex items-center gap-2">
                          <span className="h-1 w-1 rounded-full bg-muted-foreground"></span>
                          This change will affect all future weeks
                        </li>
                        <li className="flex items-center gap-2">
                          <span className="h-1 w-1 rounded-full bg-muted-foreground"></span>
                          This action cannot be undone
                        </li>
                      </ul>
                    </div>
                  </DialogDescription>
                </div>
              </DialogHeader>
              <DialogFooter className="gap-2 sm:gap-0">
                <Button
                  variant="outline"
                  onClick={() =>
                    setDeleteDialog({ isOpen: false, slotId: null })
                  }
                  className="w-full sm:w-auto"
                >
                  Keep Slot
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleDeleteAvailability}
                  disabled={isLoading}
                  className="w-full sm:w-auto gap-2"
                >
                  {isLoading ? (
                    <>
                      <Clock className="h-4 w-4 animate-spin" />
                      Removing...
                    </>
                  ) : (
                    'Remove Permanently'
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>
    </div>
  );
};

export default AvailabilitySettings;
