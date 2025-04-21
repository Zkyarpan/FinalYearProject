import { describe, it, expect } from '@jest/globals';

interface PaymentDetails {
  cardNumber: string;
  amount: number;
  appointmentId: string;
}

function processPayment(details: PaymentDetails): string {
  if (!details.cardNumber.startsWith('4242')) return 'Card declined';
  if (details.amount <= 0) return 'Invalid amount';

  return 'Payment successful';
}

describe('💳 Stripe Payment Simulation', () => {
  it('✅ should succeed with valid test card and amount', () => {
    const result = processPayment({
      cardNumber: '4242424242424242',
      amount: 2000,
      appointmentId: 'appt-001',
    });

    expect(result).toBe('Payment successful');
  });

  it('❌ should fail if card is invalid', () => {
    const result = processPayment({
      cardNumber: '1234567890123456',
      amount: 2000,
      appointmentId: 'appt-002',
    });

    expect(result).toBe('Card declined');
  });

  it('❌ should fail for zero or negative amount', () => {
    const result = processPayment({
      cardNumber: '4242424242424242',
      amount: 0,
      appointmentId: 'appt-003',
    });

    expect(result).toBe('Invalid amount');
  });
});
