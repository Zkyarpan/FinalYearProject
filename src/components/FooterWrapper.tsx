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
