'use client';

import { Toaster } from 'sonner';
import { XMarkIcon } from '@heroicons/react/24/solid';

export default function CustomToaster() {
  return (
    <Toaster
      theme="dark"
      position="bottom-right"
      closeButton     // keep the close‑btn but override its contents
      offset={12}
      toastOptions={{
        style: {
          background: 'hsl(0 0% 15%)',      // toast bg
          color: '#f5f5f5',
          borderRadius: '12px',
          boxShadow: '0 6px 20px rgba(0,0,0,0.45)',
          padding: '18px 20px',
          border: '1px solid #333333',      // dark:border-[#333333]
          fontSize: '15px',
          fontWeight: 500,
        },
        className: 'custom-sonner-toast',
        descriptionClassName: 'text-gray-400 text-sm mt-1',
      }}
      icons={{
        close: (
          <div
            className="
              flex items-center justify-center
              w-4 h-4 rounded-full
              bg-[hsl(0_0%_15%)]
              hover:bg-[hsl(0_0%_20%)]
              transition-colors duration-150
            "
          >
            <XMarkIcon className="h-3 w-3 text-gray-400 hover:text-gray-200" />
          </div>
        ),
      }}
    />
  );
}
