export function determineTimePeriods(startHour: number, endHour: number): string[] {
  const periods = new Set<string>();
  const TIME_PERIODS = {
    MORNING: { start: 0, end: 11, icon: '☀️', label: 'Morning' },
    AFTERNOON: { start: 12, end: 16, icon: '🌤️', label: 'Afternoon' },
    EVENING: { start: 17, end: 20, icon: '🌅', label: 'Evening' },
    NIGHT: { start: 21, end: 23, icon: '🌙', label: 'Night' },
  };

  for (let hour = startHour; hour <= endHour; hour++) {
    // Check which time period this hour belongs to
    if (
      hour >= TIME_PERIODS.MORNING.start &&
      hour <= TIME_PERIODS.MORNING.end
    ) {
      periods.add('MORNING');
    } else if (
      hour >= TIME_PERIODS.AFTERNOON.start &&
      hour <= TIME_PERIODS.AFTERNOON.end
    ) {
      periods.add('AFTERNOON');
    } else if (
      hour >= TIME_PERIODS.EVENING.start &&
      hour <= TIME_PERIODS.EVENING.end
    ) {
      periods.add('EVENING');
    } else if (
      hour >= TIME_PERIODS.NIGHT.start &&
      hour <= TIME_PERIODS.NIGHT.end
    ) {
      periods.add('NIGHT');
    }
  }

  return Array.from(periods);
}
