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
  Globe2,
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
  period: string;
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

interface WeekDate {
  date: Date;
  dayName: (typeof DAYS_OF_WEEK)[number];
  dayIndex: number;
  isToday: boolean;
  formattedDate: string;
}

const getNextWeekDates = () => {
  const dates: WeekDate[] = [];
  const today = new Date();

  // Get today and next 6 days
  for (let i = 0; i < 7; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    dates.push({
      date,
      dayName: DAYS_OF_WEEK[date.getDay()],
      dayIndex: date.getDay(),
      isToday: i === 0,
      formattedDate: date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      }),
    });
  }

  return dates;
};

const TIME_PERIODS = {
  MORNING: { start: 0, end: 11, icon: '☀️', label: 'Morning' },
  AFTERNOON: { start: 12, end: 16, icon: '🌤️', label: 'Afternoon' },
  EVENING: { start: 17, end: 20, icon: '🌅', label: 'Evening' },
  NIGHT: { start: 21, end: 23, icon: '🌙', label: 'Night' },
} as const;

const generateTimeSlots = () => {
  const slots: TimeSlot[] = [];

  // Generate slots for all 24 hours
  for (let i = 0; i < 24; i++) {
    const hour = i;
    const time = `${hour.toString().padStart(2, '0')}:00`;
    const period = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;

    // Determine time period
    let periodLabel = '';
    if (
      hour >= TIME_PERIODS.MORNING.start &&
      hour <= TIME_PERIODS.MORNING.end
    ) {
      periodLabel = TIME_PERIODS.MORNING.icon;
    } else if (
      hour >= TIME_PERIODS.AFTERNOON.start &&
      hour <= TIME_PERIODS.AFTERNOON.end
    ) {
      periodLabel = TIME_PERIODS.AFTERNOON.icon;
    } else if (
      hour >= TIME_PERIODS.EVENING.start &&
      hour <= TIME_PERIODS.EVENING.end
    ) {
      periodLabel = TIME_PERIODS.EVENING.icon;
    } else {
      periodLabel = TIME_PERIODS.NIGHT.icon;
    }

    slots.push({
      value: time,
      label: `${displayHour}:00 ${period}`,
      period: periodLabel,
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
                  <CalendarClock className="h-6 w-6" />
                  Set Availability
                </DialogTitle>
                <DialogDescription className="pt-2 text-base">
                  Choose your available time slots for the next 7 days
                </DialogDescription>
              </DialogHeader>

              <div className="bg-muted/30 dark:bg-input border rounded-lg p-4 my-4">
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4" />
                  <span className="font-medium">Current Date & Time:</span>
                  <span>
                    {currentTime.toLocaleDateString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
              </div>

              <form onSubmit={handleSetAvailability} className="space-y-8">
                {/* Day Selection Section */}
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label className="text-lg font-semibold">
                        Select Days
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        Choose days for your consultation hours
                      </p>
                    </div>
                    <Badge variant="outline" className="font-medium">
                      <Calendar className="h-3.5 w-3.5 mr-1.5" />
                      Next 7 days
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {getNextWeekDates().map(
                      ({ dayName, dayIndex, isToday, formattedDate }) => {
                        const isSelected =
                          newAvailability.daysOfWeek.includes(dayIndex);
                        const isWeekend = dayIndex === 0 || dayIndex === 6;

                        return (
                          <div
                            key={dayIndex}
                            onClick={() => {
                              const updatedDays = isSelected
                                ? newAvailability.daysOfWeek.filter(
                                    d => d !== dayIndex
                                  )
                                : [...newAvailability.daysOfWeek, dayIndex];
                              setNewAvailability(prev => ({
                                ...prev,
                                daysOfWeek: updatedDays,
                              }));
                            }}
                            className={`
              relative rounded-xl border p-4 cursor-pointer
              transition-all duration-200 
              ${isSelected ? 'bg-primary/5 shadow-sm' : 'hover:bg-primary/5'}
              ${isToday ? 'ring-1 ring-primary ' : ''}
              ${isWeekend ? 'bg-muted/30' : ''}
            `}
                          >
                            {isSelected && (
                              <div className="absolute top-2 right-2">
                                <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                              </div>
                            )}

                            <div className="flex flex-col items-center gap-2 select-none">
                              <span
                                className={`text-base font-semibold ${
                                  isSelected ? 'text-primary' : ''
                                }`}
                              >
                                {dayName}
                              </span>
                              <span className="text-sm text-muted-foreground">
                                {formattedDate}
                              </span>
                              {isToday && (
                                <Badge variant="default" className="mt-1">
                                  Today
                                </Badge>
                              )}
                              {isWeekend && !isToday && (
                                <Badge variant="outline" className="mt-1">
                                  Weekend
                                </Badge>
                              )}
                            </div>
                          </div>
                        );
                      }
                    )}
                  </div>
                </div>

                {/* Time Selection Section */}
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label className="text-lg font-semibold">
                        Consultation Hours
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        Set your available time slots
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">
                        1-hour slots
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <Label className="text-sm font-medium flex items-center gap-2">
                        Start Time
                        <span className="text-xs text-muted-foreground">
                          (Select when you start)
                        </span>
                      </Label>
                      <Select
                        value={newAvailability.startTime}
                        onValueChange={value => {
                          const [hour] = value.split(':').map(Number);
                          const endHour = (hour + 1)
                            .toString()
                            .padStart(2, '0');
                          setNewAvailability(prev => ({
                            ...prev,
                            startTime: value,
                            endTime: `${endHour}:00`,
                          }));
                        }}
                      >
                        <SelectTrigger
                          className="w-full h-10 dark:bg-input border border-input rounded-md 
        focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 focus:outline-none
        data-[state=open]:border-input dark:border-foreground/30"
                        >
                          <SelectValue placeholder="Choose start time" />
                        </SelectTrigger>
                        <SelectContent className="h-64 dark:bg-input">
                          <div className="grid grid-cols-1 divide-y">
                            {Object.values(TIME_PERIODS).map(period => (
                              <div key={period.label} className="relative">
                                <div className="sticky top-0 px-3 py-1.5 text-sm font-semibold bg-background border-b z-10">
                                  <div className="flex items-center gap-2">
                                    <span className="text-base">
                                      {period.icon}
                                    </span>
                                    <span>{period.label}</span>
                                  </div>
                                </div>
                                <div className="py-0.5">
                                  {timeSlots
                                    .filter(slot => {
                                      const hour = parseInt(slot.value);
                                      return (
                                        hour >= period.start &&
                                        hour <= period.end
                                      );
                                    })
                                    .map(slot => {
                                      const [hour] = slot.value
                                        .split(':')
                                        .map(Number);
                                      const isPastTime =
                                        newAvailability.daysOfWeek.includes(
                                          currentTime.getDay()
                                        ) && hour <= currentTime.getHours();

                                      return (
                                        <SelectItem
                                          key={slot.value}
                                          value={slot.value}
                                          disabled={isPastTime}
                                          className="rounded-md transition-colors"
                                        >
                                          <div className="flex items-center gap-3 py-0.5">
                                            <span className="text-base">
                                              {slot.period}
                                            </span>
                                            <Clock className="h-4 w-4 text-muted-foreground" />
                                            <span
                                              className={
                                                isPastTime
                                                  ? 'text-muted-foreground'
                                                  : ''
                                              }
                                            >
                                              {slot.label}
                                            </span>
                                            {isPastTime && (
                                              <Badge
                                                variant="outline"
                                                className="ml-auto text-xs"
                                              >
                                                Past
                                              </Badge>
                                            )}
                                          </div>
                                        </SelectItem>
                                      );
                                    })}
                                </div>
                              </div>
                            ))}
                          </div>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-3">
                      <Label className="text-sm font-medium flex items-center gap-2">
                        End Time
                        <span className="text-xs text-muted-foreground">
                          (Automatically set to 1 hour later)
                        </span>
                      </Label>
                      <Select
                        value={newAvailability.endTime}
                        disabled={!newAvailability.startTime}
                      >
                        <SelectTrigger
                          className="w-full h-10 dark:bg-input border border-input rounded-md 
        focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 focus:outline-none
        data-[state=open]:border-input dark:border-foreground/30"
                        >
                          <SelectValue placeholder="End time (1 hour slot)" />
                        </SelectTrigger>
                        <SelectContent className="dark:bg-input">
                          {newAvailability.startTime && (
                            <SelectItem value={newAvailability.endTime}>
                              <div className="flex items-center gap-3">
                                {(() => {
                                  const [hour] = newAvailability.endTime
                                    .split(':')
                                    .map(Number);
                                  const period = Object.values(
                                    TIME_PERIODS
                                  ).find(p => hour >= p.start && hour <= p.end);
                                  const displayHour = hour % 12 || 12;
                                  const ampm = hour >= 12 ? 'PM' : 'AM';

                                  return (
                                    <>
                                      <span className="text-base">
                                        {period?.icon}
                                      </span>
                                      <Clock className="h-4 w-4 text-muted-foreground" />
                                      <span>{`${displayHour}:00 ${ampm}`}</span>
                                    </>
                                  );
                                })()}
                              </div>
                            </SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                {/* Time Periods Legend */}
                <div className="rounded-lg border bg-card p-4 space-y-3">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <Info className="h-4 w-4 text-muted-foreground" />
                    <span>Time Periods Guide</span>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {Object.values(TIME_PERIODS).map(period => (
                      <div
                        key={period.label}
                        className="flex items-center gap-3 p-2 rounded-md bg-muted/30 dark:bg-input border"
                      >
                        <span className="text-lg">{period.icon}</span>
                        <div className="space-y-0.5">
                          <div className="text-sm font-medium">
                            {period.label}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {`${period.start % 12 || 12}${
                              period.start >= 12 ? 'PM' : 'AM'
                            } - ${period.end % 12 || 12}${
                              period.end >= 12 ? 'PM' : 'AM'
                            }`}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Important Rules */}
                <div className="rounded-xl border p-6 space-y-4">
                  <div className="flex items-center gap-3 border-b pb-4">
                    <div>
                      <h4 className="text-lg font-semibold tracking-tight">
                        Important Scheduling Rules
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        Please review these guidelines for consultation
                        scheduling
                      </p>
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    {/* Duration Rule */}
                    <div className="relative pl-8 pr-4 py-3 rounded-lg bg-primary/5 border border-primary/10 hover:shadow-sm transition-all">
                      <div className="absolute left-0 top-0 h-full w-1.5 bg-primary " />
                      <div className="flex items-start gap-3">
                        <Clock className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                        <div className="space-y-1">
                          <p className="font-medium">Fixed Duration</p>
                          <p className="text-sm text-muted-foreground leading-relaxed">
                            All consultation slots are standardized to 1-hour
                            sessions
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Past Slots Rule */}
                    <div className="relative pl-8 pr-4 py-3 rounded-lg bg-orange-500/5 border border-orange-500/10 hover:shadow-sm transition-all">
                      <div className="absolute left-0 top-0 h-full w-1.5 bg-orange-500 " />
                      <div className="flex items-start gap-3">
                        <Clock className="h-5 w-5 text-orange-500 shrink-0 mt-0.5" />
                        <div className="space-y-1">
                          <p className="font-medium">Past Time Slots</p>
                          <p className="text-sm text-muted-foreground leading-relaxed">
                            Past time slots for today are automatically disabled
                            for scheduling
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Schedule Range Rule */}
                    <div className="relative pl-8 pr-4 py-3 rounded-lg bg-blue-500/5 border border-blue-500/10 hover:shadow-sm transition-all">
                      <div className="absolute left-0 top-0 h-full w-1.5 bg-blue-500 " />
                      <div className="flex items-start gap-3">
                        <CalendarDays className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" />
                        <div className="space-y-1">
                          <p className="font-medium">Scheduling Window</p>
                          <p className="text-sm text-muted-foreground leading-relaxed">
                            Schedule slots for the next 7 days, including
                            weekends
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Timezone Rule */}
                    <div className="relative pl-8 pr-4 py-3 rounded-lg bg-green-500/5 border border-green-500/10 hover:shadow-sm transition-all">
                      <div className="absolute left-0 top-0 h-full w-1.5 bg-green-500 " />
                      <div className="flex items-start gap-3">
                        <Globe2 className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                        <div className="space-y-1">
                          <p className="font-medium">Time Zone</p>
                          <p className="text-sm text-muted-foreground leading-relaxed">
                            All times are shown in your local timezone for
                            convenience
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="pt-2">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Info className="h-4 w-4" />
                      <span className="text-xs">
                        These rules ensure consistent and reliable scheduling
                        for both you and your patients.
                      </span>
                    </div>
                  </div>
                </div>

                {/* Form Actions */}
                <DialogFooter className="gap-3 sm:gap-0">
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
                    className="gap-2 flex-1 sm:flex-none bg-primary hover:bg-primary/90"
                  >
                    {isLoading ? (
                      <>
                        <Clock className="h-4 w-4 animate-spin" />
                        Saving Changes...
                      </>
                    ) : (
                      <>
                        <CalendarClock className="h-4 w-4" />
                        Save Availability
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
