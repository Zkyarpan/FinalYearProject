'use client';

import Link from 'next/link';

interface NavItemProps {
  icon: React.ReactNode;
  text: string;
  href: string;
  isActive?: boolean;
  isProtected?: boolean;
  onClick?: (e: React.MouseEvent) => void;
}

const NavItem: React.FC<NavItemProps> = ({
  icon,
  text,
  href,
  isActive,
  onClick,
  isProtected,
}) => {
  const textStyle = isActive
    ? {
        fontWeight: '600',
        color: 'var(--foreground)',
      }
    : {};

  return (
    <Link
      href={href}
      onClick={onClick}
      className={`
        block 
        ${isActive ? 'dark:text-white' : 'dark:text-white'}
      `}
    >
      <span className="flex lg:flex-row flex-col items-center group pt-2 lg:py-2.5 transition-all">
        <span className="relative text-current shrink-0">{icon}</span>
        <span className="flex flex-col lg:ml-2 mt-2 lg:mt-0 transition-all lg:group-hover:translate-x-1">
          <span
            className={`
              ml-1 
              text-lg 
              font-normal
            `}
            style={textStyle}
          >
            {text}
          </span>
        </span>
      </span>
    </Link>
  );
};

export default NavItem;
