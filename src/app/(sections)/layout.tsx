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
import AdminActions from '@/components/AdminActions';
import Image from 'next/image';
import NavItem from '@/components/NavItem';
import LoginModal from '@/components/LoginModel';
import {
  getNavItemsByRole,
  USER_NAV_ITEMS,
  ADMIN_NAV_ITEMS,
} from '@/components/NavItems';
import AccountSection from '@/components/AccountSection';
import { DEFAULT_AVATAR } from '@/constants';
import FilterSection from '@/components/FilterSection';
import PsychologistProfileHighlights from '@/components/PsychologistProfileHighlights';
import Logout from '@/icons/Logout';

const routeTitles = {
  // User routes
  '/stories': 'Our Stories',
  '/services': 'Services',
  '/psychologist': 'Psychologists',
  '/articles': 'Articles',
  '/resources': 'Resources',
  '/blogs': 'Mentality Blogs',
  '/account': 'Your Account',
  '/notifications': 'Notifications',
  '/dashboard': 'Dashboard',
  '/appointments': 'Appointments',
  '/inbox': 'Inbox',
  '/sessions': 'Your Sessions',

  // Psychologist routes
  '/dashboard/psychologist': 'Dashboard',
  '/psychologist/patients': 'My Patients',
  '/psychologist/appointments': 'Your Appointments',
  '/psychologist/messages': 'Inbox',
  '/psychologist/articles': 'My Articles',
  '/psychologist/blog': 'My Blogs',
  '/psychologist/availability': 'My Availability',

  // Admin routes
  '/dashboard/admin': 'Dashboard',
  '/dashboard/admin/users': 'Users Management',
  '/dashboard/admin/psychologist': 'Psychologists Management',
  '/dashboard/admin/articles': 'Articles Management',
  '/dashboard/admin/blogs': 'Blogs Management',
  '/dashboard/admin/settings': 'System Settings',
  '/dashboard/admin/security': 'Security Settings',
  '/dashboard/admin/reports': 'Analytics & Reports',
};

