'use client';

import { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';

export default function ThemeSwitch() {
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme, resolvedTheme } = useTheme();

  // Only show the component after mounting to avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  // Render a hidden button during SSR and initial client render
  if (!mounted) {
    return (
      <button
        aria-label="Toggle theme"
        className="w-8 h-8 invisible" // Hide but preserve space
        disabled
      />
    );
  }

  return (
    <div role="button" tabIndex={0}>
      <button
        type="button"
        onClick={() => setTheme(resolvedTheme === 'light' ? 'dark' : 'light')}
        className="justify-center shrink-0 flex items-center font-semibold border 
        transition-all ease-in duration-75 whitespace-nowrap text-center 
        select-none disabled:shadow-none disabled:opacity-50 
        disabled:cursor-not-allowed gap-x-1 active:shadow-none text-sm 
        leading-5 rounded-xl py-1.5 h-8 w-8 text-gray-1k bg-gray-00 
        border-gray-200 dark:border-gray-300 
        dark:disabled:bg-gray-00 
        shadow-5 hover:shadow-10"
        aria-label="Toggle theme"
      >
        {resolvedTheme === 'light' ? (
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M21.5 14.078A8.557 8.557 0 019.922 2.5 9.627 9.627 0 0012 21.5c4.558 0 8.376-3.168 9.373-7.422z"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        ) : (
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <circle cx="12" cy="12" r="5" fill="currentColor" />
            <path
              d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
        )}
      </button>
    </div>
  );
}
