import { NextRequest, NextResponse } from 'next/server';
import { sendVerificationEmail } from '@/helpers/sendEmailVerification';
import { v4 as uuidv4 } from 'uuid';
import { createSuccessResponse, createErrorResponse } from '@/lib/response';
import TemporaryToken from '@/models/TemporaryToken';
import connectDB from '@/db/db';

export async function POST(req: NextRequest) {
  try {
    await connectDB();

    // Get token from authorization header first
    const authHeader = req.headers.get('authorization');
    let token = authHeader?.split(' ')[1];

    // If no auth header, try to get from body
    if (!token) {
      const body = await req.json();
      token = body.token;
    }

    console.log('Received token:', token);

    if (!token) {
      return NextResponse.json(createErrorResponse(400, 'Token is required.'), {
        status: 400,
      });
    }

    const newCode = uuidv4().slice(0, 6);

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
