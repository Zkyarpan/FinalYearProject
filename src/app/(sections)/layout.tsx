'use client';

import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useUserStore } from '@/store/userStore';
import UserSidebar from '@/components/UserSidebar';

import ServicesIcon from '@/icons/ServicesIcon';
import PsychologistIcon from '@/icons/Psychologist';
import ArticlesIcon from '@/icons/Atricles';
import ResourcesIcon from '@/icons/ResourceIcon';
import BlogIcon from '@/icons/BlogIcon';
import StoriesIcon from '@/icons/Stories';
import Account from '@/icons/Account';
import UserActions from '@/components/UserActions';
import NavItem from '@/components/NavItem';

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
  const { isAuthenticated, profileImage } = useUserStore();
  const currentYear = new Date().getFullYear();
  const isAccountPage = pathname === '/account' || '/settings/profile';
  const title = routeTitles[pathname];

  const showRightSidebar =
    Object.keys(routeTitles).includes(pathname) ||
    pathname === '/dashboard' ||
    pathname === '/settings/profile' ||
    (pathname === '/account' && isAuthenticated);

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      {/* Left Sidebar - Always visible */}
      <div className="w-[212px] border-r border-border fixed h-screen flex flex-col justify-between py-4 dark:border-[#333333] overflow-auto">
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
        className={`flex-1 ml-[212px] ${
          showRightSidebar ? 'mr-[348px]' : 'mr-0'
        } h-screen flex flex-col`}
      >
        <div className="h-14 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 dark:border-[#333333] mt-2">
          <div className="h-full px-6 flex items-center justify-between">
            <h1 className="text-base font-semibold">{title}</h1>
            {!showRightSidebar && (
              <UserActions
                isAuthenticated={isAuthenticated}
                profileImage={profileImage}
                router={router}
              />
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
          <div className="h-16 border-b dark:border-[#333333] flex items-center px-7 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-20">
            <UserActions
              isAuthenticated={isAuthenticated}
              profileImage={profileImage}
              router={router}
            />
          </div>

          <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-700 scrollbar-track-transparent">
            <div className="p-6">
              <div
                className={`${
                  !isAccountPage
                    ? 'rounded-2xl border border-border p-6 dark:border-[#333333] min-h-[calc(100vh-8rem)] bg-gradient-to-br from-primary/10 to-background'
                    : ''
                }`}
              >
                {pathname === '/account' || '/settings/profile' ? (
                  <UserSidebar />
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
