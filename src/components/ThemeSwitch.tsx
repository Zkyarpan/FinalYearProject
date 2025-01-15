'use client';

import { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import Sun from '@/icons/Sun';
import Moon from '@/icons/Moon';

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
        select-none  disabled:opacity-50 
        disabled:cursor-not-allowed gap-x-1 active:shadow-none text-sm 
        leading-5 rounded-xl py-1.5 h-8 w-8 text-gray-1k bg-gray-00 
        border-gray-200 dark:border-gray-300 
        dark:disabled:bg-gray-00 
        shadow-5 hover:shadow-10"
        aria-label="Toggle theme"
      >
        {resolvedTheme === 'light' ? <Moon /> : <Sun />}
      </button>
    </div>
  );
}
