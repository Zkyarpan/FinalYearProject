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

        if (data.IsSuccess && data.Result?.profile) {
          setProfile(data.Result.profile);
          updateProfile({
            firstName: data.Result.profile.firstName,
            lastName: data.Result.profile.lastName,
            profileImage: data.Result.profile.profilePhoto,
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

  if (error) return <div className="text-destructive">Error: {error}</div>;
  if (!profile) return <div className="text-muted">No profile found</div>;

  return (
    <LoadingContent>
      <div className="min-h-screen bg-background text-foreground">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="rounded-xl p-6 mb-8 bg-card">
            <div className="flex flex-col items-center">
              <div className="relative mb-6">
                <img
                  src={profile.profilePhoto || '/placeholder-avatar.png'}
                  alt={`${profile.firstName} ${profile.lastName}`}
                  className="w-32 h-32 rounded-full object-cover border-4 border-background shadow-lg"
                />
              </div>
              <h1 className="text-3xl font-bold mb-2">
                {profile.firstName} {profile.lastName}
              </h1>
              <p className="text-lg text-muted-foreground">
                {profile.licenseType}
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
                  <span>License Number: {profile.licenseNumber}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5" />
                  <span>{profile.yearsOfExperience} Years Experience</span>
                </div>
              </div>
            </div>

            <div className="rounded-xl p-6 border bg-card">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <GraduationCap className="w-5 h-5" />
                Education
              </h2>
              <div className="space-y-2">
                {profile.education.map((edu, index) => (
                  <div key={index} className="text-sm">
                    {edu.degree} - {edu.university}, {edu.graduationYear}
                  </div>
                ))}
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
                  <span>{profile.sessionDuration} minutes</span>
                </div>
                <div className="flex items-center gap-3">
                  <span>Fee: ${profile.sessionFee}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Video className="w-5 h-5" />
                  <span>{profile.sessionFormats.join(', ')}</span>
                </div>
                {profile.acceptsInsurance && (
                  <div className="text-sm">
                    Accepts Insurance: {profile.insuranceProviders.join(', ')}
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-xl p-6 border bg-card">
              <h2 className="text-xl font-semibold mb-4">Specializations</h2>
              <div className="flex flex-wrap gap-2">
                {profile.specializations.map((spec, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm"
                  >
                    {spec}
                  </span>
                ))}
              </div>
            </div>

            <div className="rounded-xl p-6 border bg-card">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Languages className="w-5 h-5" />
                Languages & Age Groups
              </h2>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <span>{profile.languages.join(', ')}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Users className="w-5 h-5" />
                  <span>Age Groups: {profile.ageGroups.join(', ')}</span>
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
                    <span className="text-green-500">
                      Accepting new clients
                    </span>
                  ) : (
                    <span className="text-red-500">
                      Not accepting new clients
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(profile.availability).map(
                    ([day, slots]) =>
                      slots.available && (
                        <div key={day} className="text-sm">
                          <span className="font-medium">{day}: </span>
                          {slots.startTime} - {slots.endTime}
                        </div>
                      )
                  )}
                </div>
              </div>
            </div>

            <div className="col-span-2 rounded-xl p-6 border bg-card">
              <h2 className="text-xl font-semibold mb-4">About Me</h2>
              <p className="text-muted-foreground whitespace-pre-wrap">
                {profile.about}
              </p>
            </div>
          </div>
        </div>
      </div>
    </LoadingContent>
  );
};

export default PsychologistProfilePage;
