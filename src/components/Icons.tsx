'use client';

import ServicesIcon from '@/icons/ServicesIcon';
import PsychologistIcon from '@/icons/Psychologist';
import ArticlesIcon from '@/icons/Atricles';
import ResourcesIcon from '@/icons/ResourceIcon';
import BlogIcon from '@/icons/BlogIcon';
import StoriesIcon from '@/icons/Stories';

const NAV_ITEMS = [
  {
    icon: <StoriesIcon />,
    text: 'Stories',
    href: '/stories',
  },
  {
    icon: <ServicesIcon />,
    text: 'Services',
    href: '/services',
  },
  {
    icon: <PsychologistIcon />,
    text: 'Psychologist',
    href: '/psychologists',
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
  { icon: <BlogIcon />, text: 'Blogs', href: '/blogs' },
];

export default NAV_ITEMS;