'use client';

import React from 'react';
import AppointmentManager from '@/components/AppointmentManager';
import { useUserStore } from '@/store/userStore'; 
import { Shield, User } from 'lucide-react';
import { VideoCallProvider } from '@/contexts/VideoCallContext';

const SessionPage = () => {
  const { isAuthenticated, profileImage, role, firstName, lastName } =
    useUserStore();

  return (
    <VideoCallProvider>
      <div className="mx-auto py-6 px-4 md:px-6">
        <div className="mb-8 flex items-center gap-2">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Session Management
            </h1>
            <p className="text-muted-foreground mt-2">
              {role === 'psychologist'
                ? 'Manage your patient sessions and appointments'
                : 'Manage your therapy sessions and appointments'}
            </p>
          </div>
        </div>

        {isAuthenticated ? (
          <AppointmentManager
            role={role === 'psychologist' ? 'psychologist' : 'user'}
            profileImage={profileImage ?? undefined}
            firstName={firstName ?? undefined}
            lastName={lastName ?? undefined}
          />
        ) : (
          <div className="text-center py-12 bg-muted/50 rounded-lg border">
            <p className="text-muted-foreground">
              Please log in to view your appointments
            </p>
          </div>
        )}
      </div>
    </VideoCallProvider>
  );
};

export default SessionPage;
