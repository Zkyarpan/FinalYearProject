import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface UserProfile {
  firstName: string | null;
  lastName: string | null;
  profileImage: string | null;
}

interface User extends UserProfile {
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
  firstName: string | null;
  lastName: string | null;
  profileImage: string | null;
}

interface UserStore extends User {
  setUser: (user: SetUser) => void;
  setProfileComplete: (complete: boolean) => void;
  updateProfile: (profile: Partial<UserProfile>) => void;
  logout: () => Promise<void>;
}

export const useUserStore = create(
  persist<UserStore>(
    set => ({
      // Initial state
      id: null,
      email: null,
      role: null,
      isAuthenticated: false,
      isVerified: false,
      profileComplete: false,
      firstName: null,
      lastName: null,
      profileImage: null,

      // Set all user data
      setUser: user =>
        set({
          id: user.id,
          email: user.email,
          role: user.role,
          isAuthenticated: true,
          isVerified: user.isVerified,
          profileComplete: user.profileComplete,
          firstName: user.firstName,
          lastName: user.lastName,
          profileImage: user.profileImage,
        }),

      // Update profile completion status
      setProfileComplete: complete =>
        set(state => ({
          ...state,
          profileComplete: complete,
        })),

      // Update specific profile fields
      updateProfile: profile =>
        set(state => ({
          ...state,
          ...profile,
          profileComplete: true,
        })),

      // Logout functionality
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
              firstName: null,
              lastName: null,
              profileImage: null,
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