const RootLayout = ({ children }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const {
    isAuthenticated,
    profileImage,
    role,
    firstName,
    lastName,
    email,
    logout,
  } = useUserStore();
  const pathname = usePathname();
  const router = useRouter();

  const isAdminRoute = pathname.startsWith('/dashboard/admin');
  const isAdminUser = role === 'admin';

  const NAV_ITEMS =
    isAuthenticated && role
      ? getNavItemsByRole(role)
      : USER_NAV_ITEMS.filter(
          item =>
            !item.href.includes('dashboard') &&
            !item.href.includes('appointments') &&
            !item.href.includes('inbox') &&
            !item.href.includes('sessions')
        );

  const isAccountPage =
    pathname === '/account' ||
    pathname === '/psychologist/account' ||
    pathname === '/admin/account' ||
    pathname === '/settings/profile';

  const isDashboardPage =
    pathname === '/dashboard' ||
    pathname === '/dashboard/psychologist' ||
    pathname === '/dashboard/admin';

  const EXCLUDED_NESTED_ROUTES = [
    '/psychologist/appointments',
    '/psychologist/articles',
    '/psychologist/blog',
    '/psychologist/messages',
    '/psychologist/patients',
    '/psychologist/resources',
    '/psychologist/services',
    '/psychologist/availability',
  ];

  const pathParts = pathname.split('/').filter(Boolean);
  const baseRoute = `/${pathParts[0]}`;
  const title = routeTitles[pathname] || routeTitles[baseRoute];

  const isNestedBlogRoute =
    pathname.startsWith('/blogs/') && pathname !== '/blogs';

  // Check for detail or edit pages
  const isNestedArticleRoute =
    pathname.startsWith('/articles/') &&
    pathname !== '/articles' &&
    !pathname.includes('/articles/create');

  const isNestedStoryRoute =
    pathname.startsWith('/stories/') &&
    pathname !== '/stories' &&
    !pathname.includes('/stories/create');

  // Check specifically for edit pages
  const isArticleEditPage = pathname.startsWith('/articles/edit/');
  const isStoryEditPage = pathname.startsWith('/stories/edit/');

  const isPsychologistProfileRoute = pathname => {
    const pathParts = pathname.split('/');
    return (
      pathParts.length === 3 &&
      pathParts[1] === 'psychologist' &&
      pathParts[2] !== ''
    );
  };

  const showBackButton =
    isNestedBlogRoute ||
    isNestedArticleRoute ||
    isNestedStoryRoute ||
    (pathname.startsWith('/psychologist/') &&
      pathname !== '/psychologist' &&
      !EXCLUDED_NESTED_ROUTES.some(route => pathname.startsWith(route)));

  const isNestedPsychologistRoute =
    pathname.startsWith('/psychologist/') &&
    pathname !== '/psychologist' &&
    isPsychologistProfileRoute(pathname);

  // Updated showRightSidebar condition to exclude admin routes
  const showRightSidebar =
    ((!isAuthenticated && pathname !== '/dashboard') ||
      (isAuthenticated && !isDashboardPage && role === 'user')) &&
    !isAdminRoute &&
    (pathname === '/stories' ||
      pathname === '/blogs' ||
      pathname === '/articles' ||
      pathname === '/psychologist' ||
      (pathname.startsWith('/psychologist/') &&
        !EXCLUDED_NESTED_ROUTES.some(route => pathname.startsWith(route))) ||
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
      router.push('/psychologist');
    } else if (
      isArticleEditPage ||
      (isNestedArticleRoute && !isArticleEditPage)
    ) {
      router.push('/articles');
    } else if (isStoryEditPage || (isNestedStoryRoute && !isStoryEditPage)) {
      router.push('/stories');
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
      '/psychologist': FilterSection,
      '/psychologist/:path*': FilterSection,
      '/stories': StoriesSection,
      '/services': ServicesSection,
      '/articles': ArticlesSection,
      '/resources': ResourcesSection,
      '/': StoriesSection,
    };

    let SectionComponent = sections[pathname];

    if (
      pathname.startsWith('/psychologist/') &&
      !EXCLUDED_NESTED_ROUTES.some(route => pathname.startsWith(route))
    ) {
      SectionComponent = PsychologistProfileHighlights;
    }

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

  // Special rendering for admin routes
  if (isAdminRoute && isAdminUser) {
    return (
      <div className="flex min-h-screen bg-background text-foreground">
        {/* Mobile Header for Admin */}
        <div className="lg:hidden fixed top-0 left-0 right-0 h-16 border-b border-border bg-background/95 backdrop-blur z-[10]">
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
                            alt="Mentality Admin"
                            width={32}
                            height={32}
                            className="object-contain dark:bg-white rounded-full"
                            src="/Logo1.png?v=1"
                          />
                          <span className="text-xl font-semibold">
                            Admin Panel
                          </span>
                        </div>
                      </SheetTitle>
                    </SheetHeader>
                    <nav className="mt-5 overflow-auto scroll-smooth">
                      {ADMIN_NAV_ITEMS.map(item => (
                        <button
                          key={item.text}
                          onClick={() => handleNavigation(item.href)}
                          className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                            pathname === item.href
                              ? 'bg-primary/10 text-primary font-medium'
                              : 'hover:bg-muted'
                          }`}
                        >
                          {item.icon}
                          <span>{item.text}</span>
                        </button>
                      ))}
                    </nav>
                  </SheetContent>
                </Sheet>
                <Link
                  href="/dashboard/admin"
                  className="flex items-center ml-2"
                >
                  <Image
                    alt="Mentality"
                    width={32}
                    height={32}
                    className="object-contain dark:bg-white rounded-full"
                    src="/Logo1.png?v=1"
                  />
                  <span className="ml-2 text-xl font-semibold">Admin</span>
                </Link>
              </div>

              <AdminActions
                email={email || 'admin@mentality.com'}
                logout={logout}
                router={router}
              />
            </div>
          </div>
        </div>

        {/* Desktop Sidebar for Admin */}
        <div className="hidden lg:flex w-[240px] border-r border-border fixed left-0 top-0 h-screen flex-col py-4 bg-background z-[10]">
          <div className="px-4 py-2 mb-4">
            <Link href="/dashboard/admin" className="flex items-center">
              <Image
                alt="Mentality"
                width={40}
                height={30}
                className="object-contain dark:bg-white rounded-full"
                src="/Logo1.png?v=1"
                priority={true}
              />
              <div className="ml-2 flex flex-col">
                <span className="text-lg font-semibold">Admin Panel</span>
                <span className="text-xs text-muted-foreground">
                  Mentality Platform
                </span>
              </div>
            </Link>
          </div>

          <div className="px-3 mb-6">
            <div className="relative">
              <input
                type="text"
                placeholder="Search..."
                className="w-full rounded-md bg-muted/50 border border-border py-2 pl-3 pr-4 text-sm outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>

          <nav className="px-3 flex-1 overflow-auto">
            <div className="text-xs font-semibold text-muted-foreground mb-2 px-2">
              MAIN NAVIGATION
            </div>
            {ADMIN_NAV_ITEMS.map(item => (
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
          </nav>

          <div className="mt-auto px-3 py-3 border-t border-border">
            <div className="flex items-center justify-between">
              <div className="text-sm">
                <div className="font-medium">Admin Account</div>
                <div className="text-xs text-muted-foreground truncate max-w-[180px]">
                  {email || 'admin@mentality.com'}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Area for Admin */}
        <div className="lg:ml-[240px] flex-1 flex flex-col min-h-screen">
          {/* Fixed Header */}
          <div className="hidden lg:flex h-14 border-b border-border bg-background/95 backdrop-blur fixed top-0 right-0 left-[240px] z-[10]">
            <div className="w-full px-6 flex items-center justify-between">
              <h1 className="text-xl font-semibold">{title}</h1>
              <AdminActions
                email={email || 'admin@mentality.com'}
                logout={logout}
                router={router}
              />
            </div>
          </div>

          <div className="flex-1 pt-16 lg:pt-14">
            <div className="max-w-full px-4 lg:px-6 py-4 lg:py-6">
              {children}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Original layout for non-admin routes
  return (
    <>
      <div className="flex min-h-screen bg-background text-foreground">
        {/* Mobile Header */}
        <div className="lg:hidden fixed top-0 left-0 right-0 h-16 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-[10]">
          <div className="container mx-auto px-4 h-full">
            <div className="flex items-center justify-between h-full">
              <div className="flex items-center">
                {showBackButton ? (
                  <button
                    type="button"
                    onClick={handleBackNavigation}
                    className="mr-2 justify-center shrink-0 flex items-center font-semibold border transition-all ease-in duration-75 whitespace-nowrap text-center select-none disabled:shadow-none disabled:opacity-50 disabled:cursor-not-allowed gap-x-1 active:shadow-none text-sm leading-5 rounded-full p-2 text-gray-900 bg-gray-100 border-gray-200 dark:bg-input dark:border-[hsl(var(--border))] hover:dark:bg-[#505050] dark:disabled:bg-gray-800 dark:disabled:hover:bg-gray-800 shadow-sm hover:shadow-md"
                  >
                    <ArrowRightIcon className="h-4 w-4 rotate-180 dark:text-white" />
                  </button>
                ) : (
                  <Sheet
                    open={isMobileMenuOpen}
                    onOpenChange={setIsMobileMenuOpen}
                  >
                    <SheetTrigger asChild>
                      <Button variant="ghost" size="icon" className="lg:hidden">
                        <Menu className="h-5 w-5" />
                      </Button>
                    </SheetTrigger>
                    <SheetContent
                      side="left"
                      className="w-[280px] sm:w-[350px]"
                    >
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
                      <nav className="mt-5 overflow-auto scroll-smooth">
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
                        {isAuthenticated && !isAdminUser && (
                          <AccountSection
                            firstName={firstName || 'Anonymous'}
                            profileImage={profileImage || '/default-avatar.jpg'}
                            role={role ?? undefined}
                          />
                        )}
                      </nav>
                    </SheetContent>
                  </Sheet>
                )}
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
        <div className="hidden lg:flex w-[212px] border-r border-border fixed left-0 top-0 h-screen flex-col justify-between py-4 dark:border-[#333333] bg-background z-[10]">
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
            <nav className="px-6 flex-1 mt-5 overflow-auto scroll-smooth">
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
              {isAuthenticated && !isAdminUser && (
                <div className="mt-4">
                  <AccountSection
                    firstName={firstName || 'User'}
                    profileImage={profileImage || DEFAULT_AVATAR}
                    role={role ?? undefined}
                  />
                </div>
              )}
            </nav>
          </div>
        </div>

        {/* Main Content Area */}
        <div
          className={`flex-1 ${
            showRightSidebar ? 'lg:mr-[420px]' : ''
          } lg:ml-[212px] flex flex-col min-h-screen relative`}
        >
          {/* Fixed Header */}
          <div
            className={`hidden lg:block h-14 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 dark:border-[#333333] fixed top-0 z-[10] 
    ${showRightSidebar ? 'w-[calc(100vw-632px)]' : 'w-[calc(100vw-212px)]'} 
    left-[212px]`}
          >
            <div className="h-full w-full flex justify-center">
              <div className="h-full w-full max-w-[1920px] px-4 lg:px-6 flex items-center justify-between">
                <div className="flex items-center gap-x-3">
                  {showBackButton && (
                    <div className="flex items-center gap-x-2">
                      <button
                        type="button"
                        onClick={handleBackNavigation}
                        className="mr-2 justify-center shrink-0 flex items-center font-semibold border transition-all ease-in duration-75 whitespace-nowrap text-center select-none disabled:shadow-none disabled:opacity-50 disabled:cursor-not-allowed gap-x-1 active:shadow-none text-sm leading-5 rounded-full p-2 text-gray-900 bg-gray-100 border-gray-200 dark:bg-input dark:border-[hsl(var(--border))] hover:dark:bg-[#505050] dark:disabled:bg-gray-800 dark:disabled:hover:bg-gray-800 shadow-sm hover:shadow-md"
                      >
                        <ArrowRightIcon className="h-4 w-4 rotate-180 dark:text-white" />
                      </button>
                    </div>
                  )}
                  {title && (
                    <h1 className="text-base font-semibold">{title}</h1>
                  )}
                </div>
                <div className="flex items-center gap-x-3">
                  {!showRightSidebar && (
                    <div className="relative z-[102]">
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
            </div>
          </div>

          <div className="flex-1 overflow-auto hide-scrollbar relative mt-10">
            <div className="max-w-[1920px] mx-auto px-4 lg:px-6 py-4 lg:py-6">
              {children}
            </div>
          </div>
        </div>

        {/* Right Sidebar */}
        {showRightSidebar && (
          <div className="hidden lg:flex w-[420px] fixed right-0 top-0 h-screen border-l border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 dark:border-[#333333] flex-col z-[50]">
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
