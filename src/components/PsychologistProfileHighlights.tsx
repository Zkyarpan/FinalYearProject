'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { toast } from 'sonner';
import PsychologistProfileHighlightsSkeleton from './PsychologistProfileHighlightsSkeleton';

interface PsychologistHighlightsProps {
  psychologistId?: string;
}

interface PsychologistWorkExperience {
  currentWorkplace?: string;
  currentRole?: string;
  currentDuration?: string;
  previousWorkplace?: string;
}

const PsychologistProfileHighlightsSimple: React.FC<
  PsychologistHighlightsProps
> = ({ psychologistId }) => {
  const params = useParams();
  const [workExperience, setWorkExperience] =
    useState<PsychologistWorkExperience | null>(null);
  const [profileInfo, setProfileInfo] = useState<{
    id: string;
    firstName: string;
    lastName: string;
    profilePhoto: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPsychologistHighlights = async () => {
      setLoading(true);
      setError(null);

      try {
        const slug = psychologistId || params?.slug;

        if (!slug) {
          throw new Error('Psychologist not found');
        }

        const response = await fetch(`/api/psychologist/${slug}`, {
          cache: 'no-store',
          next: { revalidate: 0 },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch psychologist data');
        }

        const data = await response.json();

        if (!data.IsSuccess || !data.Result?.psychologist) {
          throw new Error(
            data.ErrorMessage?.[0]?.message || 'Psychologist not found'
          );
        }

        const psychologist = data.Result.psychologist;

        await new Promise(resolve => setTimeout(resolve, 500));

        setProfileInfo({
          id: psychologist.id,
          firstName: psychologist.firstName,
          lastName: psychologist.lastName,
          profilePhoto: psychologist.profilePhoto,
        });

        setWorkExperience({
          currentWorkplace: 'Private Practice',
          currentRole: 'Counseling Psychologist',
          currentDuration: '10 years',
          previousWorkplace: 'Previous Clinic',
        });
      } catch (error) {
        console.error('Error fetching psychologist highlights:', error);
        setError(
          error instanceof Error
            ? error.message
            : 'Failed to load psychologist highlights'
        );
      } finally {
        setLoading(false);
      }
    };

    fetchPsychologistHighlights();
  }, [psychologistId, params?.slug]);

  const handleCreateProfile = (e: React.MouseEvent) => {
    e.preventDefault();
    toast.info('Feature Coming Soon', {
      description:
        'We are working on bringing this exciting feature to you. Stay tuned!',
      duration: 5000,
      position: 'bottom-right',
    });
  };

  if (loading) {
    return <PsychologistProfileHighlightsSkeleton />;
  }

  if (error || !workExperience || !profileInfo) {
    return (
      <div className="text-center text-red-500 py-10">
        Unable to load profile highlights
      </div>
    );
  }

  return (
    <div className="">
      <div
        className="relative flex flex-col gap-4 rounded-xl 
  bg-white bg-[linear-gradient(204deg,rgba(209,213,218,0.70)0%,rgba(255,255,255,0.00)50.85%)] 
  dark:bg-[#1c1c1c] dark:bg-[linear-gradient(204deg,rgba(40,40,45,0.8)0%,rgba(23,23,23,0.9)50.85%)] 
  p-4 border border-primaryBorder dark:border-[#333333]"
      >
        <div className="flex items-center justify-between">
          <div className="flex gap-2 items-center">
            <span>
              <svg
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M3 12C9.26747 12 12 9.363 12 3C12 9.363 14.7134 12 21 12C14.7134 12 12 14.7134 12 21C12 14.7134 9.26747 12 3 12Z"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinejoin="round"
                  vectorEffect="non-scaling-stroke"
                ></path>
              </svg>
            </span>
            <p className="text-gray-900 dark:text-gray-100 font-semibold text-sm">
              Profile Highlights
            </p>
          </div>
        </div>

        <div className="pl-4">
          <ul className="list-none space-y-2 text-sm">
            <li className="relative pl-4 before:content-['•'] before:absolute before:left-0 before:text-gray-500 before:-ml-4">
              Currently works at{' '}
              <span className="font-semibold">
                {workExperience.currentWorkplace}
              </span>{' '}
              as a {workExperience.currentRole} since{' '}
              <span className="font-semibold">
                {workExperience.currentDuration}
              </span>
            </li>
            <li className="relative pl-4 before:content-['•'] before:absolute before:left-0 before:text-gray-500 before:-ml-4">
              Previously worked at{' '}
              <span className="font-semibold">
                {workExperience.previousWorkplace}
              </span>
            </li>
          </ul>
        </div>

        <div className="flex flex-col items-center text-center mt-4">
          <div className="mb-2">
            <div className="w-10 h-10 relative">
              <div className="w-10 h-10 rounded-full overflow-hidden">
                <img
                  className="w-10 h-10 rounded-full bg-center bg-no-repeat bg-cover flex justify-center items-center object-cover hover:opacity-90 transition-opacity border-2 border-gray-200"
                  src={profileInfo.profilePhoto}
                  alt={`${profileInfo.firstName} ${profileInfo.lastName}`}
                  width="40"
                  height="40"
                />
              </div>
            </div>
          </div>
          <p className="font-instrument text-2xl font-normal leading-120 text-gray-900 dark:text-gray-100 mb-2">
            Join <i>{profileInfo.firstName.toLowerCase()}</i> on Mentality!
          </p>
          <p className="text-gray-600 dark:text-muted-foreground font-normal text-sm mb-3">
            Connect with expert mental health professionals like{' '}
            {profileInfo.firstName}
          </p>
          <button
            onClick={handleCreateProfile}
            className="mb-2 group flex items-center justify-center font-semibold border transition-all ease-in duration-75 whitespace-nowrap text-center select-none disabled:shadow-none disabled:opacity-50 disabled:cursor-not-allowed gap-x-1 active:shadow-none text-sm leading-5 rounded-xl py-1.5 h-8 px-4 bg-blue-600 text-white border-blue-500 hover:bg-blue-700 disabled:bg-blue-400 disabled:border-blue-400 shadow-sm"
          >
            Create Profile
            <span className="-mr-1">
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M5 12H19.5833M19.5833 12L12.5833 5M19.5833 12L12.5833 19"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  vectorEffect="non-scaling-stroke"
                ></path>
              </svg>
            </span>
          </button>
          <p className="dark:text-muted-foreground font-normal text-xs italic">
            Join with {profileInfo.firstName}'s personal invite link
          </p>
        </div>
      </div>
    </div>
  );
};

export default PsychologistProfileHighlightsSimple;
