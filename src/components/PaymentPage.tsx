'use client';

import React, { useState, useEffect } from 'react';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { PaymentForm } from '@/components/payment-form';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

// Initialize Stripe outside component to avoid recreating it on each render
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

export default function PaymentPage() {
  const router = useRouter();
  const [paymentData, setPaymentData] = useState<{
    clientSecret: string;
    amount: number;
    appointmentDetails: any;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Get payment data from localStorage that was set before navigation
    const storedPaymentData = localStorage.getItem('pendingPaymentData');
    
    if (storedPaymentData) {
      try {
        const parsedData = JSON.parse(storedPaymentData);
        setPaymentData(parsedData);
      } catch (error) {
        console.error('Error parsing payment data:', error);
        router.push('/appointments');
      }
    } else {
      // If no payment data, redirect back to appointments
      router.push('/appointments');
    }
    
    setIsLoading(false);
  }, [router]);

  const handlePaymentSuccess = async (paymentIntentId: string) => {
    if (!paymentData?.appointmentDetails) return;
    
    try {
      const appointmentResponse = await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...paymentData.appointmentDetails,
          paymentIntentId,
        }),
      });

      const appointmentData = await appointmentResponse.json();

      if (appointmentData.IsSuccess) {
        // Clear the stored payment data
        localStorage.removeItem('pendingPaymentData');
        
        // Redirect to success page
        router.push('/payment-success');
      } else {
        if (appointmentData.StatusCode === 409) {
          alert('This time slot is no longer available. Please select another time.');
          router.push('/appointments');
        } else {
          alert(appointmentData.ErrorMessage?.[0]?.message || 'Booking failed');
        }
      }
    } catch (error) {
      console.error('Booking error:', error);
      alert('Failed to book appointment');
    }
  };

  const handleCancel = () => {
    // Clear the stored payment data
    localStorage.removeItem('pendingPaymentData');
    router.push('/appointments');
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
        <p className="mt-4 text-lg text-muted-foreground">Loading payment details...</p>
      </div>
    );
  }

  if (!paymentData || !paymentData.clientSecret) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <p className="text-xl text-red-500">Payment initialization failed</p>
        <button 
          onClick={() => router.push('/appointments')}
          className="mt-4 px-6 py-2 bg-primary text-white rounded-md hover:bg-primary/90"
        >
          Return to Appointments
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-8 text-center">Complete Your Payment</h1>
      
      <Elements
        stripe={stripePromise}
        options={{
          clientSecret: paymentData.clientSecret,
          appearance: {
            theme: 'stripe',
            variables: {
              colorPrimary: '#0ea5e9',
              borderRadius: '8px',
            },
          },
        }}
      >
        <PaymentForm
          amount={paymentData.amount}
          onSuccess={handlePaymentSuccess}
          onCancel={handleCancel}
        />
      </Elements>
    </div>
  );
}