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
      .fc .fc-event {
        margin: 1px 0;
        padding: 0;
      }

      .fc .fc-timegrid-event {
        padding: 0 !important;
        margin: 2px !important;
        border: none !important;
        background: transparent !important;
      }

      /* Available slot styles */
      .fc .available-slot {
        border: 1px solid rgba(34, 197, 94, 0.25) !important;
        color: #166534 !important;
      }

      /* Booked slot styles */
      .fc .booked-slot {
        border: 1px solid rgba(239, 68, 68, 0.25) !important;
        color: #dc2626 !important;
      }

      /* Ensure events don't overlap */
      .fc .fc-timegrid-event-harness {
        margin: 0 !important;
      }

      .fc .fc-timegrid-event {
        margin: 1px !important;
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

      /* Dark mode adjustments */
      @media (prefers-color-scheme: dark) {
        .fc .available-slot {
          background-color: rgba(34, 197, 94, 0.2) !important;
        }
        .fc .booked-slot {
          background-color: rgba(239, 68, 68, 0.2) !important;
        }
      }

      /* Remove any background color transitions to prevent color blending */
      .fc .fc-event,
      .fc .fc-event-main {
        transition: opacity 0.2s ease !important;
      }
    `}</style>
  );
};

export default CalendarStyles;
