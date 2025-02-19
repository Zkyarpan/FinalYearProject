'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { MessageCircle, Link as LinkIcon, Clock, Phone } from 'lucide-react';
import Location from '@/icons/Location';
import Videos from '@/icons/Video';
import Dollar from '@/icons/Dollar';
import Graduate from '@/icons/Graudate';
import { ProfileSkeleton } from '@/components/ProfileSkeleton';
import Messages from '@/icons/Messages';
import ExperienceEducationSection from '@/components/ExperienceEducationSection';

interface PsychologistProfile {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  country: string;
  city: string;
  about: string;
  profilePhoto: string;
  licenseType: string;
  yearsOfExperience: number;
  education: Array<{
    degree: string;
    university: string;
    graduationYear: number;
  }>;
  languages: string[];
  specializations: string[];
  sessionDuration: number;
  sessionFee: number;
  sessionFormats: string[];
  acceptsInsurance: boolean;
  insuranceProviders: string[];
  acceptingNewClients: boolean;
  ageGroups: string[];
  availability: {
    [key: string]: {
      available: boolean;
      startTime: string;
      endTime: string;
    };
  };
}

const PsychologistProfileView = () => {
  const params = useParams();
  const [psychologist, setPsychologist] = useState<PsychologistProfile | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    const fetchPsychologist = async () => {
      setLoading(true);
      setError(null);

      try {
        if (!params?.slug) throw new Error('Psychologist not found');
        const response = await fetch(`/api/psychologist/${params.slug}`);
        const data = await response.json();

        if (!data.IsSuccess || !data.Result?.psychologist) {
          throw new Error(
            data.ErrorMessage?.[0]?.message || 'Psychologist not found'
          );
        }

        setPsychologist(data.Result.psychologist);
      } catch (error) {
        setError(
          error instanceof Error
            ? error.message
            : 'Failed to load psychologist data'
        );
      } finally {
        setLoading(false);
      }
    };

    fetchPsychologist();
  }, [params?.slug]);

  if (loading) {
    return <ProfileSkeleton />;
  }
  if (error || !psychologist) return 'Psychologist not found';

  const formatLicenseType = (type: string) => {
    return type
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  return (
    <div className="flex flex-col gap-4 py-10 px-4 sm:px-6">
      <div className="flex flex-col gap-4 sm:items-center justify-center">
        <div className="sm:hidden flex justify-between">
          <div className="relative">
            <div className="w-16 h-16 relative">
              <div className="w-16 h-16 rounded-full overflow-hidden">
                <img
                  className="w-16 h-16 rounded-full bg-center bg-no-repeat bg-cover object-cover hover:opacity-90 transition-opacity border border-gray-200 dark:border-gray-700"
                  src={psychologist.profilePhoto}
                  alt={`${psychologist.firstName} ${psychologist.lastName}`}
                />
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              className="p-2 rounded-xl border dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800"
              title="Send Message"
            >
              <MessageCircle className="w-5 h-5" />
            </button>
            <button
              className={`px-4 py-2 rounded-xl ${
                psychologist.acceptingNewClients
                  ? 'bg-blue-500 hover:bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-500 cursor-not-allowed'
              }`}
              disabled={!psychologist.acceptingNewClients}
            >
              {psychologist.acceptingNewClients
                ? 'Book Session'
                : 'Not Available'}
            </button>
          </div>
        </div>

        <div className="hidden sm:block relative">
          <div className="w-20 h-20 relative">
            <div className="w-20 h-20 rounded-full overflow-hidden">
              <img
                className="w-20 h-20 rounded-full bg-center bg-no-repeat bg-cover object-cover hover:opacity-90 transition-opacity border border-gray-200 dark:border-gray-700"
                src={psychologist.profilePhoto}
                alt={`${psychologist.firstName} ${psychologist.lastName}`}
              />
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-2 sm:items-center justify-center">
          <h1 className="font-semibold text-lg">
            Dr. {psychologist.firstName} {psychologist.lastName}
          </h1>
          <h2 className="text-sm font-semibold text-gray-600 dark:text-gray-400 sm:text-center">
            {formatLicenseType(psychologist.licenseType)}
          </h2>
        </div>

        <div className="flex flex-wrap sm:justify-center sm:gap-4 gap-2">
          <div className="flex gap-2 items-center">
            <Location />
            <p className="text-gray-600 dark:text-gray-400 text-xs">
              {psychologist.city}, {psychologist.country}
            </p>
          </div>
          <div className="flex gap-2 items-center">
            <Graduate />
            <p className="text-gray-600 dark:text-gray-400 text-xs">
              {psychologist.yearsOfExperience} years exp.
            </p>
          </div>
        </div>

        <div className="w-full flex sm:flex-wrap sm:overflow-x-hidden overflow-x-auto items-center gap-2 hide-scrollbar sm:justify-center">
          {psychologist.specializations.map((spec, index) => (
            <div key={index} className="flex-shrink-0">
              <button className="text-xs font-medium leading-4 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-700 dark:text-gray-300 px-2 py-1 h-6 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all capitalize">
                {spec}
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="px-4 sm:px-6">
        <div className="flex items-center justify-center border-b dark:border-[#333333]">
          <ul className="flex items-center text-sm gap-6 overflow-x-auto">
            {['overview', 'experience', 'availability'].map(tab => (
              <li key={tab} className="flex items-center">
                <button
                  onClick={() => setActiveTab(tab)}
                  className={`flex whitespace-nowrap text-center items-center py-2.5 text-xs font-medium border-b-2 transition-colors ${
                    activeTab === tab
                      ? 'font-semibold text-blue-500 border-blue-500'
                      : 'text-gray-600 dark:text-gray-400 border-transparent hover:text-gray-900 dark:hover:text-gray-100'
                  }`}
                >
                  {tab.toUpperCase()}
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="mt-6 px-4 sm:px-6">
        {activeTab === 'overview' && (
          <section className="space-y-6">
            <div className="prose dark:prose-invert max-w-none">
              <p className="dark:text-muted-foreground text-sm text-justify">
                {psychologist.about}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
              <div className="p-4 border dark:border-[#333333]  rounded-lg">
                <div className="flex items-center gap-2 mb-4">
                  <Videos />
                  <span className="text-sm font-medium">Session Info</span>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">
                      Duration
                    </span>
                    <span>{psychologist.sessionDuration} minutes</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">
                      Fee
                    </span>
                    <span className="flex">
                      <Dollar />
                      {psychologist.sessionFee}USD
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">
                      Formats
                    </span>
                    <div className="flex gap-2">
                      {psychologist.sessionFormats.map((format, index) => (
                        <span key={index} className="flex items-center gap-1">
                          {format === 'video' ? (
                            <Videos />
                          ) : (
                            <Phone className="w-3 h-3" />
                          )}
                          {format}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-4 border dark:border-[#333333]  rounded-lg">
                <div className="flex items-center gap-2 mb-4">
                  <Messages />
                  <span className="text-sm font-medium">Languages</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {psychologist.languages.map((lang, index) => (
                    <span
                      key={index}
                      className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded-lg"
                    >
                      {lang}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </section>
        )}

        {activeTab === 'experience' && (
          <section className="space-y-4">
            <ExperienceEducationSection psychologist={psychologist} />
          </section>
        )}

        {activeTab === 'availability' && (
          <section className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {Object.entries(psychologist.availability).map(
              ([day, schedule]) => {
                // Convert 24-hour format to 12-hour format with AM/PM
                const formatTime = time24 => {
                  if (!time24) return '';
                  const [hours, minutes] = time24.split(':').map(Number);
                  const period = hours >= 12 ? 'PM' : 'AM';
                  const hours12 = hours % 12 || 12; // Convert 0 to 12 for 12 AM
                  return `${hours12}:${minutes
                    .toString()
                    .padStart(2, '0')} ${period}`;
                };

                const startTime = formatTime(schedule.startTime);
                const endTime = formatTime(schedule.endTime);

                return (
                  <div
                    key={day}
                    className="p-4 border dark:border-[#333333] rounded-lg"
                  >
                    <h4 className="font-medium capitalize mb-3">{day}</h4>
                    {schedule.available ? (
                      <div className="space-y-2">
                        <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                          <Clock className="w-4 h-4 mr-2" />
                          {startTime} - {endTime}
                        </div>
                        <span className="inline-block px-2 py-1 text-xs text-green-600 bg-green-100 dark:bg-green-900 dark:text-green-300 rounded-full">
                          Available
                        </span>
                      </div>
                    ) : (
                      <span className="inline-block px-2 py-1 text-xs text-red-600 bg-red-100 dark:bg-red-900 dark:text-red-300 rounded-full">
                        Not Available
                      </span>
                    )}
                  </div>
                );
              }
            )}
          </section>
        )}
      </div>
    </div>
  );
};

export default PsychologistProfileView;
