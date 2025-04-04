'use server';

import { NextRequest, NextResponse } from 'next/server';
import { sendVerificationEmail } from '@/helpers/sendEmailVerification';
import { createSuccessResponse, createErrorResponse } from '@/lib/response';
import TemporaryToken from '@/models/TemporaryToken';
import connectDB from '@/db/db';

export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const authHeader = req.headers.get('authorization');
    let token = authHeader?.startsWith('Bearer ')
      ? authHeader.substring(7)
      : null;

    if (!token) {
      try {
        const body = await req.json();
        token = body.token;
      } catch (error) {
        console.error('Resend verification error:', error);
        return NextResponse.json(
          createErrorResponse(400, 'Invalid request body.'),
          { status: 400 }
        );
      }
    }

    if (!token) {
      return NextResponse.json(
        createErrorResponse(400, 'Verification token is required.'),
        { status: 400 }
      );
    }

    const tempToken = await TemporaryToken.findOne({ token });

    if (!tempToken) {
      return NextResponse.json(
        createErrorResponse(404, 'Verification session not found or expired.'),
        { status: 404 }
      );
    }

    const newCode = Math.floor(100000 + Math.random() * 900000).toString();

    await TemporaryToken.updateOne(
      { _id: tempToken._id },
      {
        $set: {
          verificationCode: newCode,
          verificationCodeExpiry: new Date(Date.now() + 15 * 60 * 1000),
        },
      }
    );

    const emailResult = await sendVerificationEmail(tempToken.email, newCode);

    if (!emailResult.success) {
      return NextResponse.json(
        createErrorResponse(500, 'Failed to send verification email.'),
        { status: 500 }
      );
    }

    return NextResponse.json(
      createSuccessResponse(200, {
        message: 'Verification code resent successfully.',
        email: tempToken.email,
      }),
      { status: 200 }
    );
  } catch (error) {
    console.error('Resend verification error:', error);
    return NextResponse.json(
      createErrorResponse(500, 'Failed to resend verification code.'),
      { status: 500 }
    );
  }
}
