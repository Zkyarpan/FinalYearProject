'use server';

import { NextRequest, NextResponse } from 'next/server';
import { sendPasswordResetEmail } from '@/helpers/sendPasswordResetEmail';
import TemporaryToken from '@/models/TemporaryToken';
import Account from '@/models/Account';
import { v4 as uuidv4 } from 'uuid';
import connectDB from '@/db/db';
import { createErrorResponse, createSuccessResponse } from '@/lib/response';
import { encrypt } from '@/lib/token';

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json(createErrorResponse(400, 'Email is required.'), {
        status: 400,
      });
    }

    const account = await Account.findOne({ email });
    if (!account) {
      return NextResponse.json(
        createErrorResponse(404, 'No account associated with this email.'),
        { status: 404 }
      );
    }

    const existingTempToken = await TemporaryToken.findOne({ email });
    if (existingTempToken) {
      return NextResponse.json(
        createErrorResponse(
          400,
          'A reset request already exists. Please check your email or try again later.'
        ),
        { status: 400 }
      );
    }

    const verificationCode = uuidv4().slice(0, 6);
    const token = await encrypt({ email, type: 'password-reset' });

    await TemporaryToken.create({
      email,
      token,
      verificationCode,
      verificationCodeExpiry: new Date(Date.now() + 15 * 60 * 1000),
    });

    const emailResult = await sendPasswordResetEmail(email, verificationCode);
    if (!emailResult.success) {
      return NextResponse.json(
        createErrorResponse(500, 'Failed to send the email. Please try again.'),
        { status: 500 }
      );
    }

    return NextResponse.json(
      createSuccessResponse(200, 'Password reset email sent successfully.'),
      { status: 200 }
    );
  } catch (error) {
    console.error('Error in forgot password:', error);
    return NextResponse.json(
      createErrorResponse(
        500,
        'Internal server error. Please try again later.'
      ),
      { status: 500 }
    );
  }
}
