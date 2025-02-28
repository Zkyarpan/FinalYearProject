import { SlotStatus } from '@/models/Availability';

export const getEventStyle = (
  status: SlotStatus
): {
  backgroundColor: string;
  borderColor: string;
  textColor: string;
  className: string[];
} => {
  switch (status) {
    case SlotStatus.AVAILABLE:
      return {
        backgroundColor: 'rgba(34, 197, 94, 0.1)',
        borderColor: 'rgba(34, 197, 94, 0.25)',
        textColor: '#166534',
        className: ['calendar-event', 'available-slot'],
      };
    case SlotStatus.BOOKED:
      return {
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        borderColor: 'rgba(59, 130, 246, 0.25)',
        textColor: '#1e40af',
        className: ['calendar-event', 'booked-slot'],
      };
    case SlotStatus.IN_PROGRESS:
      return {
        backgroundColor: 'rgba(234, 179, 8, 0.1)',
        borderColor: 'rgba(234, 179, 8, 0.25)',
        textColor: '#854d0e',
        className: ['calendar-event', 'in-progress-slot'],
      };
    case SlotStatus.COMPLETED:
      return {
        backgroundColor: 'rgba(34, 197, 94, 0.1)',
        borderColor: 'rgba(34, 197, 94, 0.25)',
        textColor: '#166534',
        className: ['calendar-event', 'completed-slot'],
      };
    case SlotStatus.CANCELLED:
      return {
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        borderColor: 'rgba(239, 68, 68, 0.25)',
        textColor: '#991b1b',
        className: ['calendar-event', 'cancelled-slot'],
      };
    case SlotStatus.MISSED:
      return {
        backgroundColor: 'rgba(156, 163, 175, 0.1)',
        borderColor: 'rgba(156, 163, 175, 0.25)',
        textColor: '#374151',
        className: ['calendar-event', 'missed-slot'],
      };
    default:
      return {
        backgroundColor: 'rgba(156, 163, 175, 0.1)',
        borderColor: 'rgba(156, 163, 175, 0.25)',
        textColor: '#374151',
        className: ['calendar-event', `${String(status).toLowerCase()}-slot`],
      };
  }
};
