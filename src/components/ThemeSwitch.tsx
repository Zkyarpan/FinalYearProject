'use client';

import { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import Sun from '@/icons/Sun';
import Moon from '@/icons/Moon';

export default function ThemeSwitch() {
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme, resolvedTheme } = useTheme();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <button
        aria-label="Toggle theme"
        className="w-8 h-8 invisible"
        disabled
      />
    );
  }

  return (
    <div role="button" tabIndex={0}>
      <button
        type="button"
        onClick={() => setTheme(resolvedTheme === 'light' ? 'dark' : 'light')}
        className="justify-center shrink-0 flex items-center font-semibold
        transition-all duration-200 ease-in-out select-none
        disabled:opacity-50 disabled:cursor-not-allowed
        gap-x-1 text-sm leading-5 rounded-xl
        h-8 w-8 p-4
        bg-gray-100 hover:bg-gray-200 
        border border-[hsl(var(--border))]
        active:bg-gray-300 active:scale-95
        dark:bg-input hover:dark:bg-[#505050]
        dark:active:bg-gray-600
        shadow-sm hover:shadow-md
        active:shadow-inner
        text-gray-700 dark:text-gray-200
        motion"
        aria-label="Toggle theme"
      >
        {resolvedTheme === 'light' ? <Moon /> : <Sun />}
      </button>
    </div>
  );
}
