'use client';

import { Loader2 as Loader, ArrowRight as RightIcon } from 'lucide-react';

import Therapy from '@/icons/Therapy';
import Connect from '@/icons/Connect';
import Certified from '@/icons/Certified';
import Client from '@/icons/Client';
import Link from 'next/link';

const PsychologistSection = ({
  isAuthenticated,
  isLoading: initialLoading,
  handleNavigation,
}) => {
  return (
    <div className="rounded-2xl border border-border p-6 dark:border-[#333333] min-h-[calc(100vh-8rem)] bg-gradient-to-br from-primary/10 to-background">
      <div className="h-full flex flex-col max-w-sm mx-auto space-y-6">
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold text-center text-foreground">
            Join Our Network
          </h2>
          <div className="space-y-2">
            <p className="text-sm text-center">
              Connect with clients seeking mental health support. Join our
              platform to expand your practice and make a difference.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="p-4 rounded-xl bg-card/50 border border-border/50">
            <div className="flex flex-col items-start gap-2">
              <Therapy />
              <h3 className="font-medium text-sm">Online Therapy</h3>
              <p className="text-xs">
                Provide therapy sessions remotely and reach clients worldwide.
              </p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-card/50 border border-border/50">
            <div className="flex flex-col items-start gap-2">
              <Connect />
              <h3 className="font-medium text-sm">Easy Connect</h3>
              <p className="text-xs">
                Simple scheduling and secure video consultations platform.
              </p>
            </div>
          </div>
        </div>

        <div className="flex justify-center items-center gap-6 text-xs">
          <span className="flex items-center gap-2">
            <Certified /> 500+ Therapists
          </span>
          <span className="flex items-center gap-2">
            <Client /> 10k+ Clients
          </span>
        </div>

        <Link
          href={'/signup/psychologist'}
          className="bg-primary text-primary-foreground rounded-full px-6 py-2.5 text-sm font-semibold hover:bg-primary/90 transition-colors w-full flex justify-center items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Join as therapist <RightIcon className="w-4 h-4" />
        </Link>

        <p className="text-xs text-center italic text-muted-foreground">
          Join our network of certified mental health professionals
        </p>
      </div>
    </div>
  );
};

export default PsychologistSection;
