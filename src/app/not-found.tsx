import React from 'react';
import Image from 'next/image';
import Link from 'next/link';

const NotFoundPage = () => {
  return (
    <div className="container flex flex-col items-center justify-center min-h-screen bg-white text-black dark:bg-[--background] dark:text-white mb-5">
      <Image
        src="https://dqy38fnwh4fqs.cloudfront.net/website/404-doodle.webp"
        alt="404 not found"
        width={200}
        height={200}
        className="dark:invert"
      />
      <div className="flex flex-col items-center text-center gap-2">
        <p className="text-base font-semibold">404—Page not found.</p>
        <p className="text-sm">
          We’re not sure, but the page you’re looking for may have been moved,
          removed, renamed, or… might never have existed. 🤷‍♂️
        </p>
      </div>
      <Link href="/" passHref>
        <a className="mt-6 inline-flex items-center justify-center px-4 py-2 text-sm font-medium shadow-sm text-white bg-[hsl(210,96.1%,40%)] hover:bg-[hsl(210,96.1%,50%)] rounded-xl border border-[hsl(var(--border))] hover:shadow-md dark:bg-[#404040] dark:border-[#525252] hover:dark:bg-[#505050]">
          <svg
            className="mr-2 -ml-1 h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 17H12.009"
            />
            <path
              strokeLinecap="round"
              d="M20 8.5V13.5C20 17.2712 20 19.1569 18.8284 20.3284C17.6569 21.5 15.7712 21.5 12 21.5C8.22876 21.5 6.34315 21.5 5.17157 20.3284C4 19.1569 4 17.2712 4 13.5V8.5"
            />
            <path
              strokeLinecap="round"
              d="M22 10.5L17.6569 6.33548C14.9902 3.77849 13.6569 2.5 12 2.5C10.3431 2.5 9.00981 3.77849 6.34315 6.33548L2 10.5"
            />
          </svg>
          Back Home
        </a>
      </Link>
    </div>
  );
};

export default NotFoundPage;
