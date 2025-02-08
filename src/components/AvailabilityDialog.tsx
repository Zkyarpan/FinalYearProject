'use client';

import React, { useState } from 'react';
import { toast } from 'sonner';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const availabilitySchema = z.object({
  daysOfWeek: z.array(z.number()).min(1, 'Please select at least one day'),
  startTime: z.string().min(1, 'Please select a start time'),
  endTime: z.string().min(1, 'Please select an end time'),
});

export const AvailabilityDialog = ({ isOpen, onClose, onRefresh }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [availability, setAvailability] = useState({
    daysOfWeek: [],
    startTime: '',
    endTime: '',
  });

  const timeSlots = [
    { value: '08:00', label: '8:00 AM' },
    { value: '09:00', label: '9:00 AM' },
    { value: '10:00', label: '10:00 AM' },
    { value: '11:00', label: '11:00 AM' },
    { value: '12:00', label: '12:00 PM' },
    { value: '13:00', label: '1:00 PM' },
    { value: '14:00', label: '2:00 PM' },
    { value: '15:00', label: '3:00 PM' },
    { value: '16:00', label: '4:00 PM' },
    { value: '17:00', label: '5:00 PM' },
  ];

  const handleSetAvailability = async e => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const result = availabilitySchema.safeParse(availability);

      if (!result.success) {
        toast.error(result.error.errors[0].message);
        return;
      }

      const response = await fetch('/api/availability', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(availability),
      });

      const data = await response.json();

      if (!response.ok) {
        const errorMessage =
          data.ErrorMessage?.[0]?.message || 'Failed to set availability';
        toast.error(errorMessage);
        return;
      }

      if (data.IsSuccess) {
        toast.success(data.Result?.message || 'Availability set successfully');
        onClose();
        onRefresh?.();
      }
    } catch (error) {
      console.error('Set availability error:', error);
      toast.error('Something went wrong while setting availability');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Set Weekly Availability</DialogTitle>
          <DialogDescription>
            Choose your recurring weekly availability
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSetAvailability} className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label>Days Available</Label>
            <Select
              defaultValue=""
              onValueChange={value => {
                const daysMap = {
                  weekdays: [1, 2, 3, 4, 5],
                  weekends: [0, 6],
                  all: [0, 1, 2, 3, 4, 5, 6],
                };
                setAvailability({
                  ...availability,
                  daysOfWeek: daysMap[value] || [],
                });
              }}
              disabled={isLoading}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select days" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="weekdays">Weekdays (Mon-Fri)</SelectItem>
                <SelectItem value="weekends">Weekends (Sat-Sun)</SelectItem>
                <SelectItem value="all">All Week</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label>Start Time</Label>
              <Select
                value={availability.startTime}
                onValueChange={value =>
                  setAvailability({ ...availability, startTime: value })
                }
                disabled={isLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Start time" />
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

            <div className="grid gap-2">
              <Label>End Time</Label>
              <Select
                value={availability.endTime}
                onValueChange={value =>
                  setAvailability({ ...availability, endTime: value })
                }
                disabled={isLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="End time" />
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
              onClick={onClose}
              disabled={isLoading}
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
  );
};

export default AvailabilityDialog;
