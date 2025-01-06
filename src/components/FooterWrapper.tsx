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
    '/forgot-password/confirmation'

  ];

  if (hideFooterPages.includes(pathname)) {
    return null;
  }

  return <Footer />;
};

export default FooterWrapper;
