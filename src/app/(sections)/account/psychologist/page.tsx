'use client';

import React, { useEffect, useState } from 'react';
import {
  Phone,
  Video,
  Clock,
  Languages,
  Users,
  Calendar,
  GraduationCap,
  BadgeDollarSign,
  Award,
} from 'lucide-react';
import { useUserStore } from '@/store/userStore';
import LoadingContent from '../../LoadingContent';

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

interface PsychologistProfile {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  country: string;
  streetAddress: string;
  city: string;
  about: string;
  profilePhoto: string | null;
  certificateOrLicense: string;
  licenseType: string;
  licenseNumber: string;
  yearsOfExperience: number;
  education: Education[];
  languages: string[];
  specializations: string[];
  sessionDuration: number;
  sessionFee: number;
  sessionFormats: string[];
  acceptsInsurance: boolean;
  insuranceProviders: string[];
  acceptingNewClients: boolean;
  ageGroups: string[];
  availability: Availability;
  createdAt: string;
  updatedAt: string;
}

const PsychologistProfilePage = () => {
  const [profile, setProfile] = useState<PsychologistProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { updateProfile } = useUserStore();

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await fetch('/api/psychologist/profile');
        if (!response.ok) {
          throw new Error('Failed to fetch profile');
        }
        const data = await response.json();
        console.log('API Response:', data);

        if (data.IsSuccess && data.Result?.psychologists?.length > 0) {
          const profileData = data.Result.psychologists[0];

          const safeProfile = {
            ...profileData,
            education: profileData.education || [],
            languages: profileData.languages || [],
            specializations: profileData.specializations || [],
            sessionFormats: profileData.sessionFormats || [],
            insuranceProviders: profileData.insuranceProviders || [],
            ageGroups: profileData.ageGroups || [],
            availability: profileData.availability || {},
          };

          setProfile(safeProfile);

          updateProfile({
            firstName: safeProfile.firstName || '',
            lastName: safeProfile.lastName || '',
            profileImage: safeProfile.profilePhoto || null,
          });
        } else {
          throw new Error(data.ErrorMessage?.[0] || 'Profile data not found');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Something went wrong');
        console.error('Profile fetch error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [updateProfile]);

  if (error) return <div className="text-destructive">Error: {error}</div>;
  if (!profile) return <div className="text-muted">No profile found</div>;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="rounded-xl p-6 mb-8 bg-card">
          <div className="flex flex-col items-center">
            <div className="relative mb-6">
              <img
                src={profile.profilePhoto || '/placeholder-avatar.png'}
                alt={`${profile.firstName || 'User'} ${profile.lastName || ''}`}
                className="w-32 h-32 rounded-full object-cover border-4 border-background shadow-lg"
              />
            </div>
            <h1 className="text-3xl font-bold mb-2">
              {profile.firstName || ''} {profile.lastName || ''}
            </h1>
            <p className="text-lg text-muted-foreground">
              {profile.licenseType || ''}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="rounded-xl p-6 border bg-card">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Award className="w-5 h-5" />
              Professional Credentials
            </h2>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <span>License Number: {profile.licenseNumber || 'N/A'}</span>
              </div>
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5" />
                <span>{profile.yearsOfExperience || 0} Years Experience</span>
              </div>
            </div>
          </div>

          <div className="rounded-xl p-6 border bg-card">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <GraduationCap className="w-5 h-5" />
              Education
            </h2>
            <div className="space-y-2">
              {Array.isArray(profile.education) &&
              profile.education.length > 0 ? (
                profile.education.map((edu, index) => (
                  <div key={index} className="text-sm">
                    {edu.degree || ''} - {edu.university || ''},{' '}
                    {edu.graduationYear || ''}
                  </div>
                ))
              ) : (
                <div className="text-sm">
                  No education information available
                </div>
              )}
            </div>
          </div>

          <div className="rounded-xl p-6 border bg-card">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <BadgeDollarSign className="w-5 h-5" />
              Session Details
            </h2>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5" />
                <span>{profile.sessionDuration || 0} minutes</span>
              </div>
              <div className="flex items-center gap-3">
                <span>Fee: ${profile.sessionFee || 0}</span>
              </div>
              <div className="flex items-center gap-3">
                <Video className="w-5 h-5" />
                <span>
                  {Array.isArray(profile.sessionFormats)
                    ? profile.sessionFormats.join(', ')
                    : 'Not specified'}
                </span>
              </div>
              {profile.acceptsInsurance &&
                Array.isArray(profile.insuranceProviders) && (
                  <div className="text-sm">
                    Accepts Insurance: {profile.insuranceProviders.join(', ')}
                  </div>
                )}
            </div>
          </div>

          <div className="rounded-xl p-6 border bg-card">
            <h2 className="text-xl font-semibold mb-4">Specializations</h2>
            <div className="flex flex-wrap gap-2">
              {Array.isArray(profile.specializations) &&
              profile.specializations.length > 0 ? (
                profile.specializations.map((spec, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm"
                  >
                    {spec}
                  </span>
                ))
              ) : (
                <span>No specializations listed</span>
              )}
            </div>
          </div>

          <div className="rounded-xl p-6 border bg-card">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Languages className="w-5 h-5" />
              Languages & Age Groups
            </h2>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <span>
                  {Array.isArray(profile.languages)
                    ? profile.languages.join(', ')
                    : 'Not specified'}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <Users className="w-5 h-5" />
                <span>
                  Age Groups:{' '}
                  {Array.isArray(profile.ageGroups)
                    ? profile.ageGroups.join(', ')
                    : 'Not specified'}
                </span>
              </div>
            </div>
          </div>

          <div className="rounded-xl p-6 border bg-card">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Availability Status
            </h2>
            <div className="space-y-4">
              <div>
                {profile.acceptingNewClients ? (
                  <span className="text-green-500">Accepting new clients</span>
                ) : (
                  <span className="text-red-500">
                    Not accepting new clients
                  </span>
                )}
              </div>
              <div className="grid grid-cols-2 gap-2">
                {typeof profile.availability === 'object' &&
                profile.availability !== null ? (
                  Object.entries(profile.availability).map(
                    ([day, slots]) =>
                      slots &&
                      slots.available && (
                        <div key={day} className="text-sm">
                          <span className="font-medium">{day}: </span>
                          {slots.startTime || ''} - {slots.endTime || ''}
                        </div>
                      )
                  )
                ) : (
                  <div>No availability information</div>
                )}
              </div>
            </div>
          </div>

          <div className="col-span-2 rounded-xl p-6 border bg-card">
            <h2 className="text-xl font-semibold mb-4">About Me</h2>
            <p className="text-muted-foreground whitespace-pre-wrap">
              {profile.about || 'No information provided.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PsychologistProfilePage;
