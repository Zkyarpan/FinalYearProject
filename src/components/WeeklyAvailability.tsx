'use client';

import { useState } from 'react';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const timeSlots = Array.from({ length: 24 }, (_, i) => {
  const hour = i;
  const ampm = hour < 12 ? 'AM' : 'PM';
  const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  return {
    value: `${String(hour).padStart(2, '0')}:00`,
    label: `${displayHour}:00 ${ampm}`,
  };
});

export default function AvailabilitySection() {
  const [availability, setAvailability] = useState({
    monday: { enabled: false, startTime: '09:00', endTime: '17:00' },
    tuesday: { enabled: false, startTime: '09:00', endTime: '17:00' },
    wednesday: { enabled: false, startTime: '09:00', endTime: '17:00' },
    thursday: { enabled: false, startTime: '09:00', endTime: '17:00' },
    friday: { enabled: false, startTime: '09:00', endTime: '17:00' },
    saturday: { enabled: false, startTime: '09:00', endTime: '17:00' },
    sunday: { enabled: false, startTime: '09:00', endTime: '17:00' },
  });

  const handleToggleDay = day => {
    setAvailability(prev => ({
      ...prev,
      [day]: { ...prev[day], enabled: !prev[day].enabled },
    }));
  };

  const handleTimeChange = (day, type, value) => {
    setAvailability(prev => ({
      ...prev,
      [day]: { ...prev[day], [type]: value },
    }));
  };

  return (
    <div className="space-y-4">
      <h3 className="text-2xl font-semibold main-font">Weekly Availability</h3>
      {Object.entries(availability).map(
        ([day, { enabled, startTime, endTime }]) => (
          <div key={day} className="flex items-center gap-10">
            <div className="w-28 flex items-center gap-2">
              <Switch
                checked={enabled}
                onCheckedChange={() => handleToggleDay(day)}
              />
              <span className="capitalize">{day}</span>
            </div>

            <Select
              value={startTime}
              onValueChange={value => handleTimeChange(day, 'startTime', value)}
              disabled={!enabled}
            >
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {timeSlots.map(({ value, label }) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <span>to</span>

            <Select
              value={endTime}
              onValueChange={value => handleTimeChange(day, 'endTime', value)}
              disabled={!enabled}
            >
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {timeSlots.map(({ value, label }) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )
      )}
    </div>
  );
}
