import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface Education {
  degree: string;
  university: string;
  graduationYear: number;
}

interface Availability {
  [key: string]: {
    available: boolean;
    startTime?: string;
    endTime?: string;
  };
}

// Define approval status type
type ApprovalStatus = 'pending' | 'approved' | 'rejected';

interface UserProfile {
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  profileImage: string | null;
  image?: string | null; // Added image property for compatibility
  country?: string | null;
  streetAddress?: string | null;
  city?: string | null;
  about?: string | null;
  certificateOrLicense?: string | null;
  licenseNumber?: string | null;
  licenseType?:
    | 'clinical_psychologist'
    | 'counseling_psychologist'
    | 'psychiatrist'
    | 'mental_health_counselor'
    | null;
  education?: Education[];
  specializations?: string[];
  yearsOfExperience?: number | null;
  languages?: string[];
  sessionDuration?: 30 | 50 | 80 | null;
  sessionFee?: number | null;
  sessionFormats?: ('in-person' | 'video' | 'phone')[];
  acceptsInsurance?: boolean;
  insuranceProviders?: string[];
  availability?: Availability;
  acceptingNewClients?: boolean;
  ageGroups?: ('children' | 'teenagers' | 'adults' | 'seniors')[];
  approvalStatus?: ApprovalStatus; // Add approval status
  adminFeedback?: string | null; // Add admin feedback for rejections
}

interface User extends UserProfile {
  _id: string | null;
  role: string | null;
  isAuthenticated: boolean;
  isVerified: boolean;
  profileComplete: boolean;
  approvalStatus?: ApprovalStatus; // Add approval status
  adminFeedback?: string | null; // Add admin feedback for rejections
}

interface SetUser extends UserProfile {
  _id?: string;
  id?: string; // Add id property from API
  role: string;
  isVerified: boolean;
  profileComplete: boolean;
  isAuthenticated?: boolean;
  image?: string; // Allow image property from API
  approvalStatus?: ApprovalStatus; // Add approval status
  adminFeedback?: string | null; // Add admin feedback for rejections
}

interface UserStore extends User {
  user: User | null;

  // User management methods
  setUser: (user: SetUser) => void;
  setProfileComplete: (complete: boolean) => void;
  updateProfile: (profile: Partial<UserProfile>) => void;
  logout: () => Promise<void>;

  // Role helper methods
  getDisplayRole: () => string;

  // Approval status helper methods
  isApproved: () => boolean;
  isPending: () => boolean;
  isRejected: () => boolean;
  getApprovalStatus: () => ApprovalStatus | null;

  // Authentication helper methods
  getUserId: () => string | null;
  getAuthHeaders: () => HeadersInit;
  isResourceOwner: (resourceAuthorId: string | undefined) => boolean;
  ensureAuthentication: () => boolean;
  debugAuth: () => boolean;
}

