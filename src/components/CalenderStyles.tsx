export const CalendarStyles = () => {
  return (
    <style jsx global>{`
      .fc {
        --fc-border-color: hsl(var(--border));
        --fc-page-bg-color: transparent;
        --fc-neutral-bg-color: transparent;
        --fc-today-bg-color: hsl(var(--accent) / 0.1);
      }

      /* Event styles */
      .fc .calendar-event {
        margin: 1px 0;
        padding: 0;
        border-radius: 4px;
      }

      /* Available slot styles */
      .fc .available-slot {
        background-color: rgba(34, 197, 94, 0.1) !important;
        border: 1px solid rgba(34, 197, 94, 0.25) !important;
        color: #166534 !important;
      }

      /* Booked slot styles */
      .fc .booked-slot {
        background-color: rgba(239, 68, 68, 0.1) !important;
        border: 1px solid rgba(239, 68, 68, 0.25) !important;
        color: #dc2626 !important;
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
        .fc .available-slot {
          background-color: rgba(34, 197, 94, 0.2) !important;
        }
        .fc .booked-slot {
          background-color: rgba(239, 68, 68, 0.2) !important;
        }
      }
    `}</style>
  );
};

export default CalendarStyles;
