'use client';

import { Search, Loader2 } from 'lucide-react';
import ThemeSwitch from './ThemeSwitch';
import Notification from '@/icons/Notification';
import Settings from '@/icons/Settings';
import Logout from '@/icons/Logout';
import User from '@/icons/User';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useRef, useEffect } from 'react';
import { toast } from 'sonner';

interface UserActionsProps {
  isAuthenticated: boolean;
  profileImage: string | null;
  role: string | null;
  firstName: string | null;
  lastName: string | null;
  router: any;
  onLoginClick?: () => void;
  logout: () => void;
}

const UserActions = ({
  isAuthenticated,
  profileImage,
  role,
  firstName,
  lastName,
  router,
  logout,
}: UserActionsProps) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const isNestedBlogRoute =
    pathname.startsWith('/blogs/') && pathname !== '/blogs';

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleProfileClick = () => {
    setIsDropdownOpen(!isDropdownOpen);
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
        logout();
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

  const navigateToProfile = () => {
    const profilePath =
      role === 'psychologist' ? '/dashboard/psychologist' : '/account';
    router.push(profilePath);
    setIsDropdownOpen(false);
  };

  if (isAuthenticated) {
    return (
      <div className="flex items-center justify-end w-full relative z-50">
        <div className="flex items-center gap-x-3">
          <div className="flex items-center relative">
            <div
              className={`relative flex w-[209px] items-center rounded-xl border dark:border-[#333333] bg-gray-100 dark:bg-input px-4 py-1.5 transition-all duration-200 dark:shadow-sm shadow-sm ${
                isNestedBlogRoute ? 'ml-8' : 'ml-3'
              }`}
            >
              <Search className="h-5 w-5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search Mentality"
                className="ml-2 w-full h-6 text-sm border-none outline-none focus:ring-0 placeholder:text-muted-foreground dark:bg-input bg-gray-100"
              />
            </div>
          </div>

          <div className="flex items-center gap-3 px-1">
            <ThemeSwitch />
            <Notification />
            <div className="relative" ref={dropdownRef}>
              <button
                className="p-1 rounded-full hover:opacity-80 transition-all"
                onClick={handleProfileClick}
              >
                <div className="w-8 h-8 rounded-full overflow-hidden border border-border dark:border-[#333333]">
                  <Image
                    src={profileImage || '/default-avatar.jpg'}
                    alt={`${firstName}'s profile picture`}
                    width={32}
                    height={32}
                    layout="responsive"
                    className="object-cover"
                  />
                </div>
              </button>

              {isDropdownOpen && (
                <div className="absolute right-0 mt-2 w-52 bg-background border border-border dark:border-[#333333] rounded-xl shadow-lg z-[60]">
                  <div className="p-4 border-b border-border dark:border-[#333333]">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full overflow-hidden border border-border dark:border-[#333333]">
                        <Image
                          src={profileImage || '/default-avatar.jpg'}
                          alt="Profile"
                          width={40}
                          height={40}
                          className="object-cover w-full h-full"
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <p className="text-base font-semibold tracking-tight">
                          {firstName} {lastName}
                        </p>
                        <div className="flex items-center gap-1.5">
                          <div className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                          </div>
                          <p className="text-xs text-muted-foreground capitalize">
                            {role}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="p-2 flex flex-col gap-1">
                    <button
                      onClick={navigateToProfile}
                      className="w-full text-left px-3 py-2 text-sm rounded-lg group transition-colors flex items-center gap-2 hover:bg-muted"
                    >
                      <User />
                      <span className="group-hover:translate-x-1 transition-transform duration-200">
                        View Profile
                      </span>
                    </button>
                    <button
                      onClick={() => {
                        router.push('/settings');
                        setIsDropdownOpen(false);
                      }}
                      className="w-full text-left px-3 py-2 text-sm rounded-lg group transition-colors flex items-center gap-2 hover:bg-muted"
                    >
                      <Settings />
                      <span className="group-hover:translate-x-1 transition-transform duration-200">
                        Settings
                      </span>
                    </button>
                    <button
                      onClick={handleLogout}
                      disabled={isLoading || isRedirecting}
                      className="w-full text-left px-3 py-2 text-sm rounded-lg group transition-colors text-red-500 flex items-center gap-2 hover:bg-muted"
                    >
                      {isLoading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Logout />
                      )}
                      <span className="group-hover:translate-x-1 transition-transform duration-200">
                        {isLoading ? 'Logging out...' : 'Logout'}
                      </span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-end w-full relative z-50">
      <div className="flex items-center gap-3 px-1">
        <Link
          href="/login"
          className="font-medium text-sm py-1.5 px-4 rounded-xl border border-border dark:border-[#333333] hover:bg-muted transition-colors bg-white dark:bg-[#404040] hover:dark:bg-[#505050]"
        >
          Log in
        </Link>
        <Link
          href="/signup"
          className="font-medium text-sm py-1.5 px-4 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          Create Profile
        </Link>
        <ThemeSwitch />
      </div>
    </div>
  );
};

export default UserActions;
