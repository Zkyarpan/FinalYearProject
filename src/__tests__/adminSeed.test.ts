import { describe, it, expect, beforeEach } from '@jest/globals';

interface User {
  email: string;
  password: string;
  role: 'admin' | 'user' | 'psychologist';
  isVerified: boolean;
}

let mockDatabase: User[] = [];

function seedAdmin(): string {
  const existingAdmin = mockDatabase.find(u => u.role === 'admin');
  if (existingAdmin) return 'Admin already exists';

  const defaultAdmin: User = {
    email: 'admin@mentality.com',
    password: 'Admin@123',
    role: 'admin',
    isVerified: true,
  };

  mockDatabase.push(defaultAdmin);
  return 'Admin seeded';
}

describe('🛠️ Admin Seed Test', () => {
  beforeEach(() => {
    mockDatabase = [];
  });

  it('✅ should seed default admin if not already present', () => {
    const result = seedAdmin();
    expect(result).toBe('Admin seeded');
    expect(mockDatabase.length).toBe(1);
    expect(mockDatabase[0].role).toBe('admin');
  });

  it('❌ should not create another admin if one already exists', () => {
    seedAdmin(); // first call
    const result = seedAdmin(); // second call
    expect(result).toBe('Admin already exists');
    expect(mockDatabase.length).toBe(1);
  });
});
