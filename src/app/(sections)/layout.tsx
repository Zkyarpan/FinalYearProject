'use client';

import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useUserStore } from '@/store/userStore';
import { useState } from 'react';
import UserSidebar from '@/components/UserSidebar';
import UserActions from '@/components/UserActions';
import NavItem from '@/components/NavItem';
import LoginModal from '@/components/LoginModel';

import ServicesIcon from '@/icons/ServicesIcon';
import PsychologistIcon from '@/icons/Psychologist';
import ArticlesIcon from '@/icons/Atricles';
import ResourcesIcon from '@/icons/ResourceIcon';
import BlogIcon from '@/icons/BlogIcon';
import StoriesIcon from '@/icons/Stories';
import Account from '@/icons/Account';
import BlogRightSection from '@/components/BlogRightSection';
import PsychologistSection from '@/components/PsychologistSection';
import StoriesSection from '@/components/StoriesSection';
import ServicesSection from '@/components/ServicesSection';
import ArticlesSection from '@/components/ArticlesSection';
import ResourcesSection from '@/components/ResourcesSection';

const LEFT_SIDEBAR_WIDTH = 212;
const RIGHT_SIDEBAR_WIDTH = 420;

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
  '/notifications': 'Notifications',
};

const RootLayout = ({ children }) => {
  const pathname = usePathname();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const { isAuthenticated, profileImage } = useUserStore();
  const currentYear = new Date().getFullYear();

  const isAccountPage =
    pathname === '/account' || pathname === '/settings/profile';
  const pathParts = pathname.split('/').filter(Boolean);
  const isNestedRoute = pathParts.length > 1;
  const baseRoute = `/${pathParts[0]}`;
  const currentSection = pathParts[0];
  const title = routeTitles[baseRoute];

  const showRightSidebar =
    Object.keys(routeTitles).includes(pathname) ||
    pathname === '/dashboard' ||
    pathname === '/settings/profile' ||
    pathname === '/account';

  const handleNavigation = (path, requiresAuth = false) => {
    if (requiresAuth && !isAuthenticated) {
      localStorage.setItem('redirectAfterLogin', path);
      setShowLoginModal(true);
      return;
    }

    router.push(path);
  };

  const handleLogoClick = e => {
    e.preventDefault();
    if (isAuthenticated) {
      router.push('/dashboard');
    } else {
      router.push('/');
    }
  };

  const renderSidebarContent = () => {
    if (isAccountPage && isAuthenticated) {
      return <UserSidebar />;
    }

    const sections = {
      '/blogs': BlogRightSection,
      '/psychologists': PsychologistSection,
      '/stories': StoriesSection,
      '/services': ServicesSection,
      '/articles': ArticlesSection,
      '/resources': ResourcesSection,
    };

    const SectionComponent = sections[pathname];

    if (SectionComponent) {
      return (
        <SectionComponent
          isAuthenticated={isAuthenticated}
          isLoading={isLoading}
          handleNavigation={handleNavigation}
        />
      );
    }
  };

  return (
    <>
      <div className="flex min-h-screen bg-background text-foreground">
        <div
          className={`w-[${LEFT_SIDEBAR_WIDTH}px] border-r border-border fixed h-screen flex flex-col justify-between py-4 dark:border-[#333333] overflow-auto bg-background`}
        >
          <div className="flex flex-col h-full">
            <div className="px-4 -py-2 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
              <Link
                href={isAuthenticated ? '/dashboard' : '/'}
                onClick={handleLogoClick}
                className="flex items-center"
              >
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
                  onClick={e => {
                    e.preventDefault();
                    handleNavigation(item.href);
                  }}
                />
              ))}
              {isAuthenticated && (
                <NavItem
                  icon={<Account />}
                  text="Account"
                  href="/account"
                  isActive={pathname === '/account'}
                />
              )}
            </nav>
          </div>
          <div className="px-6">
            <p className="text-muted-foreground text-[10px]">
              © {currentYear} Mentality, Inc.
            </p>
          </div>
        </div>

        <div
          className={`flex-1 ml-[${LEFT_SIDEBAR_WIDTH}px] ${
            showRightSidebar ? `mr-[${RIGHT_SIDEBAR_WIDTH}px]` : 'mr-0'
          } h-screen flex flex-col`}
        >
          <div className="h-14 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 dark:border-[#333333] mt-2">
            <div className="h-full px-6 flex items-center justify-between">
              <div className="flex items-center gap-x-3">
                {isNestedRoute && currentSection === 'blogs' && (
                  <div className="flex items-center gap-x-2">
                    <button
                      onClick={() => router.push('/blogs')}
                      type="button"
                      className="mr-2 justify-center shrink-0 flex items-center font-semibold transition-all ease-in duration-75 whitespace-nowrap text-center select-none disabled:shadow-none disabled:opacity-50 disabled:cursor-not-allowed gap-x-1 active:shadow-none text-sm leading-5 rounded-xl py-1.5 h-8 w-8 text-gray-1k bg-gray-00 bg-gray-100 hover:bg-gray-200 border border-[hsl(var(--border))] dark:bg-input hover:dark:bg-[#505050] dark:disabled:bg-gray-00 dark:disabled:hover:bg-gray-00 shadow-5 hover:shadow-sm"
                    >
                      <svg
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M19.5833 12H5M5 12L12 5M5 12L12 19"
                          stroke="currentColor"
                          strokeWidth="1.46"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          vectorEffect="non-scaling-stroke"
                        />
                      </svg>
                    </button>
                    <span className="font-bold">Blogs</span>
                  </div>
                )}
                {!isNestedRoute && title && (
                  <h1 className="text-base font-semibold">{title}</h1>
                )}
              </div>
              {!showRightSidebar && (
                <UserActions
                  isAuthenticated={isAuthenticated}
                  profileImage={profileImage}
                  router={router}
                  onLoginClick={() => setShowLoginModal(true)}
                />
              )}
            </div>
          </div>

          <div className="flex-1 overflow-auto hide-scrollbar">
            <div className="p-6">{children}</div>
          </div>
        </div>

        {showRightSidebar && (
          <div
            className={`w-[${RIGHT_SIDEBAR_WIDTH}px] fixed right-0 top-0 h-screen border-l border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 dark:border-[#333333] flex flex-col`}
          >
            <div className="h-16 border-b dark:border-[#333333] flex items-center px-8 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-20">
              <UserActions
                isAuthenticated={isAuthenticated}
                profileImage={profileImage}
                router={router}
                onLoginClick={() => setShowLoginModal(true)}
              />
            </div>

            <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-700 scrollbar-track-transparent">
              <div className="p-8">{renderSidebarContent()}</div>
            </div>
          </div>
        )}
      </div>

      <LoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
      />
    </>
  );
};

export default RootLayout;
