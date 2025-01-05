'use server';

import { decrypt, encrypt } from '@/lib/token';
import { NextRequest, NextResponse } from 'next/server';
import TemporaryToken from '@/models/TemporaryToken';
import Account from '@/models/Account';
import bcrypt from 'bcryptjs';
import connectDB from '@/db/db';
import { createErrorResponse, createSuccessResponse } from '@/lib/response';

export async function POST(req: NextRequest) {
  try {
    connectDB();
    const { code } = await req.json();

    if (!code) {
      return NextResponse.json(
        createSuccessResponse(400, 'Verification code is required.'),
        { status: 400 }
      );
    }

    const record = await TemporaryToken.findOne({ verificationCode: code });

    if (!record) {
      return NextResponse.json(
        createSuccessResponse(400, 'Invalid verification code.'),
        { status: 400 }
      );
    }

    if (new Date() > new Date(record.verificationCodeExpiry)) {
      return NextResponse.json(
        createSuccessResponse(400, 'Verification code has expired.'),
        { status: 400 }
      );
    }

    const payload = await decrypt(record.token);

    if (!payload) {
      return NextResponse.json(
        createSuccessResponse(400, 'Failed to decrypt token.'),
        { status: 400 }
      );
    }

    const { email, password } = payload;

    if (!password) {
      return NextResponse.json(
        createSuccessResponse(400, 'Password is required.'),
        { status: 400 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const newAccount = new Account({
      email,
      password: hashedPassword,
      isVerified: true,
      role: 'user',
    });

    await newAccount.save();
    await TemporaryToken.deleteOne({ verificationCode: code });

    const sessionToken = await encrypt({
      id: newAccount._id.toString(),
      email: newAccount.email,
      role: newAccount.role,
      isVerified: true,
    });

    const response = NextResponse.json(
      createSuccessResponse(200, {
        message: 'Verified successfully.',
        redirectUrl: '/dashboard',
      })
    );

    response.cookies.set({
      name: 'accessToken',
      value: sessionToken,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60,
    });

    return response;
  } catch (error) {
    console.error('Error in verification:', error);
    return NextResponse.json(
      createErrorResponse(500, 'Internal server error.'),
      { status: 500 }
    );
  }
}
