'use client';

import { useEffect } from 'react';

const companies = [
  'Google',
  'Microsoft',
  'Amazon',
  'Netflix',
  'YouTube',
  'Instagram',
  'Uber',
  'Spotify',
];

export function Companies() {
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      @keyframes marquee {
        0% {
          transform: translateX(0);
        }
        100% {
          transform: translateX(calc(-100% - var(--gap)));
        }
      }
      
      .animate-marquee {
        animation: marquee var(--duration) linear infinite;
      }
      
      .group:hover .animate-marquee {
        animation-play-state: paused;
      }
    `;
    document.head.appendChild(style);

    // Cleanup function to remove the style when component unmounts
    return () => {
      document.head.removeChild(style);
    };
  }, []); // Empty dependency array means this runs once on mount

  return (
    <section id="companies" className="dark:bg-transparent">
      <div className="py-14">
        <div className="container mx-auto px-4 md:px-8">
          <h3 className="text-center text-sm font-semibold">
            TRUSTED BY LEADING TEAMS
          </h3>
          <div className="relative mt-6">
            <div className="group flex overflow-hidden p-2 [--gap:1rem] [gap:var(--gap)] flex-row max-w-full [--duration:40s]">
              {[0, 1, 2, 3].map(groupIndex => (
                <div
                  key={groupIndex}
                  className="flex shrink-0 justify-around [gap:var(--gap)] animate-marquee flex-row"
                >
                  {companies.map(company => (
                    <img
                      key={`${company}-${groupIndex}`}
                      src={`https://cdn.magicui.design/companies/${company}.svg`}
                      className="h-10 w-28 dark:brightness-0 dark:invert"
                      alt={company}
                    />
                  ))}
                </div>
              ))}
            </div>
            <div className="pointer-events-none absolute inset-y-0 left-0 h-full w-1/3 bg-gradient-to-r from-white dark:from-[#171717]"></div>
            <div className="pointer-events-none absolute inset-y-0 right-0 h-full w-1/3 bg-gradient-to-l from-white dark:from-[#171717]"></div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default Companies;
