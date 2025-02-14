interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  extendedProps: {
    type: string;
    psychologistId: any;
    psychologistName: any;
    isBooked: boolean;
  };
  display: string;
  backgroundColor: string;
  borderColor: string;
  textColor: string;
}

export function generateCalendarEvents(availability: any[]): CalendarEvent[] {
  if (!Array.isArray(availability)) return [];

  const events: CalendarEvent[] = [];

  availability.forEach(avail => {
    const { daysOfWeek, startTime, endTime } = avail;
    const [startHour] = startTime.split(':').map(Number);
    const [endHour] = endTime.split(':').map(Number);

    // Current date for reference
    const currentDate = new Date();
    const currentDay = currentDate.getDay();

    // Generate events for each day
    daysOfWeek.forEach(day => {
      // Calculate the next occurrence of this day
      const date = new Date(currentDate);
      const daysUntilNext = (day - currentDay + 7) % 7;
      date.setDate(date.getDate() + daysUntilNext);

      // Generate hourly slots
      for (let hour = startHour; hour < endHour; hour++) {
        const slotStart = new Date(date);
        slotStart.setHours(hour, 0, 0);

        const slotEnd = new Date(date);
        slotEnd.setHours(hour + 1, 0, 0);

        events.push({
          id: `${avail._id}-${day}-${hour}`,
          title: `Available (${formatTime(hour)} - ${formatTime(hour + 1)})`,
          start: slotStart,
          end: slotEnd,
          extendedProps: {
            type: 'availability',
            psychologistId: avail.psychologistId,
            psychologistName: avail.psychologistDetails?.name,
            isBooked: false,
          },
          display: 'block',
          backgroundColor: 'rgba(34, 197, 94, 0.1)',
          borderColor: 'rgba(34, 197, 94, 0.25)',
          textColor: '#166534',
        });
      }
    });
  });

  return events;
}

function formatTime(hour) {
  const period = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 || 12;
  return `${displayHour}:00 ${period}`;
}
