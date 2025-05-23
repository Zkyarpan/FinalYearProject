'use client';

import Footer from '@/components/Footer';
import { usePathname } from 'next/navigation';

const FooterWrapper = () => {
  const pathname = usePathname();

  const hideFooterPages = [
    '/login',
    '/signup',
    '/psychologist',
    '/verify',
    '/dashboard',
    '/appointments',
    '/psychologist/dashboard',
    '/admin/dashboard',
    '/forgot-password',
    '/forgot-password/confirmation',
    '/stories',
    '/blogs',
    '/psychologists',
    '/resources',
    '/services',
    '/articles',
    '/user',
    '/account',
    '/notifications',
    '/settings',
    '/inbox',
    '/sessions',
    '/exercises',
    '/breathing',
    '/wellness',
    '/assessments',
  ];

  const shouldHideFooter = pathname => {
    return hideFooterPages.some(page => {
      if (page.includes('*')) {
        const regex = new RegExp(`^${page.replace('*', '.*')}$`);
        return regex.test(pathname);
      }
      return pathname.startsWith(page);
    });
  };

  if (shouldHideFooter(pathname)) {
    return null;
  }

  return <Footer />;
};

export default FooterWrapper;
