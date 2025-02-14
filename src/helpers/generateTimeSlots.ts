import { addMinutes, format, parse } from 'date-fns';

interface TimeSlot {
  start: string;
  end: string;
}

export function generateTimeSlots(
  startTime: string,
  endTime: string,
  duration: number = 60
) {
  const slots: TimeSlot[] = [];
  const start = parse(startTime, 'HH:mm', new Date());
  const end = parse(endTime, 'HH:mm', new Date());

  let currentSlot = start;
  while (currentSlot < end) {
    const slotEnd = addMinutes(currentSlot, duration);
    if (slotEnd <= end) {
      slots.push({
        start: format(currentSlot, 'HH:mm'),
        end: format(slotEnd, 'HH:mm'),
      });
    }
    currentSlot = slotEnd;
  }
  return slots;
}
