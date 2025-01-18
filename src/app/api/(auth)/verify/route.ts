'use server';

import { decrypt, encrypt } from '@/lib/token';
import { NextRequest, NextResponse } from 'next/server';
import TemporaryToken from '@/models/TemporaryToken';
import Account from '@/models/Account';
import connectDB from '@/db/db';
import { createErrorResponse, createSuccessResponse } from '@/lib/response';

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const { code } = await req.json();

    if (!code) {
      return NextResponse.json(
        createErrorResponse(400, 'Verification code is required.'),
        { status: 400 }
      );
    }

    const record = await TemporaryToken.findOne({ verificationCode: code });

    if (!record) {
      return NextResponse.json(
        createErrorResponse(400, 'Invalid verification code.'),
        { status: 400 }
      );
    }

    if (new Date() > new Date(record.verificationCodeExpiry)) {
      return NextResponse.json(
        createErrorResponse(400, 'Verification code expired.'),
        { status: 400 }
      );
    }

    const payload = await decrypt(record.token);
    if (!payload || !payload.email || !payload.hashedPassword) {
      return NextResponse.json(
        createErrorResponse(400, 'Invalid token data.'),
        { status: 400 }
      );
    }

    const { email, hashedPassword } = payload;

    const existingAccount = await Account.findOne({ email });
    if (existingAccount) {
      return NextResponse.json(
        createErrorResponse(400, 'Account already exists.'),
        { status: 400 }
      );
    }

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
        message: 'Account verified successfully.',
        redirectUrl: '/dashboard',
        user: {
          id: newAccount._id.toString(),
          email: newAccount.email,
          role: newAccount.role,
          isVerified: true,
          profileComplete: false,
        },
      })
    );

    const accessTokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    response.cookies.set('accessToken', sessionToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      path: '/',
      expires: accessTokenExpires,
    });
    return response;
  } catch (error) {
    console.error('Verification Error:', error);
    return NextResponse.json(
      createErrorResponse(500, 'Internal server error'),
      { status: 500 }
    );
  }
}
