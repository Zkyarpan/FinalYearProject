'use client';

import { Toaster } from 'sonner';
import { XMarkIcon } from '@heroicons/react/24/solid';

export default function CustomToaster() {
  return (
    <Toaster
      theme="dark"
      position="bottom-right"
      closeButton
      offset={12}
      toastOptions={{
        style: {
          background: '#0d0d0d', 
          color: '#f5f5f5', 
          borderRadius: '12px', 
          boxShadow: '0 6px 20px rgba(0,0,0,0.45)', 
          padding: '18px 20px',
          border: '1px solid #1a1a1a',
          fontSize: '15px',
          fontWeight: 500,
        },
        className: 'custom-sonner-toast',
        descriptionClassName: 'text-gray-400 text-sm mt-1',
      }}
      icons={{
        close: (
          <XMarkIcon className="h-4 w-4 text-gray-400 hover:text-gray-200 transition duration-150" />
        ),
      }}
    />
  );
}
