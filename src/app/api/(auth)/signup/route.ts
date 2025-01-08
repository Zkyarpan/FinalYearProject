'use server';

import { encrypt } from '@/lib/token';
import { NextRequest, NextResponse } from 'next/server';
import { sendVerificationEmail } from '@/helpers/sendEmailVerification';
import TemporaryToken from '@/models/TemporaryToken';
import Account from '@/models/Account';
import { v4 as uuidv4 } from 'uuid';
import connectDB from '@/db/db';
import { createSuccessResponse, createErrorResponse } from '@/lib/response';

export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const body = await req.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        createErrorResponse(400, 'All fields are required.'),
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        createErrorResponse(
          400,
          'Password must be at least 8 characters long.'
        ),
        { status: 400 }
      );
    }

    const existingAccount = await Account.findOne({ email });
    if (existingAccount) {
      return NextResponse.json(
        createErrorResponse(400, 'Email is already registered. Please login.'),
        { status: 400 }
      );
    }

    const existingTempToken = await TemporaryToken.findOne({ email });
    if (existingTempToken) {
      existingTempToken.verificationCode = uuidv4().slice(0, 6);
      existingTempToken.verificationCodeExpiry = new Date(
        Date.now() + 15 * 60 * 1000
      );
      await existingTempToken.save();

      const emailResult = await sendVerificationEmail(
        email,
        existingTempToken.verificationCode
      );

      if (!emailResult.success) {
        return NextResponse.json(
          createErrorResponse(500, 'Failed to resend verification email.'),
          { status: 500 }
        );
      }

      return NextResponse.json(
        createSuccessResponse(200, {
          message: 'Verification email resent successfully.',
          token: existingTempToken.token,
        }),
        { status: 200 }
      );
    }

    const verificationCode = Math.floor(
      100000 + Math.random() * 900000
    ).toString();
    const token = await encrypt({ email, password });

    await TemporaryToken.create({
      email,
      token,
      verificationCode,
      verificationCodeExpiry: new Date(Date.now() + 15 * 60 * 1000),
    });

    const emailResult = await sendVerificationEmail(email, verificationCode);

    if (!emailResult.success) {
      return NextResponse.json(
        createErrorResponse(500, 'Failed to send verification email.'),
        { status: 500 }
      );
    }

    const response = NextResponse.json(
      createSuccessResponse(200, {
        message: 'Verification email sent successfully.',
        token: token,
      }),
      { status: 200 }
    );
    response.cookies.set('tempToken', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      expires: new Date(Date.now() + 15 * 60 * 1000),
    });
    return response;
  } catch (error) {
    return NextResponse.json(
      createErrorResponse(500, 'Internal server error.'),
      { status: 500 }
    );
  }
}
