'use client';

import ServicesIcon from '@/icons/ServicesIcon';
import PsychologistIcon from '@/icons/Psychologist';
import ArticlesIcon from '@/icons/Atricles';
import ResourcesIcon from '@/icons/ResourceIcon';
import BlogIcon from '@/icons/BlogIcon';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import Link from 'next/link';
import ThemeSwitch from '@/components/ThemeSwitch';
import { useState } from 'react';
import { usePathname } from 'next/navigation';

const NavItem = ({ icon, text, isActive, href }) => {
  return (
    <Link
      href={href}
      className={`flex items-center gap-x-3 px-3 py-2 text-sm rounded-lg transition-colors ${
        isActive
          ? 'bg-secondary text-secondary-foreground'
          : 'hover:bg-secondary/80 hover:text-secondary-foreground'
      }`}
    >
      {icon}
      <span>{text}</span>
    </Link>
  );
};

function HomePage() {
  const [menuOpen, setMenuOpen] = useState(false);
  const currentYear = new Date().getFullYear();
  const pathname = usePathname();

  const navItems = [
    { icon: <ServicesIcon />, text: 'Services', href: '/services' },
    { icon: <PsychologistIcon />, text: 'Psychologist', href: '/psychologist' },
    { icon: <ArticlesIcon />, text: 'Articles', href: '/articles' },
    { icon: <ResourcesIcon />, text: 'Resources', href: '/resources' },
    { icon: <BlogIcon />, text: 'Blog', href: '/blog' },
  ];

  const posts = [
    {
      id: 1,
      title: 'Boost your conversion rate',
      href: '#',
      description:
        'Illo sint voluptas. Error voluptates culpa eligendi. Hic vel totam vitae illo. Non aliquid explicabo necessitatibus unde.',
      date: 'Mar 16, 2020',
      category: 'Marketing',
      author: {
        name: 'Michael Foster',
        role: 'Co-Founder / CTO',
      },
    },
    {
      id: 3,
      title: 'Boost your conversion rate',
      href: '#',
      description:
        'Illo sint voluptas. Error voluptates culpa eligendi. Hic vel totam vitae illo. Non aliquid explicabo necessitatibus unde.',
      date: 'Mar 16, 2020',
      category: 'Marketing',
      author: {
        name: 'Michael Foster',
        role: 'Co-Founder / CTO',
      },
    },
    {
      id: 2,
      title: 'Boost your conversion rate',
      href: '#',
      description:
        'Illo sint voluptas. Error voluptates culpa eligendi. Hic vel totam vitae illo. Non aliquid explicabo necessitatibus unde.',
      date: 'Mar 16, 2020',
      category: 'Marketing',
      author: {
        name: 'Michael Foster',
        role: 'Co-Founder / CTO',
      },
    },
  ];

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      {/* Left Sidebar */}
      <div className="w-[212px] border-r border-border fixed h-screen flex flex-col justify-between py-4 dark:border-[#333333]">
        <div className="flex flex-col h-full">
          <div className="px-4 -py-2 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <Link href="/" className="flex items-center">
              <Image
                alt="Mentality"
                width={40}
                height={30}
                className="object-contain dark:bg-white rounded-full"
                src="/logo1.png?v=1"
                priority
              />
              <span className="ml-2 text-2xl font-extrabold logo-font">
                Mentality
              </span>
            </Link>
          </div>
          <nav className="px-6 flex-1 mt-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            {navItems.map(item => (
              <NavItem
                key={item.text}
                icon={item.icon}
                text={item.text}
                href={item.href}
                isActive={pathname === item.href}
              />
            ))}
          </nav>
        </div>
        <div className="px-6">
          <p className="text-muted-foreground text-[10px]">
            © {currentYear} Mentality, Inc.
          </p>
        </div>
      </div>

      {/* Rest of your component remains the same */}
      {/* Main Content */}
      <div className="flex-1 ml-[212px] mr-[348px] h-screen flex flex-col">
        {/* Fixed Header */}
        <div className="h-14 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 dark:border-[#333333]">
          <div className="h-full px-6 flex items-center justify-between">
            <h1 className="text-base font-semibold">Scroll</h1>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-auto hide-scrollbar">
          <div className="p-6">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-2">
              {posts.map(post => (
                <article
                  key={post.id}
                  className="flex flex-col bg-card border border-border rounded-xl overflow-hidden dark:border-[#333333]"
                >
                  <div className="p-6">
                    <div className="flex items-center gap-x-4 text-xs">
                      <time
                        dateTime={post.date}
                        className="text-muted-foreground"
                      >
                        {post.date}
                      </time>
                      <Link
                        href={post.href}
                        className="relative rounded-full bg-secondary px-3 py-1.5 font-medium text-secondary-foreground hover:bg-accent"
                      >
                        {post.category}
                      </Link>
                    </div>
                    <div className="group relative">
                      <h3 className="mt-3 text-lg font-semibold text-foreground group-hover:text-primary">
                        <Link href={post.href}>
                          <span className="absolute inset-0" />
                          {post.title}
                        </Link>
                      </h3>
                      <p className="mt-5 line-clamp-3 text-sm leading-6 text-muted-foreground">
                        {post.description}
                      </p>
                    </div>
                    <div className="relative mt-8 flex items-center gap-x-4">
                      <div className="h-10 w-10 rounded-full bg-secondary" />
                      <div className="text-sm leading-6">
                        <p className="font-semibold text-foreground">
                          <Link href={post.href}>
                            <span className="absolute inset-0" />
                            {post.author.name}
                          </Link>
                        </p>
                        <p className="text-muted-foreground">
                          {post.author.role}
                        </p>
                      </div>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Right Sidebar */}
      <div className="w-[348px] fixed right-0 top-0 h-screen border-l border-border flex flex-col bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 dark:border-[#333333]">
        {/* Top section with buttons */}
        <div className="h-14 border-b border-border flex items-center px-10 dark:border-[#333333]">
          <div className="flex items-center justify-between gap-x-2 w-full">
            <Link
              href="/login"
              className="font-semibold text-sm py-1.5 px-4 rounded-xl border border-[hsl(var(--border))] hover:shadow-md dark:bg-[#404040] dark:border-[#525252] hover:dark:bg-[#505050]"
            >
              Log in
            </Link>
            <Link
              href="/signup"
              className="font-semibold text-sm py-1.5 px-4 rounded-xl bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] hover:bg-[hsl(var(--ring))] hover:shadow-md  hover:dark:bg-[#0072ce]"
            >
              Create Profile
            </Link>
            <ThemeSwitch />
            <Button
              type="button"
              className="p-1 rounded-full block sm:hidden"
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label="Toggle Menu"
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M3 5H21M3 12H21M3 19H21"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </Button>
          </div>
        </div>

        {/* Content section */}
        <div className="flex-1 p-6 overflow-y-auto">
          <div
            className="rounded-2xl border border-border p-6 h-full dark:border-[#333333]"
            style={{
              background:
                'linear-gradient(215deg, hsl(var(--primary) / 0.2) 0%, hsl(var(--background) / 0) 49.92%)',
            }}
          >
            <h2 className="text-2xl text-center mb-4 text-foreground">
              Not your typical content feed!
            </h2>
            <p className="text-sm text-center mb-2 text-muted-foreground">
              Are you building side projects, writing articles, designing UIs,
              reading books, hiring, or looking for a new job?
            </p>
            <p className="text-sm text-center mb-6 text-muted-foreground">
              Share it here to get valuable feedback, intros, and opportunities.
            </p>
            <div className="flex flex-col items-center gap-2">
              <button className="bg-primary text-primary-foreground rounded-full px-6 py-2.5 text-sm font-semibold hover:bg-ring transition-colors w-full">
                Create Profile
              </button>
              <p className="text-xs text-center italic text-muted-foreground">
                Claim your username before it's too late!
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default HomePage;
