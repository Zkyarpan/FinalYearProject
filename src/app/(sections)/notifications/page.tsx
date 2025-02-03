'use client';

const NotificationsPage = () => {
  return (
    <div className="flex items-center justify-center w-full h-[calc(100vh-4rem)]">
      <div className="w-full max-w-md flex items-center justify-center">
        <div className="flex flex-col items-center text-center">
          <div className="rounded-full bg-gray-100 dark:bg-gray-800 p-4 mb-4">
            <svg
              width="80"
              height="80"
              viewBox="0 0 80 80"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="dark:opacity-75"
            >
              <circle
                cx="40"
                cy="40"
                r="31.5"
                className="fill-gray-100 dark:fill-gray-800"
                stroke="currentColor"
              />
              <circle
                cx="40"
                cy="60"
                r="7.5"
                className="fill-gray-50 dark:fill-gray-700"
                stroke="currentColor"
              />
              <rect
                x="37"
                y="12"
                width="6"
                height="9"
                rx="3"
                className="fill-gray-400 dark:fill-gray-500"
              />
              <g filter="url(#filter0_d_9580_31973)">
                <path
                  d="M25.8581 28.4897C26.7468 21.3553 32.8104 16 40 16C47.1896 16 53.2532 21.3553 54.1419 28.4897L55.2209 37.1521C55.3722 38.367 55.626 39.567 55.9795 40.7392L56.9324 43.8989C58.7529 49.9352 62.3161 55.2992 67.1746 59.3174C67.4531 59.5477 67.2902 60 66.929 60H13.5382C13.0193 60 12.7855 59.3504 13.1853 59.0197C17.8091 55.1956 21.2001 50.0908 22.9327 44.3462L24.0205 40.7392C24.374 39.567 24.6278 38.367 24.7791 37.1521L25.8581 28.4897Z"
                  className="fill-gray-50 dark:fill-gray-800"
                />
                <path
                  d="M26.3543 28.5515C27.2117 21.6674 33.0627 16.5 40 16.5C46.9373 16.5 52.7883 21.6674 53.6457 28.5515L54.7247 37.2139C54.8795 38.4568 55.1391 39.6844 55.5008 40.8836L56.4537 44.0433C58.2722 50.073 61.8028 55.4421 66.6133 59.5H13.5382C13.5171 59.5 13.5098 59.4947 13.5068 59.4924C13.501 59.4882 13.493 59.4791 13.4877 59.4645C13.4825 59.4499 13.4829 59.4378 13.4846 59.4308C13.4855 59.4272 13.4877 59.4185 13.504 59.405C18.2037 55.5182 21.6504 50.3295 23.4114 44.4906L24.4992 40.8836C24.8609 39.6844 25.1205 38.4568 25.2753 37.2139L26.3543 28.5515Z"
                  stroke="currentColor"
                />
              </g>
              <circle cx="40" cy="44" r="1.5" fill="#6FCF97" stroke="#6FCF97" />
              <path
                d="M37 33C37 34.6569 35.6569 36 34 36C32.3431 36 31 34.6569 31 33"
                stroke="#6FCF97"
                strokeWidth="2"
                strokeLinecap="round"
              />
              <path
                d="M49 33C49 34.6569 47.6569 36 46 36C44.3431 36 43 34.6569 43 33"
                stroke="#6FCF97"
                strokeWidth="2"
                strokeLinecap="round"
              />
              <defs>
                <filter
                  id="filter0_d_9580_31973"
                  x="4.98438"
                  y="12"
                  width="70.332"
                  height="60"
                  filterUnits="userSpaceOnUse"
                  colorInterpolationFilters="sRGB"
                >
                  <feFlood floodOpacity="0" result="BackgroundImageFix" />
                  <feColorMatrix
                    in="SourceAlpha"
                    type="matrix"
                    values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
                    result="hardAlpha"
                  />
                  <feOffset dy="4" />
                  <feGaussianBlur stdDeviation="4" />
                  <feComposite in2="hardAlpha" operator="out" />
                  <feColorMatrix
                    type="matrix"
                    values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.05 0"
                  />
                  <feBlend
                    mode="normal"
                    in2="BackgroundImageFix"
                    result="effect1_dropShadow_9580_31973"
                  />
                  <feBlend
                    mode="normal"
                    in="SourceGraphic"
                    in2="effect1_dropShadow_9580_31973"
                    result="shape"
                  />
                </filter>
              </defs>
            </svg>
          </div>
          <h2 className="text-xl font-semibold mb-2 dark:text-gray-200">
            No-tifications
          </h2>
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            You don't have any notifications.
          </p>
        </div>
      </div>
    </div>
  );
};

export default NotificationsPage;
