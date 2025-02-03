'use client';

import dynamic from 'next/dynamic';

const ProfileCompletion = dynamic(
  () => import('@/components/ProfileCompletion')
);

const ProfileCompletePage = () => {
  return (
    <div>
      <ProfileCompletion onComplete={() => {}} />
    </div>
  );
};

export default ProfileCompletePage;
