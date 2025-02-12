'use client';

import { useEffect, useState } from 'react';
import { useUserStore } from '@/store/userStore';
import dynamic from 'next/dynamic';

const ProfileCompletion = dynamic(
  () => import('@/components/ProfileCompletion'),
  { ssr: false }
);

export default function DashboardLayout({ children }) {
  const { isAuthenticated, profileComplete, role } = useUserStore();
  const [showProfileCompletion, setShowProfileCompletion] = useState(false);

  useEffect(() => {
    if (isAuthenticated && !profileComplete && role === 'user') {
      setShowProfileCompletion(true);
      document.documentElement.classList.add('overflow-hidden');
    } else {
      setShowProfileCompletion(false);
      document.documentElement.classList.remove('overflow-hidden');
    }

    return () => {
      document.documentElement.classList.remove('overflow-hidden');
    };
  }, [isAuthenticated, profileComplete, role]);

  return (
    <div className="relative min-h-screen">
      {/* Main Content */}
      <div
        className={`h-screen ${
          showProfileCompletion
            ? 'blur-sm pointer-events-none overflow-hidden'
            : ''
        }`}
      >
        {children}
      </div>

      {/* Modal */}
      {showProfileCompletion && (
        <div
          className="fixed inset-0 bg-black/20 backdrop-blur-[2px] overflow-hidden"
          style={{ zIndex: 999999 }}
          onClick={e => {
            if (e.target === e.currentTarget) {
              setShowProfileCompletion(false);
            }
          }}
        >
          <div className="fixed inset-0 flex items-center justify-center">
            <div
              className="w-full max-w-lg mx-4 bg-[#1a1a1a] rounded-2xl shadow-xl relative"
              onClick={e => e.stopPropagation()}
              style={{
                isolation: 'isolate',
                transform: 'translateZ(0)',
              }}
            >
              <style jsx global>{`
                .select-dropdown {
                  z-index: 50 !important;
                }

                /* Ensure select component is above modal */
                [role='listbox'],
                [role='combobox'],
                .select__menu,
                .select__menu-list {
                  z-index: 1000000 !important;
                }
              `}</style>
              <ProfileCompletion
                onComplete={() => setShowProfileCompletion(false)}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
