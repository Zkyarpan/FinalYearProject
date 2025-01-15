'use client';

import { useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import ThemeSwitch from '@/components/ThemeSwitch';
import { useUserStore } from '@/store/userStore';

import ServicesIcon from '@/icons/ServicesIcon';
import PsychologistIcon from '@/icons/Psychologist';
import ArticlesIcon from '@/icons/Atricles';
import ResourcesIcon from '@/icons/ResourceIcon';
import BlogIcon from '@/icons/BlogIcon';
import StoriesIcon from '@/icons/Stories';
import { toast } from 'sonner';
import Account from '@/icons/Account';
import Notification from '@/icons/Notification';

const NAV_ITEMS = [
  { icon: <StoriesIcon />, text: 'Stories', href: '/stories' },
  { icon: <ServicesIcon />, text: 'Services', href: '/services' },
  { icon: <PsychologistIcon />, text: 'Psychologist', href: '/psychologists' },
  { icon: <ArticlesIcon />, text: 'Articles', href: '/articles' },
  { icon: <ResourcesIcon />, text: 'Resources', href: '/resources' },
  { icon: <BlogIcon />, text: 'Blogs', href: '/blogs' },
];

const routeTitles = {
  '/stories': 'Our Stories',
  '/services': 'Services',
  '/psychologists': 'Our Psychologists',
  '/articles': 'Latest Articles',
  '/resources': 'Resources',
  '/blogs': 'Mentality Blogs',
  '/account': 'Your Account',
};

const NavItem = ({ icon, text, isActive, href }) => {
  const textStyle = isActive
    ? {
        fontWeight: '600',
        color: 'var(--foreground)',
      }
    : {};

  return (
    <Link href={href}>
      <span className="flex lg:flex-row flex-col items-center group pt-2 lg:py-2.5 transition-all hover:text-gray-900 dark:text-white">
        <span className="relative text-current shrink-0">{icon}</span>
        <span className="flex flex-col lg:ml-2 mt-2 lg:mt-0 transition-all lg:group-hover:translate-x-1">
          <span className="ml-1 text-lg font-normal" style={textStyle}>
            {text}
          </span>
        </span>
      </span>
    </Link>
  );
};

const ProfileDropdown = ({ isOpen, onLogout }) =>
  isOpen && (
    <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-[#333333] shadow-lg rounded-xl border dark:border-[#444] z-50">
      <ul className="py-2">
        <li className="px-4 py-2 hover:bg-gray-100 dark:hover:bg-[#444] cursor-pointer">
          <Link href="/profile">View Profile</Link>
        </li>
        <li
          className="px-4 py-2 hover:bg-gray-100 dark:hover:bg-[#444] cursor-pointer"
          onClick={onLogout}
        >
          Logout
        </li>
      </ul>
    </div>
  );

const RootLayout = ({ children }) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { isAuthenticated, logout } = useUserStore();
  const currentYear = new Date().getFullYear();
  const isMainRoute = Object.keys(routeTitles).includes(pathname);
  const title = routeTitles[pathname];
  const authenticatedNavItems = isAuthenticated
    ? [{ icon: <Account />, text: 'Account', href: '/account' }]
    : [];

  const combinedNavItems = [...NAV_ITEMS, ...authenticatedNavItems];
  const handleLogout = async () => {
    try {
      const response = await fetch('/api/logout', {
        method: 'POST',
        credentials: 'include',
      });

      if (response.ok) {
        logout();
        router.push('/login');
      } else {
        toast.error('Logout failed');
      }
    } catch (error) {
      toast.error('Something went wrong during logout');
    }
  };

  const showRightSidebar =
    Object.keys(routeTitles).includes(pathname) ||
    (pathname === '/account' && isAuthenticated);

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      {/* Left Sidebar - Always visible */}
      <div className="w-[212px] border-r border-border fixed h-screen flex flex-col justify-between py-4 dark:border-[#333333] overflow-auto ">
        <div className="flex flex-col h-full">
          <div className="px-4 -py-2 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <Link href="/" className="flex items-center">
              <Image
                alt="Mentality"
                width={40}
                height={30}
                className="object-contain dark:bg-white rounded-full"
                src="/Logo1.png?v=1"
                priority
              />
              <span className="ml-1 text-2xl logo-font">Mentality</span>
            </Link>
          </div>
          <nav className="px-6 flex-1 mt-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            {combinedNavItems.map(item => (
              <NavItem
                key={item.text}
                {...item}
                isActive={pathname === item.href}
              />
            ))}
          </nav>
        </div>
        <div className="px-6">
          <p className="text-muted-foreground text-[10px]">
            © {currentYear} Mentality, Inc.
          </p>
        </div>
      </div>

      <div
        className={`flex-1 ml-[212px] ${
          showRightSidebar ? 'mr-[348px]' : 'mr-0'
        } h-screen flex flex-col`}
      >
        <div className="h-14 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 dark:border-[#333333] mt-2">
          <div className="h-full px-6 flex items-center justify-between">
            <h1 className="text-base font-semibold">{title}</h1>
            {!showRightSidebar && (
              <div className="flex items-center gap-4">
                {isAuthenticated ? (
                  <div className="relative">
                    <button
                      className="w-10 h-10 rounded-full border border-border flex items-center justify-center hover:shadow-md"
                      onClick={() => setDropdownOpen(!dropdownOpen)}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth="1.5"
                        stroke="currentColor"
                        className="w-6 h-6"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M12 14c3.5 0 6 2.5 6 6H6c0-3.5 2.5-6 6-6zm0-4c1.657 0 3-1.343 3-3S13.657 4 12 4 9 5.343 9 7s1.343 3 3 3z"
                        />
                      </svg>
                    </button>
                    <ProfileDropdown
                      isOpen={dropdownOpen}
                      onLogout={handleLogout}
                    />
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
                  </div>
                )}
                <ThemeSwitch />
              </div>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-auto hide-scrollbar">
          <div className="p-6">{children}</div>
        </div>
      </div>

      {/* Right Sidebar - Only show on main routes */}
      {showRightSidebar && (
        <div className="w-[348px] fixed right-0 top-0 h-screen border-l border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 dark:border-[#333333] flex flex-col">
          <div className="h-16 border-b dark:border-[#333333]  flex items-center px-7 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-20">
            <div className="flex flex-1 items-center mr-3">
              <div className="relative flex w-full items-center rounded-lg border border-gray-200 dark:border-[#333333] px-3 py-2">
                <input
                  type="text"
                  placeholder="Search"
                  className="w-full text-sm bg-transparent border-none outline-none focus:ring-0"
                />
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <ThemeSwitch />
              <div className="">
                <Notification />
              </div>
              <button className="hover:opacity-80 transition-opacity">
                <div className="w-8 h-8 rounded-full overflow-hidden">
                  <Image
                    src="/api/placeholder/32/32"
                    alt="Profile"
                    width={32}
                    height={32}
                    className="object-cover"
                  />
                </div>
              </button>
            </div>
          </div>

          {/* Scrollable Content with improved handling */}
          <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-700 scrollbar-track-transparent">
            <div className="p-6">
              <div className="rounded-2xl border border-border p-6 dark:border-[#333333] min-h-[calc(100vh-8rem)] bg-gradient-to-br from-primary/10 to-background">
                {pathname === '/account' ? (
                  <div className="h-full flex flex-col space-y-6">
                    <div className="space-y-4">
                      <h2 className="text-2xl font-semibold text-center text-foreground">
                        Welcome to Your Account
                      </h2>
                      <div className="space-y-2">
                        <p className="text-sm text-center text-muted-foreground">
                          Manage your profile, appointments, and mental wellness
                          journey all in one place.
                        </p>
                        <p className="text-sm text-center text-muted-foreground">
                          Track your progress, access your resources, and stay
                          connected with your support network.
                        </p>
                      </div>
                    </div>
                    <div className="mt-auto space-y-3">
                      <button className="bg-primary text-primary-foreground rounded-full px-6 py-2.5 text-sm font-semibold hover:bg-primary/90 transition-colors w-full">
                        Schedule an Appointment
                      </button>
                      <p className="text-xs text-center italic text-muted-foreground">
                        Your well-being is our priority
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="h-full flex flex-col space-y-6">
                    <div className="space-y-4">
                      <h2 className="text-2xl font-semibold text-center text-foreground">
                        Your Journey to Better Mental Health Starts Here
                      </h2>
                      <div className="space-y-2">
                        <p className="text-sm text-center text-muted-foreground">
                          Feeling overwhelmed, anxious, or just need someone to
                          talk to? Our professional psychologists are here to
                          provide the support you need.
                        </p>
                        <p className="text-sm text-center text-muted-foreground">
                          Connect with licensed therapists, join supportive
                          communities, and access personalized mental wellness
                          resources - all in one place.
                        </p>
                      </div>
                    </div>
                    <div className="mt-auto space-y-3">
                      <button className="bg-primary text-primary-foreground rounded-full px-6 py-2.5 text-sm font-semibold hover:bg-primary/90 transition-colors w-full">
                        Start Your Wellness Journey
                      </button>
                      <p className="text-xs text-center italic text-muted-foreground">
                        Take the first step towards better mental health today
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RootLayout;
