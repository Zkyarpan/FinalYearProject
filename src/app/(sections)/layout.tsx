'use client';

import { useState } from 'react';
import { Menu, ArrowRightIcon } from 'lucide-react';
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
import { getNavItemsByRole, USER_NAV_ITEMS } from '@/components/NavItems';
import AccountSection from '@/components/AccountSection';

const routeTitles = {
  // User routes
  '/stories': 'Our Stories',
  '/services': 'Services',
  '/psychologist': 'Psychologists',
  '/psychologists': 'Psychologists',
  '/articles': 'Articles',
  '/resources': 'Resources',
  '/blogs': 'Blogs',
  '/account': 'Your Account',
  '/notifications': 'Notifications',
  '/dashboard': 'Dashboard',
  // Psychologist routes
  '/dashboard/psychologist': 'Dashboard',
  '/psychologists/patients': 'My Patients',
  '/psychologists/appointments': 'Appointments',
  '/psychologists/messages': 'Messages',
  '/psychologists/articles': 'My Articles',
  '/psychologists/blog': 'My Blogs',
  // Admin routes
  '/dashboard/admin': 'Dashboard',
  '/admin/users': 'Users Management',
  '/admin/psychologists': 'Psychologists Management',
  '/admin/articles': 'Articles Management',
  '/admin/blogs': 'Blogs Management',
  '/admin/settings': 'System Settings',
};

