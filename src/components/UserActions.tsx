'use client';

import { Loader2, User2, Settings2 } from 'lucide-react';
import ThemeSwitch from './ThemeSwitch';
import NotificationIcon from '@/components/notifications/NotificationIcon';
import Logout from '@/icons/Logout';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { DEFAULT_AVATAR } from '@/constants';
import { CommandMenu } from './CommandSearch';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

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
  const [isLoading, setIsLoading] = useState(false);
  const [showFullPageLoader, setShowFullPageLoader] = useState(false);
  const pathname = usePathname();

  const handleLogout = async () => {
    if (isLoading) return;
    setIsLoading(true);
    setShowFullPageLoader(true);

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

        localStorage.clear();
        sessionStorage.clear();

        setTimeout(() => {
          router.push('/login');
        }, 300);
      } else {
        const data = await response.json();
        throw new Error(data.message || 'Failed to log out');
      }
    } catch (error) {
      console.error('Logout error:', error);
      toast.error('Failed to log out. Please try again.');
      setShowFullPageLoader(false);
    } finally {
      setIsLoading(false);
    }
  };

  const navigateToProfile = () => {
    const profilePath =
      role === 'psychologist' ? '/dashboard/psychologist' : '/account';
    router.push(profilePath);
  };

  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-end w-full relative z-[999]">
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
  }

  return (
    <>
      <div className="flex items-center justify-end w-full relative ">
        <div className="flex items-center gap-x-3 z-[100]">
          <div className="flex items-center relative">
            <CommandMenu router={router} />
          </div>

          <div className="flex items-center gap-3 px-1">
            <ThemeSwitch />

            <Link
              href="/notifications"
              className="inline-flex items-center justify-center"
              aria-label="View notifications"
            >
              <NotificationIcon />
            </Link>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="p-1 rounded-full" aria-label="Profile">
                  <div className="relative w-8 h-8">
                    <div className="absolute inset-0 rounded-full overflow-hidden">
                      <img
                        src={profileImage || DEFAULT_AVATAR}
                        alt={`${firstName}'s profile picture`}
                        className="w-full h-full object-cover opacity-90"
                      />
                    </div>
                  </div>
                </button>
              </DropdownMenuTrigger>

              <DropdownMenuContent className="w-52" align="end">
                <div className="p-3 border-b border-border dark:border-[#333333]">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full overflow-hidden border border-border dark:border-[#333333]">
                      <img
                        src={profileImage || DEFAULT_AVATAR}
                        alt={`${firstName}'s profile picture`}
                        className="w-full h-full object-cover opacity-90"
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

                <DropdownMenuGroup className="p-1">
                  <DropdownMenuItem
                    className="px-3 py-2 text-sm rounded-lg group transition-colors flex items-center gap-2 cursor-pointer"
                    onClick={navigateToProfile}
                  >
                    <User2 className="h-4 w-4" />
                    <span className="group-hover:translate-x-1 group transition-transform duration-200">
                      View Profile
                    </span>
                  </DropdownMenuItem>

                  <DropdownMenuItem
                    className="px-3 py-2 text-sm rounded-lg group transition-colors flex items-center gap-2 cursor-pointer"
                    onClick={() => router.push('/settings')}
                  >
                    <Settings2 className="h-4 w-4" />
                    <span className="group-hover:translate-x-1 transition-transform duration-200">
                      Settings
                    </span>
                  </DropdownMenuItem>

                 

                  <DropdownMenuSeparator />

                  <DropdownMenuItem
                    className="px-3 py-2 text-sm rounded-lg group transition-colors text-red-500 flex items-center gap-2 cursor-pointer "
                    onClick={handleLogout}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Logout />
                    )}
                    <span className="group-hover:translate-x-1 transition-transform duration-200">
                      {isLoading ? 'Logging out...' : 'Logout'}
                    </span>
                  </DropdownMenuItem>
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </>
  );
};

export default UserActions;
