'use client';

import React, { useState } from 'react';
import Settings from '@/icons/Settings';
import Logout from '@/icons/Logout';
import { useUserStore } from '@/store/userStore';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { toast } from 'sonner';

function UserSidebar() {
  const { firstName, lastName, profileImage, isAuthenticated, logout } =
    useUserStore();
  const pathname = usePathname();
  const router = useRouter();

  if (!isAuthenticated) {
    return null;
  }

  const isActive = (path: string): boolean => {
    return pathname === path;
  };

  const handleLogout = async () => {
    try {
      const response = await fetch('/api/logout', {
        method: 'POST',
        credentials: 'include',
      });

      if (response.ok) {
        logout();
        router.push('/login');
        toast.success('Logged out successfully!');
      } else {
        throw new Error('Failed to log out');
      }
    } catch (error) {
      console.error('Logout error:', error);
      toast.error('Failed to log out');
    }
  };

  return (
    <>
      <div className="">
        <nav className="border dark:border-neutral-800 p-4 rounded-xl bg-white dark:bg-neutral-900">
          <div className="flex flex-col gap-2">
            <Link href="/account" passHref>
              <div
                className={`flex items-center gap-3 p-3 rounded-2xl cursor-pointer
                  ${
                    isActive('/account')
                      ? 'bg-neutral-100 dark:bg-neutral-800'
                      : 'hover:bg-neutral-100 dark:hover:bg-neutral-800'
                  } transition-colors duration-200`}
              >
                <div
                  className="w-10 h-10 rounded-full"
                  style={{
                    backgroundImage: `url(${profileImage || 'default-profile.png'})`,
                    backgroundSize: 'cover',
                  }}
                />
                <div>
                  <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                    {firstName} {lastName}
                  </p>
                  <p className="text-xs text-neutral-600 dark:text-neutral-400">
                    Manage your profile
                  </p>
                </div>
              </div>
            </Link>

            <NavItem
              icon={<Settings />}
              title="Settings"
              description="Edit profile & account"
              link="/settings/profile"
              isActive={isActive('/settings/profile')}
            />
            <NavItem
              icon={<Logout />}
              title="Logout"
              description="Sign out of your account"
              link="/api/logout"
              onClick={handleLogout}
              customClass="group"
            />
          </div>
        </nav>
      </div>
    </>
  );
}

interface NavItemProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  link?: string;
  onClick?: () => void;
  isActive?: boolean;
  customClass?: string;
}

function NavItem({
  icon,
  title,
  description,
  link,
  onClick,
  isActive,
  customClass,
}: NavItemProps) {
  const handleClick = () => {
    if (onClick) onClick();
  };

  const isLogout = title === 'Logout';

  return (
    <Link href={link || '#'} passHref>
      <div
        onClick={handleClick}
        className={`flex items-center gap-3 p-3 rounded-2xl cursor-pointer
          ${
            isActive
              ? 'bg-neutral-100 dark:bg-neutral-800'
              : 'hover:bg-neutral-100 dark:hover:bg-neutral-800'
          } ${customClass} transition-colors duration-200`}
      >
        <div
          className={`${isLogout ? 'text-red-500' : 'text-neutral-700 dark:text-neutral-400'}`}
        >
          {icon}
        </div>
        <div className="flex-1 group-hover:translate-x-2 transition-transform duration-200">
          <div className="flex items-center gap-2">
            <p
              className={`text-sm font-medium ${
                isLogout
                  ? 'text-red-500 dark:text-red-500'
                  : 'text-neutral-900 dark:text-neutral-100'
              }`}
            >
              {title}
            </p>
          </div>
          <p
            className={`text-xs ${
              isLogout
                ? 'text-red-500 dark:text-red-500'
                : 'text-neutral-600 dark:text-neutral-400'
            }`}
          >
            {description}
          </p>
        </div>
      </div>
    </Link>
  );
}

export default UserSidebar;
