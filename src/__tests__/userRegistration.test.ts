import { describe, it, expect } from '@jest/globals';

interface NewUser {
  email: string;
  password: string;
}

const mockDatabase: NewUser[] = [];

function registerUser(email: string, password: string): string {
  const existingUser = mockDatabase.find(user => user.email === email);
  if (existingUser) return 'User already exists';
  if (!email || !password) return 'Invalid input';

  mockDatabase.push({ email, password });
  return 'Registration Success';
}

describe('🧪 User Registration Tests', () => {
  it('✅ should register user with valid email and password', () => {
    const result = registerUser('testuser@mentality.com', 'strongPass123');
    expect(result).toBe('Registration Success');
  });

  it('❌ should not allow duplicate email registration', () => {
    registerUser('testuser@mentality.com', 'strongPass123'); 
    const result = registerUser('testuser@mentality.com', 'anotherPass');
    expect(result).toBe('User already exists');
  });

  it('❌ should not register with empty credentials', () => {
    const result = registerUser('', '');
    expect(result).toBe('Invalid input');
  });
});
