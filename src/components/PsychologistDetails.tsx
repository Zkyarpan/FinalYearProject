'use client';

import React from 'react';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import {
  Award,
  Clock3,
  Languages,
  Stethoscope,
  DollarSign,
} from 'lucide-react';
import { SelectedSlot } from '@/types/appointment';

interface PsychologistDetailsProps {
  selectedSlot: SelectedSlot | null;
}

export function PsychologistDetails({
  selectedSlot,
}: PsychologistDetailsProps) {
  // If no slot is selected, return null or a placeholder
  if (!selectedSlot) {
    return (
      <div className="p-6 text-center text-muted-foreground">
        No psychologist details available
      </div>
    );
  }

  // Destructure with default values to prevent undefined errors
  const {
    psychologistName = 'Unknown Provider',
    about = 'No description available',
    profilePhotoUrl = '/default-avatar.png',
    licenseType = 'Not Specified',
    yearsOfExperience = 0,
    languages = [],
    specializations = [],
    sessionDuration = 0,
    sessionFee = 0,
  } = selectedSlot || {};

  // Fallback for avatar initials
  const initials = psychologistName
    ? psychologistName
        .split(' ')
        .map(n => n[0])
        .join('')
    : 'UN'; // Unknown

  return (
    <div className="p-6 space-y-6 max-h-[65vh] overflow-y-auto no-scrollbar">
      {/* Provider Header */}
      <Card className="p-4 bg-muted/30 dark:bg-input border">
        <div className="flex items-start space-x-4">
          <Avatar className="h-20 w-20 border-2 border-primary">
            <AvatarImage
              src={profilePhotoUrl}
              alt={psychologistName}
              onError={e => {
                e.currentTarget.src = '/default-avatar.png';
              }}
            />
            <AvatarFallback className="text-lg bg-primary/10">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="space-y-2">
            <h3 className="text-xl font-semibold">{psychologistName}</h3>
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <Award className="h-4 w-4 text-white bg-primary p-0.5 rounded-full" />
                <span>{licenseType}</span>
              </div>
              <span className="text-primary">•</span>
              <div className="flex items-center gap-1.5">
                <Clock3 className="h-4 w-4 text-white bg-primary p-0.5 rounded-full" />
                <span>{yearsOfExperience}y exp</span>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* About Section */}
      <div className="space-y-2">
        <h4 className="text-lg font-medium">About</h4>
        <p className="text-sm text-muted-foreground leading-relaxed text-justify">
          {about}
        </p>
      </div>

      {/* Languages & Specializations Grid */}
      <div className="grid grid-cols-2 gap-6">
        {/* Languages Section */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Languages className="h-4 w-4 text-white bg-primary p-0.5 rounded-full" />
            <span className="font-medium">Languages</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {languages.length > 0 ? (
              languages.map(lang => (
                <span
                  key={lang}
                  className="rounded-full px-3 py-1 text-sm border dark:bg-input text-muted-foreground"
                >
                  {lang}
                </span>
              ))
            ) : (
              <span className="text-sm text-muted-foreground">
                No languages specified
              </span>
            )}
          </div>
        </div>

        {/* Specializations Section */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Stethoscope className="h-4 w-4 text-white bg-primary p-0.5 rounded-full" />
            <span className="font-medium">Specializations</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {specializations.length > 0 ? (
              specializations.map(spec => (
                <span
                  key={spec}
                  className="rounded-full px-3 py-1 text-sm border dark:bg-input text-muted-foreground"
                >
                  {spec}
                </span>
              ))
            ) : (
              <span className="text-sm text-muted-foreground">
                No specializations listed
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Session Details Card */}
      <Card className="grid grid-cols-2 gap-6 p-4 border bg-muted/30 dark:bg-input">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Clock3 className="h-4 w-4 text-white bg-primary p-0.5 rounded-full" />
            <span className="font-medium">Session Duration</span>
          </div>
          <p className="text-2xl font-semibold main-font">
            {sessionDuration > 0 ? `${sessionDuration} min` : 'N/A'}
          </p>
        </div>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-white bg-primary p-0.5 rounded-full" />
            <span className="font-medium">Session Fee</span>
          </div>
          <p className="text-2xl font-semibold main-font">
            {sessionFee > 0 ? `$${sessionFee}` : 'N/A'}
          </p>
        </div>
      </Card>
    </div>
  );
}
