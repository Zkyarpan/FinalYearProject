'use client';

import { useEffect, useState } from 'react';
import { useUserStore } from '@/store/userStore';
import dynamic from 'next/dynamic';

const ProfileCompletion = dynamic(
  () => import('@/components/ProfileCompletion'),
  { ssr: false }
);

export default function DashboardLayout({ children }) {
  const { isAuthenticated, profileComplete } = useUserStore();

  const [showProfileCompletion, setShowProfileCompletion] = useState(false);

  useEffect(() => {
    if (isAuthenticated && !profileComplete) {
      setShowProfileCompletion(true);
    } else {
      setShowProfileCompletion(false);
    }
  }, [isAuthenticated, profileComplete]);

  return (
    <div className="relative min-h-screen">
      <div className={showProfileCompletion ? 'blur-[1px]' : ''}>
        {children}
      </div>

      {showProfileCompletion && (
        <div className="fixed inset-0 z-50">
          <div
            className="fixed inset-0 bg-black/20 backdrop-blur-[2px]"
            onClick={() => setShowProfileCompletion(false)}
          />

          <div className="absolute inset-0 overflow-y-auto">
            <div className="flex items-center justify-center min-h-full p-4">
              <div className="relative z-50 w-full max-w-lg mx-auto rounded-2xl shadow-xl bg-[#1a1a1a]">
                <ProfileCompletion
                  onComplete={() => setShowProfileCompletion(false)}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
