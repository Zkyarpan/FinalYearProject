'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import {
  Clock3,
  Clock,
  AlertCircle,
  Info,
  CalendarClock,
  ChevronRight,
  Calendar,
  Users,
  CalendarDays,
  Globe2,
} from 'lucide-react';
import Current from '@/icons/Current';
import Avaiable from '@/icons/Avaiable';
import Calendars from '@/icons/Calendar';

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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import Add from '@/icons/Add';
import Delete from '@/icons/Delete';
import { useSocket } from '@/contexts/SocketContext';
import { useUserStore } from '@/store/userStore';

const SESSION_DURATIONS = [
  {
    value: 30,
    label: '30 minutes',
    description: 'Quick consultation',
    endTimeLabel: '(+30 min)',
  },
  {
    value: 45,
    label: '45 minutes',
    description: 'Brief session',
    endTimeLabel: '(+45 min)',
  },
  {
    value: 60,
    label: '1 hour',
    description: 'Standard session',
    endTimeLabel: '(+1 hour)',
  },
  {
    value: 90,
    label: '1.5 hours',
    description: 'Extended session',
    endTimeLabel: '(+1.5 hours)',
  },
  {
    value: 120,
    label: '2 hours',
    description: 'In-depth consultation',
    endTimeLabel: '(+2 hours)',
  },
] as const;

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
  duration: number;
}

interface NewAvailability {
  daysOfWeek: number[];
  startTime: string;
  endTime: string;
  duration: number;
  timePeriods: string[];
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
    duration: number;
  }>;
}

interface ApiResponse<T> {
  IsSuccess: boolean;
  Result: {
    availability: T;
  };
  ErrorMessage?: { message: string }[];
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

  // Generate slots for all 24 hours with half-hour increments
  for (let i = 0; i < 24; i++) {
    // Full hour slot
    const hour = i;
    const fullHourTime = `${hour.toString().padStart(2, '0')}:00`;
    const periodFull = hour >= 12 ? 'PM' : 'AM';
    const displayHourFull = hour % 12 || 12;

    // Determine time period for full hour
    let periodLabelFull = '';
    if (
      hour >= TIME_PERIODS.MORNING.start &&
      hour <= TIME_PERIODS.MORNING.end
    ) {
      periodLabelFull = TIME_PERIODS.MORNING.icon;
    } else if (
      hour >= TIME_PERIODS.AFTERNOON.start &&
      hour <= TIME_PERIODS.AFTERNOON.end
    ) {
      periodLabelFull = TIME_PERIODS.AFTERNOON.icon;
    } else if (
      hour >= TIME_PERIODS.EVENING.start &&
      hour <= TIME_PERIODS.EVENING.end
    ) {
      periodLabelFull = TIME_PERIODS.EVENING.icon;
    } else {
      periodLabelFull = TIME_PERIODS.NIGHT.icon;
    }

    slots.push({
      value: fullHourTime,
      label: `${displayHourFull}:00 ${periodFull}`,
      period: periodLabelFull,
    });

    // Half hour slot
    const halfHourTime = `${hour.toString().padStart(2, '0')}:30`;
    const periodHalf = hour >= 12 ? 'PM' : 'AM';
    const displayHourHalf = hour % 12 || 12;

    // Determine time period for half hour
    let periodLabelHalf = '';
    if (
      hour >= TIME_PERIODS.MORNING.start &&
      hour <= TIME_PERIODS.MORNING.end
    ) {
      periodLabelHalf = TIME_PERIODS.MORNING.icon;
    } else if (
      hour >= TIME_PERIODS.AFTERNOON.start &&
      hour <= TIME_PERIODS.AFTERNOON.end
    ) {
      periodLabelHalf = TIME_PERIODS.AFTERNOON.icon;
    } else if (
      hour >= TIME_PERIODS.EVENING.start &&
      hour <= TIME_PERIODS.EVENING.end
    ) {
      periodLabelHalf = TIME_PERIODS.EVENING.icon;
    } else {
      periodLabelHalf = TIME_PERIODS.NIGHT.icon;
    }

    slots.push({
      value: halfHourTime,
      label: `${displayHourHalf}:30 ${periodHalf}`,
      period: periodLabelHalf,
    });
  }

  return slots;
};

