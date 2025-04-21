import { describe, it, expect } from '@jest/globals';

const mockUsers = [
  {
    email: 'verified@user.com',
    password: 'password123',
    isVerified: true,
    isBlocked: false,
  },
];

function login(email: string, password: string) {
  const user = mockUsers.find(
    u => u.email === email && u.password === password
  );
  if (!user) return 'Invalid credentials';
  if (!user.isVerified) return 'Not Verified';
  if (user.isBlocked) return 'Blocked';
  return 'Login Success';
}

describe('❌ Invalid Login Test', () => {
  it('should reject login for wrong email', () => {
    const result = login('wrong@user.com', 'password123');
    expect(result).toBe('Invalid credentials');
  });

  it('should reject login for wrong password', () => {
    const result = login('verified@user.com', 'wrongPassword');
    expect(result).toBe('Invalid credentials');
  });

  it('should reject login for completely unknown user', () => {
    const result = login('ghost@unknown.com', 'ghost123');
    expect(result).toBe('Invalid credentials');
  });
});
