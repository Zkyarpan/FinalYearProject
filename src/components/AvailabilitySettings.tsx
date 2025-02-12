'use client';

import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { z } from 'zod';
import { Clock3, Clock, AlertCircle, Calendar } from 'lucide-react';
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

const availabilitySchema = z.object({
  daysOfWeek: z.array(z.number()).min(1, 'Please select at least one day'),
  startTime: z.string().min(1, 'Please select a start time'),
  endTime: z.string().min(1, 'Please select an end time'),
});

const timeSlots = Array.from({ length: 16 }, (_, i) => {
  const hour = i + 6; // Start from 6 AM to 9 PM
  const time = `${hour.toString().padStart(2, '0')}:00`;
  const label = `${hour % 12 || 12}:00 ${hour >= 12 ? 'PM' : 'AM'}`; // Proper 12-hour format
  return {
    value: time,
    label: label,
  };
});

interface AvailabilitySlot {
  id: string;
  daysOfWeek: number[];
  startTime: string;
  endTime: string;
}

const AvailabilitySettings = ({ onRefresh }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [availabilitySlots, setAvailabilitySlots] = useState<
    AvailabilitySlot[]
  >([]);
  const [isAddingSlot, setIsAddingSlot] = useState(false);
  const [newAvailability, setNewAvailability] = useState({
    daysOfWeek: [],
    startTime: '',
    endTime: '',
  });
  const [deleteDialog, setDeleteDialog] = useState<{
    isOpen: boolean;
    slotId: string | null;
    hasBookings: boolean;
  }>({
    isOpen: false,
    slotId: null,
    hasBookings: false,
  });

  useEffect(() => {
    fetchAvailability();
  }, []);

  const fetchAvailability = async () => {
    try {
      const response = await fetch('/api/availability/psychologist');
      const data = await response.json();
      if (data.IsSuccess) {
        setAvailabilitySlots(data.Result.availability);
      } else {
        toast.error('Failed to fetch availability');
      }
    } catch (error) {
      toast.error('Error loading availability');
    }
  };

  const getDayName = dayNum => {
    return ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][dayNum];
  };

  const handleSetAvailability = async e => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const result = availabilitySchema.safeParse(newAvailability);
      if (!result.success) {
        toast.error(result.error.errors[0].message);
        return;
      }

      const response = await fetch('/api/availability', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newAvailability),
      });

      const data = await response.json();
      if (data.IsSuccess) {
        toast.success('Availability set successfully');
        fetchAvailability();
        setIsAddingSlot(false);
        setNewAvailability({
          daysOfWeek: [],
          startTime: '',
          endTime: '',
        });
      } else {
        toast.error(
          data.ErrorMessage?.[0]?.message || 'Failed to set availability'
        );
      }
    } catch (error) {
      toast.error('Something went wrong');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteAvailability = async () => {
    if (!deleteDialog.slotId) return;

    try {
      setIsLoading(true);
      const response = await fetch(
        `/api/availability/psychologist?id=${deleteDialog.slotId}`,
        { method: 'DELETE' }
      );
      const data = await response.json();

      if (data.IsSuccess) {
        toast.success('Availability deleted successfully');
        fetchAvailability();
      } else {
        toast.error(data.ErrorMessage || 'Failed to delete availability');
      }
    } catch (error) {
      toast.error('Error deleting availability');
    } finally {
      setIsLoading(false);
      setDeleteDialog({ isOpen: false, slotId: null, hasBookings: false });
    }
  };

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    return `${hour % 12 || 12}:${minutes} ${hour >= 12 ? 'PM' : 'AM'}`;
  };

  return (
    <Card className="w-full mb-10">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <div className="flex items-center gap-2 ">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Clock3 className="h-5 w-5" />
            Availability Settings
          </CardTitle>
        </div>
        <Button onClick={() => setIsAddingSlot(true)} className="gap-2">
          <Add />
          Add Time Slot
        </Button>
      </CardHeader>

      <CardContent>
        <div className="space-y-4">
          {availabilitySlots.map(slot => (
            <Card key={slot.id} className="bg-muted/30 dark:bg-input">
              <CardContent className="p-4 ">
                <div className="flex items-center justify-between">
                  <div className="space-y-2 ">
                    <div className="flex gap-1.5 flex-wrap">
                      {slot.daysOfWeek.map(day => (
                        <Badge key={day} variant="secondary">
                          {getDayName(day)}
                        </Badge>
                      ))}
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">
                        {formatTime(slot.startTime)} -{' '}
                        {formatTime(slot.endTime)}
                      </span>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="hover:bg-destructive/10 hover:text-destructive"
                    onClick={() =>
                      setDeleteDialog({
                        isOpen: true,
                        slotId: slot.id,
                        hasBookings: false,
                      })
                    }
                  >
                    <Delete />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}

          {availabilitySlots.length === 0 && (
            <div className="text-center text-muted-foreground py-8">
              <Calendar className="h-12 w-12 mx-auto mb-3 text-muted-foreground/50" />
              <p className="font-medium">No availability slots set</p>
              <p className="text-sm mt-1">
                Add your first availability slot to start accepting appointments
              </p>
            </div>
          )}
        </div>
      </CardContent>

      <Dialog open={isAddingSlot} onOpenChange={setIsAddingSlot}>
        <DialogContent className="sm:max-w-md " style={{ zIndex: 1000 }}>
          <DialogHeader>
            <DialogTitle>Add Availability Slot</DialogTitle>
            <DialogDescription>
              Set your recurring weekly availability for appointments
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSetAvailability} className="space-y-4 ">
            <div className="space-y-2">
              <Label>Days Available</Label>
              <Select
                value={
                  newAvailability.daysOfWeek.length
                    ? newAvailability.daysOfWeek.length === 7
                      ? 'all'
                      : newAvailability.daysOfWeek.join(',') === '1,2,3,4,5'
                      ? 'weekdays'
                      : newAvailability.daysOfWeek.join(',') === '0,6'
                      ? 'weekends'
                      : 'custom'
                    : ''
                }
                onValueChange={value => {
                  const daysMap = {
                    weekdays: [1, 2, 3, 4, 5],
                    weekends: [0, 6],
                    all: [0, 1, 2, 3, 4, 5, 6],
                  };
                  setNewAvailability({
                    ...newAvailability,
                    daysOfWeek: daysMap[value] || [],
                  });
                }}
              >
                <SelectTrigger className="w-full h-10">
                  <SelectValue placeholder="Select days">
                    {newAvailability.daysOfWeek.length
                      ? newAvailability.daysOfWeek.length === 7
                        ? 'All Week'
                        : newAvailability.daysOfWeek.join(',') === '1,2,3,4,5'
                        ? 'Weekdays (Mon-Fri)'
                        : newAvailability.daysOfWeek.join(',') === '0,6'
                        ? 'Weekends (Sat-Sun)'
                        : 'Custom'
                      : 'Select days'}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent
                  position="popper"
                  className="w-[var(--radix-select-trigger-width)]"
                  align="start"
                  sideOffset={4}
                >
                  <SelectItem value="weekdays">Weekdays (Mon-Fri)</SelectItem>
                  <SelectItem value="weekends">Weekends (Sat-Sun)</SelectItem>
                  <SelectItem value="all">All Week</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Start Time</Label>
                <Select
                  value={newAvailability.startTime}
                  onValueChange={value => {
                    if (
                      newAvailability.endTime &&
                      value >= newAvailability.endTime
                    ) {
                      toast.error('Start time must be before end time');
                      return;
                    }
                    setNewAvailability({
                      ...newAvailability,
                      startTime: value,
                    });
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Start time" />
                  </SelectTrigger>
                  <SelectContent
                    position="popper"
                    className="h-[200px] items-center justify-center"
                  >
                    {timeSlots.map(slot => (
                      <SelectItem
                        key={slot.value}
                        value={slot.value}
                        className="py-1.5"
                        disabled={
                          Boolean(newAvailability.endTime) &&
                          slot.value >= newAvailability.endTime
                        }
                      >
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
                    setNewAvailability({
                      ...newAvailability,
                      endTime: value,
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="End time" />
                  </SelectTrigger>
                  <SelectContent position="popper" className="h-[200px]">
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
          if (!isOpen)
            setDeleteDialog({
              isOpen: false,
              slotId: null,
              hasBookings: false,
            });
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 mb-4">
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
              onClick={() =>
                setDeleteDialog({
                  isOpen: false,
                  slotId: null,
                  hasBookings: false,
                })
              }
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
    </Card>
  );
};

export default AvailabilitySettings;
