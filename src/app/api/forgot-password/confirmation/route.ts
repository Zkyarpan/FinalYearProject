'use server';

import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import TemporaryToken from '@/models/TemporaryToken';
import Account from '@/models/Account';
import connectDB from '@/db/db';
import { createErrorResponse, createSuccessResponse } from '@/lib/response';

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const { verificationCode, newPassword } = await req.json();

    if (!verificationCode || !newPassword) {
      return NextResponse.json(
        createErrorResponse(
          400,
          'Verification code and password are required.'
        ),
        { status: 400 }
      );
    }

    if (newPassword.length < 8) {
      return NextResponse.json(
        createErrorResponse(
          400,
          'Password must be at least 8 characters long.'
        ),
        { status: 400 }
      );
    }

    const tempToken = await TemporaryToken.findOne({ verificationCode });
    if (!tempToken) {
      return NextResponse.json(
        createErrorResponse(400, 'Invalid or expired verification code.'),
        { status: 400 }
      );
    }

    if (new Date() > new Date(tempToken.verificationCodeExpiry)) {
      return NextResponse.json(
        createErrorResponse(400, 'Verification code has expired.'),
        { status: 400 }
      );
    }

    const account = await Account.findOne({ email: tempToken.email });
    if (!account) {
      return NextResponse.json(createErrorResponse(404, 'Account not found.'), {
        status: 404,
      });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12);
    account.password = hashedPassword;
    await account.save();

    await TemporaryToken.deleteOne({ verificationCode });

    return NextResponse.json(
      createSuccessResponse(200, 'Password reset successfully.'),
      { status: 200 }
    );
  } catch (error) {
    console.error('Error in password reset:', error);
    return NextResponse.json(
      createErrorResponse(500, 'Internal server error.'),
      { status: 500 }
    );
  }
}
