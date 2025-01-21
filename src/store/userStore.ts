import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface UserProfile {
  firstName: string | null;
  lastName: string | null;
  profileImage: string | null;
}

interface User extends UserProfile {
  _id: string | null;
  email: string | null;
  role: string | null;
  isAuthenticated: boolean;
  isVerified: boolean;
  profileComplete: boolean;
}

interface SetUser {
  _id: string;
  email: string;
  role: string;
  isVerified: boolean;
  profileComplete: boolean;
  firstName: string | null;
  lastName: string | null;
  profileImage: string | null;
  isAuthenticated?: boolean;
}

interface UserStore extends User {
  user: User | null;
  setUser: (user: SetUser) => void;
  setProfileComplete: (complete: boolean) => void;
  updateProfile: (profile: Partial<UserProfile>) => void;
  logout: () => Promise<void>;
}

export const useUserStore = create(
  persist<UserStore>(
    set => ({
      _id: null,
      email: null,
      role: null,
      isAuthenticated: false,
      isVerified: false,
      profileComplete: false,
      firstName: null,
      lastName: null,
      profileImage: null,
      user: null,

      setUser: user =>
        set({
          _id: user._id,
          email: user.email,
          role: user.role,
          isAuthenticated: user.isAuthenticated ?? true,
          isVerified: user.isVerified,
          profileComplete: user.profileComplete,
          firstName: user.firstName,
          lastName: user.lastName,
          profileImage: user.profileImage || null,
          user: {
            _id: user._id,
            email: user.email,
            role: user.role,
            isAuthenticated: user.isAuthenticated ?? true,
            isVerified: user.isVerified,
            profileComplete: user.profileComplete,
            firstName: user.firstName,
            lastName: user.lastName,
            profileImage: user.profileImage || null,
          },
        }),

      setProfileComplete: complete =>
        set(state => ({
          ...state,
          profileComplete: complete,
        })),

      updateProfile: profile =>
        set(state => ({
          ...state,
          ...profile,
          profileComplete: true,
          isAuthenticated: true,
          firstName: profile.firstName ?? state.firstName,
          lastName: profile.lastName ?? state.lastName,
          profileImage: profile.profileImage ?? state.profileImage,
        })),

      logout: async () => {
        set({
          _id: null,
          email: null,
          role: null,
          isAuthenticated: false,
          isVerified: false,
          profileComplete: false,
          firstName: null,
          lastName: null,
          profileImage: null,
        });
      },
    }),
    {
      name: 'user-storage',
    }
  )
);