export const useUserStore = create(
  persist<UserStore>(
    (set, get) => ({
      _id: null,
      email: null,
      role: null,
      isAuthenticated: false,
      isVerified: false,
      profileComplete: false,
      firstName: null,
      lastName: null,
      profileImage: null,
      image: null,
      country: null,
      streetAddress: null,
      city: null,
      about: null,
      certificateOrLicense: null,
      licenseNumber: null,
      licenseType: null,
      education: [],
      specializations: [],
      yearsOfExperience: null,
      languages: [],
      sessionDuration: null,
      sessionFee: null,
      sessionFormats: [],
      acceptsInsurance: false,
      insuranceProviders: [],
      availability: {},
      acceptingNewClients: false,
      ageGroups: [],
      approvalStatus: undefined,
      adminFeedback: null,
      user: null,

      // Display role helper
      getDisplayRole: () => {
        const role = get().role;
        if (!role) return 'User';
        return role.charAt(0).toUpperCase() + role.slice(1);
      },

      // Approval status helpers
      isApproved: () => get().approvalStatus === 'approved',
      isPending: () => get().approvalStatus === 'pending',
      isRejected: () => get().approvalStatus === 'rejected',
      getApprovalStatus: () =>
        get().role === 'psychologist' ? get().approvalStatus || null : null,

      // Authentication helpers
      getUserId: () => {
        return get()._id;
      },

      getAuthHeaders: () => {
        const userId = get()._id;
        const headers: HeadersInit = {
          'Content-Type': 'application/json',
        };

        if (userId) {
          headers['Authorization'] = `Bearer ${userId}`;
          console.log('Adding auth header with user ID:', userId);
        } else {
          console.log('No user ID available for auth header');
        }

        return headers;
      },

      isResourceOwner: resourceAuthorId => {
        if (!resourceAuthorId) return false;

        const userId = get()._id;
        if (!userId) return false;

        // Convert both IDs to strings to ensure consistent comparison
        const userIdStr = String(userId).trim();
        const authorIdStr = String(resourceAuthorId).trim();

        const isOwner = userIdStr === authorIdStr;

        console.log('Ownership check:', {
          userId: userIdStr,
          resourceAuthorId: authorIdStr,
          isOwner,
          compareResult: userIdStr === authorIdStr,
        });

        return isOwner;
      },

      ensureAuthentication: () => {
        const state = get();
        if (state.isAuthenticated && !state._id) {
          console.warn('⚠️ Authentication state inconsistency detected');
          set({ isAuthenticated: false });
          return false;
        }
        return state.isAuthenticated;
      },

      debugAuth: () => {
        const state = get();
        console.log('Current auth state:', {
          _id: state._id,
          isAuthenticated: state.isAuthenticated,
          role: state.role,
        });

        if (state._id && !state.isAuthenticated) {
          console.log('Fixing inconsistent auth state');
          set(state => ({ ...state, isAuthenticated: true }));
          return true;
        }
        return false;
      },

      // FIXED: Modified setUser to handle both id and _id properties
      setUser: user => {
        // Handle both id and _id from API response
        const userId = user._id || user.id;

        // Log what we're receiving for debugging
        console.log('Setting user with:', {
          id: user.id,
          _id: user._id,
          userId,
        });

        if (!userId) {
          console.error(
            'Cannot set user without user ID (neither id nor _id provided)'
          );
          return;
        }

        const isAuthenticated = true;

        set({
          _id: userId, // Use the extracted userId
          email: user.email,
          role: user.role,
          isAuthenticated: isAuthenticated,
          isVerified: user.isVerified,
          profileComplete: user.profileComplete,
          firstName: user.firstName,
          lastName: user.lastName,
          profileImage: user.profileImage || user.image || null,
          image: user.image || user.profileImage || null,
          country: user.country,
          streetAddress: user.streetAddress,
          city: user.city,
          about: user.about,
          certificateOrLicense: user.certificateOrLicense,
          licenseNumber: user.licenseNumber,
          licenseType: user.licenseType,
          education: user.education || [],
          specializations: user.specializations || [],
          yearsOfExperience: user.yearsOfExperience,
          languages: user.languages || [],
          sessionDuration: user.sessionDuration,
          sessionFee: user.sessionFee,
          sessionFormats: user.sessionFormats || [],
          acceptsInsurance: user.acceptsInsurance || false,
          insuranceProviders: user.insuranceProviders || [],
          availability: user.availability || {},
          acceptingNewClients: user.acceptingNewClients || false,
          ageGroups: user.ageGroups || [],
          approvalStatus:
            user.approvalStatus ||
            (user.role === 'psychologist' ? 'pending' : undefined),
          adminFeedback: user.adminFeedback || null,
          user: {
            ...user,
            _id: userId, // Ensure user object also has _id
            isAuthenticated: isAuthenticated,
            profileImage: user.profileImage || user.image || null,
            image: user.image || user.profileImage || null,
            approvalStatus:
              user.approvalStatus ||
              (user.role === 'psychologist' ? 'pending' : undefined),
            adminFeedback: user.adminFeedback || null,
          },
        });

        console.log('User state updated:', {
          id: userId,
          isAuthenticated: isAuthenticated,
          role: user.role,
        });
      },

      setProfileComplete: complete =>
        set(state => ({
          ...state,
          profileComplete: complete,
        })),

      updateProfile: profile =>
        set(state => {
          const updatedImage =
            profile.image ||
            profile.profileImage ||
            state.image ||
            state.profileImage;

          return {
            ...state,
            ...profile,
            profileImage: updatedImage,
            image: updatedImage,
            profileComplete: true,
            isAuthenticated: state._id ? true : false,
          };
        }),

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
          image: null,
          country: null,
          streetAddress: null,
          city: null,
          about: null,
          certificateOrLicense: null,
          licenseNumber: null,
          licenseType: null,
          education: [],
          specializations: [],
          yearsOfExperience: null,
          languages: [],
          sessionDuration: null,
          sessionFee: null,
          sessionFormats: [],
          acceptsInsurance: false,
          insuranceProviders: [],
          availability: {},
          acceptingNewClients: false,
          ageGroups: [],
          approvalStatus: undefined,
          adminFeedback: null,
          user: null,
        });

        console.log('User logged out, state cleared');
      },
    }),
    {
      name: 'user-storage',
    }
  )
);

// Convenience exports
export const getUserId = () => useUserStore.getState().getUserId();
export const getAuthHeaders = () => useUserStore.getState().getAuthHeaders();
export const isResourceOwner = (resourceAuthorId: string | undefined) =>
  useUserStore.getState().isResourceOwner(resourceAuthorId);
export const ensureAuthentication = () =>
  useUserStore.getState().ensureAuthentication();
