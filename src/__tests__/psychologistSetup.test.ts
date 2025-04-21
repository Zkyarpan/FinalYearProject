import { describe, it, expect } from '@jest/globals';

interface IPsychologist {
  fullName: string;
  email: string;
  approvalStatus: 'pending' | 'approved' | 'rejected';
  sessionFee: number;
  sessionDuration: 30 | 50 | 80;
  sessionFormats: ('in-person' | 'video' | 'phone')[];
  availability: {
    monday: { start: string; end: string };
    tuesday: { start: string; end: string };
    [key: string]: { start: string; end: string };
  };
}

let mockPsychologist: IPsychologist;

beforeEach(() => {
  mockPsychologist = {
    fullName: 'Dr. Arpan Karki',
    email: 'arpan@mentalcare.com',
    approvalStatus: 'pending',
    sessionFee: 2500,
    sessionDuration: 50,
    sessionFormats: ['video', 'phone'],
    availability: {
      monday: { start: '10:00', end: '16:00' },
      tuesday: { start: '12:00', end: '17:00' },
    },
  };
});

describe('🧠 Psychologist Setup Test', () => {
  it('✅ should have correct default status and availability setup', () => {
    expect(mockPsychologist.approvalStatus).toBe('pending');
    expect(mockPsychologist.sessionFee).toBe(2500);
    expect(mockPsychologist.sessionFormats).toContain('video');
    expect(mockPsychologist.availability.monday.start).toBe('10:00');
  });

  it('✅ should update availability and session preferences', () => {
    mockPsychologist.availability.wednesday = { start: '14:00', end: '18:00' };
    mockPsychologist.sessionFormats.push('in-person');

    expect(mockPsychologist.availability.wednesday.start).toBe('14:00');
    expect(mockPsychologist.sessionFormats).toContain('in-person');
  });
});
function beforeEach(arg0: () => void) {
    throw new Error('Function not implemented.');
}

