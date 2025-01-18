'use client';

import React, { useEffect, useState } from 'react';
import Phone from '@/icons/Call';
import Video from '@/icons/Video';
import Emergency from '@/icons/Emergency';
import Clock from '@/icons/Clock';
import Location from '@/icons/Location';
import { useUserStore } from '@/store/userStore';

interface Profile {
  id: string;
  firstName: string;
  lastName: string;
  image: string;
  address: string;
  phone: string;
  age: number;
  gender: string;
  emergencyContact: string;
  emergencyPhone: string;
  therapyHistory: string;
  preferredCommunication: string;
  struggles: string[];
  briefBio: string;
  profileCompleted: boolean;
  createdAt: string;
  updatedAt: string;
}

const AccountPage = () => {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { updateProfile } = useUserStore();

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await fetch('/api/profile');
        if (!response.ok) {
          throw new Error('Failed to fetch profile');
        }
        const data = await response.json();

        if (data.IsSuccess && data.Result?.profile) {
          setProfile(data.Result.profile);
          // Update the global state with the profile image
          updateProfile({
            firstName: data.Result.profile.firstName,
            lastName: data.Result.profile.lastName,
            profileImage: data.Result.profile.image, // Update the profileImage in the store
          });
        } else {
          throw new Error(data.ErrorMessage[0] || 'Profile data not found');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Something went wrong');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [updateProfile]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-destructive">Error: {error}</div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-muted">No profile data found</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-4xl mx-auto px-4">
        <div className="rounded-xl p-6 mb-6 dark:border-[#333333]">
          <div className="space-y-6">
            <div className="p-6 rounded-xl">
              <div className="flex flex-col items-center">
                <div className="relative group mb-6">
                  <div className="relative">
                    <img
                      src={profile.image}
                      alt={`${profile.firstName} ${profile.lastName}`}
                      className="w-32 h-32 rounded-full object-cover border-4 border-white shadow-lg outline-none"
                    />
                    <div className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  </div>

                  {profile.profileCompleted && (
                    <div className="absolute -bottom-1 -right-1 bg-gradient-to-r from-blue-400 to-blue-500 rounded-full p-2 border-2 border-white shadow-md">
                      <svg
                        className="w-3 h-3 text-white"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" />
                      </svg>
                    </div>
                  )}
                </div>

                <div className="text-center flex-1">
                  <h1 className="text-3xl font-bold">
                    {profile.firstName} {profile.lastName}
                  </h1>
                </div>
              </div>
            </div>

            <div className="p-6 rounded-xl border dark:border-[#333333] shadow-sm">
              <div className="space-y-6">
                <div className="flex justify-center gap-8 pb-6 border-b">
                  <div className="text-center">
                    <span className="block text-sm font-medium">Age</span>
                    <span className="text-xs font-semibold">{profile.age}</span>
                  </div>
                  <div className="text-center">
                    <span className="block text-sm font-medium">Gender</span>
                    <span className="text-xs font-semibold">
                      {profile.gender.charAt(0).toUpperCase() +
                        profile.gender.slice(1)}
                    </span>
                  </div>
                </div>

                <div className="space-y-3">
                  <h3 className="text-sm font-medium text-center">Struggles</h3>
                  <div className="flex flex-wrap gap-2.5 justify-center">
                    {profile.struggles.map(struggle => (
                      <span
                        key={struggle}
                        className="px-4 py-2 rounded-full text-sm font-medium
                        bg-gradient-to-r from-gray-50 to-gray-100
                        text-gray-700 border border-gray-200
                        hover:from-blue-50 hover:to-indigo-50 
                        hover:text-blue-700 hover:border-blue-200
                        transition-all duration-300 ease-out
                        shadow-sm hover:shadow
                        cursor-default
                        focus:outline-none focus:ring-0"
                      >
                        {struggle}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="rounded-xl shadow-sm p-6 border dark:border-[#333333] text-card-foreground focus:outline-none focus:ring-0">
            <h2 className="text-lg font-semibold mb-4">Contact Information</h2>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Phone />
                <span>{profile.phone}</span>
              </div>
              <div className="flex items-center gap-3">
                <Location />
                <span>{profile.address}</span>
              </div>
            </div>
          </div>

          <div className="border dark:border-[#333333] rounded-xl shadow-sm p-6 text-card-foreground focus:outline-none focus:ring-0">
            <h2 className="text-lg font-semibold mb-4">Emergency Contact</h2>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Emergency />
                <span>{profile.emergencyContact}</span>
              </div>
              <div className="flex items-center gap-3">
                <Phone />
                <span>{profile.emergencyPhone}</span>
              </div>
            </div>
          </div>

          <div className="border dark:border-[#333333] rounded-xl shadow-sm p-6 text-card-foreground focus:outline-none focus:ring-0">
            <h2 className="text-lg font-semibold mb-4">Therapy Preferences</h2>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Video />
                <span>
                  Preferred:{' '}
                  {profile.preferredCommunication.charAt(0).toUpperCase() +
                    profile.preferredCommunication.slice(1)}{' '}
                  Sessions
                </span>
              </div>
              <div className="flex items-center gap-3">
                <Clock />
                <span>
                  Previous Therapy:{' '}
                  {profile.therapyHistory === 'yes' ? 'Yes' : 'No'}
                </span>
              </div>
            </div>
          </div>

          <div className="border dark:border-[#333333] rounded-xl shadow-sm p-6 text-card-foreground focus:outline-none focus:ring-0">
            <h2 className="text-lg font-semibold mb-4">About Me</h2>
            <p className="dark:text-white">{profile.briefBio}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AccountPage;
