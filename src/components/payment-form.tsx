'use client';

import React, { useState, useCallback, useEffect } from 'react';
import {
  PaymentElement,
  useStripe,
  useElements,
  LinkAuthenticationElement,
  AddressElement,
} from '@stripe/react-stripe-js';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import {
  Loader2,
  Lock,
  CreditCard,
  CheckCircle,
  AlertCircle,
  ArrowLeft,
} from 'lucide-react';
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
  const [paymentStatus, setPaymentStatus] = useState<
    'idle' | 'processing' | 'success' | 'error'
  >('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const { theme } = useTheme();
  const isDarkMode = theme === 'dark';

  // Update Stripe Elements theme when the app theme changes
  useEffect(() => {
    if (elements) {
      elements.update({
        appearance: {
          theme: isDarkMode ? 'night' : 'stripe',
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
              boxShadow: 'none',
              fontSize: '16px',
              padding: '12px',
              transition: 'all 0.2s ease',
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
              fontSize: '14px',
              fontWeight: '500',
              marginBottom: '8px',
            },
            '.Tab': {
              backgroundColor: isDarkMode ? '#2d2d2d' : '#f9fafb',
              border: isDarkMode ? '1px solid #404040' : '1px solid #e5e7eb',
              borderRadius: '8px',
              padding: '12px 16px',
              fontSize: '14px',
              fontWeight: '500',
              transition: 'all 0.15s ease',
            },
            '.Tab:hover': {
              backgroundColor: isDarkMode ? '#363636' : '#f3f4f6',
            },
            '.Tab--selected': {
              backgroundColor: isDarkMode ? '#0ea5e9' : '#0ea5e9',
              borderColor: isDarkMode ? '#0ea5e9' : '#0ea5e9',
              color: '#ffffff',
            },
            '.TabIcon': {
              color: 'inherit',
            },
            '.TabLabel': {
              color: 'inherit',
            },
            '.Error': {
              color: '#ef4444',
              fontSize: '14px',
              padding: '8px 0',
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
    setPaymentStatus('processing');
    setErrorMessage(null);

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
      setPaymentStatus('success');
      toast.success('Payment successful!');

      // Short delay to show success state before proceeding
      setTimeout(() => {
        onSuccess(paymentIntent.id);
      }, 1000);
    } catch (error: any) {
      console.error('Payment process error:', error);
      setPaymentStatus('error');
      setErrorMessage(error.message || 'An unexpected error occurred');
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
    <div className={`px-4 py-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
      {/* Payment Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-2xl font-semibold main-font">Payment Details</h3>
        <div className="dark:bg-input font-semibold rounded-full px-3 py-1 text-sm main-font">
          ${amount}
        </div>
      </div>

      {/* Payment Status Messages */}
      {paymentStatus === 'success' && (
        <div className="bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 p-3 rounded-lg flex items-center gap-2 mb-4 text-sm">
          <CheckCircle className="w-4 h-4 flex-shrink-0" />
          <span>Payment successful! Processing your booking...</span>
        </div>
      )}

      {paymentStatus === 'error' && errorMessage && (
        <div className="bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 p-3 rounded-lg flex items-center gap-2 mb-4 text-sm">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Secure Payment Badge */}
      <div
        className={`flex items-center gap-2 mb-4 p-3 rounded-lg ${
          isDarkMode ? 'bg-zinc-800' : 'bg-gray-50'
        }`}
      >
        <Lock className="w-4 h-4 text-green-500" />
        <span className="text-sm text-sky-500 font-medium">
          Secure payment powered by Stripe
        </span>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Payment Method Selection with Enhanced UI */}
        <div
          className={`rounded-lg ${
            isDarkMode ? 'bg-zinc-800/70' : 'bg-white border border-gray-100'
          } p-4`}
        >
          <PaymentElement
            options={{
              layout: {
                type: 'tabs',
                defaultCollapsed: false,
              },
              defaultValues: {
                billingDetails: {
                  name: '',
                },
              },
            }}
          />
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-3 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isProcessing}
            className={`${
              isDarkMode
                ? 'bg-zinc-800 border-zinc-700 hover:bg-zinc-700 text-zinc-300'
                : 'hover:bg-gray-100'
            }`}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <Button
            type="submit"
            disabled={isProcessing || !stripe || !elements}
            className={`${
              isDarkMode
                ? 'bg-blue-600 hover:bg-blue-500'
                : 'bg-blue-600 hover:bg-blue-500'
            }`}
          >
            {isProcessing ? (
              <div className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Processing...</span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <CreditCard className="w-4 h-4" />
                <span>Pay ${amount}</span>
              </div>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
};
