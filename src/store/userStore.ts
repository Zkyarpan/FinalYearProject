import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  id: string | null;
  email: string | null;
  role: string | null;
  isAuthenticated: boolean;
  isVerified: boolean;
  profileComplete: boolean;
}

interface SetUser {
  id: string;
  email: string;
  role: string;
  isVerified: boolean;
  profileComplete: boolean;
}

interface UserStore extends User {
  setUser: (user: SetUser) => void;
  setProfileComplete: (complete: boolean) => void;
  logout: () => Promise<void>;
}

export const useUserStore = create(
  persist<UserStore>(
    set => ({
      id: null,
      email: null,
      role: null,
      isAuthenticated: false,
      isVerified: false,
      profileComplete: false,

      setUser: user =>
        set({
          id: user.id,
          email: user.email,
          role: user.role,
          isAuthenticated: true,
          isVerified: user.isVerified,
          profileComplete: user.profileComplete,
        }),

      setProfileComplete: complete =>
        set(state => ({
          ...state,
          profileComplete: complete,
        })),

      logout: async () => {
        try {
          const response = await fetch('/api/logout', {
            method: 'POST',
            credentials: 'include',
          });
          if (response.ok) {
            set({
              id: null,
              email: null,
              role: null,
              isAuthenticated: false,
              isVerified: false,
              profileComplete: false,
            });
          } else {
            console.error('Failed to logout.');
          }
        } catch (error) {
          console.error('Logout error:', error);
        }
      },
    }),
    {
      name: 'user-storage',
    }
  )
);
