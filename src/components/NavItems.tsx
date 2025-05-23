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
import Computer from '@/icons/Computer';
import Exercise from '@/icons/Exercise';
import Welness from '@/icons/Welness';
import {
  Brain,
  Wind,
  Heart,
  Moon,
  Gamepad2,
  ClipboardCheck,
} from 'lucide-react';

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
    icon: <Messages />,
    text: 'Inbox',
    href: '/inbox',
  },
  {
    icon: <Computer />,
    text: 'Sessions',
    href: '/sessions',
  },
  {
    icon: <ClipboardCheck size={18} />,
    text: 'Assessments',
    href: '/assessments',
    subItems: [
      {
        icon: <Brain size={18} />,
        text: 'Mental Health',
        href: '/assessments/mental-health',
      },
      {
        icon: <Heart size={18} />,
        text: 'Emotional Wellbeing',
        href: '/assessments/emotional-wellbeing',
      },
      {
        icon: <Wind size={18} />,
        text: 'Stress Levels',
        href: '/assessments/stress',
      },
    ],
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
    icon: <Welness />,
    text: 'Activities',
    href: '/wellness',
    subItems: [
      {
        icon: <Wind size={18} />,
        text: 'Breathing Exercises',
        href: '/wellness/breathing',
      },
      {
        icon: <Moon size={18} />,
        text: 'Meditation',
        href: '/wellness/meditation',
      },
      {
        icon: <Brain size={18} />,
        text: 'Focus Games',
        href: '/wellness/focus-games',
      },
      {
        icon: <Heart size={18} />,
        text: 'Gratitude Journal',
        href: '/wellness/gratitude',
      },
    ],
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
    icon: <ClipboardCheck size={18} />,
    text: 'Assessments',
    href: '/assessments/manage',
    subItems: [
      {
        icon: <Brain size={18} />,
        text: 'Create Assessment',
        href: '/assessments/create',
      },
      {
        icon: <Heart size={18} />,
        text: 'Patient Reports',
        href: '/assessments/reports',
      },
    ],
  },
  {
    icon: <Welness />,
    text: 'Activities',
    href: '/wellness',
    subItems: [
      {
        icon: <Wind size={18} />,
        text: 'Breathing Exercises',
        href: '/wellness/breathing',
      },
      {
        icon: <Moon size={18} />,
        text: 'Meditation',
        href: '/wellness/meditation',
      },
      {
        icon: <Brain size={18} />,
        text: 'Focus Games',
        href: '/wellness/focus-games',
      },
      {
        icon: <Heart size={18} />,
        text: 'Gratitude Journal',
        href: '/wellness/gratitude',
      },
    ],
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
    icon: <Computer />,
    text: 'Sessions',
    href: '/sessions',
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

export const ADMIN_NAV_ITEMS = [
  {
    icon: <Dashboard />,
    text: 'Dashboard',
    href: '/dashboard/admin',
  },
  {
    icon: <ClipboardCheck size={18} />,
    text: 'Assessments',
    href: '/dashboard/admin/assessments',
    subItems: [
      {
        icon: <Brain size={18} />,
        text: 'Manage Templates',
        href: '/dashboard/admin/assessments/templates',
      },
      {
        icon: <Heart size={18} />,
        text: 'User Statistics',
        href: '/dashboard/admin/assessments/statistics',
      },
    ],
  },
  {
    icon: <Settings />,
    text: 'Settings',
    href: '/dashboard/admin/settings',
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
