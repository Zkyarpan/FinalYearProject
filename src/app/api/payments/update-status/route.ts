'use server';

import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/db/db';
import { withAuth } from '@/middleware/authMiddleware';
import { createErrorResponse, createSuccessResponse } from '@/lib/response';
import Payment from '@/models/Payment';

export async function POST(req: NextRequest) {
  return withAuth(async (req: NextRequest, token: any) => {
    try {
      await connectDB();

      const { paymentIntentId, status } = await req.json();
      console.log('paymentIntentId:', paymentIntentId);
      console.log('status:', status);

      if (!paymentIntentId || !status) {
        return NextResponse.json(
          createErrorResponse(400, 'Missing required fields')
        );
      }

      // Find and update the payment document
      const payment = await Payment.findOneAndUpdate(
        { stripePaymentIntentId: paymentIntentId },
        {
          $set: {
            status,
            updatedAt: new Date(),
          },
        },
        { new: true }
      );

      if (!payment) {
        console.error(
          `Payment not found for paymentIntentId: ${paymentIntentId}`
        );
        return NextResponse.json(
          createErrorResponse(404, 'Payment record not found')
        );
      }

      return NextResponse.json(
        createSuccessResponse(200, {
          message: 'Payment status updated successfully',
          payment,
        })
      );
    } catch (error: any) {
      console.error('Error updating payment status:', error);
      return NextResponse.json(
        createErrorResponse(500, 'Internal Server Error: ' + error.message)
      );
    }
  }, req);
}
