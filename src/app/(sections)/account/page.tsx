// 'use client';

// import React, { useEffect, useState } from 'react';
// import Phone from '@/icons/Call';
// import Video from '@/icons/Video';
// import Emergency from '@/icons/Emergency';
// import Clock from '@/icons/Clock';
// import Location from '@/icons/Location';
// import { useUserStore } from '@/store/userStore';
// import AccountPageSkeleton from '@/components/AccountPageSkeleton';

// interface Profile {
//   id: string;
//   firstName: string;
//   lastName: string;
//   image: string;
//   address: string;
//   phone: string;
//   age: number;
//   gender: string;
//   emergencyContact: string;
//   emergencyPhone: string;
//   therapyHistory: string;
//   preferredCommunication: string;
//   struggles: string[];
//   briefBio: string;
//   profileCompleted: boolean;
//   createdAt: string;
//   updatedAt: string;
// }

// const AccountPage = () => {
//   const [profile, setProfile] = useState<Profile | null>(null);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState<string | null>(null);
//   const { updateProfile } = useUserStore();

//   useEffect(() => {
//     const fetchProfile = async () => {
//       try {
//         const response = await fetch('/api/profile');
//         if (!response.ok) {
//           throw new Error('Failed to fetch profile');
//         }
//         const data = await response.json();

//         if (data.IsSuccess && data.Result?.profile) {
//           setProfile(data.Result.profile);
//           updateProfile({
//             firstName: data.Result.profile.firstName,
//             lastName: data.Result.profile.lastName,
//             profileImage: data.Result.profile.image,
//           });
//         } else {
//           throw new Error(data.ErrorMessage[0] || 'Profile data not found');
//         }
//       } catch (err) {
//         setError(err instanceof Error ? err.message : 'Something went wrong');
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchProfile();
//   }, [updateProfile]);

//   if (error) {
//     return (
//       <div className="min-h-screen flex items-center justify-center">
//         <div className="text-destructive">Error: {error}</div>
//       </div>
//     );
//   }

//   if (loading) {
//     return <AccountPageSkeleton />;
//   }
//   if (!profile) {
//     return <AccountPageSkeleton />;
//   }

//   return (
//     <div className="min-h-screen bg-background text-foreground">
//       <div className="max-w-4xl mx-auto px-4">
//         <div className="rounded-xl p-6 mb-6 dark:border-[#333333]">
//           <div className="space-y-6">
//             <div className="p-6 rounded-xl">
//               <div className="flex flex-col items-center">
//                 <div className="relative group mb-6">
//                   <div className="relative">
//                     <img
//                       src={profile.image}
//                       alt={`${profile.firstName} ${profile.lastName}`}
//                       className="w-32 h-32 rounded-full object-cover border-4 border-white shadow-lg outline-none"
//                     />
//                     <div className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
//                   </div>

//                   {profile.profileCompleted && (
//                     <div className="absolute -bottom-1 -right-1 bg-gradient-to-r from-blue-400 to-blue-500 rounded-full p-2 border-2 border-white shadow-md">
//                       <svg
//                         className="w-3 h-3 text-white"
//                         fill="currentColor"
//                         viewBox="0 0 20 20"
//                       >
//                         <path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" />
//                       </svg>
//                     </div>
//                   )}
//                 </div>

//                 <div className="text-center flex-1">
//                   <h1 className="text-3xl font-bold">
//                     {profile.firstName} {profile.lastName}
//                   </h1>
//                 </div>
//               </div>
//             </div>

//             <div className="p-6 rounded-xl border dark:border-[#333333] shadow-sm">
//               <div className="space-y-6">
//                 <div className="flex justify-center gap-8 pb-6 border-b">
//                   <div className="text-center">
//                     <span className="block text-sm font-medium">Age</span>
//                     <span className="text-xs font-semibold">{profile.age}</span>
//                   </div>
//                   <div className="text-center">
//                     <span className="block text-sm font-medium">Gender</span>
//                     <span className="text-xs font-semibold">
//                       {profile.gender
//                         ? profile.gender.charAt(0).toUpperCase() +
//                           profile.gender.slice(1)
//                         : 'N/A'}
//                     </span>
//                   </div>
//                 </div>

//                 <div className="space-y-3">
//                   <h3 className="text-sm font-medium text-center">
//                     Areas of Focus
//                   </h3>
//                   <div className="grid grid-cols-2 gap-3">
//                     {profile.struggles && profile.struggles.length > 0 ? (
//                       profile.struggles
//                         .toString()
//                         .split(',')
//                         .map((struggle, index) => (
//                           <div
//                             key={index}
//                             className="bg-white px-4 py-2 rounded-xl text-sm
//             dark:bg-[#171717] border dark:border-[#333333]
//             hover:border-primary/30
//             transition-all duration-300
//             shadow-sm hover:shadow-md
//             cursor-default text-center"
//                           >
//                             {struggle.trim()}
//                           </div>
//                         ))
//                     ) : (
//                       <div
//                         className="bg-white px-4 py-2 rounded-xl text-sm
//         dark:bg-[#171717] border dark:border-[#333333]
//         transition-all duration-300
//         shadow-sm cursor-default text-center"
//                       >
//                         No struggles listed
//                       </div>
//                     )}
//                   </div>
//                 </div>
//               </div>
//             </div>
//           </div>
//         </div>

