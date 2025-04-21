import { describe, it, expect, beforeEach } from '@jest/globals';

interface Profile {
  user: string; 
  firstName: string;
  lastName: string;
  image: string;
  address?: string;
  phone: string;
  age: number;
  gender?: 'male' | 'female' | 'other';
  emergencyContact: string;
  emergencyPhone: string;
  therapyHistory: 'yes' | 'no';
  preferredCommunication: 'video' | 'audio' | 'chat' | 'in-person';
  struggles: string[];
  briefBio: string;
  profileCompleted: boolean;
}

let mockProfiles: Profile[] = [];

function completeProfile(userId: string, profileData: Omit<Profile, 'profileCompleted' | 'user'>): string {
  const alreadyExists = mockProfiles.find(p => p.user === userId);
  if (alreadyExists) return 'Profile already exists';

  mockProfiles.push({ ...profileData, user: userId, profileCompleted: true });
  return 'Profile successfully created';
}

describe('👤 Profile Completion Based on Real Schema', () => {
  beforeEach(() => {
    mockProfiles = [];
  });

  it('✅ should allow profile creation with valid data', () => {
    const result = completeProfile('user123', {
      firstName: 'Arpan',
      lastName: 'Karki',
      image: '',
      address: 'Kathmandu',
      phone: '9812345678',
      age: 21,
      gender: 'male',
      emergencyContact: 'Dad',
      emergencyPhone: '9800000000',
      therapyHistory: 'no',
      preferredCommunication: 'video',
      struggles: ['anxiety', 'overthinking'],
      briefBio: 'I am seeking mental clarity.',
    });

    expect(result).toBe('Profile successfully created');
    expect(mockProfiles.length).toBe(1);
    expect(mockProfiles[0].profileCompleted).toBe(true);
  });

  it('❌ should reject duplicate profile for same user', () => {
    completeProfile('user123', {
      firstName: 'Arpan',
      lastName: 'Karki',
      image: '',
      address: 'Kathmandu',
      phone: '9812345678',
      age: 21,
      gender: 'male',
      emergencyContact: 'Dad',
      emergencyPhone: '9800000000',
      therapyHistory: 'no',
      preferredCommunication: 'video',
      struggles: ['anxiety'],
      briefBio: 'Existing user.',
    });

    const result = completeProfile('user123', {
      firstName: 'Duplicate',
      lastName: 'User',
      image: '',
      address: 'Lalitpur',
      phone: '9811111111',
      age: 25,
      gender: 'other',
      emergencyContact: 'Mom',
      emergencyPhone: '9810000000',
      therapyHistory: 'yes',
      preferredCommunication: 'chat',
      struggles: ['stress'],
      briefBio: 'Duplicate profile attempt.',
    });

    expect(result).toBe('Profile already exists');
    expect(mockProfiles.length).toBe(1);
  });
});
