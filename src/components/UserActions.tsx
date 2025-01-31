// import Search from '@/icons/Search';
// import ThemeSwitch from './ThemeSwitch';
// import Notification from '@/icons/Notification';
// import Image from 'next/image';
// import Link from 'next/link';
// import { usePathname } from 'next/navigation';

// interface UserActionsProps {
//   isAuthenticated: boolean;

//   profileImage: string | null;

//   router: any;

//   onLoginClick?: () => void;
// }

// const UserActions = ({
//   isAuthenticated,
//   profileImage,
//   router,
// }: UserActionsProps) => {
//   const pathname = usePathname();
//   const isNestedBlogRoute =
//     pathname.startsWith('/blogs/') && pathname !== '/blogs';

//   if (isAuthenticated) {
//     return (
//       <div className="flex items-center justify-end w-full">
//         <div className="flex items-center bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-20">
//           <div className="flex items-center relative mr-3">
//             {isNestedBlogRoute && (
//               <div className="absolute dark:border-[#333333] -top-5 -bottom-3 w-px border-r left-5 mb-0.5" />
//             )}
//             <div
//               className={`relative flex w-[220px] items-center rounded-xl border dark:bg-input bg-white px-4 py-1.5 transition-all duration-200 gap-x-2 ${isNestedBlogRoute ? 'ml-8' : 'ml-3'}`}
//             >
//               <Search />
//               <input
//                 type="text"
//                 placeholder="Search Mentality"
//                 className="w-full text-sm bg-transparent border-none outline-none focus:ring-0 transition-colors duration-200 placeholder:text-muted-foreground"
//               />
//             </div>
//           </div>

//           <div className="flex items-center gap-3">
//             <ThemeSwitch />
//             <Notification />
//             <button
//               className="hover:opacity-80 transition-opacity"
//               onClick={() => router.push('/account')}
//             >
//               <div className="w-8 h-8 rounded-full overflow-hidden">
//                 <Image
//                   src={profileImage || '/default-avatar.jpg'}
//                   alt="Profile"
//                   width={32}
//                   height={32}
//                   className="object-cover"
//                 />
//               </div>
//             </button>
//           </div>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="flex items-center justify-end w-full">
//       <div className="flex items-center gap-3">
//         <Link
//           href="/login"
//           className="font-semibold text-sm py-1.5 px-4 rounded-xl border border-[hsl(var(--border))] hover:shadow-md dark:bg-[#f8f9fa] dark:border-[#ced4da] hover:dark:bg-[#e9ecef] dark:text-black"
//         >
//           Log in
//         </Link>
//         <Link
//           href="/signup"
//           className="font-semibold text-sm py-1.5 px-4 rounded-xl bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] hover:bg-[hsl(var(--ring))] hover:shadow-md hover:dark:bg-[#0072ce]"
//         >
//           Create Profile
//         </Link>
//         <ThemeSwitch />
//       </div>
//     </div>
//   );
// };

// export default UserActions;

'use client';

import Search from '@/icons/Search';
import ThemeSwitch from './ThemeSwitch';
import Notification from '@/icons/Notification';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from './ui/button';

interface UserActionsProps {
  isAuthenticated: boolean;
  profileImage: string | null;
  router: any;
  onLoginClick?: () => void;
}

const UserActions = ({
  isAuthenticated,
  profileImage,
  router,
}: UserActionsProps) => {
  const pathname = usePathname();
  const isNestedBlogRoute =
    pathname.startsWith('/blogs/') && pathname !== '/blogs';

  if (isAuthenticated) {
    return (
      <div className="flex items-center justify-end w-full">
        <div className="flex items-center gap-x-3">
          <div className="flex items-center relative">
            {isNestedBlogRoute && (
              <div className="absolute -top-[20px] -bottom-[12px] w-[1px] bg-border dark:bg-[#333333] left-5" />
            )}
            <div
              className={`relative flex w-[220px] items-center rounded-xl border border-border dark:border-[#333333] bg-background dark:bg-[#1a1a1a] px-4 py-1.5 transition-all duration-200 ${
                isNestedBlogRoute ? 'ml-8' : 'ml-3'
              }`}
            >
              <Search />
              <input
                type="text"
                placeholder="Search Mentality"
                className="ml-2 w-full text-sm bg-transparent border-none outline-none focus:ring-0 placeholder:text-muted-foreground"
              />
            </div>
          </div>

          <div className="flex items-center gap-3 px-1">
            <button className="p-2 rounded-lg hover:bg-muted transition-colors">
              <ThemeSwitch />
            </button>
            <button className="p-2 rounded-lg hover:bg-muted transition-colors">
              <Notification />
            </button>
            <button
              className="p-1 rounded-full hover:opacity-80 transition-all"
              onClick={() => router.push('/account')}
            >
              <div className="w-8 h-8 rounded-full overflow-hidden border border-border dark:border-[#333333]">
                <Image
                  src={profileImage || '/default-avatar.jpg'}
                  alt="Profile"
                  width={32}
                  height={32}
                  className="object-cover w-full h-full"
                />
              </div>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-end w-full">
      <div className="flex items-center gap-3 px-1">
        <Link
          href="/login"
          className="font-medium text-sm py-1.5 px-4 rounded-xl border border-border dark:border-[#333333] hover:bg-muted transition-colors bg-white dark:bg-[#404040] dark:border-[#525252] hover:dark:bg-[#505050]"
        >
          Log in
        </Link>
        <Link
          href="/signup"
          className="font-medium text-sm py-1.5 px-4 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          Create Profile
        </Link>
        <ThemeSwitch />
      </div>
    </div>
  );
};

export default UserActions;
