import { describe, it, expect, beforeEach } from '@jest/globals';

interface User {
  email: string;
  password: string;
  isVerified: boolean;
  verificationCode?: string;
}

let mockDatabase: User[] = [];

function registerUser(email: string, password: string): User {
  const verificationCode = Math.random()
    .toString(36)
    .substring(2, 8)
    .toUpperCase();
  const newUser = {
    email,
    password,
    isVerified: false,
    verificationCode,
  };
  mockDatabase.push(newUser);
  return newUser;
}

function verifyEmail(code: string): string {
  const user = mockDatabase.find(u => u.verificationCode === code);
  if (!user) return 'Invalid or expired code';
  user.isVerified = true;
  delete user.verificationCode;
  return 'Verification Successful';
}

describe('📧 Email Verification Workflow', () => {
  beforeEach(() => {
    mockDatabase = [];
  });

  it('✅ should verify user with valid verification code', () => {
    const user = registerUser('arpankarki533@gmail.com', 'pass1234');
    const result = verifyEmail(user.verificationCode!);
    expect(result).toBe('Verification Successful');
    expect(user.isVerified).toBe(true);
  });

  it('❌ should reject invalid verification code', () => {
    registerUser('arpankarki533@gmail.com', 'pass1234');
    const result = verifyEmail('WRONG123');
    expect(result).toBe('Invalid or expired code');
  });
});
