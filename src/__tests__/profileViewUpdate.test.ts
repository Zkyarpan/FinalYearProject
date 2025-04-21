import { describe, it, expect, beforeEach } from '@jest/globals';

type Profile = {
  user: string;
  firstName: string;
  lastName: string;
  image: string;
  address?: string;
  phone: string;
  age: number;
  gender?: string;
  emergencyContact: string;
  emergencyPhone: string;
  therapyHistory: 'yes' | 'no';
  preferredCommunication: 'video' | 'audio' | 'chat' | 'in-person';
  struggles: string[];
  briefBio: string;
  profileCompleted: boolean;
  createdAt: Date;
  updatedAt: Date;
};

let mockProfile: Profile;

beforeEach(() => {
  mockProfile = {
    user: 'user123',
    firstName: 'Arpan',
    lastName: 'Karki',
    image: '/default-avatar.png',
    address: 'Kathmandu, Nepal',
    phone: '9800000000',
    age: 22,
    gender: 'male',
    emergencyContact: 'Father',
    emergencyPhone: '9811111111',
    therapyHistory: 'no',
    preferredCommunication: 'video',
    struggles: ['stress', 'anxiety'],
    briefBio: 'I am working on improving my mental health.',
    profileCompleted: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
});

function getUserProfile(): Profile {
  return mockProfile;
}

function updateUserProfile(updates: Partial<Profile>): Profile {
  mockProfile = { ...mockProfile, ...updates, updatedAt: new Date() };
  return mockProfile;
}

describe('👤 Profile View & Update Test', () => {
  it('✅ should retrieve the current profile', () => {
    const profile = getUserProfile();
    expect(profile.firstName).toBe('Arpan');
    expect(profile.therapyHistory).toBe('no');
    expect(profile.struggles).toContain('stress');
  });

  it('✅ should update phone number and brief bio', () => {
    const updated = updateUserProfile({
      phone: '9840000000',
      briefBio: 'Updated bio',
    });

    expect(updated.phone).toBe('9840000000');
    expect(updated.briefBio).toBe('Updated bio');
    expect(updated.profileCompleted).toBe(true);
  });
});
