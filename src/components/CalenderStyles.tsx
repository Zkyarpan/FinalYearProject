export const CalendarStyles = () => {
  return (
    <style jsx global>{`
      .fc {
        --fc-border-color: hsl(var(--border));
        --fc-page-bg-color: transparent;
        --fc-neutral-bg-color: transparent;
        --fc-today-bg-color: hsl(var(--accent) / 0.1);
      }

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

      .fc .fc-button:disabled {
        opacity: 0.5;
        cursor: default;
      }

      .fc .fc-button:not(:disabled):hover {
        background: hsl(var(--accent));
        border-color: hsl(var(--accent));
        color: hsl(var(--accent-foreground));
      }

      .fc .fc-button-primary:not(:disabled).fc-button-active,
      .fc .fc-button-primary:not(:disabled):active {
        background: hsl(var(--accent));
        border-color: hsl(var(--accent));
        color: hsl(var(--accent-foreground));
      }

      .fc .fc-timegrid-event {
        background: hsl(var(--background));
        border: 1px solid hsl(var(--border));
        box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1);
        border-radius: 0;
      }

      /* Success Event Style */
      .fc .event-success {
        background-color: hsl(142.1 76.2% 36.3%) !important;
        border: none !important;
      }

      .fc .event-success .fc-event-main {
        background-color: hsl(142.1 76.2% 36.3%) !important;
        color: white !important;
        padding: 0.5rem;
      }

      .fc .event-success .fc-event-title,
      .fc .event-success .fc-event-time {
        color: white !important;
        font-weight: 500;
      }

      /* Available slots styling - Light Mode Options */
      .fc .available-slot {
        margin: 0 !important;
        padding: 0 !important;
        border: none !important;
        inset-inline: 0 !important;
        inset-block: 0 !important;
        height: 100% !important;
        border-radius: 0 !important;

        /* Default - Sky Blue */
        background: #0ea5e9 !important;

        /* Option 1 - Calm Blue */
        /* background: #3b82f6 !important; */

        /* Option 2 - Soft Teal */
        /* background: #14b8a6 !important; */

        /* Option 3 - Gentle Indigo */
        /* background: #6366f1 !important; */

        /* Option 4 - Professional Purple */
        /* background: #8b5cf6 !important; */
      }

      /* Available slots styling - Dark Mode Options */
      @media (prefers-color-scheme: dark) {
        .fc .available-slot {
          /* Default - Deep Blue */
          /* background: #1d4ed8 !important; */

          /* Option 1 - Rich Purple */
          /* background: #7c3aed !important; */

          /* Option 2 - Dark Teal */
          /* background: #0d9488 !important; */

          /* Option 3 - Navy Blue */
          /* background: #1e40af !important; */

          /* Option 4 - Deep Indigo */
          /* background: #4338ca !important; */
        }
      }

      .fc .available-slot .fc-event-main {
        padding: 0.5rem;
        height: 100%;
      }

      .fc .available-slot .fc-event-title,
      .fc .available-slot .fc-event-time {
        color: white !important;
        font-weight: 500;
      }

      .fc .available-slot:hover {
        filter: brightness(1.1);
      }

      .fc .fc-timegrid-event {
        background: hsl(var(--background));
        border: 1px solid hsl(var(--border));
        box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1);
        border-radius: 0;
      }

      .fc .fc-timegrid-event .fc-event-main {
        padding: 0.5rem;
      }

      .fc .fc-timegrid-event .fc-event-time {
        font-size: 0.875rem;
        font-weight: 500;
      }

      .fc .fc-timegrid-slots td {
        height: 4rem;
      }

      .fc .fc-timegrid-col {
        padding: 0 !important;
      }

      .fc .fc-timegrid-col-events {
        margin: 0 !important;
      }

      .fc .fc-timegrid-axis {
        padding: 0.5rem;
        border-right: 1px solid hsl(var(--border));
      }

      .fc .fc-col-header-cell {
        padding: 0.75rem 0.5rem;
        background: hsl(var(--background));
        border-bottom: 1px solid hsl(var(--border));
      }

      .fc .fc-timegrid-event-harness {
        margin: 0 !important;
      }

      .fc .fc-timegrid-now-indicator-line {
        border-color: hsl(var(--destructive));
      }
    `}</style>
  );
};
