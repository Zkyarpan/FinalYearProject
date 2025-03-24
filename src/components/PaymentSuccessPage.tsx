'use client';

import React, { useEffect, useState } from 'react';
import { CheckCircle, Calendar, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';

export default function PaymentSuccessPage() {
  const router = useRouter();
  const { theme } = useTheme();
  const isDarkMode = theme === 'dark';
  interface AppointmentDetails {
    dateTime: string;
    psychologistName: string;
    sessionFormat: string;
  }
  const [appointmentDetails, setAppointmentDetails] =
    useState<AppointmentDetails | null>(null);

  useEffect(() => {
    // Try to get appointment details from localStorage if available
    const storedAppointmentData = localStorage.getItem('lastBookedAppointment');
    if (storedAppointmentData) {
      try {
        setAppointmentDetails(JSON.parse(storedAppointmentData));
      } catch (error) {
        console.error('Error parsing appointment data:', error);
      }
    }

    // Clean up localStorage
    localStorage.removeItem('pendingPaymentData');
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div
        className={`max-w-md w-full ${
          isDarkMode ? 'bg-zinc-800' : 'bg-white'
        } rounded-xl shadow-xl overflow-hidden`}
      >
        <div className="p-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="h-10 w-10 text-green-600" />
          </div>

          <h1
            className={`text-2xl font-bold mb-2 ${
              isDarkMode ? 'text-white' : 'text-gray-900'
            }`}
          >
            Payment Successful!
          </h1>

          <p
            className={`text-sm ${
              isDarkMode ? 'text-zinc-300' : 'text-gray-600'
            } mb-6`}
          >
            Your appointment has been booked successfully. We've sent a
            confirmation email with all the details.
          </p>

          {appointmentDetails && (
            <div
              className={`mb-8 p-4 rounded-lg ${
                isDarkMode ? 'bg-zinc-700' : 'bg-gray-50'
              }`}
            >
              <h3
                className={`font-medium mb-3 ${
                  isDarkMode ? 'text-zinc-200' : 'text-gray-800'
                }`}
              >
                Appointment Details
              </h3>
              <ul
                className={`text-sm text-left space-y-2 ${
                  isDarkMode ? 'text-zinc-300' : 'text-gray-600'
                }`}
              >
                <li className="flex justify-between">
                  <span>Date:</span>
                  <span className="font-medium">
                    {new Date(appointmentDetails.dateTime).toLocaleDateString()}
                  </span>
                </li>
                <li className="flex justify-between">
                  <span>Time:</span>
                  <span className="font-medium">
                    {new Date(appointmentDetails.dateTime).toLocaleTimeString(
                      [],
                      {
                        hour: '2-digit',
                        minute: '2-digit',
                      }
                    )}
                  </span>
                </li>
                <li className="flex justify-between">
                  <span>Provider:</span>
                  <span className="font-medium">
                    {appointmentDetails.psychologistName}
                  </span>
                </li>
                <li className="flex justify-between">
                  <span>Format:</span>
                  <span className="font-medium capitalize">
                    {appointmentDetails.sessionFormat}
                  </span>
                </li>
              </ul>
            </div>
          )}

          <div className="space-y-3">
            <Button
              onClick={() => router.push('/appointments')}
              className="w-full flex items-center justify-center gap-2 py-6"
            >
              <Calendar className="h-4 w-4" />
              View My Appointments
            </Button>

            <Button
              variant="outline"
              onClick={() => router.push('/dashboard')}
              className={`w-full flex items-center justify-center gap-2 py-6 ${
                isDarkMode
                  ? 'bg-zinc-700 border-zinc-600 hover:bg-zinc-600'
                  : ''
              }`}
            >
              Go to Dashboard
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
