'use client';

import ServicesIcon from '@/icons/ServicesIcon';
import PsychologistIcon from '@/icons/Psychologist';
import ArticlesIcon from '@/icons/Atricles';
import ResourcesIcon from '@/icons/ResourceIcon';
import BlogIcon from '@/icons/BlogIcon';
import StoriesIcon from '@/icons/Stories';
import Dashboard from '@/icons/Dashboard';
import Users from '@/icons/Users';
import Settings from '@/icons/Settings';
import Calendar from '@/icons/Calendar';
import Messages from '@/icons/Messages';
import Availability from '@/icons/Availability';

export const USER_NAV_ITEMS = [
  {
    icon: <Dashboard />,
    text: 'Dashboard',
    href: '/dashboard',
  },
  {
    icon: <Calendar />,
    text: 'Appointments',
    href: '/appointments',
  },

  {
    icon: <StoriesIcon />,
    text: 'Stories',
    href: '/stories',
  },
  {
    icon: <Messages />,
    text: 'Inbox',
    href: '/inbox',
  },
  {
    icon: <ServicesIcon />,
    text: 'Services',
    href: '/services',
  },
  {
    icon: <PsychologistIcon />,
    text: 'Psychologist',
    href: '/psychologist',
  },

  {
    icon: <ArticlesIcon />,
    text: 'Articles',
    href: '/articles',
  },
  {
    icon: <ResourcesIcon />,
    text: 'Resources',
    href: '/resources',
  },
  {
    icon: <BlogIcon />,
    text: 'Blogs',
    href: '/blogs',
  },
];

export const PSYCHOLOGIST_NAV_ITEMS = [
  {
    icon: <Dashboard />,
    text: 'Dashboard',
    href: '/dashboard/psychologist',
  },
  {
    icon: <Users />,
    text: 'My Patients',
    href: '/psychologist/patients',
  },
  {
    icon: <Availability />,
    text: 'Availability',
    href: '/psychologist/availability',
  },
  {
    icon: <Calendar />,
    text: 'Appointments',
    href: '/psychologist/appointments',
  },
  {
    icon: <Messages />,
    text: 'Inbox',
    href: '/inbox',
  },
  {
    icon: <ArticlesIcon />,
    text: 'My Articles',
    href: '/psychologist/articles',
  },
  {
    icon: <BlogIcon />,
    text: 'My Blogs',
    href: '/psychologist/blog',
  },
];

export const ADMIN_NAV_ITEMS = [
  {
    icon: <Dashboard />,
    text: 'Dashboard',
    href: '/dashboard/admin',
  },
  {
    icon: <Users />,
    text: 'Users',
    href: '/admin/users',
  },
  {
    icon: <PsychologistIcon />,
    text: 'Psychologists',
    href: '/admin/psychologists',
  },
  {
    icon: <ArticlesIcon />,
    text: 'Articles',
    href: '/admin/articles',
  },
  {
    icon: <BlogIcon />,
    text: 'Blogs',
    href: '/admin/blogs',
  },
  {
    icon: <Settings />,
    text: 'Settings',
    href: '/admin/settings',
  },
];

export const getNavItemsByRole = (role: string) => {
  switch (role) {
    case 'psychologist':
      return PSYCHOLOGIST_NAV_ITEMS;
    case 'admin':
      return ADMIN_NAV_ITEMS;
    default:
      return USER_NAV_ITEMS;
  }
};

export default USER_NAV_ITEMS;
