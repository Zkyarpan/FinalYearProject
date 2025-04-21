import { describe, it, expect } from '@jest/globals';

let sessionStore: Record<string, boolean> = {
  'admin-session': true,
  'user-session': true,
};

function logout(sessionId: string) {
  if (sessionStore[sessionId]) {
    delete sessionStore[sessionId]; // Invalidate session
    return 'Logout successful';
  }
  return 'Invalid session';
}

describe('🔐 Logout Functionality', () => {
  it('✅ should successfully logout with a valid session ID', () => {
    const result = logout('user-session');
    expect(result).toBe('Logout successful');
    expect(sessionStore['user-session']).toBeUndefined();
  });

  it('❌ should fail logout for already logged-out or invalid session ID', () => {
    const result = logout('non-existent-session');
    expect(result).toBe('Invalid session');
  });

  it('❌ should fail logout for same session twice', () => {
    logout('admin-session'); // First logout
    const result = logout('admin-session'); // Try again
    expect(result).toBe('Invalid session');
  });
});
