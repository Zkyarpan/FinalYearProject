import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface UserState {
  id: string | null;
  email: string | null;
  role: string | null;
  isAuthenticated: boolean;
  setUser: (user: { id: string; email: string; role: string }) => void;
  logout: () => void;
}

export const useUserStore = create(
  persist<UserState>(
    set => ({
      id: null,
      email: null,
      role: null,
      isAuthenticated: false,

      setUser: user => set({ ...user, isAuthenticated: true }),

      logout: async () => {
        try {
          const response = await fetch('/api/logout', {
            method: 'POST',
            credentials: 'include',
          });
          if (response.ok) {
            set({ id: null, email: null, role: null, isAuthenticated: false });
          } else {
            console.error('Failed to logout.');
          }
        } catch (error) {
          console.error('Logout error:', error);
        }
      },
    }),
    {
      name: 'user-storage', // Key for localStorage
    }
  )
);
