'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import {
  Clock3,
  Clock,
  AlertCircle,
  Calendar,
  Info,
  CalendarClock,
  ChevronRight,
  Users,
  CalendarDays,
} from 'lucide-react';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
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
import Add from '@/icons/Add';
import Delete from '@/icons/Delete';

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

export const AvailabilitySettings: React.FC<AvailabilitySettingsProps> = ({
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

    if (startHour >= endHour) {
      toast.error('End time must be after start time');
      return false;
    }

    const hasInvalidDay = selectedDays.some(day => {
      if (day < currentDay) {
        return true;
      } else if (day === currentDay) {
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

    DAYS_OF_WEEK.forEach((_, index) => {
      daysMap.set(index, { day: index, slots: [] });
    });

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
    <div className="space-y-6 mt-5 max-w-7xl mx-auto">
      <div className="grid gap-6 md:grid-cols-3">
        {/* Time Zone Card */}
        <Card className="dark:bg-input">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <div className="p-2 rounded-lg">
                <Clock3 className="h-6 w-6 " />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">
                  Current Time Zone
                </p>
                <p className="text-2xl font-extrabold tracking-tight main-font">
                  {currentTime.toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
                <p className="text-sm text-muted-foreground">
                  {Intl.DateTimeFormat().resolvedOptions().timeZone}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Current Date Card */}
        <Card className="dark:bg-input">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <div className="p-2 bg-secondary/10 rounded-lg">
                <CalendarDays className="h-6 w-6 text-secondary-foreground" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">
                  Current Date
                </p>
                <p className="text-2xl font-bold tracking-tight">{dayName}</p>
                <p className="text-sm text-muted-foreground">{date}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Stats Card */}
        <Card className="dark:bg-input">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <div className="p-2 bg-accent/10 rounded-lg">
                <Users className="h-6 w-6 text-accent-foreground" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">
                  Available Slots
                </p>
                <p className="text-2xl font-bold tracking-tight">
                  {availabilitySlots.reduce(
                    (acc, slot) => acc + slot.daysOfWeek.length,
                    0
                  )}
                </p>
                <p className="text-sm text-muted-foreground">Across all days</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="w-full">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div className="space-y-1">
            <CardTitle className="text-2xl font-bold flex items-center gap-2">
              <Clock3 className="h-7 w-7" />
              Consultation Hours
            </CardTitle>
            <CardDescription className="text-base">
              Manage your weekly availability for patient consultations
            </CardDescription>
          </div>
          <Button
            onClick={() => setIsAddingSlot(true)}
            className="gap-2 bg-primary hover:bg-primary/90 shadow-sm"
            size="lg"
          >
            <Add />
            Add Time Slot
          </Button>
        </CardHeader>

        <Separator />

        <CardContent className="pt-6">
          <Tabs defaultValue="weekly" className="space-y-6">
            <TabsContent value="weekly" className="space-y-6">
              <Alert
                variant="default"
                className="border dark:bg-input max-w-[350px]"
              >
                <AlertDescription className="flex items-center gap-2 text-sm ">
                  <Info className="h-4 w-4" />
                  All times are shown in your local timezone.
                </AlertDescription>
              </Alert>

              {groupSlotsByDay().length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 px-4 border-2 border-dashed rounded-lg bg-muted/30">
                  <div className="p-4 bg-primary/5 rounded-full mb-4">
                    <Calendar className="h-12 w-12 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold text-foreground mb-2">
                    No Availability Set
                  </h3>
                  <p className="text-sm text-muted-foreground text-center mb-6 max-w-md">
                    You haven't set any consultation hours yet. Add your
                    available time slots to start accepting appointments.
                  </p>
                  <Button
                    onClick={() => setIsAddingSlot(true)}
                    className="gap-2"
                    size="lg"
                  >
                    <Clock3 className="h-5 w-5" />
                    Set Your Hours
                  </Button>
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {groupSlotsByDay().map(({ day, slots }) => (
                    <Card
                      key={day}
                      className={`group hover:shadow-md transition-all duration-200 ${
                        day === currentTime.getDay()
                          ? 'border-primary/50 bg-primary/5'
                          : 'hover:border-primary/30'
                      }`}
                    >
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <h3 className="font-semibold text-lg flex items-center gap-2">
                            <div
                              className={`h-2 w-2 rounded-full ${
                                day === currentTime.getDay()
                                  ? 'bg-primary animate-pulse'
                                  : 'bg-muted-foreground'
                              }`}
                            />
                            {getDayName(day)}
                          </h3>
                          {day === currentTime.getDay() && (
                            <Badge variant="default" className="font-medium">
                              Today
                            </Badge>
                          )}
                        </div>
                      </CardHeader>
                      <CardContent className="pb-4">
                        <div className="space-y-2">
                          {slots.map((slot, index) => (
                            <div
                              key={`${slot.id}-${index}`}
                              className="flex items-center justify-between p-3 rounded-lg bg-background/80 border border-border/50 hover:border-primary/30 hover:bg-primary/5 transition-all group"
                            >
                              <div className="flex items-center gap-3">
                                <Clock className="h-4 w-4" />
                                <span className="font-medium">
                                  {formatTime(slot.startTime)} -{' '}
                                  {formatTime(slot.endTime)}
                                </span>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="group-hover:opacity-100 hover:bg-destructive/10 hover:text-destructive transition-all"
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
                      {slots.length === 0 && (
                        <CardFooter className="pt-0 pb-4">
                          <p className="text-sm text-muted-foreground text-center w-full">
                            No slots available
                          </p>
                        </CardFooter>
                      )}
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>

          {/* Add Time Slot Dialog */}
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
            <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-2xl">
                  <Clock3 className="h-6 w-6 text-primary" />
                  Set Weekly Hours
                </DialogTitle>
                <DialogDescription className="pt-2 text-base">
                  Set your recurring weekly consultation hours.
                </DialogDescription>
              </DialogHeader>

              <div className="bg-muted/30 border rounded-lg p-4 my-4">
                <div className="flex items-center gap-2 text-sm mb-2">
                  <Info className="h-4 w-4 text-primary" />
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
                      const isSelected =
                        newAvailability.daysOfWeek.includes(index);

                      return (
                        <Badge
                          key={day}
                          variant={isSelected ? 'default' : 'outline'}
                          className={`
                            cursor-pointer transition-all duration-200 px-4 py-1.5
                            ${isPastDay ? 'opacity-50 cursor-not-allowed' : ''}
                            ${isSelected ? 'shadow-sm' : ''}
                            hover:shadow-sm
                          `}
                          onClick={() => {
                            if (!isPastDay) {
                              const updatedDays = isSelected
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

                <div className="grid grid-cols-2 gap-6">
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
                      <SelectContent className="max-h-[300px]">
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
                              className={`
                                ${isDisabled ? 'opacity-50' : ''}
                                ${isPastTime ? 'text-muted-foreground' : ''}
                              `}
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
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Auto-set to 1 hour later" />
                      </SelectTrigger>
                      <SelectContent>
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

                <Alert
                  variant="default"
                  className="bg-primary/5 border-primary/20"
                >
                  <div className="flex items-center gap-2">
                    <Info className="h-4 w-4 text-primary" />
                    <AlertDescription>
                      Slots must be exactly 1 hour long and cannot be scheduled
                      in the past.
                    </AlertDescription>
                  </div>
                </Alert>

                <DialogFooter className="gap-2 sm:gap-0">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsAddingSlot(false)}
                    className="flex-1 sm:flex-none"
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
                    className="gap-2 flex-1 sm:flex-none"
                  >
                    {isLoading ? (
                      <>
                        <Clock className="h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Clock3 className="h-4 w-4" />
                        Save Hours
                      </>
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
                <DialogTitle className="flex items-center gap-2  mb-5">
                  <AlertCircle className="h-5 w-5" />
                  Remove Time Slot
                </DialogTitle>
                <div className="border-l-4 border-destructive bg-destructive/5 p-4 mt-2">
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
                      <ul className="text-xs text-muted-foreground space-y-2">
                        <li className="flex items-center gap-2">
                          <ChevronRight className="h-3 w-3" />
                          Any pending appointments will need to be rescheduled
                        </li>
                        <li className="flex items-center gap-2">
                          <ChevronRight className="h-3 w-3" />
                          This change will affect all future weeks
                        </li>
                        <li className="flex items-center gap-2">
                          <ChevronRight className="h-3 w-3" />
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
                  className="flex-1 sm:flex-none"
                >
                  Keep Slot
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleDeleteAvailability}
                  disabled={isLoading}
                  className="gap-2 flex-1 sm:flex-none"
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
