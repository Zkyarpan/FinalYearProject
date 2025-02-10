// app/api/payments/create-intent/route.ts

'use server';
import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/middleware/authMiddleware';
import Stripe from 'stripe';
import Payment from '@/models/Payment';
import connectDB from '@/db/db';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(req: NextRequest) {
  return withAuth(async (req: NextRequest, token: any) => {
    try {
      await connectDB();
      const { psychologistId, sessionFee, appointmentDate } = await req.json();

      if (!psychologistId || !sessionFee || !appointmentDate) {
        return NextResponse.json({
          StatusCode: 400,
          IsSuccess: false,
          ErrorMessage: [{ message: 'Missing required fields' }],
        });
      }

      // Create a Stripe PaymentIntent
      const paymentIntent = await stripe.paymentIntents.create({
        amount: sessionFee * 100, // Convert to cents
        currency: 'usd',
        automatic_payment_methods: {
          enabled: true,
        },
        metadata: {
          userId: token.id,
          psychologistId,
          appointmentDate,
        },
      });

      // Create a pending payment record
      const payment = await Payment.create({
        userId: token.id,
        psychologistId,
        amount: sessionFee,
        currency: 'usd',
        status: 'pending',
        stripePaymentId: paymentIntent.id,
        stripePaymentIntentId: paymentIntent.id,
        metadata: {
          appointmentDate,
          intentCreatedAt: new Date().toISOString(),
        },
      });

      return NextResponse.json({
        StatusCode: 200,
        IsSuccess: true,
        Result: {
          clientSecret: paymentIntent.client_secret,
          paymentIntentId: paymentIntent.id,
          paymentId: payment._id,
        },
      });
    } catch (error) {
      console.error('Payment intent creation error:', error);
      return NextResponse.json({
        StatusCode: 500,
        IsSuccess: false,
        ErrorMessage: [{ message: error.message }],
      });
    }
  }, req);
}
