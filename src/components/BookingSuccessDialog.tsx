'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog';
import { CalendarDays, X } from 'lucide-react';
import Checkmark from '@/icons/Checkmark';
import { useRouter } from 'next/navigation';

export const BookingSuccessDialog = ({
  isOpen,
  onClose,
  appointmentId,
}: {
  isOpen: boolean;
  onClose: () => void;
  appointmentId: string;
}) => {
  const router = useRouter();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className="flex flex-col gap-4 rounded-xl 
        bg-white bg-[linear-gradient(204deg,rgba(209,213,218,0.70)0%,rgba(255,255,255,0.00)50.85%)] 
        dark:bg-[#1c1c1c] dark:bg-[linear-gradient(204deg,rgba(40,40,45,0.8)0%,rgba(23,23,23,0.9)50.85%)] 
        p-4 border border-primaryBorder dark:border-[#333333]"
      >
        <div className="flex flex-col items-center text-center pt-8 pb-2">
          <div className="relative">
            <div className="h-16 w-16 rounded-full bg-gray-200 flex items-center justify-center mb-6">
              <Checkmark />
            </div>
          </div>

          <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-200 bg-clip-text text-transparent">
            Booking Confirmed!
          </DialogTitle>

          <DialogDescription className="mt-4 text-gray-600 dark:text-gray-300 max-w-sm">
            Your appointment has been successfully scheduled. You'll receive a
            confirmation email shortly.
          </DialogDescription>
        </div>

        <div className="mt-8 flex gap-3 px-4">
          <button
            //    onClick={() => router.push(`/appointments/${appointmentId}`)}
            onClick={() => router.push(`/appointments`)}
            className="flex-1 group flex items-center justify-center font-semibold border transition-all ease-in duration-75 whitespace-nowrap text-center select-none disabled:shadow-none disabled:opacity-50 disabled:cursor-not-allowed gap-x-1 active:shadow-none text-sm leading-5 rounded-xl py-1.5 h-8 px-4 bg-blue-600 text-white border-blue-500 hover:bg-blue-700 disabled:bg-blue-400 disabled:border-blue-400 shadow-sm"
          >
            View Appointment
            <span className="-mr-1">
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M5 12H19.5833M19.5833 12L12.5833 5M19.5833 12L12.5833 19"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  vectorEffect="non-scaling-stroke"
                ></path>
              </svg>
            </span>
          </button>

          <button
            onClick={onClose}
            className="flex-1 group flex items-center justify-center font-semibold border transition-all ease-in duration-75 whitespace-nowrap text-center select-none disabled:shadow-none disabled:opacity-50 disabled:cursor-not-allowed gap-x-1 active:shadow-none text-sm leading-5 rounded-xl py-1.5 h-8 px-4 bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200 disabled:bg-gray-50 disabled:border-gray-100 shadow-sm dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700 dark:hover:bg-gray-700"
          >
            Close
            <span className="-mr-1"></span>
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BookingSuccessDialog;
