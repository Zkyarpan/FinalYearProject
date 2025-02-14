interface CalendarEvent {
  id: string;
  title: string;
  start: string;
  end: string;
  backgroundColor: string;
  borderColor: string;
  textColor: string;
  classNames: string[];
}

export const formatCalendarEvents = (
  appointments: any[],
  availabilitySlots: any[]
) => {
  const events: CalendarEvent[] = [];

  appointments.forEach(apt => {
    events.push({
      id: apt._id,
      title: `Appointment: ${apt.userId.profile.firstName} ${apt.userId.profile.lastName}`,
      start: apt.dateTime,
      end: new Date(
        new Date(apt.dateTime).getTime() + apt.duration * 60000
      ).toISOString(),
      backgroundColor:
        apt.status === 'confirmed' ? 'rgb(5, 150, 105)' : 'rgb(37, 99, 235)',
      borderColor:
        apt.status === 'confirmed' ? 'rgb(5, 150, 105)' : 'rgb(37, 99, 235)',
      textColor: '#ffffff',
      classNames: [
        apt.status === 'confirmed' ? 'confirmed-event' : 'booked-event',
      ],
    });
  });

  // Add availability as calendar events
  availabilitySlots.forEach(slot => {
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 30); // Adjust as needed for more future dates

    while (startDate <= endDate) {
      if (slot.daysOfWeek.includes(startDate.getDay())) {
        const startTime = `${slot.startTime}`;
        const endTime = `${slot.endTime}`;

        events.push({
          id: `availability-${slot.id}-${startDate.toISOString()}`,
          title: 'Available',
          start: new Date(
            startDate.setHours(
              parseInt(startTime.split(':')[0]),
              parseInt(startTime.split(':')[1]),
              0
            )
          ).toISOString(),
          end: new Date(
            startDate.setHours(
              parseInt(endTime.split(':')[0]),
              parseInt(endTime.split(':')[1]),
              0
            )
          ).toISOString(),
          backgroundColor: 'rgba(75, 192, 192, 0.5)',
          borderColor: '#4BC0C0',
          textColor: '#fff',
          classNames: ['availability-event'],
        });
      }
      startDate.setDate(startDate.getDate() + 1);
    }
  });

  return events;
};