const RootLayout = ({ children }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const { isAuthenticated, profileImage, role, firstName, lastName, logout } =
    useUserStore();
  const currentYear = new Date().getFullYear();
  const pathname = usePathname();
  const router = useRouter();

  const NAV_ITEMS =
    isAuthenticated && role
      ? getNavItemsByRole(role)
      : USER_NAV_ITEMS.filter(item => !item.href.includes('dashboard'));

  const isAccountPage =
    pathname === '/account' ||
    pathname === '/psychologist/account' ||
    pathname === '/admin/account' ||
    pathname === '/settings/profile';

  const isDashboardPage =
    pathname === '/dashboard' ||
    pathname === '/dashboard/psychologist' ||
    pathname === '/dashboard/admin';

  const pathParts = pathname.split('/').filter(Boolean);
  const baseRoute = `/${pathParts[0]}`;
  const title = routeTitles[pathname] || routeTitles[baseRoute];

  const isNestedBlogRoute =
    pathname.startsWith('/blogs/') && pathname !== '/blogs';
  const isNestedPsychologistRoute =
    pathname.startsWith('/psychologists/') && pathname !== '/psychologists';

  const showRightSidebar =
    ((!isAuthenticated && pathname !== '/dashboard') ||
      (isAuthenticated && !isDashboardPage && role === 'user')) &&
    (pathname === '/stories' ||
      pathname === '/blogs' ||
      pathname === '/psychologists' ||
      pathname === '/' ||
      isAccountPage);

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
      const dashboardPath =
        role === 'psychologist'
          ? '/dashboard/psychologist'
          : role === 'admin'
            ? '/dashboard/admin'
            : '/dashboard';
      router.push(dashboardPath);
    } else {
      router.push('/');
    }
  };

  const handleBackNavigation = () => {
    if (isNestedBlogRoute) {
      router.push('/blogs');
    } else if (isNestedPsychologistRoute) {
      router.push('/psychologists');
    }
  };

  const renderSidebarContent = () => {
    if (isAccountPage && isAuthenticated) {
      return <UserSidebar />;
    }

    if (isDashboardPage && isAuthenticated) {
      return null;
    }

    const sections = {
      '/blogs': BlogRightSection,
      '/psychologists': PsychologistSection,
      '/stories': StoriesSection,
      '/services': ServicesSection,
      '/articles': ArticlesSection,
      '/resources': ResourcesSection,
      '/': StoriesSection,
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

    return null;
  };

  return (
    <>
      <div className="flex min-h-screen bg-background text-foreground">
        {/* Mobile Header */}
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
                      <AccountSection
                        firstName={firstName || 'Anonymous'}
                        profileImage={profileImage || '/default-avatar.jpg'}
                        onNavigate={handleNavigation}
                      />
                    </nav>
                  </SheetContent>
                </Sheet>
                <Link
                  href={isAuthenticated ? `/dashboard/${role!}` : '/'}
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
                role={role}
                firstName={firstName || ''}
                lastName={lastName}
                router={router}
                logout={logout}
              />
            </div>
          </div>
        </div>

        {/* Desktop Sidebar */}
        <div className="hidden lg:flex w-[212px] border-r border-border fixed left-0 top-0 h-screen flex-col justify-between py-4 dark:border-[#333333] bg-background z-40">
          <div className="flex flex-col h-full">
            <div className="px-4 py-2">
              <Link
                href={isAuthenticated ? `/dashboard/${role!}` : '/'}
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
                <div className="mt-4">
                  <AccountSection
                    firstName={firstName || 'Anonymous'}
                    profileImage={profileImage || '/default-avatar.jpg'}
                    onNavigate={handleNavigation}
                  />
                </div>
              )}
            </nav>
          </div>
          <div className="px-6">
            <p className="text-muted-foreground text-[10px]">
              © {currentYear} Mentality, Inc.
            </p>
          </div>
        </div>

        {/* Main Content Area */}
        <div
          className={`flex-1 ${
            showRightSidebar ? 'lg:mr-[420px]' : ''
          } lg:ml-[212px] mt-16 lg:mt-0 flex flex-col min-h-screen relative`}
        >
          <div className="hidden lg:block h-14 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 dark:border-[#333333] sticky top-0 z-[100]">
            <div className="h-full max-w-[1920px] mx-auto px-6 flex items-center justify-between relative">
              <div className="flex items-center gap-x-3">
                {(isNestedBlogRoute || isNestedPsychologistRoute) && (
                  <div className="flex items-center gap-x-2">
                    <button
                      type="button"
                      onClick={handleBackNavigation}
                      className="mr-2 justify-center shrink-0 flex items-center font-semibold border transition-all ease-in duration-75 whitespace-nowrap text-center select-none disabled:shadow-none disabled:opacity-50 disabled:cursor-not-allowed gap-x-1 active:shadow-none text-sm leading-5 rounded-xl py-1.5 h-8 w-8 text-gray-900 bg-gray-100 border-gray-200 dark:bg-input dark:border-[hsl(var(--border))] hover:dark:bg-[#505050] dark:disabled:bg-gray-800 dark:disabled:hover:bg-gray-800 shadow-sm hover:shadow-md"
                    >
                      <ArrowRightIcon className="h-4 w-4 rotate-180 dark:text-white" />
                    </button>
                  </div>
                )}
                {title && <h1 className="text-base font-semibold">{title}</h1>}
              </div>
              {!showRightSidebar && (
                <div className="relative z-[101]">
                  <UserActions
                    isAuthenticated={isAuthenticated}
                    profileImage={profileImage}
                    role={role}
                    firstName={firstName}
                    lastName={lastName}
                    router={router}
                    onLoginClick={() => setShowLoginModal(true)}
                    logout={logout}
                  />
                </div>
              )}
            </div>
          </div>

          <div className="flex-1 overflow-auto hide-scrollbar">
            <div className="max-w-[1920px] mx-auto px-4 lg:px-6 py-4 lg:py-6">
              {children}
            </div>
          </div>
        </div>

        {/* Right Sidebar */}
        {showRightSidebar && (
          <div className="hidden lg:flex w-[420px] fixed right-0 top-0 h-screen border-l border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 dark:border-[#333333] flex-col z-40">
            <div className="h-14 border-b border-border dark:border-[#333333] flex items-center px-8 sticky top-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
              <UserActions
                isAuthenticated={isAuthenticated}
                profileImage={profileImage}
                role={role}
                firstName={firstName}
                lastName={lastName}
                router={router}
                onLoginClick={() => setShowLoginModal(true)}
                logout={logout}
              />
            </div>
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
