'use client';

import { Loader2 as Loader, ArrowRight as RightIcon } from 'lucide-react';

import Therapy from '@/icons/Therapy';
import Support from '@/icons/Support';
import Sessions from '@/icons/Session';
import Users from '@/icons/User';

const ServicesSection = ({ isAuthenticated, isLoading, handleNavigation }) => {
  return (
    <div className="rounded-2xl border border-border p-6 dark:border-[#333333] min-h-[calc(100vh-8rem)] bg-gradient-to-br from-primary/10 to-background">
      <div className="h-full flex flex-col max-w-sm mx-auto space-y-6">
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold text-center text-foreground">
            Get Support Today
          </h2>
          <div className="space-y-2">
            <p className="text-sm text-center">
              Connect with professional therapists and access mental health
              support services tailored to your needs.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="p-4 rounded-xl bg-card/50 border border-border/50">
            <div className="flex flex-col items-start gap-2">
              <Therapy />
              <h3 className="font-medium text-sm">Online Therapy</h3>
              <p className="text-xs">
                Professional counseling from licensed therapists, anywhere you
                are.
              </p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-card/50 border border-border/50">
            <div className="flex flex-col items-start gap-2">
              <Support />
              <h3 className="font-medium text-sm">Support Groups</h3>
              <p className="text-xs">
                Join guided group sessions and connect with peers who
                understand.
              </p>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="flex justify-center items-center gap-6 text-xs">
          <span className="flex items-center gap-2">
            <Sessions /> 1000+ Sessions
          </span>
          <span className="flex items-center gap-2">
            <Users /> 5k+ Users Helped
          </span>
        </div>

        <button
          onClick={() => handleNavigation('/services/book')}
          className="bg-primary text-primary-foreground rounded-full px-6 py-2.5 text-sm font-semibold hover:bg-primary/90 transition-colors w-full flex justify-center items-center gap-2"
        >
          Book a session <RightIcon className="w-4 h-4" />
        </button>

        <p className="text-xs text-center italic text-muted-foreground">
          Professional mental health support when you need it
        </p>
      </div>
    </div>
  );
};

export default ServicesSection;
