"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { Button } from "./ui/button";
import ThemeSwitch from "./ThemeSwitch";

const Navbar = () => {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="w-full mx-auto flex flex-col relative">
      <div className="fixed top-0 left-0 w-full h-14 z-10 backdrop-blur-md bg-[hsl(var(--background)/0.8)] text-[hsl(var(--foreground))]">
        <nav className="flex items-center justify-center max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 h-full">
          {/* Logo */}
          <Link href="/" className="flex items-center">
            <Image
              alt="Mentality"
              width={40}
              height={30}
              className="object-contain"
              src="/logo1.png?v=1"
              priority /* Ensures immediate image loading */
            />
            <span className="ml-2 text-2xl font-extrabold logo-font">
              Mentality
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden sm:flex items-center">
            <Link
              href="/stories"
              className="font-medium text-sm py-1.5 px-6 hover:underline"
            >
              Stories
            </Link>
            <Link
              href="/resources"
              className="font-medium text-sm py-1.5 px-3 hover:underline"
            >
              Resources
            </Link>
            <Link
              href="/services"
              className="font-medium text-sm py-1.5 px-5 hover:underline"
            >
              Services
            </Link>
          </div>

          {/* Mobile Menu */}
          {menuOpen && (
            <div className="absolute top-14 left-0 w-full shadow-xl bg-[hsl(var(--card))] sm:hidden">
              <div className="flex flex-col mt-4">
                <Link
                  href="/stories"
                  className="px-4 py-2 font-medium text-[hsl(var(--foreground))]"
                  onClick={() => setMenuOpen(false)} // Close menu on click
                >
                  Stories
                </Link>
                <Link
                  href="/resources"
                  className="px-4 py-2 font-medium text-[hsl(var(--foreground))]"
                  onClick={() => setMenuOpen(false)}
                >
                  Resources
                </Link>
                <Link
                  href="/services"
                  className="px-4 py-2 font-medium text-[hsl(var(--foreground))]"
                  onClick={() => setMenuOpen(false)}
                >
                  Services
                </Link>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-x-4">
            <Link
              href="/login"
              className="font-semibold text-sm py-1.5 px-4 rounded-xl border border-[hsl(var(--border))] hover:shadow-md"
            >
              Log in
            </Link>
            <Link
              href="/signup"
              className="font-semibold text-sm py-1.5 px-4 rounded-xl bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] hover:bg-[hsl(var(--ring))] hover:shadow-md transition-all"
            >
              Create Profile
            </Link>
            <ThemeSwitch />
          </div>

          {/* Hamburger Menu Button */}
          <Button
            type="button"
            className="p-1 rounded block sm:hidden"
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
        </nav>
      </div>
    </div>
  );
};

export default Navbar;
