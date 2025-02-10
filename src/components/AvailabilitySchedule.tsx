'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock } from 'lucide-react';

interface AvailabilitySlot {
  title: string;
  daysOfWeek: number[];
  startTime: string;
  endTime: string;
  extendedProps: {
    type: string;
    psychologistId: string;
    psychologistName: string;
    [key: string]: any;
  };
}

interface AvailabilityScheduleProps {
  availability: AvailabilitySlot[];
}

const AvailabilitySchedule: React.FC<AvailabilityScheduleProps> = ({
  availability,
}) => {
  // Group slots by time range
  const groupedSlots = availability.reduce((acc, slot) => {
    const key = `${slot.startTime}-${slot.endTime}`;
    if (!acc[key]) {
      acc[key] = {
        startTime: slot.startTime,
        endTime: slot.endTime,
        days: slot.daysOfWeek,
      };
    }
    return acc;
  }, {} as Record<string, { startTime: string; endTime: string; days: number[] }>);

  const getDayNames = (days: number[]) => {
    const dayMap: Record<number, string> = {
      0: 'Sun',
      1: 'Mon',
      2: 'Tue',
      3: 'Wed',
      4: 'Thu',
      5: 'Fri',
      6: 'Sat',
    };

    return days.map(day => dayMap[day]).join(', ');
  };

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    const date = new Date();
    date.setHours(parseInt(hours), parseInt(minutes));
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  return (
    <div className="space-y-4">
      {Object.values(groupedSlots).map((slot, index) => (
        <Card key={index} className="bg-card hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-primary" />
                  <span className="font-medium">
                    {formatTime(slot.startTime)} - {formatTime(slot.endTime)}
                  </span>
                </div>
                <Badge variant="secondary">
                  {slot.days.length} {slot.days.length === 1 ? 'day' : 'days'}
                </Badge>
              </div>
              <div className="flex flex-wrap gap-2 mt-1">
                {getDayNames(slot.days)
                  .split(', ')
                  .map(day => (
                    <Badge key={day} variant="outline" className="text-xs">
                      {day}
                    </Badge>
                  ))}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default AvailabilitySchedule;
