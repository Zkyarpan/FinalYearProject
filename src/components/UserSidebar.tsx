'use client';

import React, { useState } from 'react';
import { Loader2 as Loader } from 'lucide-react';
import Settings from '@/icons/Settings';
import Logout from '@/icons/Logout';
import { useUserStore } from '@/store/userStore';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { toast } from 'sonner';

function UserSidebar() {
  // Use the store with the proper fields, including the role
  const { firstName, lastName, profileImage, isAuthenticated, role, logout } =
    useUserStore();

  const [isLoading, setIsLoading] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  if (!isAuthenticated) {
    return null;
  }

  // Format role for display (capitalize first letter)
  const displayRole = role
    ? role.charAt(0).toUpperCase() + role.slice(1)
    : 'User';

  const isActive = (path: string): boolean => {
    return pathname === path;
  };

  const handleLogout = async () => {
    if (isLoading || isRedirecting) return;

    setIsLoading(true);
    setIsRedirecting(true);
    try {
      const response = await fetch('/api/logout', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        await logout(); // Use the async logout function from your store
        toast.success('Logged out successfully!');
        setTimeout(() => {
          router.push('/login');
        }, 500);
      } else {
        const data = await response.json();
        throw new Error(data.message || 'Failed to log out');
      }
    } catch (error) {
      console.error('Logout error:', error);
      toast.error('Failed to log out. Please try again.');
      setIsRedirecting(false);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <div className="">
        <nav className="border dark:border-[#333333] p-4 rounded-xl bg-white dark:bg-neutral-900">
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
                    backgroundImage: `url(${
                      profileImage || 'default-profile.png'
                    })`,
                    backgroundSize: 'cover',
                  }}
                />
                <div>
                  <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                    {firstName} {lastName}
                  </p>
                  <p className="text-xs text-neutral-600 dark:text-neutral-400">
                    {displayRole}
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
              onClick={handleLogout}
              customClass="group"
              isLoading={isLoading}
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
  isLoading?: boolean;
}

function NavItem({
  icon,
  title,
  description,
  link,
  onClick,
  isActive,
  customClass,
  isLoading,
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
          className={`${
            isLogout ? 'text-red-500' : 'text-neutral-700 dark:text-neutral-400'
          }`}
        >
          {isLoading && isLogout ? <Loader className="animate-spin" /> : icon}
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
              {isLoading && isLogout ? 'Logging out...' : title}
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
