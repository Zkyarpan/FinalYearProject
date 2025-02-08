'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

export function BookingDialog({ handleNavigation }) {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleBooking = async () => {
    try {
      setIsLoading(true);

      // Store the current URL before navigation
      localStorage.setItem('redirectAfterLogin', '/appointments/');

      // Check authentication first
      const canProceed = await handleNavigation('/appointments/', true);

      if (!canProceed) {
        setIsLoading(false);
        return;
      }

      // If authenticated, redirect to appointments page
      router.push('/appointments/');
    } catch (error) {
      console.error('Booking error:', error);
      toast.error('Failed to proceed with booking');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      onClick={handleBooking}
      disabled={isLoading}
      className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
    >
      {isLoading ? 'Please wait...' : 'Book Consultation'}
    </Button>
  );
}
