'use server';

import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/db/db';
import Account from '@/models/User';
import Psychologist from '@/models/Psychologist';
import Profile from '@/models/Profile';
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

    let user = await Account.findOne({ email }).select('+password');
    let userType = 'user';

    if (user) {
      userType = user.role || 'user';
    } else {
      user = await Psychologist.findOne({ email }).select('+password');
      if (user) {
        userType = 'psychologist';
      }
    }

    if (!user) {
      return NextResponse.json(
        createErrorResponse(400, 'Invalid email or password'),
        { status: 400 }
      );
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return NextResponse.json(
        createErrorResponse(400, 'Invalid email or password'),
        { status: 400 }
      );
    }

    const profile = await Profile.findOne({ user: user._id });

    const profileComplete = profile ? profile.profileCompleted : false;

    const accessToken = await encrypt({
      id: user._id,
      email: user.email,
      role: userType,
      isVerified: user.isVerified,
      profileComplete,
    });

    const response = NextResponse.json(
      createSuccessResponse(200, {
        message: 'Login successful',
        accessToken,
        user_data: {
          id: user._id,
          email: user.email,
          role: userType,
          isVerified: user.isVerified,
          profileComplete: profile ? profile.profileCompleted : false,
          firstName: profile ? profile.firstName : null,
          lastName: profile ? profile.lastName : null,
          profileImage: profile ? profile.image : null,
        },
      }),
      { status: 200 }
    );

    response.cookies.set('accessToken', accessToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24, 
    });

    return response;
  } catch (error) {
    console.error('Server Error:', error);
    return NextResponse.json(
      createErrorResponse(
        500,
        'Internal Server Error due to: ' + error.message
      ),
      { status: 500 }
    );
  }
}
