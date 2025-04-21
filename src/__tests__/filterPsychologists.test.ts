import { describe, it, expect, beforeEach } from '@jest/globals';

interface Psychologist {
  fullName: string;
  email: string;
  specializations: string[];
  approvalStatus: 'pending' | 'approved' | 'rejected';
}

let mockPsychologists: Psychologist[] = [];

beforeEach(() => {
  mockPsychologists = [
    {
      fullName: 'Dr. Arpan Karki',
      email: 'arpan@mental.com',
      specializations: ['anxiety', 'stress', 'adult counseling'],
      approvalStatus: 'approved',
    },
    {
      fullName: 'Dr. Sneha Sharma',
      email: 'sneha@mental.com',
      specializations: ['child therapy', 'trauma', 'grief'],
      approvalStatus: 'approved',
    },
    {
      fullName: 'Dr. Rejected Doc',
      email: 'rejected@mental.com',
      specializations: ['depression'],
      approvalStatus: 'rejected',
    },
  ];
});

function filterPsychologistsBySpecialization(
  specialization: string
): Psychologist[] {
  return mockPsychologists.filter(
    p =>
      p.approvalStatus === 'approved' &&
      p.specializations
        .map(s => s.toLowerCase())
        .includes(specialization.toLowerCase())
  );
}

describe('🔍 Filter Psychologists by Specialization', () => {
  it('✅ should return psychologists who match the specialization and are approved', () => {
    const result = filterPsychologistsBySpecialization('anxiety');
    expect(result.length).toBe(1);
    expect(result[0].fullName).toBe('Dr. Arpan Karki');
  });

  it('✅ should return psychologists for child therapy', () => {
    const result = filterPsychologistsBySpecialization('child therapy');
    expect(result.length).toBe(1);
    expect(result[0].fullName).toBe('Dr. Sneha Sharma');
  });

  it('❌ should not return rejected psychologists even if specialization matches', () => {
    const result = filterPsychologistsBySpecialization('depression');
    expect(result.length).toBe(0);
  });

  it('❌ should return empty array if specialization not found', () => {
    const result = filterPsychologistsBySpecialization('relationship issues');
    expect(result).toEqual([]);
  });
});
