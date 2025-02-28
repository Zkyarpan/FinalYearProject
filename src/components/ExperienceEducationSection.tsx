'use client';

import React from 'react';
import { GraduationCap, MapPin, Clock } from 'lucide-react';

// Verification Badge Component
const VerificationBadge = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 20 20"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <rect
      x="1"
      y="1"
      width="18"
      height="18"
      rx="9"
      fill="rgb(var(--gray-00))"
    />
    <path
      d="M8.4773 2.80234C9.21702 1.73255 10.7828 1.73255 11.5225 2.80234C11.9706 3.45043 12.7717 3.74544 13.5267 3.54042C14.773 3.20199 15.9725 4.22029 15.8595 5.52087C15.791 6.30877 16.2173 7.05577 16.9259 7.38975C18.0957 7.94104 18.3675 9.50115 17.4547 10.424C16.9017 10.983 16.7537 11.8325 17.0844 12.5492C17.6302 13.7322 16.8473 15.1042 15.5618 15.2174C14.783 15.286 14.1299 15.8405 13.9279 16.6046C13.5944 17.8658 12.1231 18.4076 11.0663 17.6583C10.4262 17.2044 9.57363 17.2044 8.93345 17.6583C7.87671 18.4076 6.40539 17.8658 6.07192 16.6046C5.86989 15.8405 5.21682 15.286 4.43803 15.2174C3.15249 15.1042 2.36961 13.7322 2.91544 12.5492C3.24611 11.8325 3.09807 10.983 2.54507 10.424C1.63224 9.50115 1.90413 7.94104 3.07386 7.38975C3.78249 7.05577 4.20875 6.30877 4.1403 5.52087C4.02731 4.22029 5.22675 3.20199 6.47304 3.54042C7.22807 3.74544 8.02918 3.45043 8.4773 2.80234Z"
      fill="url(#paint0_linear_11664_9169)"
    />
    <path
      d="M6.66667 10.254L8.66667 12.1112L13.3333 7.77783"
      stroke="#fff"
      strokeWidth="1.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <rect
      x="1"
      y="1"
      width="18"
      height="18"
      rx="9"
      stroke="rgb(var(--gray-00))"
      strokeWidth="2"
    />
    <defs>
      <linearGradient
        id="paint0_linear_11664_9169"
        x1="9.9999"
        y1="2"
        x2="9.9999"
        y2="18"
        gradientUnits="userSpaceOnUse"
      >
        <stop stopColor="#27AE60" />
        <stop offset="1" stopColor="#1E874B" />
      </linearGradient>
    </defs>
  </svg>
);

// Experience and Education Section Component
const ExperienceEducationSection = ({ psychologist }) => {
  // Step-by-step explanation of experience calculation
  const calculateExperience = yearsOfExperience => {
    // Check if the year looks like a birth year or founding year
    const currentYear = new Date().getFullYear();

    // Case 1: If the year is clearly in the past (before current year)
    if (yearsOfExperience < currentYear) {
      // Assume it's a start year of practice
      return currentYear - yearsOfExperience;
    }

    // Case 2: If the year is abnormally large (like 1993)
    if (yearsOfExperience > 1900 && yearsOfExperience <= currentYear) {
      return currentYear - yearsOfExperience;
    }

    // Case 3: If it's already a number of years
    return yearsOfExperience;
  };

  // Calculate corrected years of experience
  const correctedExperience = calculateExperience(
    psychologist.yearsOfExperience
  );

  return (
    <div className="space-y-10">
      {/* Experience Section */}
      <div className="mb-10 sm:pb-0 pb-4 sm:mb-20">
        <div className="flex items-center justify-between">
          <div className="w-full flex items-center justify-between">
            <p className="text-gray-1k font-semibold text-base">Experience</p>
            <span className="text-xs font-semibold leading-4 px-2 py-0.5 rounded-md h-5 inline-flex items-center justify-center text-center w-fit text-gray-700 bg-gray-100 dark:bg-gray-50 ml-2 sm:ml-4">
              {correctedExperience} years
            </span>
          </div>
        </div>

        <div className="mt-6">
          {/* Experience Item */}
          <div className="group">
            <div className="w-full flex justify-between">
              <div className="flex items-center gap-2 overflow-hidden">
                <span className="max-w-fit">
                  <div className="group/company flex items-center gap-2 overflow-hidden">
                    <div className="rounded-full bg-purple-500 w-6 h-6 flex items-center justify-center text-white">
                      M
                    </div>
                    <p className="text-gray-1k font-normal text-sm group-hover/company:underline truncate">
                      Private Practice
                    </p>
                  </div>
                </span>
              </div>
            </div>

            <div className="pl-8 relative w-full transition-colors duration-200 flex flex-col items-center">
              <div className="absolute w-0.5 bg-gray-200 dark:bg-gray-400 h-[10px] left-[11px]"></div>
              <div className="w-full flex relative pt-2">
                <div className="w-4 h-3 border-l-2 border-b-2 rounded-bl-lg absolute -left-[21px] border-gray-200 dark:border-gray-400"></div>
                <div className="w-full flex">
                  <div className="group w-full duration-300 ease-in-out rounded-2xl outline-none transition-shadow">
                    <div className="w-full flex flex-col gap-2">
                      <div className="flex items-center justify-between w-full">
                        <div className="w-full flex flex-col gap-1">
                          <div className="flex items-center gap-2">
                            <p className="text-gray-900 dark:text-white font-semibold text-sm">
                              {psychologist.licenseType
                                .split('_')
                                .map(
                                  word =>
                                    word.charAt(0).toUpperCase() + word.slice(1)
                                )
                                .join(' ')}
                            </p>
                          </div>
                          <p className="text-gray-600 dark:text-gray-300 font-normal text-xs">
                            <strong>
                              {1993} - Present • {correctedExperience} years
                              <span className="font-normal capitalize">
                                {' '}
                                • {psychologist.city}, {psychologist.country}
                              </span>
                            </strong>
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Education Section */}
      <div className="mb-10 sm:pb-0 pb-4 sm:mb-20">
        <div className="flex items-center justify-between">
          <div className="w-full flex items-center justify-between">
            <p className="text-gray-1k font-semibold text-base">Education</p>
          </div>
        </div>

        <div className="flex flex-col mt-6 sm:gap-6 gap-4">
          {psychologist.education.map((edu, index) => (
            <div key={index} className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <p className="text-gray-1k font-semibold text-sm">
                  {edu.university}
                </p>
                <div aria-label="Verified Badge information">
                  <VerificationBadge />
                </div>
              </div>

              <p className="dark:text-muted-foreground font-normal text-xs">
                {edu.degree}, {edu.degree}
              </p>

              <p className="dark:text-muted-foreground font-normal text-xs">
                {edu.graduationYear} - {edu.graduationYear + 4}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ExperienceEducationSection;
