'use client';

import React, { useState } from 'react';
import {
  PaymentElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);

    try {
      // Submit the PaymentElement
      const { error: submitError } = await elements.submit();
      if (submitError) {
        toast.error(submitError.message);
        return;
      }

      // Confirm the payment
      const { error: confirmError, paymentIntent } =
        await stripe.confirmPayment({
          elements,
          redirect: 'if_required',
        });

      if (confirmError) {
        toast.error(confirmError.message);
      } else if (paymentIntent && paymentIntent.status === 'succeeded') {
        toast.success('Payment successful');
        onSuccess(paymentIntent.id);
      }
    } catch (error) {
      console.error('Payment error:', error);
      toast.error('Payment failed. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="bg-secondary/20 p-4 rounded-lg space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium">Amount to pay:</span>
          <span className="text-lg font-semibold">${amount}</span>
        </div>
        <p className="text-xs text-muted-foreground">
          Your payment is secured by Stripe
        </p>
      </div>

      <PaymentElement />

      <div className="flex justify-end gap-2 mt-6">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isProcessing}
          className="h-9"
        >
          Back
        </Button>
        <Button
          type="submit"
          disabled={isProcessing || !stripe || !elements}
          className="h-9"
        >
          {isProcessing ? 'Processing...' : `Pay $${amount}`}
        </Button>
      </div>
    </form>
  );
};
