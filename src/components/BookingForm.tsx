'use client';

import React from 'react';
import { Calendar, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

export const BookingForm = ({
  bookingDetails,
  selectedSlot,
  onUpdateBookingDetails,
  onSubmit,
  onCancel,
  isLoading,
}) => {
  const formatDateTime = () => {
    try {
      const date = new Date(selectedSlot.start);
      const formattedDate = date.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
      return formattedDate;
    } catch (error) {
      console.error('Date formatting error:', error);
      return 'Invalid Date';
    }
  };

  return (
    <div className="space-y-4">
      <div className="bg-secondary/20 dark:bg-input border p-2 rounded-lg space-y-1 text-sm">
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4" />
          <span>{formatDateTime()}</span>
        </div>
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4" />
          <span>
            {selectedSlot.extendedProps?.originalStartTime ||
              selectedSlot.originalStartTime}{' '}
            -{' '}
            {selectedSlot.extendedProps?.originalEndTime ||
              selectedSlot.originalEndTime}
          </span>
        </div>
      </div>

      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label htmlFor="patientName" className="text-sm">
              Name *
            </Label>
            <input
              id="patientName"
              value={bookingDetails.patientName}
              onChange={e =>
                onUpdateBookingDetails({ patientName: e.target.value })
              }
              className="block w-full rounded-md px-3 py-1.5 text-base text-foreground outline outline-1 -outline-offset-1 outline-border placeholder:text-muted-foreground outline-none focus-visible:ring-transparent sm:text-sm dark:bg-input"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="email" className="text-sm">
              Email *
            </Label>
            <input
              id="email"
              type="email"
              value={bookingDetails.email}
              onChange={e => onUpdateBookingDetails({ email: e.target.value })}
              className="block w-full rounded-md px-3 py-1.5 text-base text-foreground outline outline-1 -outline-offset-1 outline-border placeholder:text-muted-foreground outline-none focus-visible:ring-transparent sm:text-sm dark:bg-input"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label htmlFor="phone" className="text-sm">
              Phone *
            </Label>
            <input
              id="phone"
              value={bookingDetails.phone}
              onChange={e => onUpdateBookingDetails({ phone: e.target.value })}
              className="block w-full rounded-md px-3 py-1.5 text-base text-foreground outline outline-1 -outline-offset-1 outline-border placeholder:text-muted-foreground outline-none focus-visible:ring-transparent sm:text-sm dark:bg-input"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-sm">Format *</Label>
            <RadioGroup
              value={bookingDetails.sessionFormat}
              onValueChange={value =>
                onUpdateBookingDetails({ sessionFormat: value })
              }
              className="flex gap-3"
            >
              {(selectedSlot.extendedProps?.sessionFormats || ['video']).map(
                format => (
                  <div key={format} className="flex items-center space-x-1">
                    <RadioGroupItem value={format} id={format} />
                    <Label htmlFor={format} className="text-sm capitalize">
                      {format}
                    </Label>
                  </div>
                )
              )}
            </RadioGroup>
          </div>
        </div>

        <div className="space-y-1">
          <Label htmlFor="reasonForVisit" className="text-sm">
            Reason *
          </Label>
          <textarea
            id="reasonForVisit"
            value={bookingDetails.reasonForVisit}
            onChange={e =>
              onUpdateBookingDetails({ reasonForVisit: e.target.value })
            }
            className="block w-full rounded-md h-20 px-3 py-1.5 text-base text-foreground outline outline-1 -outline-offset-1 outline-border placeholder:text-muted-foreground outline-none focus-visible:ring-transparent sm:text-sm dark:bg-input"
          />
        </div>

        <div className="space-y-1">
          <Label htmlFor="notes" className="text-sm">
            Notes (Optional)
          </Label>
          <textarea
            id="notes"
            value={bookingDetails.notes}
            onChange={e => onUpdateBookingDetails({ notes: e.target.value })}
            className="block w-full rounded-md h-20 px-3 py-1.5 text-base text-foreground outline outline-1 -outline-offset-1 outline-border placeholder:text-muted-foreground outline-none focus-visible:ring-transparent sm:text-sm dark:bg-input"
          />
        </div>
      </div>

      <div className="flex justify-end gap-2 mt-4">
        <Button variant="outline" onClick={onCancel} className="h-8">
          Cancel
        </Button>
        <Button onClick={onSubmit} disabled={isLoading} className="h-8">
          {isLoading
            ? 'Processing...'
            : `Proceed to Payment ($${
                selectedSlot.extendedProps?.sessionFee ||
                selectedSlot.sessionFee
              })`}
        </Button>
      </div>
    </div>
  );
};

export default BookingForm;
