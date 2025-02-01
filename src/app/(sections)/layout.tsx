'use client';

import React, { useState } from 'react';
import { Menu, ChevronDown } from 'lucide-react';

import BlogRightSection from '@/components/BlogRightSection';
import PsychologistSection from '@/components/PsychologistSection';
import StoriesSection from '@/components/StoriesSection';
import ServicesSection from '@/components/ServicesSection';
import ArticlesSection from '@/components/ArticlesSection';
import ResourcesSection from '@/components/ResourcesSection';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';

import { useUserStore } from '@/store/userStore';
import { usePathname, useRouter } from 'next/navigation';
import UserSidebar from '@/components/UserSidebar';
import Link from 'next/link';
import UserActions from '@/components/UserActions';
import Image from 'next/image';
import NavItem from '@/components/NavItem';
import LoginModal from '@/components/LoginModel';
import Account from '@/icons/Account';
import NAV_ITEMS from '@/components/Icons';

const routeTitles = {
  '/stories': 'Our Stories',
  '/services': 'Services',
  '/psychologists': 'Psychologists',
  '/articles': 'Articles',
  '/resources': 'Resources',
  '/blogs': 'Mentality Blogs',
  '/account': 'Your Account',
  '/notifications': 'Notifications',
};

const RootLayout = ({ children }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const { isAuthenticated, profileImage } = useUserStore();
  const currentYear = new Date().getFullYear();
  const pathname = usePathname();
  const router = useRouter();

  const isAccountPage =
    pathname === '/account' || pathname === '/settings/profile';
  const pathParts = pathname.split('/').filter(Boolean);
  const isNestedRoute = pathParts.length > 1;
  const baseRoute = `/${pathParts[0]}`;
  const currentSection = pathParts[0];
  const title = routeTitles[baseRoute];

  const showRightSidebar =
    Object.keys(routeTitles).includes(pathname) &&
    pathname !== '/resources' &&
    pathname !== '/articles' &&
    pathname !== '/services' &&
    pathname !== '/psychologists';

  const handleNavigation = (path, requiresAuth = false) => {
    if (requiresAuth && !isAuthenticated) {
      localStorage.setItem('redirectAfterLogin', path);
      setShowLoginModal(true);
      return;
    }
    router.push(path);
    setIsMobileMenuOpen(false);
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
        {/* Mobile Header - Fixed position with proper z-index */}
        <div className="lg:hidden fixed top-0 left-0 right-0 h-16 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-50">
          <div className="container mx-auto px-4 h-full">
            <div className="flex items-center justify-between h-full">
              <div className="flex items-center">
                <Sheet
                  open={isMobileMenuOpen}
                  onOpenChange={setIsMobileMenuOpen}
                >
                  <SheetTrigger asChild>
                    <Button variant="ghost" size="icon" className="lg:hidden">
                      <Menu className="h-5 w-5" />
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="left" className="w-[280px] sm:w-[350px]">
                    <SheetHeader>
                      <SheetTitle>
                        <div className="flex items-center gap-2">
                          <Image
                            alt="Mentality"
                            width={32}
                            height={32}
                            className="object-contain dark:bg-white rounded-full"
                            src="/Logo1.png?v=1"
                          />
                          <span className="text-xl logo-font">Mentality</span>
                        </div>
                      </SheetTitle>
                    </SheetHeader>
                    <nav className="mt-8">
                      {NAV_ITEMS.map(item => (
                        <button
                          key={item.text}
                          onClick={() => handleNavigation(item.href)}
                          className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                            pathname === item.href
                              ? 'dark:text-white font-medium'
                              : 'hover:transition-all lg:group-hover:translate-x-1'
                          }`}
                        >
                          {item.icon}
                          <span>{item.text}</span>
                        </button>
                      ))}
                      {isAuthenticated && (
                        <button
                          onClick={() => handleNavigation('/account')}
                          className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                            pathname === '/account'
                              ? 'dark:text-white font-medium'
                              : 'hover:transition-all lg:group-hover:translate-x-1'
                          }`}
                        >
                          <Account />
                          <span>Account</span>
                        </button>
                      )}
                    </nav>
                  </SheetContent>
                </Sheet>
                <Link
                  href={isAuthenticated ? '/dashboard' : '/'}
                  onClick={handleLogoClick}
                  className="flex items-center ml-2"
                >
                  <Image
                    alt="Mentality"
                    width={32}
                    height={32}
                    className="object-contain dark:bg-white rounded-full"
                    src="/Logo1.png?v=1"
                  />
                  <span className="ml-2 text-xl logo-font">Mentality</span>
                </Link>
              </div>
              <UserActions
                isAuthenticated={isAuthenticated}
                profileImage={profileImage}
                router={router}
                onLoginClick={() => setShowLoginModal(true)}
              />
            </div>
          </div>
        </div>

        {/* Desktop Sidebar - Fixed position */}
        <div className="hidden lg:flex w-[212px] border-r border-border fixed left-0 top-0 h-screen flex-col justify-between py-4 dark:border-[#333333] bg-background z-40">
          <div className="flex flex-col h-full">
            <div className="px-4 py-2">
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
                  priority={true}
                />
                <span className="ml-2 text-2xl logo-font">Mentality</span>
              </Link>
            </div>
            <nav className="px-6 flex-1 mt-10">
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
                  onClick={e => {
                    e.preventDefault();
                    handleNavigation('/account');
                  }}
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

        {/* Main Content Area - Responsive margins and padding */}
        <div
          className={`flex-1 ${
            showRightSidebar ? 'lg:mr-[420px]' : ''
          } lg:ml-[212px] mt-16 lg:mt-0 flex flex-col min-h-screen relative`}
        >
          {/* Top Header Bar - Fixed position with proper border alignment */}
          <div className="hidden lg:block h-14 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 dark:border-[#333333] sticky top-0 z-30">
            <div className="h-full max-w-[1920px] mx-auto px-6 flex items-center justify-between">
              <div className="flex items-center gap-x-3">
                {isNestedRoute && currentSection === 'blogs' && (
                  <div className="flex items-center gap-x-2">
                    <Button
                      onClick={() => router.push('/blogs')}
                      variant="ghost"
                      size="icon"
                      className="mr-2"
                    >
                      <ChevronDown className="h-4 w-4 rotate-90" />
                    </Button>
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

          {/* Main Content - Scrollable area with max-width constraint */}
          <div className="flex-1 overflow-auto hide-scrollbar">
            <div className="max-w-[1920px] mx-auto px-4 lg:px-6 py-4 lg:py-6">
              {children}
            </div>
          </div>
        </div>

        {/* Right Sidebar - Fixed position with proper border and alignment */}
        {showRightSidebar && (
          <div className="hidden lg:flex w-[420px] fixed right-0 top-0 h-screen border-l border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 dark:border-[#333333] flex-col z-40">
            {/* Right Sidebar Header */}
            <div className="h-14 border-b border-border dark:border-[#333333] flex items-center px-8 sticky top-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
              <UserActions
                isAuthenticated={isAuthenticated}
                profileImage={profileImage}
                router={router}
                onLoginClick={() => setShowLoginModal(true)}
              />
            </div>
            {/* Right Sidebar Content */}
            <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-700 scrollbar-track-transparent">
              <div className="p-8">{renderSidebarContent()}</div>
            </div>
          </div>
        )}

        <LoginModal
          isOpen={showLoginModal}
          onClose={() => setShowLoginModal(false)}
        />
      </div>
    </>
  );
};

export default RootLayout;
