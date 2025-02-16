'use client';

import React, { useState, useCallback, useEffect } from 'react';
import {
  PaymentElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Loader2, Lock } from 'lucide-react';
import { useTheme } from 'next-themes';

interface PaymentFormProps {
  amount: number;
  onSuccess: (paymentIntentId: string) => void;
  onCancel: () => void;
}

export const PaymentForm: React.FC<PaymentFormProps> = ({
  amount,
  onSuccess,
  onCancel,
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const { theme } = useTheme();
  const isDarkMode = theme === 'dark';

  // Update Stripe Elements theme when the app theme changes
  useEffect(() => {
    if (elements) {
      elements.update({
        appearance: {
          theme: 'night',
          variables: {
            colorPrimary: '#0ea5e9',
            colorBackground: isDarkMode ? '#1e1e1e' : '#ffffff',
            colorText: isDarkMode ? '#ffffff' : '#1a1a1a',
            colorDanger: '#ef4444',
            fontFamily: 'ui-sans-serif, system-ui, sans-serif',
            spacingUnit: '4px',
            borderRadius: '8px',
          },
          rules: {
            '.Input': {
              backgroundColor: isDarkMode ? '#2d2d2d' : '#ffffff',
              color: isDarkMode ? '#ffffff' : '#1a1a1a',
              border: isDarkMode ? '1px solid #404040' : '1px solid #e5e7eb',
            },
            '.Input:hover': {
              backgroundColor: isDarkMode ? '#363636' : '#f9fafb',
            },
            '.Input:focus': {
              backgroundColor: isDarkMode ? '#363636' : '#ffffff',
              border: '2px solid #0ea5e9',
              boxShadow: '0 0 0 1px rgba(14, 165, 233, 0.2)',
            },
            '.Input--invalid': {
              border: '1px solid #ef4444',
            },
            '.Label': {
              color: isDarkMode ? '#d4d4d4' : '#6b7280',
            },
            '.Tab': {
              backgroundColor: isDarkMode ? '#2d2d2d' : '#f9fafb',
              border: isDarkMode ? '1px solid #404040' : '1px solid #e5e7eb',
            },
            '.Tab:hover': {
              backgroundColor: isDarkMode ? '#363636' : '#f3f4f6',
            },
            '.Tab--selected': {
              backgroundColor: isDarkMode ? '#404040' : '#ffffff',
              border: '1px solid #0ea5e9',
            },
            '.TabIcon': {
              color: isDarkMode ? '#d4d4d4' : '#6b7280',
            },
            '.TabLabel': {
              color: isDarkMode ? '#ffffff' : '#1a1a1a',
            },
            '.Error': {
              color: '#ef4444',
            },
          },
        },
      });
    }
  }, [elements, isDarkMode]);

  const updatePaymentStatus = useCallback(async (paymentIntentId: string) => {
    try {
      const response = await fetch('/api/payments/update-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paymentIntentId,
          status: 'completed',
        }),
      });

      const data = await response.json();

      if (!data.IsSuccess) {
        throw new Error(
          data.ErrorMessage?.[0]?.message || 'Failed to update payment status'
        );
      }

      return true;
    } catch (error) {
      console.error('Error updating payment status:', error);
      throw error;
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      toast.error('Payment system not initialized');
      return;
    }

    setIsProcessing(true);

    try {
      // First, submit the PaymentElement
      const { error: submitError } = await elements.submit();
      if (submitError) {
        throw new Error(submitError.message || 'Error submitting payment');
      }

      // Then, confirm the payment
      const { error: confirmError, paymentIntent } =
        await stripe.confirmPayment({
          elements,
          redirect: 'if_required',
          confirmParams: {
            return_url: window.location.href,
          },
        });

      if (confirmError) {
        switch (confirmError.type) {
          case 'card_error':
            throw new Error('Your card was declined. Please try another card.');
          case 'validation_error':
            throw new Error('Please check your card details and try again.');
          default:
            throw new Error(confirmError.message || 'Payment failed');
        }
      }

      if (!paymentIntent || paymentIntent.status !== 'succeeded') {
        throw new Error('Payment was not completed successfully');
      }

      // Update payment status in our database
      await updatePaymentStatus(paymentIntent.id);

      // If we get here, both the payment and status update were successful
      toast.success('Payment successful!');
      onSuccess(paymentIntent.id);
    } catch (error: any) {
      console.error('Payment process error:', error);
      toast.error(error.message || 'An unexpected error occurred');

      // If this was a payment success but status update failed, still proceed
      if (
        error.message.includes('update payment status') &&
        error.paymentIntent
      ) {
        toast.info(
          'Payment recorded, but status update delayed. Proceeding with booking...'
        );
        onSuccess(error.paymentIntent.id);
      }
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div
        className={`p-6 rounded-lg space-y-3 ${
          isDarkMode ? 'bg-zinc-800/50' : 'bg-gray-100'
        }`}
      >
        <div className="flex justify-between items-center">
          <span
            className={`text-sm font-medium main-font ${
              isDarkMode ? 'text-zinc-200' : 'text-gray-700'
            }`}
          >
            Amount to pay:
          </span>
          <span
            className={`text-lg font-semibold ${
              isDarkMode ? 'text-white' : 'text-gray-900'
            }`}
          >
            ${amount}
          </span>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Lock className="w-3 h-3" />
          <span className="main-font">Secure payment powered by Stripe</span>
        </div>
      </div>

      <div
        className={`rounded-lg ${
          isDarkMode ? 'bg-zinc-800/30' : 'bg-white'
        } p-6`}
      >
        <PaymentElement
          options={{
            layout: 'tabs',
            defaultValues: {
              billingDetails: {
                name: '',
                email: '',
              },
            },
          }}
        />
      </div>

      <div className="flex justify-end gap-3 mt-6">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isProcessing}
          className={`h-11 px-5 ${
            isDarkMode
              ? 'bg-zinc-800 border-zinc-700 hover:bg-zinc-700 text-zinc-200'
              : 'hover:bg-gray-100'
          }`}
        >
          Back
        </Button>
        <Button
          type="submit"
          disabled={isProcessing || !stripe || !elements}
          className={`h-11 px-5 ${
            isDarkMode
              ? 'bg-blue-600 hover:bg-blue-700 text-white'
              : 'bg-blue-600 hover:bg-blue-700 text-white'
          }`}
        >
          {isProcessing ? (
            <div className="flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Processing...</span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4" />
              <span className="main-font">Pay ${amount}</span>
            </div>
          )}
        </Button>
      </div>
    </form>
  );
};
