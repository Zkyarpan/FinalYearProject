'use client';

import { useEffect, useState } from 'react';

const LoadingContent = ({ children }) => {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="relative w-full min-h-[calc(100vh-4rem)] bg-white dark:bg-[#171717] transition-colors duration-300">
      {isLoading ? (
        <div className="absolute inset-0 flex items-center justify-center z-50">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-2 border-blue-500 dark:border-blue-400 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-gray-600 dark:text-gray-300 animate-pulse">
              Loading
            </p>
          </div>
        </div>
      ) : (
        <div className="animate-fadeIn">{children}</div>
      )}
    </div>
  );
};

const style = document.createElement('style');
style.textContent = `
  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translateY(10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .animate-fadeIn {
    animation: fadeIn 0.4s ease-out forwards;
  }
`;
document.head.appendChild(style);

export default LoadingContent;
