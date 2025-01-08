'use client';

import Navbar from '@/components/Navbar';
import { usePathname } from 'next/navigation';

const NavbarWrapper = () => {
  const pathname = usePathname();

  const hideFooterPages = [
    '/dashboard',
    '/admin/dashboard',
    '/stories',
    '/psychologist/dashboard',
  ];

  if (hideFooterPages.includes(pathname)) {
    return null;
  }

  return <Navbar />;
};

export default NavbarWrapper;