const timeSlots: TimeSlot[] = generateTimeSlots();

const DAYS_OF_WEEK = [
  'Sunday', // 0
  'Monday', // 1
  'Tuesday', // 2
  'Wednesday', // 3
  'Thursday', // 4
  'Friday', // 5
  'Saturday', // 6
] as const;

export const AvailabilitySettings: React.FC<AvailabilitySettingsProps> = ({
  onRefresh,
}) => {
  // Move the socket hook inside the component body
  const { socket, isConnected } = useSocket();
  const { user } = useUserStore();

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
    duration: 60,
    timePeriods: [],
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

      console.log('API Response Raw Data:', data);

      if (!response.ok) {
        if (data.ErrorMessage && data.ErrorMessage.length > 0) {
          throw new Error(data.ErrorMessage[0].message);
        } else {
          throw new Error('Failed to fetch availability');
        }
      }

      if (data.IsSuccess && data.Result) {
        console.log('Availability data structure:', data.Result);

        const slots = data.Result.availability || [];
        console.log('Slots before setting state:', slots);

        const validSlots = slots.map(slot => {
          if (!slot._id) {
            console.warn('Found slot without ID:', slot);
            // If no _id exists, create a temporary one or use another identifier
            return {
              ...slot,
              _id:
                slot._id || `temp-${Math.random().toString(36).substr(2, 9)}`,
            };
          }
          return slot;
        });
        setAvailabilitySlots(validSlots);
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Error loading availability'
      );
    }
  };

  const handleDurationChange = (value: string) => {
    const newDuration = parseInt(value);

    setNewAvailability(prev => {
      const updatedAvailability = {
        ...prev,
        duration: newDuration,
      };

      if (prev.startTime) {
        updatedAvailability.endTime = calculateEndTime(
          prev.startTime,
          newDuration
        );
      }

      return updatedAvailability;
    });
  };

  const calculateEndTime = (
    startTime: string,
    durationMinutes: number
  ): string => {
    const [startHour, startMinute] = startTime.split(':').map(Number);
    const totalMinutes = startHour * 60 + startMinute + durationMinutes;
    const endHour = Math.floor(totalMinutes / 60) % 24;
    const endMinute = totalMinutes % 60;

    return `${endHour.toString().padStart(2, '0')}:${endMinute
      .toString()
      .padStart(2, '0')}`;
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

    if (
      startHour > endHour ||
      (startHour === endHour && startMinutes >= endMinutes)
    ) {
      toast.error('End time must be after start time');
      return false;
    }

    // Allow setting availability for times at least 5 minutes in the future
    const hasInvalidDay = selectedDays.some(day => {
      if (day < currentDay) {
        return true;
      } else if (day === currentDay) {
        // Convert times to total minutes for easier comparison
        const currentTotalMinutes = currentHour * 60 + currentMinutes;
        const startTotalMinutes = startHour * 60 + startMinutes;

        // Allow if the start time is at least 5 minutes in the future
        if (startTotalMinutes < currentTotalMinutes + 5) {
          return true;
        }
      }
      return false;
    });

    if (hasInvalidDay) {
      toast.error(
        'Availability must be set for at least 5 minutes in the future'
      );
      return false;
    }

    return true;
  };

  const DaySelectionCard = ({
    dayName,
    dayIndex,
    isToday,
    formattedDate,
    isSelected,
    onClick,
  }) => {
    const currentDate = new Date();
    const isPastDay =
      dayIndex < currentDate.getDay() ||
      (dayIndex === currentDate.getDay() && currentDate.getHours() >= 23);
    const isWeekend = dayIndex === 0 || dayIndex === 6;

    return (
      <div
        onClick={() => !isPastDay && onClick()}
        className={`
          relative rounded-xl border p-4 transition-all duration-200 
          ${
            isPastDay
              ? 'opacity-50 cursor-not-allowed bg-gray-100 dark:bg-gray-800'
              : 'cursor-pointer hover:bg-primary/5'
          }
          ${isSelected && !isPastDay ? 'bg-primary/5 shadow-sm' : ''}
          ${isToday ? 'ring-1 ring-primary' : ''}
          ${isWeekend && !isPastDay ? 'bg-muted/30' : ''}
        `}
      >
        {isPastDay && (
          <div className="absolute inset-0 bg-background/60 rounded-xl backdrop-blur-[1px]" />
        )}

        {isSelected && !isPastDay && (
          <div className="absolute top-2 right-2">
            <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
          </div>
        )}

        <div className="absolute top-2 left-2">
          <span className="text-xs font-mono text-muted-foreground">
            Day {dayIndex}
          </span>
        </div>

        <div className="flex flex-col items-center gap-2 select-none pt-4">
          <div className="flex flex-col items-center">
            <span
              className={`text-base font-semibold ${
                isSelected && !isPastDay ? 'text-primary' : ''
              }`}
            >
              {dayName}
            </span>
            <span className="text-sm text-muted-foreground">
              {formattedDate}
            </span>
          </div>

          <div className="flex flex-wrap gap-1 justify-center mt-1">
            {isToday && (
              <Badge variant="default" className="text-xs">
                Today
              </Badge>
            )}
            {isWeekend && !isToday && (
              <Badge variant="outline" className="text-xs">
                Weekend
              </Badge>
            )}
            {isPastDay && (
              <Badge
                variant="outline"
                className="bg-muted text-muted-foreground text-xs"
              >
                Past
              </Badge>
            )}
          </div>
        </div>
      </div>
    );
  };

  const handleSetAvailability = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();

    try {
      if (newAvailability.daysOfWeek.length === 0) {
        toast.error('Please select at least one day');
        return;
      }

      if (!newAvailability.startTime || !newAvailability.duration) {
        toast.error('Please select both start time and session duration');
        return;
      }

      // Calculate time period based on start time
      const hour = parseInt(newAvailability.startTime.split(':')[0]);
      let timePeriod: string;

      if (hour >= 0 && hour <= 11) {
        timePeriod = 'MORNING';
      } else if (hour >= 12 && hour <= 16) {
        timePeriod = 'AFTERNOON';
      } else if (hour >= 17 && hour <= 20) {
        timePeriod = 'EVENING';
      } else {
        timePeriod = 'NIGHT';
      }

      // Calculate end time based on start time and duration
      const endTime = calculateEndTime(
        newAvailability.startTime,
        newAvailability.duration
      );

      // Check for overlapping slots before proceeding
      const { hasOverlap, conflictDetails } = checkForOverlappingSlots(
        newAvailability.startTime,
        endTime,
        newAvailability.daysOfWeek
      );

      if (hasOverlap) {
        toast.error(`Overlapping slots already exist: ${conflictDetails}`);
        return;
      }

      // Create availability data with time period
      const availabilityWithEndTime = {
        ...newAvailability,
        endTime,
        timePeriods: [timePeriod],
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      };

      // Validate time slot
      if (
        !validateTimeSlot(
          newAvailability.startTime,
          endTime,
          newAvailability.daysOfWeek
        )
      ) {
        return;
      }

      setIsLoading(true);

      // Make API request
      const response = await fetch('/api/availability', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(availabilityWithEndTime),
      });

      const data: ApiResponse<unknown> = await response.json();

      // Handle API errors
      if (!response.ok) {
        const errorMessage =
          data.ErrorMessage && data.ErrorMessage.length > 0
            ? data.ErrorMessage[0].message
            : 'Failed to set availability';
        throw new Error(errorMessage);
      }

      // Handle success
      if (data.IsSuccess) {
        toast.success('Availability set successfully');

        // Emit socket event for real-time notifications
        if (socket && isConnected && user?._id) {
          socket.emit('update_availability', {
            psychologistId: user._id,
            availabilityData: {
              daysOfWeek: newAvailability.daysOfWeek,
              startTime: newAvailability.startTime,
              endTime,
              duration: newAvailability.duration,
              timePeriods: [timePeriod],
            },
          });
        }

        // Refresh data and reset form
        void fetchAvailability();
        onRefresh?.();
        setIsAddingSlot(false);

        // Reset form state with all fields including timePeriods
        setNewAvailability({
          daysOfWeek: [],
          startTime: '',
          endTime: '',
          duration: 60,
          timePeriods: [],
        });
      } else {
        throw new Error('Failed to set availability');
      }
    } catch (error) {
      console.error('Error setting availability:', error);
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
      console.log('Processing slot with _id:', slot._id);
      slot.daysOfWeek.forEach(day => {
        const daySlot = daysMap.get(day)!;
        daySlot.slots.push({
          id: slot._id,
          startTime: slot.startTime,
          endTime: slot.endTime,
          duration: slot.duration || 60, // Default to 60 if not specified
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

  const checkForOverlappingSlots = (
    newStart: string,
    newEnd: string,
    selectedDays: number[]
  ): { hasOverlap: boolean; conflictDetails: string } => {
    // Helper to convert time string to minutes since midnight
    const timeToMinutes = (timeStr: string): number => {
      const [hours, minutes] = timeStr.split(':').map(Number);
      return hours * 60 + minutes;
    };

    const newStartMinutes = timeToMinutes(newStart);
    const newEndMinutes = timeToMinutes(newEnd);

    let hasOverlap = false;
    let conflictDetails = '';

    // Check each availability slot for potential conflicts
    for (const slot of availabilitySlots) {
      // Check if the days overlap
      const overlappingDays = slot.daysOfWeek.filter(day =>
        selectedDays.includes(day)
      );

      if (overlappingDays.length > 0) {
        const existingStartMinutes = timeToMinutes(slot.startTime);
        const existingEndMinutes = timeToMinutes(slot.endTime);

        // Check if the time ranges overlap
        if (
          newStartMinutes < existingEndMinutes &&
          newEndMinutes > existingStartMinutes
        ) {
          hasOverlap = true;
          const daysText = overlappingDays
            .map(day => DAYS_OF_WEEK[day])
            .join(', ');
          conflictDetails = `Conflict on ${daysText} between ${formatTime(
            slot.startTime
          )} - ${formatTime(slot.endTime)}`;
          break;
        }
      }
    }

    return { hasOverlap, conflictDetails };
  };

  const formatTime = (time: string): string => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    return `${hour % 12 || 12}:${minutes} ${hour >= 12 ? 'PM' : 'AM'}`;
  };

  const handleDeleteAvailability = async (): Promise<void> => {
    if (!deleteDialog.slotId) return;

    console.log('Deleting slot:', deleteDialog.slotId);

    try {
      setIsLoading(true);
      const response = await fetch(
        `/api/availability/psychologist?id=${deleteDialog.slotId}`,
        {
          method: 'DELETE',
        }
      );

      const data: ApiResponse<unknown> = await response.json();

      if (!response.ok) {
        if (data.ErrorMessage && data.ErrorMessage.length > 0) {
          throw new Error(data.ErrorMessage[0].message);
        } else {
          throw new Error('Failed to delete availability');
        }
      }

      if (data.IsSuccess) {
        toast.success('Availability slot removed successfully');

        // Update the local state immediately without waiting for fetchAvailability
        setAvailabilitySlots(prevSlots =>
          prevSlots.filter(slot => slot._id !== deleteDialog.slotId)
        );

        // Still fetch from the server to ensure consistency, but don't block the UI update
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

  const formatDuration = (minutes: number): string => {
    if (minutes < 60) {
      return `${minutes} min`;
    } else if (minutes === 60) {
      return '1 hour';
    } else {
      const hours = Math.floor(minutes / 60);
      const remainingMinutes = minutes % 60;
      return remainingMinutes > 0
        ? `${hours}h ${remainingMinutes}m`
        : `${hours} hours`;
    }
  };

  return (
    <div className="space-y-6 mt-5 max-w-7xl mx-auto">
      <div className="grid gap-6 md:grid-cols-3">
        {/* Time Zone Card */}
        <Card className="">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <div className="p-2 rounded-lg">
                <Current />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium dark:text-muted-foreground">
                  Current Time Zone
                </p>
                <p className="text-2xl font-extrabold tracking-wide">
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
        <Card className="">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <div className="p-2 bg-secondary/10 rounded-lg">
                <Calendars />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium dark:text-muted-foreground">
                  Current Date
                </p>
                <p className="text-2xl font-bold tracking-tight">{dayName}</p>
                <p className="text-sm text-muted-foreground">{date}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Stats Card */}
        <Card className="">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <div className="p-2 rounded-lg">
                <Avaiable />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium dark:text-muted-foreground">
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
              <Current />
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
                    <Calendars />
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
                              <div className="flex flex-col gap-1">
                                <div className="flex items-center gap-3">
                                  <Clock className="h-4 w-4" />
                                  <span className="font-medium">
                                    {formatTime(slot.startTime)} -{' '}
                                    {formatTime(slot.endTime)}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2 ml-7"></div>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  console.log(
                                    'Setting up deletion for slot with ID:',
                                    slot.id
                                  );
                                  setDeleteDialog({
                                    isOpen: true,
                                    slotId: slot.id,
                                  });
                                }}
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
                  duration: 60,
                  timePeriods: [],
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
                  Choose your available time slots and session duration
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
                      ({ dayName, dayIndex, isToday, formattedDate }) => (
                        <DaySelectionCard
                          key={dayIndex}
                          dayName={dayName}
                          dayIndex={dayIndex}
                          isToday={isToday}
                          formattedDate={formattedDate}
                          isSelected={newAvailability.daysOfWeek.includes(
                            dayIndex
                          )}
                          onClick={() => {
                            const updatedDays =
                              newAvailability.daysOfWeek.includes(dayIndex)
                                ? newAvailability.daysOfWeek.filter(
                                    d => d !== dayIndex
                                  )
                                : [...newAvailability.daysOfWeek, dayIndex];
                            setNewAvailability(prev => ({
                              ...prev,
                              daysOfWeek: updatedDays,
                            }));
                          }}
                        />
                      )
                    )}
                  </div>
                </div>

                {/* Session Duration Section */}
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label className="text-lg font-semibold">
                        Session Duration
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        Select the duration for your consultation sessions
                      </p>
                    </div>
                  </div>

                  <RadioGroup
                    value={newAvailability.duration.toString()}
                    onValueChange={handleDurationChange}
                    className="grid grid-cols-1 md:grid-cols-3 gap-4"
                  >
                    {SESSION_DURATIONS.map(duration => (
                      <Label
                        key={duration.value}
                        htmlFor={`duration-${duration.value}`}
                        className={`
        flex items-center space-x-2 rounded-lg border p-4 cursor-pointer
        ${
          newAvailability.duration === duration.value
            ? 'border-primary bg-primary/5 shadow-md'
            : 'hover:bg-muted/50 hover:border-primary/20'
        }
        transition-all
      `}
                      >
                        <RadioGroupItem
                          value={duration.value.toString()}
                          id={`duration-${duration.value}`}
                          className="text-primary"
                        />
                        <div className="grid gap-1 ml-2 flex-1">
                          <div className="flex items-center justify-between">
                            <span className="font-medium">
                              {duration.label}
                            </span>
                            <Badge
                              variant="outline"
                              className="text-xs font-mono"
                            >
                              {duration.endTimeLabel}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {duration.description}
                          </p>

                          {/* Preview time difference if a start time is selected */}
                          {newAvailability.startTime &&
                            newAvailability.duration === duration.value && (
                              <div className="mt-1 text-xs text-primary font-medium bg-primary/5 rounded p-1 flex items-center">
                                <Clock className="h-3 w-3 mr-1" />
                                {formatTime(newAvailability.startTime)} →{' '}
                                {formatTime(
                                  calculateEndTime(
                                    newAvailability.startTime,
                                    duration.value
                                  )
                                )}
                              </div>
                            )}
                        </div>
                      </Label>
                    ))}
                  </RadioGroup>
                </div>

                {/* Time Selection Section */}
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label className="text-lg font-semibold">
                        Start Time
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        Select when your consultation begins
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground capitalize">
                        {formatDuration(newAvailability.duration)} sessions
                      </span>
                    </div>
                  </div>

                  <Select
                    value={newAvailability.startTime}
                    onValueChange={value => {
                      setNewAvailability(prev => ({
                        ...prev,
                        startTime: value,
                        endTime: calculateEndTime(value, prev.duration),
                      }));
                    }}
                  >
                    <SelectTrigger
                      className="w-full h-10 dark:bg-input border border-input rounded-md 
  focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 focus:outline-none
  data-[state=open]:border-input dark:border-foreground/30"
                    >
                      {newAvailability.startTime ? (
                        <div className="flex items-center justify-between w-full">
                          <span>{formatTime(newAvailability.startTime)}</span>
                          {newAvailability.duration > 0 && (
                            <div className="flex items-center text-muted-foreground text-sm">
                              <ChevronRight className="h-4 w-4 mx-1" />
                              <span>
                                {formatTime(
                                  calculateEndTime(
                                    newAvailability.startTime,
                                    newAvailability.duration
                                  )
                                )}
                              </span>
                            </div>
                          )}
                        </div>
                      ) : (
                        <SelectValue placeholder="Choose start time" />
                      )}
                    </SelectTrigger>
                    <SelectContent className="h-64 dark:bg-input">
                      <div className="grid grid-cols-1 divide-y">
                        {Object.values(TIME_PERIODS).map(period => (
                          <div key={period.label} className="relative">
                            <div className="sticky top-0 px-3 py-1.5 text-sm font-semibold bg-background border-b z-10">
                              <div className="flex items-center gap-2">
                                <span className="text-base">{period.icon}</span>
                                <span>{period.label}</span>
                              </div>
                            </div>
                            <div className="py-0.5">
                              {timeSlots
                                .filter(slot => {
                                  const hour = parseInt(
                                    slot.value.split(':')[0]
                                  );
                                  const minutes = parseInt(
                                    slot.value.split(':')[1]
                                  );
                                  return (
                                    hour >= period.start && hour <= period.end
                                  );
                                })
                                .map(slot => {
                                  const [hourStr, minutesStr] =
                                    slot.value.split(':');
                                  const hour = parseInt(hourStr);
                                  const minutes = parseInt(minutesStr);

                                  // Calculate if this time is in the past or too near future
                                  const now = new Date();
                                  const currentHour = now.getHours();
                                  const currentMinutes = now.getMinutes();

                                  // Convert to total minutes for comparison
                                  const slotTotalMinutes = hour * 60 + minutes;
                                  const currentTotalMinutes =
                                    currentHour * 60 + currentMinutes;

                                  // Consider a time slot as "past" if it's less than 5 minutes in the future
                                  const isPastTime =
                                    newAvailability.daysOfWeek.includes(
                                      currentTime.getDay()
                                    ) &&
                                    slotTotalMinutes < currentTotalMinutes + 5;

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

                                        {/* Show end time next to each option */}
                                        {newAvailability.duration > 0 && (
                                          <span className="ml-auto text-xs text-muted-foreground mr-2">
                                            →{' '}
                                            {formatTime(
                                              calculateEndTime(
                                                slot.value,
                                                newAvailability.duration
                                              )
                                            )}
                                          </span>
                                        )}

                                        {isPastTime && (
                                          <Badge
                                            variant="outline"
                                            className="ml-auto text-xs"
                                          >
                                            {slotTotalMinutes <
                                            currentTotalMinutes
                                              ? 'Past'
                                              : 'Too soon'}
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

                {/* Show calculated end time */}
                {newAvailability.startTime && newAvailability.duration && (
                  <div className="rounded-lg border bg-muted/30 p-4 dark:bg-input">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-full">
                          <Clock className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">Session Details</p>
                          <div className="flex items-center mt-1">
                            <div className="flex items-center text-sm">
                              <Clock className="h-3.5 w-3.5 mr-1 text-muted-foreground" />
                              <span>Start: </span>
                              <span className="font-medium ml-1">
                                {formatTime(newAvailability.startTime)}
                              </span>
                            </div>
                            <ChevronRight className="h-3.5 w-3.5 mx-2 text-muted-foreground" />
                            <div className="flex items-center text-sm">
                              <Clock className="h-3.5 w-3.5 mr-1 text-muted-foreground" />
                              <span>End: </span>
                              <span className="font-medium ml-1">
                                {formatTime(
                                  calculateEndTime(
                                    newAvailability.startTime,
                                    newAvailability.duration
                                  )
                                )}
                              </span>
                            </div>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            Total session time:{' '}
                            {formatDuration(newAvailability.duration)}
                          </p>
                        </div>
                      </div>
                      <Badge className="px-3 capitalize">
                        {formatDuration(newAvailability.duration)}
                      </Badge>
                    </div>
                  </div>
                )}

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
                  onClick={() => {
                    handleDeleteAvailability();
                  }}
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
