'use server';

import { encrypt } from '@/lib/token';
import { NextRequest, NextResponse } from 'next/server';
import { sendVerificationEmail } from '@/helpers/sendEmailVerification';
import TemporaryToken from '@/models/TemporaryToken';
import Account from '@/models/User';
import connectDB from '@/db/db';
import bcrypt from 'bcryptjs';
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
        createErrorResponse(400, 'Email already registered. Please login.'),
        { status: 400 }
      );
    }

    const verificationCode = Math.floor(
      100000 + Math.random() * 900000
    ).toString();
    const hashedPassword = await bcrypt.hash(password, 12);
    const token = await encrypt({ email, hashedPassword });

    await TemporaryToken.findOneAndUpdate(
      { email },
      {
        token,
        verificationCode,
        verificationCodeExpiry: new Date(Date.now() + 15 * 60 * 1000),
      },
      { upsert: true, new: true }
    );

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
    console.error('Signup Error:', error);
    return NextResponse.json(
      createErrorResponse(500, 'Internal server error.'),
      { status: 500 }
    );
  }
}