//         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//           <div className="rounded-xl shadow-sm p-6 border dark:border-[#333333] text-card-foreground focus:outline-none focus:ring-0">
//             <h2 className="text-lg font-semibold mb-4">Contact Information</h2>
//             <div className="space-y-4">
//               <div className="flex items-center gap-3">
//                 <Phone />
//                 <span>{profile.phone}</span>
//               </div>
//               <div className="flex items-center gap-3">
//                 <Location />
//                 <span>{profile.address}</span>
//               </div>
//             </div>
//           </div>

//           <div className="border dark:border-[#333333] rounded-xl shadow-sm p-6 text-card-foreground focus:outline-none focus:ring-0">
//             <h2 className="text-lg font-semibold mb-4">Emergency Contact</h2>
//             <div className="space-y-4">
//               <div className="flex items-center gap-3">
//                 <Emergency />
//                 <span>{profile.emergencyContact}</span>
//               </div>
//               <div className="flex items-center gap-3">
//                 <Phone />
//                 <span>{profile.emergencyPhone}</span>
//               </div>
//             </div>
//           </div>

//           <div className="border dark:border-[#333333] rounded-xl shadow-sm p-6 text-card-foreground focus:outline-none focus:ring-0">
//             <h2 className="text-lg font-semibold mb-4">Therapy Preferences</h2>
//             <div className="space-y-4">
//               <div className="flex items-center gap-3">
//                 <Video />
//                 <span>
//                   Preferred:{' '}
//                   {profile.preferredCommunication
//                     ? profile.preferredCommunication.charAt(0).toUpperCase() +
//                       profile.preferredCommunication.slice(1)
//                     : 'Not set'}{' '}
//                   Sessions
//                 </span>
//               </div>
//               <div className="flex items-center gap-3">
//                 <Clock />
//                 <span>
//                   Previous Therapy:{' '}
//                   {profile.therapyHistory === 'yes' ? 'Yes' : 'No'}
//                 </span>
//               </div>
//             </div>
//           </div>

//           <div className="border dark:border-[#333333] rounded-xl shadow-sm p-6 text-card-foreground focus:outline-none focus:ring-0 overflow-hidden">
//             <h2 className="text-lg font-semibold mb-4">About Me</h2>
//             <p
//               className="dark:text-white break-words overflow-auto"
//               style={{ maxHeight: '200px' }}
//             >
//               {profile.briefBio}
//             </p>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default AccountPage;

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { ProfileClient } from './client';
import { Profile } from './types';
import AccountPageSkeleton from '@/components/AccountPageSkeleton';
import { baseUrl } from '@/constants';

async function getProfile(): Promise<Profile> {
  try {
    const cookieStore = await cookies();
    const accessToken = cookieStore.get('accessToken')?.value;

    if (!accessToken) {
      redirect('/login');
    }

    const response = await fetch(`${baseUrl}/api/profile`, {
      headers: {
        Cookie: `accessToken=${accessToken}`,
      },
      cache: 'no-store',
    });

    if (response.status === 401) {
      redirect('/login');
    }

    if (!response.ok) {
      throw new Error('Failed to fetch profile');
    }

    const data = await response.json();

    if (!data.IsSuccess) {
      throw new Error(data.ErrorMessage[0] || 'Failed to fetch profile');
    }

    // Handle case where profile doesn't exist but user is authenticated
    if (!data.Result.profile.profileCompleted) {
      return {
        id: '',
        firstName: data.Result.profile.firstName || '',
        lastName: data.Result.profile.lastName || '',
        image: data.Result.profile.image || '',
        address: '',
        phone: '',
        age: 0,
        gender: '',
        emergencyContact: '',
        emergencyPhone: '',
        therapyHistory: '',
        preferredCommunication: '',
        struggles: [],
        briefBio: '',
        profileCompleted: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    }

    return data.Result.profile;
  } catch (error) {
    console.error('Profile fetch error:', error);
    if (error instanceof Error && error.message.includes('NEXT_REDIRECT')) {
      throw error;
    }
    throw new Error('Failed to fetch profile');
  }
}

export default async function AccountPage() {
  try {
    const profile = await getProfile();

    if (!profile.profileCompleted) {
      return <AccountPageSkeleton />;
    }

    return <ProfileClient profile={profile} />;
  } catch (error) {
    throw error;
  }
}
