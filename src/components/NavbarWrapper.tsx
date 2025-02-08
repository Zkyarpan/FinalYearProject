'use client';

import Navbar from '@/components/Navbar';
import { usePathname } from 'next/navigation';

const NavbarWrapper = () => {
  const pathname = usePathname();

  const hideNavbarPages = [
    '/dashboard',
    '/admin/dashboard',
    '/stories',
    '/appointments',
    '/psychologist/dashboard',
    '/blogs',
    '/psychologist',
    '/resources',
    '/services',
    '/articles',
    '/account',
    '/notifications',
    '/settings',
  ];

  const shouldHideNavbar = pathname => {
    return hideNavbarPages.some(page => {
      if (page.includes('*')) {
        const regex = new RegExp(`^${page.replace('*', '.*')}$`);
        return regex.test(pathname);
      }
      return pathname.startsWith(page);
    });
  };

  if (shouldHideNavbar(pathname)) {
    return null;
  }

  return <Navbar />;
};

export default NavbarWrapper;
