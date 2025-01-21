'use server';

import { NextRequest, NextResponse } from 'next/server';
import { sendPasswordResetEmail } from '@/helpers/sendPasswordResetEmail';
import TemporaryToken from '@/models/TemporaryToken';
import Account from '@/models/User';
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

    const verificationCode = Math.floor(
      100000 + Math.random() * 900000
    ).toString();

    const resetToken = await encrypt({ email, type: 'password-reset' });

    await TemporaryToken.create({
      email,
      token: resetToken,
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

    const response = NextResponse.json(
      createSuccessResponse(200, 'Password reset email sent successfully.'),
      { status: 200 }
    );

    response.cookies.set('resetToken', resetToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 900,
    });

    return response;
  } catch (error) {
    console.error('Error in forgot password:', error);
    return NextResponse.json(
      createErrorResponse(500, 'Internal server error.'),
      { status: 500 }
    );
  }
}
