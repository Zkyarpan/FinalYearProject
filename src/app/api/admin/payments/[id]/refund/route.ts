'use server';

import { NextRequest, NextResponse } from 'next/server';
import { Types, PipelineStage } from 'mongoose';
import connectDB from '@/db/db';
import { withAuth } from '@/middleware/authMiddleware';
import { createSuccessResponse, createErrorResponse } from '@/lib/response';
import Appointment, { AppointmentStatus } from '@/models/Appointment';
import Payment from '@/models/Payment';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  return withAuth(
    async (req: NextRequest, token: any) => {
      try {
        // Verify admin role
        if (token.role !== 'admin') {
          return NextResponse.json(
            createErrorResponse(
              403,
              'Access denied. Admin privileges required.'
            ),
            { status: 403 }
          );
        }

        const paymentId = params.id;

        // Validate payment ID
        if (!paymentId || !Types.ObjectId.isValid(paymentId)) {
          return NextResponse.json(
            createErrorResponse(400, 'Invalid payment ID'),
            { status: 400 }
          );
        }

        await connectDB();

        // Get refund reason from request body
        const body = await req.json().catch(() => ({}));
        const refundReason = body.reason || 'Refunded by admin';

        // Find the payment
        const payment = await Payment.findById(paymentId);

        if (!payment) {
          return NextResponse.json(
            createErrorResponse(404, 'Payment not found'),
            { status: 404 }
          );
        }

        // Check if payment can be refunded
        if (payment.status !== 'completed') {
          return NextResponse.json(
            createErrorResponse(
              400,
              `Cannot refund a payment with status: ${payment.status}`
            ),
            { status: 400 }
          );
        }

        // Process refund through Stripe
        try {
          // Uncomment and adapt this code to use your Stripe implementation
          /*
          const refund = await stripe.refunds.create({
            payment_intent: payment.stripePaymentIntentId,
            reason: 'requested_by_customer',
          });
          
          // Check refund status
          if (refund.status !== 'succeeded') {
            throw new Error(`Refund failed with status: ${refund.status}`);
          }
          */

          // Mock successful refund for now
          console.log(`Processing refund for payment: ${payment._id}`);

          // Update payment status to refunded
          payment.status = 'refunded';
          payment.refundReason = refundReason;
          await payment.save();

          // If there's an associated appointment, cancel it
          if (payment.appointmentId) {
            const appointment = await Appointment.findById(
              payment.appointmentId
            );

            if (
              appointment &&
              appointment.status !== AppointmentStatus.CANCELED
            ) {
              appointment.status = AppointmentStatus.CANCELED;
              appointment.isCanceled = true;
              appointment.canceledAt = new Date();
              appointment.canceledBy = new Types.ObjectId(token.id);
              appointment.cancelationReason = `Payment refunded: ${refundReason}`;
              await appointment.save();

              // Release availability slot if applicable
              try {
                await Appointment.prototype.cancel.call(
                  appointment,
                  new Types.ObjectId(token.id),
                  `Payment refunded: ${refundReason}`
                );
              } catch (error) {
                console.error('Error releasing availability slot:', error);
                // Continue anyway as we've already canceled the appointment
              }
            }
          }

          return NextResponse.json(
            createSuccessResponse(200, {
              payment,
              message: 'Payment refunded successfully',
            }),
            { status: 200 }
          );
        } catch (refundError: any) {
          console.error('Error processing refund:', refundError);
          return NextResponse.json(
            createErrorResponse(
              500,
              `Failed to process refund: ${refundError.message || 'Unknown error'}`
            ),
            { status: 500 }
          );
        }
      } catch (error: any) {
        console.error('Error refunding payment:', error);
        return NextResponse.json(
          createErrorResponse(500, error.message || 'Internal Server Error'),
          { status: 500 }
        );
      }
    },
    req,
    ['admin'] // Only allow admins
  );
}
