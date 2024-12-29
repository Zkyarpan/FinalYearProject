"use client";

import { useState, useEffect } from "react";

const SpinnerLoader = ({ children }: { children: React.ReactNode }) => {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 2000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="relative">
      <div
        className={`transition-all duration-700 ${
          loading ? "blur-sm opacity-50" : "blur-none opacity-100"
        }`}
      >
        {children}
      </div>

      {loading && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-white/80 dark:bg-black/80">
          <svg
            className="animate-spin"
            xmlns="http://www.w3.org/2000/svg"
            width="50"
            height="50"
            viewBox="0 0 34 34"
            fill="none"
          >
            <g id="Component 2">
              <circle
                id="Ellipse 717"
                cx="17.0007"
                cy="17.0001"
                r="14.2013"
                className="stroke-gray-300 dark:stroke-gray-600"
                strokeWidth="4"
                strokeDasharray="2 3"
              />
              <path
                id="Ellipse 715"
                d="M21.3573 30.5163C24.6694 29.4486 27.4741 27.2019 29.2391 24.2028C31.0041 21.2038 31.6065 17.661 30.9319 14.2471C30.2573 10.8332 28.3528 7.78584 25.5798 5.68345C22.8067 3.58105 19.3583 2.57 15.8891 2.84222"
                className="stroke-blue-500 dark:stroke-blue-300"
                strokeWidth="4"
              />
            </g>
          </svg>

          <span className="mt-3 text-black dark:text-white text-sm font-medium leading-snug">
            Loading...
          </span>
        </div>
      )}
    </div>
  );
};

export default SpinnerLoader;
