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

const NAV_ITEMS = [
  { icon: <StoriesIcon />, text: 'Stories', href: '/stories' },
  { icon: <ServicesIcon />, text: 'Services', href: '/services' },
  { icon: <PsychologistIcon />, text: 'Psychologist', href: '/psychologists' },
  { icon: <ArticlesIcon />, text: 'Articles', href: '/articles' },
  { icon: <ResourcesIcon />, text: 'Resources', href: '/resources' },
  { icon: <BlogIcon />, text: 'Blogs', href: '/blogs' },
];

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

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      {/* Left Sidebar */}
      <div className="w-[212px] border-r border-border fixed h-screen flex flex-col justify-between py-4 dark:border-[#333333]">
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
            {NAV_ITEMS.map(item => (
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

      {/* Main Content */}
      <div className="flex-1 ml-[212px] mr-[348px] h-screen flex flex-col">
        <div className="h-14 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 dark:border-[#333333]">
          <div className="h-full px-6 flex items-center justify-between">
            <h1 className="text-base font-semibold">
              {pathname === '/' ? 'Scroll' : pathname.slice(1)}
            </h1>
          </div>
        </div>

        <div className="flex-1 overflow-auto hide-scrollbar">
          <div className="p-6">{children}</div>
        </div>
      </div>

      {/* Right Sidebar */}
      <div className="w-[348px] fixed right-0 top-0 h-screen border-l border-border flex flex-col bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 dark:border-[#333333]">
        <div className="h-14 border-b border-border flex items-center px-10 dark:border-[#333333]">
          <div className="flex items-center justify-between gap-x-2 w-full">
            {!isAuthenticated ? (
              <>
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
              </>
            ) : (
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
            )}
            <ThemeSwitch />
          </div>
        </div>

        <div className="flex-1 p-6 overflow-y-auto">
          <div
            className="rounded-2xl border border-border p-6 h-full dark:border-[#333333]"
            style={{
              background:
                'linear-gradient(215deg, hsl(var(--primary) / 0.2) 0%, hsl(var(--background) / 0) 49.92%)',
            }}
          >
            <h2 className="text-2xl text-center mb-4 text-foreground">
              Not your typical content feed!
            </h2>
            <p className="text-sm text-center mb-2 text-muted-foreground">
              Are you building side projects, writing articles, designing UIs,
              reading books, hiring, or looking for a new job?
            </p>
            <p className="text-sm text-center mb-6 text-muted-foreground">
              Share it here to get valuable feedback, intros, and opportunities.
            </p>
            <div className="flex flex-col items-center gap-2">
              <button className="bg-primary text-primary-foreground rounded-full px-6 py-2.5 text-sm font-semibold hover:bg-ring transition-colors w-full">
                Create Profile
              </button>
              <p className="text-xs text-center italic text-muted-foreground">
                Claim your username before it's too late!
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RootLayout;
