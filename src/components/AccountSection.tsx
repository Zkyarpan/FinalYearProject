'use client';

import Image from 'next/image';

interface AccountSectionProps {
  firstName: string;
  profileImage?: string;
  onNavigate: (path: string) => void;
}

export default function AccountSection({
  firstName,
  profileImage,
  onNavigate,
}: AccountSectionProps) {
  return (
    <button
      onClick={() => onNavigate('/account')}
      className="w-full flex items-center gap-3 p-2 rounded-xl border dark:border-[#333333] bg-gray-200 dark:bg-input transition-colors duration-200 ease-in-out"
    >
      <div className="w-8 h-8 rounded-full overflow-hidden border shadow-sm">
        <Image
          src={profileImage || '/default-avatar.jpg'}
          alt={`${firstName}'s profile picture`}
          width={32}
          height={32}
          layout="responsive"
          className="object-cover"
        />
      </div>
      <div className="flex flex-col items-start justify-center">
        <span className="text-sm font-medium hover:translate-x-1 transition-transform duration-200">
          {firstName}
        </span>
        <span className="text-xs dark:text-gray-300">Manage account</span>
      </div>
    </button>
  );
}
