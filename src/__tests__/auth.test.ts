import { describe, it, expect } from '@jest/globals';

const mockUsers = [
  { email: 'admin@mentality.com', password: 'admin123', isVerified: true, isBlocked: false },
  { email: 'user1@gmail.com', password: 'test1234', isVerified: false, isBlocked: false },
  { email: 'user2@gmail.com', password: 'helloWorld', isVerified: true, isBlocked: true },
];

function login(email: string, password: string) {
  const user = mockUsers.find(u => u.email === email && u.password === password);
  if (!user) return null;
  if (!user.isVerified) return 'Not Verified';
  if (user.isBlocked) return 'Blocked';
  return 'Login Success';
}

describe('🧪 Login Functionality Tests', () => {
  it('✅ should login successfully with valid credentials', () => {
    const result = login('admin@mentality.com', 'admin123');
    expect(result).toBe('Login Success');
  });

  it('❌ should fail if user is not verified', () => {
    const result = login('user1@gmail.com', 'test1234');
    expect(result).toBe('Not Verified');
  });

  it('❌ should block login if user is blocked', () => {
    const result = login('user2@gmail.com', 'helloWorld');
    expect(result).toBe('Blocked');
  });

  it('❌ should fail login with wrong credentials', () => {
    const result = login('user2@gmail.com', 'wrongpass');
    expect(result).toBe(null);
  });

  it('❌ should return null for non-existing users', () => {
    const result = login('ghost@mentality.com', 'ghost123');
    expect(result).toBe(null);
  });
});
