export const CalendarStyles = () => {
  return (
    <style jsx global>{`
      .fc {
        --fc-border-color: hsl(var(--border));
        --fc-page-bg-color: transparent;
        --fc-neutral-bg-color: transparent;
        --fc-today-bg-color: hsl(var(--accent) / 0.1);
      }

      /* Status messages for all types */
      .fc .calendar-status-messages {
        display: grid;
        gap: 0.5rem;
        margin-bottom: 1rem;
      }

      .fc .status-message {
        padding: 0.75rem;
        font-size: 0.875rem;
        font-weight: 500;
        border-left-width: 3px;
        border-left-style: solid;
      }

      /* Available status */
      .fc .status-message-available {
        background-color: rgba(239, 68, 68, 0.1);
        border-left-color: rgb(239, 68, 68);
        color: rgb(239, 68, 68);
      }

      /* Booked status */
      .fc .status-message-booked {
        background-color: rgba(37, 99, 235, 0.1);
        color: rgb(37, 99, 235);
      }

      /* Confirmed status */
      .fc .status-message-confirmed {
        background-color: rgba(5, 150, 105, 0.1);
        border-left-color: rgb(5, 150, 105);
        color: rgb(5, 150, 105);
      }

      /* Available Slots */
      .fc .availability-slot {
        background-color: rgba(239, 68, 68, 0.15) !important;
        border: 2px solid rgb(239, 68, 68) !important;
        margin: 0 !important;
        opacity: 1 !important;
      }

      .fc .availability-slot .fc-event-title,
      .fc .availability-slot .fc-event-time {
        color: rgb(239, 68, 68) !important;
        font-weight: 600;
      }

      /* Booked Appointments */
      .fc .booked-event {
        background-color: rgb(37, 99, 235) !important;
        border: none !important;
        opacity: 1 !important;
      }

      .fc .booked-event .fc-event-title,
      .fc .booked-event .fc-event-time {
        color: white !important;
        font-weight: 500;
      }

      /* Confirmed Appointments */
      .fc .confirmed-event {
        background-color: rgb(5, 150, 105) !important;
        border: none !important;
        opacity: 1 !important;
      }

      .fc .confirmed-event .fc-event-title,
      .fc .confirmed-event .fc-event-time {
        color: white !important;
        font-weight: 500;
      }

      /* Base calendar styles */
      .fc .fc-timegrid-slot {
        height: 4rem;
        border-bottom: 1px solid hsl(var(--border));
      }

      .fc .fc-timegrid-slot-minor {
        border-top-style: none;
      }

      .fc .fc-toolbar-title {
        font-size: 1.25rem;
        font-weight: 600;
        color: hsl(var(--foreground));
      }

      .fc .fc-button {
        background: hsl(var(--background));
        border: 1px solid hsl(var(--border));
        padding: 0.5rem 1rem;
        font-weight: 500;
        height: 2.5rem;
        color: hsl(var(--foreground));
        border-radius: 0;
      }

      /* Dark mode adjustments */
      @media (prefers-color-scheme: dark) {
        .fc .availability-slot {
          background-color: rgba(239, 68, 68, 0.25) !important;
        }
        .fc .booked-event {
          background-color: rgb(59, 130, 246) !important;
        }
        .fc .confirmed-event {
          background-color: rgb(16, 185, 129) !important;
        }
      }
    `}</style>
  );
};
