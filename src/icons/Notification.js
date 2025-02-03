'use client';

import { useRouter } from 'next/navigation';

const Notification = () => {
  const router = useRouter();

  const handleNotificationClick = () => {
    router.push('/notifications');
  };

  return (
    <div role="button" tabIndex={0}>
      <button
        onClick={handleNotificationClick}
        type="button"
        className="justify-center shrink-0 flex items-center font-semibold
          transition-all duration-200 ease-in-out select-none
          disabled:opacity-50 disabled:cursor-not-allowed
          gap-x-1 text-sm leading-5 rounded-xl
          h-8 w-8
          bg-gray-100 hover:bg-gray-200 
          border border-[hsl(var(--border))]
          active:bg-gray-300 active:scale-95
          dark:bg-input hover:dark:bg-[#505050]
          dark:active:bg-gray-600
          shadow-sm hover:shadow-md
          active:shadow-inner
          text-gray-700 dark:text-gray-200
          motion"
        aria-label="View notifications"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          width={22}
          height={22}
          className="text-gray-700 dark:text-gray-200"
          fill="none"
        >
          <path
            d="M2.52992 14.394C2.31727 15.7471 3.268 16.6862 4.43205 17.1542C8.89481 18.9486 15.1052 18.9486 19.5679 17.1542C20.732 16.6862 21.6827 15.7471 21.4701 14.394C21.3394 13.5625 20.6932 12.8701 20.2144 12.194C19.5873 11.2975 19.525 10.3197 19.5249 9.27941C19.5249 5.2591 16.1559 2 12 2C7.84413 2 4.47513 5.2591 4.47513 9.27941C4.47503 10.3197 4.41272 11.2975 3.78561 12.194C3.30684 12.8701 2.66061 13.5625 2.52992 14.394Z"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M9 21C9.79613 21.6219 10.8475 22 12 22C13.1525 22 14.2039 21.6219 15 21"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
    </div>
  );
};

export default Notification;
