import { Sun, Cloud, Sunset, Moon } from 'lucide-react';

const TIME_PERIODS = {
  MORNING: { start: '00:00:00', end: '11:59:59', icon: Sun, label: 'Morning' },
  AFTERNOON: {
    start: '12:00:00',
    end: '16:59:59',
    icon: Cloud,
    label: 'Afternoon',
  },
  EVENING: {
    start: '17:00:00',
    end: '20:59:59',
    icon: Sunset,
    label: 'Evening',
  },
  NIGHT: { start: '21:00:00', end: '23:59:59', icon: Moon, label: 'Night' },
};

export const getAppointmentCountByPeriod = (events, period) => {
  const periodStart = parseInt(TIME_PERIODS[period].start.split(':')[0]);
  const periodEnd = parseInt(TIME_PERIODS[period].end.split(':')[0]);

  return events.filter(event => {
    if (event.extendedProps?.type === 'appointment') {
      const eventHour = new Date(event.start).getHours();
      return eventHour >= periodStart && eventHour <= periodEnd;
    }
    return false;
  }).length;
};
