// 'use client';

// import Link from 'next/link';
// import Image from 'next/image';
// import { useState } from 'react';
// import { Button } from './ui/button';
// import ThemeSwitch from './ThemeSwitch';

// const Navbar = () => {
//   const [menuOpen, setMenuOpen] = useState(false);

//   return (
//     <div className="w-full mx-auto flex flex-col relative">
//       <div className="fixed top-0 left-0 w-full z-10">
//         <nav className="flex justify-center mx-auto px-4 sm:px-6 lg:px-8 h-14 max-w-[800px]">
//           <div className="flex items-center justify-center w-full max-w-screen-xl backdrop-blur text-[hsl(var(--foreground))] px-4 py-2 rounded-lg">
//             <Link href="/" className="flex items-center">
//               <Image
//                 alt="Mentality"
//                 width={40}
//                 height={30}
//                 className="object-contain"
//                 src="/logo1.png?v=1"
//                 priority
//               />
//               <span className="ml-2 text-2xl font-extrabold logo-font">
//                 Mentality
//               </span>
//             </Link>

//             <div className="hidden sm:flex items-center">
//               <Link
//                 href="/stories"
//                 className="font-medium text-sm py-1.5 px-6 hover:underline"
//               >
//                 Stories
//               </Link>
//               <Link
//                 href="/resources"
//                 className="font-medium text-sm py-1.5 px-3 hover:underline"
//               >
//                 Resources
//               </Link>
//               <Link
//                 href="/services"
//                 className="font-medium text-sm py-1.5 px-5 hover:underline"
//               >
//                 Services
//               </Link>
//             </div>

//             <div className="flex items-center gap-x-4">
//               <Link
//                 href="/login"
//                 className="font-semibold text-sm py-1.5 px-4 rounded-xl border border-[hsl(var(--border))] hover:shadow-md"
//               >
//                 Log in
//               </Link>
//               <Link
//                 href="/signup"
//                 className="font-semibold text-sm py-1.5 px-4 rounded-xl bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] hover:bg-[hsl(var(--ring))] hover:shadow-md transition-all"
//               >
//                 Create Profile
//               </Link>
//               <ThemeSwitch />
//             </div>

//             <Button
//               type="button"
//               className="p-1 rounded block sm:hidden"
//               onClick={() => setMenuOpen(!menuOpen)}
//               aria-label="Toggle Menu"
//             >
//               <svg
//                 width="20"
//                 height="20"
//                 viewBox="0 0 24 24"
//                 fill="none"
//                 xmlns="http://www.w3.org/2000/svg"
//               >
//                 <path
//                   d="M3 5H21M3 12H21M3 19H21"
//                   stroke="currentColor"
//                   strokeWidth="1.5"
//                   strokeLinecap="round"
//                   strokeLinejoin="round"
//                 />
//               </svg>
//             </Button>
//           </div>
//         </nav>

//         {menuOpen && (
//           <div className="absolute top-14 left-0 w-full shadow-xl bg-[hsl(var(--card))] sm:hidden">
//             <div className="flex flex-col mt-4">
//               <Link
//                 href="/stories"
//                 className="px-4 py-2 font-medium text-[hsl(var(--foreground))]"
//                 onClick={() => setMenuOpen(false)}
//               >
//                 Stories
//               </Link>
//               <Link
//                 href="/resources"
//                 className="px-4 py-2 font-medium text-[hsl(var(--foreground))]"
//                 onClick={() => setMenuOpen(false)}
//               >
//                 Resources
//               </Link>
//               <Link
//                 href="/services"
//                 className="px-4 py-2 font-medium text-[hsl(var(--foreground))]"
//                 onClick={() => setMenuOpen(false)}
//               >
//                 Services
//               </Link>
//             </div>
//           </div>
//         )}
//       </div>
//     </div>
//   );
// };

// export default Navbar;

'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';
import { Button } from './ui/button';
import ThemeSwitch from './ThemeSwitch';

const Navbar = () => {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <>
      {/* Spacer to prevent content from going under navbar */}
      <div className="h-14" />

      {/* Fixed Navbar */}
      <header className="fixed top-0 left-0 right-0 h-14 z-50">
        {/* Background overlay with proper dark mode handling */}
        <div className="absolute inset-0 bg-background/75 backdrop-blur-sm" />

        <div className="relative max-w-[800px] h-full mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex items-center justify-between h-full">
            <Link href="/" className="flex items-center flex-shrink-0">
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

            <div className="hidden sm:flex items-center space-x-2">
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
            </div>
          </nav>
        </div>

        {/* Mobile Menu */}
        {menuOpen && (
          <div className="absolute top-full left-0 w-full bg-background border-t border-[hsl(var(--border))] sm:hidden">
            <div className="max-w-[800px] mx-auto px-4">
              <div className="py-2 space-y-1">
                <Link
                  href="/stories"
                  className="block px-4 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground rounded-md"
                  onClick={() => setMenuOpen(false)}
                >
                  Stories
                </Link>
                <Link
                  href="/resources"
                  className="block px-4 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground rounded-md"
                  onClick={() => setMenuOpen(false)}
                >
                  Resources
                </Link>
                <Link
                  href="/services"
                  className="block px-4 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground rounded-md"
                  onClick={() => setMenuOpen(false)}
                >
                  Services
                </Link>
              </div>
            </div>
          </div>
        )}
      </header>
    </>
  );
};

export default Navbar;
