'use client';

import Search from '@/icons/Search';
import ThemeSwitch from './ThemeSwitch';
import Notification from '@/icons/Notification';
import Image from 'next/image';
import Link from 'next/link';

const UserActions = ({ isAuthenticated, profileImage, router }) => {
  if (isAuthenticated) {
    return (
      <div className="flex items-center gap-4">
        {isAuthenticated ? (
          <div className="flex items-center px bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-20">
            <div className="flex flex-1 items-center mr-3">
              <div
                className="relative flex w-full items-center rounded-xl
    border dark:bg-input 
    bg-white 
    px-4 py-1
    transition-all duration-200 gap-x-2
   "
              >
                <Search />
                <input
                  type="text"
                  placeholder="Search..."
                  className="w-full text-lg bg-transparent border-none outline-none focus:ring-0
        transition-colors duration-200"
                />
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <ThemeSwitch />
              <div className="">
                <Notification />
              </div>
              <button
                className="hover:opacity-80 transition-opacity"
                onClick={() => router.push('/account')}
              >
                <div className="w-8 h-8 rounded-full overflow-hidden">
                  <Image
                    src={profileImage || '/default-avatar.jpg'}
                    alt="Profile"
                    width={32}
                    height={32}
                    className="object-cover"
                  />
                </div>
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-4">
            <Link
              href="/login"
              className="font-semibold text-sm py-1.5 px-4 rounded-xl border border-[hsl(var(--border))] hover:shadow-md dark:bg-[#f8f9fa] dark:border-[#ced4da] hover:dark:bg-[#e9ecef] dark:text-black"
            >
              Log in
            </Link>
            <Link
              href="/signup"
              className="font-semibold text-sm py-1.5 px-4 rounded-xl bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] hover:bg-[hsl(var(--ring))] hover:shadow-md hover:dark:bg-[#0072ce]"
            >
              Create Profile
            </Link>
            <ThemeSwitch />
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-4">
      <Link
        href="/login"
        className="font-semibold text-sm py-1.5 px-4 rounded-xl border border-[hsl(var(--border))] hover:shadow-md dark:bg-[#f8f9fa] dark:border-[#ced4da] hover:dark:bg-[#e9ecef] dark:text-black"
      >
        Log in
      </Link>
      <Link
        href="/signup"
        className="font-semibold text-sm py-1.5 px-4 rounded-xl bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] hover:bg-[hsl(var(--ring))] hover:shadow-md hover:dark:bg-[#0072ce]"
      >
        Create Profile
      </Link>
      <ThemeSwitch />
    </div>
  );
};

export default UserActions;
