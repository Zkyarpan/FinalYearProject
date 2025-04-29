'use client';

import React, { useState, useEffect } from 'react';
import { Calendar } from 'lucide-react';
import Message from '@/icons/Messages';
import Verified from '@/icons/Verified';
import Time from '@/icons/Clock';
import Dollar from '@/icons/Dollar';
import Award from '@/icons/Award';
import Video from '@/icons/Video';
import Phone from '@/icons/Phone';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import Link from 'next/link';
import Location from '@/icons/Location';
import { PsychologistCardSkeleton } from '../../../components/PsychologistCardSkeleton';

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

const PsychologistDirectory = () => {
  const [psychologists, setPsychologists] = useState<PsychologistProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchPsychologists = async () => {
      try {
        const response = await fetch('/api/psychologist/profile');
        const data = await response.json();

        console.log('API Response:', data);

        if (data.IsSuccess) {
          if (data.Result && data.Result.psychologists) {
            setPsychologists(data.Result.psychologists);
          } else if (Array.isArray(data.Result)) {
            setPsychologists(data.Result);
          } else {
            console.error('Unexpected API response structure:', data);
            setPsychologists([]);
          }
        }
      } catch (error) {
        console.error('Error fetching psychologists:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPsychologists();
  }, []);

  if (loading) {
    return (
      <div>
        <PsychologistCardSkeleton />
      </div>
    );
  }

  const filteredPsychologists = psychologists.filter(
    psych =>
      psych.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      psych.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      psych.specializations.some(spec =>
        spec.toLowerCase().includes(searchTerm.toLowerCase())
      )
  );

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName[0]}${lastName[0]}`;
  };

  const formatLicenseType = (type: string) => {
    return type
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  return (
    <div className="min-h-screen">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="space-y-4">
          {filteredPsychologists.map(psych => (
            <Card
              key={psych.id}
              className="overflow-hidden hover:shadow-md transition-shadow duration-200"
            >
              <CardContent className="p-0">
                <Link
                  href={`/psychologist/${psych.firstName}-${psych.lastName}`}
                >
                  <div className="flex items-start p-6 gap-4">
                    <div className="flex-shrink-0">
                      <div className="relative">
                        <Avatar className="w-16 h-16">
                          <AvatarImage
                            src={psych.profilePhoto}
                            alt={`${psych.firstName} ${psych.lastName}`}
                          />
                          <AvatarFallback>
                            {getInitials(psych.firstName, psych.lastName)}
                          </AvatarFallback>
                        </Avatar>
                        {psych.acceptingNewClients && (
                          <div className="absolute bottom-0 right-0 transform translate-x-1/4 translate-y-1/4">
                            <Verified />
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="text-lg font-semibold hover:underline underline-offset-2">
                            Dr. {psych.firstName} {psych.lastName}
                          </h3>
                          <p className="text-sm hover:underline underline-offset-2">
                            {formatLicenseType(psych.licenseType)}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge
                            variant={
                              psych.acceptingNewClients
                                ? 'default'
                                : 'secondary'
                            }
                            className="text-xs"
                          >
                            <Calendar className="w-3 h-3 mr-1" />
                            {psych.acceptingNewClients
                              ? 'Available'
                              : 'Not Available'}
                          </Badge>
                        </div>
                      </div>

                      <div className="mt-2 flex items-center gap-4 dark:text-muted-foreground">
                        <div className="flex items-center text-sm">
                          <Location />
                          {psych.city}, {psych.country}
                        </div>
                        <div className="flex items-center text-sm">
                          <Award />
                          {psych.yearsOfExperience} years exp.
                        </div>
                      </div>

                      <div className="mt-3 flex flex-wrap gap-2 uppercase dark:text-muted">
                        {psych.specializations.map((spec, index) => (
                          <Badge
                            key={index}
                            variant="default"
                            className="text-xs border "
                          >
                            {spec}
                          </Badge>
                        ))}
                      </div>

                      <div className="mt-4 flex items-center gap-4 text-sm dark:text-muted-foreground">
                        <div className="flex items-center gap-1">
                          {psych.sessionFormats.includes('video') && <Video />}
                          {psych.sessionFormats.includes('phone') && <Phone />}
                          {psych.sessionFormats.join(' & ')}
                        </div>
                        <div className="flex gap-1">
                          <Dollar />
                          {psych.sessionFee} USD
                        </div>
                        <div className="flex gap-1">
                          <Time />
                          {psych.sessionDuration} minutes
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center mt-2 gap-2">
                        <div className="flex items-center text-sm dark:text-muted-foreground gap-1">
                          <Message />
                          <span>Speaks:</span>
                        </div>
                        <div className="flex flex-wrap gap-1 ">
                          {psych.languages.map((language, index) => (
                            <Badge
                              key={index}
                              variant="custom"
                              className="text-xs border"
                            >
                              {language}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PsychologistDirectory;
