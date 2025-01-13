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
    let token = authHeader?.split(' ')[1];

    if (!token) {
      const body = await req.json();
      token = body.token;
    }

    if (!token) {
      return NextResponse.json(createErrorResponse(400, 'Token is required.'), {
        status: 400,
      });
    }

    const newCode = Math.floor(100000 + Math.random() * 900000).toString();

    const tempToken = await TemporaryToken.findOneAndUpdate(
      { token },
      {
        $set: {
          verificationCode: newCode,
          verificationCodeExpiry: new Date(Date.now() + 15 * 60 * 1000),
        },
      },
      { new: true }
    );

    if (!tempToken) {
      return NextResponse.json(
        createErrorResponse(404, 'Temporary token not found.'),
        { status: 404 }
      );
    }

    if (!tempToken.email) {
      return NextResponse.json(
        createErrorResponse(500, 'Email not found in temporary token.'),
        { status: 500 }
      );
    }

    const emailResult = await sendVerificationEmail(tempToken.email, newCode);

    if (!emailResult.success) {
      return NextResponse.json(
        createErrorResponse(500, 'Failed to send verification email.'),
        { status: 500 }
      );
    }

    return NextResponse.json(
      createSuccessResponse(200, {
        message: 'Verification code updated and resent successfully.',
        email: tempToken.email, // Send back email for UI feedback
      }),
      { status: 200 }
    );
  } catch (error) {
    console.error('Resend verification error:', error);
    return NextResponse.json(
      createErrorResponse(500, 'Internal server error.'),
      { status: 500 }
    );
  }
}
