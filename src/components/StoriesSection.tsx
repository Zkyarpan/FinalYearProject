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

function HomePage() {
  const [menuOpen, setMenuOpen] = useState(false);
  const currentYear = new Date().getFullYear();
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
      id: 2,
      title: 'How to use search engine optimization to drive sales',
      href: '#',
      description:
        'Optio sit exercitation et ex ullamco aliquid explicabo. Dolore do ut officia anim non ad eu.',
      date: 'Mar 10, 2020',
      category: 'Sales',
      author: {
        name: 'Lindsay Walton',
        role: 'Front-end Developer',
      },
    },
    {
      id: 3,
      title: 'Improve your customer experience',
      href: '#',
      description:
        'Dolore commodo in nulla do nulla esse consectetur. Adipisicing voluptate velit sint adipisicing ex duis elit deserunt sint ipsum.',
      date: 'Feb 12, 2020',
      category: 'Business',
      author: {
        name: 'Tom Cook',
        role: 'Director of Product',
      },
    },
  ];

  return (
    <div className="flex min-h-screen bg-[hsl(var(--background))] text-[hsl(var(--foreground))]">
      {/* Left Sidebar */}
      <div className="w-[212px] border-r border-[hsl(var(--border))] fixed h-screen flex flex-col justify-between py-4">
        <div className="flex flex-col h-full overflow-y-auto">
          <div className="px-4 -py-2">
            <Link href="/" className="flex items-center">
              <Image
                alt="Mentality"
                width={40}
                height={30}
                className="object-contain"
                src="/logo1.png?v=1"
                priority
              />
              <span className="ml-2 text-2xl font-extrabold logo-font">
                Mentality
              </span>
            </Link>
          </div>
          <nav className="px-6 flex-1 mt-10">
            <NavItem icon={<ServicesIcon />} text="Services" active />
            <NavItem icon={<PsychologistIcon />} text="Psychologist" />
            <NavItem icon={<ArticlesIcon />} text="Articles" />
            <NavItem icon={<ResourcesIcon />} text="Resources" />
            <NavItem icon={<BlogIcon />} text="Blog" />
          </nav>
        </div>
        <div className="px-6">
          <p className="text-[hsl(var(--muted-foreground))] text-[10px]">
            © {currentYear} Mentality, Inc.
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 ml-[212px] mr-[348px]">
        {/* Fixed Header */}
        <div className="h-14 border-b border-[hsl(var(--border))] fixed top-0 left-[212px] right-[348px] bg-[hsl(var(--background))] z-50">
          <div className="h-full px-6 flex items-center justify-between">
            <h1 className="text-base font-semibold">Scroll</h1>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="pt-14 h-[calc(100vh-3.5rem)] overflow-y-auto hide-scrollbar">
          <div className="p-6">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-2">
              {posts.map(post => (
                <article
                  key={post.id}
                  className="flex flex-col bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-xl overflow-hidden"
                >
                  <div className="p-6">
                    <div className="flex items-center gap-x-4 text-xs">
                      <time
                        dateTime={post.date}
                        className="text-[hsl(var(--muted-foreground))]"
                      >
                        {post.date}
                      </time>
                      <Link
                        href={post.href}
                        className="relative z-10 rounded-full bg-[hsl(var(--secondary))] px-3 py-1.5 font-medium text-[hsl(var(--secondary-foreground))] hover:bg-[hsl(var(--accent))]"
                      >
                        {post.category}
                      </Link>
                    </div>
                    <div className="group relative">
                      <h3 className="mt-3 text-lg font-semibold text-[hsl(var(--foreground))] group-hover:text-[hsl(var(--primary))]">
                        <Link href={post.href}>
                          <span className="absolute inset-0" />
                          {post.title}
                        </Link>
                      </h3>
                      <p className="mt-5 line-clamp-3 text-sm leading-6 text-[hsl(var(--muted-foreground))]">
                        {post.description}
                      </p>
                    </div>
                    <div className="relative mt-8 flex items-center gap-x-4">
                      <div className="h-10 w-10 rounded-full bg-[hsl(var(--secondary))]" />
                      <div className="text-sm leading-6">
                        <p className="font-semibold text-[hsl(var(--foreground))]">
                          <Link href={post.href}>
                            <span className="absolute inset-0" />
                            {post.author.name}
                          </Link>
                        </p>
                        <p className="text-[hsl(var(--muted-foreground))]">
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
      <div className="w-[348px] fixed right-0 top-0 h-screen border-l border-[hsl(var(--border))] flex flex-col">
        {/* Top section with buttons */}
        <div className="m-5">
          <div className="flex items-center justify-between gap-x-2">
            <Link
              href="/login"
              className="font-semibold text-sm py-2 px-6 rounded-full border border-[hsl(var(--border))] hover:bg-[hsl(var(--accent))] transition-colors"
            >
              Log in
            </Link>
            <Link
              href="/signup"
              className="font-semibold text-sm py-2 px-6 rounded-full bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] hover:bg-[hsl(var(--ring))] transition-colors"
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
        <div className="flex-1 p-6">
          <div
            className="rounded-2xl border border-[hsl(var(--border))] p-6 h-full"
            style={{
              background:
                'linear-gradient(215deg, hsl(var(--primary) / 0.2) 0%, hsl(var(--background) / 0) 49.92%)',
            }}
          >
            <h2 className="text-2xl text-center mb-4 text-[hsl(var(--foreground))]">
              Not your typical content feed!
            </h2>
            <p className="text-sm text-center mb-2 text-[hsl(var(--muted-foreground))]">
              Are you building side projects, writing articles, designing UIs,
              reading books, hiring, or looking for a new job?
            </p>
            <p className="text-sm text-center mb-6 text-[hsl(var(--muted-foreground))]">
              Share it here to get valuable feedback, intros, and opportunities.
            </p>
            <div className="flex flex-col items-center gap-2">
              <button className="bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] rounded-full px-6 py-2.5 text-sm font-semibold hover:bg-[hsl(var(--ring))] transition-colors w-full">
                Create Profile
              </button>
              <p className="text-xs text-center italic text-[hsl(var(--muted-foreground))]">
                Claim your username before it's too late!
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function NavItem({ icon, text, active = false }) {
  return (
    <a
      className={`flex items-center py-2.5 group ${
        active
          ? 'text-[hsl(var(--primary))]'
          : 'text-[hsl(var(--muted-foreground))]'
      }`}
      href="#"
    >
      <span className="shrink-0">{icon}</span>
      <span className="ml-2 font-semibold transition-transform group-hover:translate-x-1">
        {text}
      </span>
    </a>
  );
}

export default HomePage;
