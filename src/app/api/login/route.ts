'use server';

import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/db/db';
import Account from '@/models/Account';
import bcrypt from 'bcryptjs';
import { createSuccessResponse, createErrorResponse } from '@/lib/response';
import { encrypt } from '@/lib/token';

export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const body = await req.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        createErrorResponse(400, 'All fields are required'),
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        createErrorResponse(400, 'Password must be at least 8 characters long'),
        { status: 400 }
      );
    }

    const account = await Account.findOne({ email });
    if (!account) {
      return NextResponse.json(
        createErrorResponse(400, 'Invalid email or password'),
        { status: 400 }
      );
    }

    const isPasswordValid = await bcrypt.compare(password, account.password);
    if (!isPasswordValid) {
      return NextResponse.json(
        createErrorResponse(400, 'Invalid email or password'),
        { status: 400 }
      );
    }

    const accessToken = await encrypt({
      id: account._id,
      role: account.role,
    });
    const refreshToken = await encrypt({
      id: account._id,
      type: 'refresh',
    });

    const accessTokenExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    const refreshTokenExpires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    const response = NextResponse.json(
      createSuccessResponse(200, {
        message: 'Login successful',
        accessToken,
        user_data: {
          id: account._id,
          email: account.email,
          role: account.role,
        },
      }),
      { status: 200 }
    );

    response.cookies.set('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      expires: refreshTokenExpires,
    });
    console.log('Refresh Token Cookie Set:', refreshToken);

    response.cookies.set('accessToken', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      expires: accessTokenExpires,
    });
    console.log('Access Token Cookie Set:', accessToken);

    return response;
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      createErrorResponse(500, 'Internal Server Error'),
      { status: 500 }
    );
  }
}
