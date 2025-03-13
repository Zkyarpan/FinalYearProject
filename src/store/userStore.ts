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
  _id: string;
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
  setUser: (user: SetUser) => void;
  setProfileComplete: (complete: boolean) => void;
  updateProfile: (profile: Partial<UserProfile>) => void;
  logout: () => Promise<void>;
  // Add a helper method to get display role
  getDisplayRole: () => string;
  // Add helper methods for approval status
  isApproved: () => boolean;
  isPending: () => boolean;
  isRejected: () => boolean;
  getApprovalStatus: () => ApprovalStatus | null;
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
      image: null, // Added image property with default value
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
      approvalStatus: undefined, // Initialize approval status
      adminFeedback: null, // Initialize admin feedback
      user: null,

      // Add helper method to get formatted display role
      getDisplayRole: () => {
        const role = get().role;
        if (!role) return 'User';
        return role.charAt(0).toUpperCase() + role.slice(1);
      },

      // Add helper methods for approval status
      isApproved: () => get().approvalStatus === 'approved',
      isPending: () => get().approvalStatus === 'pending',
      isRejected: () => get().approvalStatus === 'rejected',
      getApprovalStatus: () =>
        get().role === 'psychologist' ? get().approvalStatus || null : null,

      setUser: user =>
        set({
          _id: user._id,
          email: user.email,
          role: user.role, // Ensure role is properly set
          isAuthenticated: user.isAuthenticated ?? true,
          isVerified: user.isVerified,
          profileComplete: user.profileComplete,
          firstName: user.firstName,
          lastName: user.lastName,
          profileImage: user.profileImage || user.image || null, // Use image as fallback
          image: user.image || user.profileImage || null, // Set both properties
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
            isAuthenticated: user.isAuthenticated ?? true,
            // Ensure user object also has both image properties
            profileImage: user.profileImage || user.image || null,
            image: user.image || user.profileImage || null,
            // Ensure approval status is set in the user object
            approvalStatus:
              user.approvalStatus ||
              (user.role === 'psychologist' ? 'pending' : undefined),
            adminFeedback: user.adminFeedback || null,
          },
        }),

      setProfileComplete: complete =>
        set(state => ({
          ...state,
          profileComplete: complete,
        })),

      updateProfile: profile =>
        set(state => {
          // If profile update includes either image property, update both
          const updatedImage =
            profile.image ||
            profile.profileImage ||
            state.image ||
            state.profileImage;

          return {
            ...state,
            ...profile,
            // Keep both properties in sync
            profileImage: updatedImage,
            image: updatedImage,
            profileComplete: true,
            isAuthenticated: true,
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
          image: null, // Clear image property too
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
          approvalStatus: undefined, // Clear approval status
          adminFeedback: null, // Clear admin feedback
          user: null,
        });
      },
    }),
    {
      name: 'user-storage',
    }
  )
);
