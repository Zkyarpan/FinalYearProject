import { describe, it, expect, beforeEach } from '@jest/globals';

interface AvailabilityDay {
  start: string;
  end: string;
  isAvailable: boolean;
}

interface Psychologist {
  fullName: string;
  availability: Record<string, AvailabilityDay>;
}

let mockPsychologist: Psychologist;

beforeEach(() => {
  mockPsychologist = {
    fullName: 'Dr. Arpan Karki',
    availability: {
      monday: { start: '10:00', end: '16:00', isAvailable: true },
      tuesday: { start: '12:00', end: '17:00', isAvailable: true },
      wednesday: { start: '', end: '', isAvailable: false },
      thursday: { start: '', end: '', isAvailable: false },
      friday: { start: '14:00', end: '18:00', isAvailable: true },
      saturday: { start: '', end: '', isAvailable: false },
      sunday: { start: '', end: '', isAvailable: false },
    },
  };
});

function getAvailableDays(availability: Record<string, AvailabilityDay>): string[] {
  return Object.entries(availability)
    .filter(([_, data]) => data.isAvailable)
    .map(([day]) => day);
}

describe('📅 Psychologist Availability Display', () => {
  it('✅ should return available days only', () => {
    const result = getAvailableDays(mockPsychologist.availability);
    expect(result).toEqual(['monday', 'tuesday', 'friday']);
    expect(result).not.toContain('sunday');
  });

  it('✅ should return empty array if no availability set', () => {
    const result = getAvailableDays({
      monday: { start: '', end: '', isAvailable: false },
      tuesday: { start: '', end: '', isAvailable: false },
    });
    expect(result).toEqual([]);
  });
});
