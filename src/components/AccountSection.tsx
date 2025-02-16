'use client';

import Link from 'next/link';
import { DEFAULT_AVATAR } from '@/constants';

interface AccountSectionProps {
  firstName: string;
  profileImage?: string;
  role?: string;
}

export default function AccountSection({
  firstName,
  profileImage,
  role = 'user',
}: AccountSectionProps) {
  const getAccountPath = () => {
    switch (role) {
      case 'psychologist':
        return '/account/psychologist';
      case 'admin':
        return '/account/admin';
      default:
        return '/account';
    }
  };

  const getManageLabel = () => {
    switch (role) {
      case 'psychologist':
        return 'Manage account';
      case 'admin':
        return 'Manage account';
      default:
        return 'Manage account';
    }
  };

  return (
    <Link
      href={getAccountPath()}
      className="block w-full p-2 rounded-xl border dark:border-[#333333] bg-gray-200 dark:bg-input transition-colors duration-200 ease-in-out"
    >
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-full overflow-hidden border shadow-sm">
          <img
            src={profileImage || DEFAULT_AVATAR}
            alt={`${firstName}'s profile picture`}
            width={32}
            height={32}
            className="object-cover w-full h-full"
          />
        </div>
        <div className="flex flex-col items-start justify-center">
          <span className="text-sm font-medium hover:translate-x-1 transition-transform duration-200">
            {firstName}
          </span>
          <span className="text-xs dark:text-gray-300">{getManageLabel()}</span>
        </div>
      </div>
    </Link>
  );
}
