'use server';

import { decrypt, encrypt, getTokenExpirationDate } from '@/lib/token';
import { NextRequest, NextResponse } from 'next/server';
import TemporaryToken from '@/models/TemporaryToken';
import Account from '@/models/User';
import Psychologist from '@/models/Psychologist';
import connectDB from '@/db/db';
import { createErrorResponse, createSuccessResponse } from '@/lib/response';

export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const body = await req.json();
    const { code } = body;

    if (!code || typeof code !== 'string') {
      return NextResponse.json(
        createErrorResponse(400, 'Valid verification code is required.'),
        { status: 400 }
      );
    }

    const record = await TemporaryToken.findOne({
      verificationCode: code.trim(),
    }).select('+token +verificationCodeExpiry');

    if (!record) {
      return NextResponse.json(
        createErrorResponse(
          404,
          'Invalid verification code. Please request a new code.'
        ),
        { status: 404 }
      );
    }

    const now = new Date();
    const expiryDate = new Date(record.verificationCodeExpiry);

    if (now > expiryDate) {
      await TemporaryToken.deleteOne({ _id: record._id });
      return NextResponse.json(
        createErrorResponse(
          410,
          'Verification code has expired. Please request a new code.'
        ),
        { status: 410 }
      );
    }

    const payload = await decrypt(record.token);
    if (!payload || !payload.email) {
      await TemporaryToken.deleteOne({ _id: record._id });
      return NextResponse.json(
        createErrorResponse(400, 'Invalid token data. Please sign up again.'),
        { status: 400 }
      );
    }

    const isPsychologist = payload.role === 'psychologist';

    const existingAccount = isPsychologist
      ? await Psychologist.findOne({
          email: { $regex: new RegExp(`^${payload.email}$`, 'i') },
        })
      : await Account.findOne({
          email: { $regex: new RegExp(`^${payload.email}$`, 'i') },
        });

    if (existingAccount) {
      await TemporaryToken.deleteOne({ _id: record._id });
      return NextResponse.json(
        createErrorResponse(409, 'An account with this email already exists.'),
        { status: 409 }
      );
    }

    let newAccount;
    if (isPsychologist) {
      newAccount = new Psychologist({
        ...payload,
        email: payload.email.toLowerCase(),
        isVerified: true,
        approvalStatus: 'pending', // Ensure approval status is set to pending
        sessionDuration: '60',
        createdAt: new Date(),
      });
    } else {
      newAccount = new Account({
        email: payload.email.toLowerCase(),
        password: payload.hashedPassword,
        isVerified: true,
        role: 'user',
        createdAt: new Date(),
      });
    }

    await newAccount.save();
    await TemporaryToken.deleteOne({ _id: record._id });

    const tokenPayload = {
      id: newAccount._id.toString(),
      email: newAccount.email,
      role: newAccount.role,
      isVerified: true,
      profileComplete: false,
      approvalStatus: isPsychologist ? 'pending' : 'approved', // Include approval status in token
    };

    const sessionToken = await encrypt(tokenPayload, '24h');
    const expires = await getTokenExpirationDate('24h');

    // Include a clear message about approval status for psychologists
    const message = isPsychologist
      ? 'Account verified. Your account requires admin approval before you can log in.'
      : 'Account verified and created successfully.';

    const response = NextResponse.json(
      createSuccessResponse(201, {
        message,
        redirectUrl: isPsychologist ? '/login' : '/dashboard',
        user: {
          id: newAccount._id.toString(),
          email: newAccount.email,
          role: newAccount.role,
          isVerified: true,
          profileComplete: false,
          approvalStatus: isPsychologist ? 'pending' : 'approved',
        },
      }),
      { status: 201 }
    );

    response.cookies.set('accessToken', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      expires,
    });

    return response;
  } catch (error) {
    console.error('Verification Error:', error);

    const errorMessage =
      process.env.NODE_ENV === 'development'
        ? `Verification failed: ${error.message}`
        : 'Verification failed. Please try again.';

    return NextResponse.json(createErrorResponse(500, errorMessage), {
      status: 500,
    });
  }
}
