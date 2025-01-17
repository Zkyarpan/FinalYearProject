'use client'

import Link from "next/link";

const NavItem = ({ icon, text, isActive, href }) => {
    const textStyle = isActive
      ? {
          fontWeight: '600',
          color: 'var(--foreground)',
        }
      : {};
  
    return (
      <Link href={href}>
        <span className="flex lg:flex-row flex-col items-center group pt-2 lg:py-2.5 transition-all hover:text-gray-900 dark:text-white">
          <span className="relative text-current shrink-0">{icon}</span>
          <span className="flex flex-col lg:ml-2 mt-2 lg:mt-0 transition-all lg:group-hover:translate-x-1">
            <span className="ml-1 text-lg font-normal" style={textStyle}>
              {text}
            </span>
          </span>
        </span>
      </Link>
    );
  };

  export default NavItem;