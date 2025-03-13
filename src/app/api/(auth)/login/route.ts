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
    console.log('🔍 Login API: Connected to database');

    const { email, password } = await req.json();
    console.log(`🔍 Login attempt for email: ${email}`);

    if (!email || !password) {
      console.log('❌ Missing email or password');
      return NextResponse.json(
        createErrorResponse(400, 'All fields are required'),
        { status: 400 }
      );
    }

    // Check for regular user first
    console.log('🔍 Checking for regular user account');
    let user = await Account.findOne({ email }).select('+password');
    let userType = 'user';
    let profile;

    if (user) {
      console.log(`✅ Found regular user with id: ${user._id}`);
      userType = user.role || 'user';
      profile = await Profile.findOne({ user: user._id });
    } else {
      // If not found, try finding a psychologist
      console.log('🔍 Checking for psychologist account');
      user = await Psychologist.findOne({ email }).select('+password');

      if (user) {
        console.log(`✅ Found psychologist with id: ${user._id}`);
        console.log(`👀 Psychologist approval status: ${user.approvalStatus}`);
        userType = 'psychologist';
      } else {
        console.log('❌ No user found with this email');
        return NextResponse.json(
          createErrorResponse(400, 'Invalid email or password'),
          { status: 400 }
        );
      }
    }

    // Now check the password
    console.log('🔍 Validating password');
    const isPasswordValid = await bcrypt.compare(password, user.password);
    console.log(`🔐 Password valid: ${isPasswordValid}`);

    if (!isPasswordValid) {
      console.log('❌ Password validation failed');
      return NextResponse.json(
        createErrorResponse(400, 'Invalid email or password'),
        { status: 400 }
      );
    }

    // Now check approval status for psychologists
    if (userType === 'psychologist') {
      console.log(
        `🔍 Checking psychologist approval status: ${user.approvalStatus}`
      );

      if (user.approvalStatus !== 'approved') {
        console.log(`🚫 Psychologist not approved: ${user.approvalStatus}`);

        // IMPORTANT: Return 403 status for pending/rejected accounts
        return NextResponse.json(
          createErrorResponse(
            403,
            user.approvalStatus === 'pending'
              ? 'Your account is pending approval by an administrator. Please check your email for updates.'
              : 'Your account has been rejected. Please check your email for more information.'
          ),
          { status: 403 }
        );
      }
      console.log('✅ Psychologist is approved');
    }

    // If we get here, authentication is successful
    console.log('✅ Authentication successful, creating session token');
    const isAdminOrPsychologist = ['admin', 'psychologist'].includes(userType);

    const accessToken = await encrypt({
      id: user._id,
      email: user.email,
      role: userType,
      isVerified: user.isVerified,
      profileComplete: isAdminOrPsychologist
        ? true
        : profile?.profileCompleted || false,
      approvalStatus:
        userType === 'psychologist' ? user.approvalStatus : 'approved',
    });

    let userData;

    if (userType === 'psychologist') {
      userData = {
        id: user._id,
        email: user.email,
        role: userType,
        isVerified: user.isVerified,
        profileComplete: true,
        firstName: user.firstName,
        lastName: user.lastName,
        profileImage: user.profilePhotoUrl,
        approvalStatus: user.approvalStatus,
        // Other fields omitted for brevity
      };
    } else {
      userData = {
        id: user._id,
        email: user.email,
        role: userType,
        isVerified: user.isVerified,
        profileComplete: profile?.profileCompleted || false,
        firstName: profile?.firstName || null,
        lastName: profile?.lastName || null,
        profileImage: profile?.image || null,
        approvalStatus: 'approved',
      };
    }

    console.log('✅ Creating successful response');
    const response = NextResponse.json(
      createSuccessResponse(200, {
        message: 'Login successful',
        accessToken,
        user_data: userData,
      }),
      { status: 200 }
    );

    response.cookies.set('accessToken', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24,
    });

    return response;
  } catch (error) {
    console.error('❌ Server Error:', error);
    return NextResponse.json(
      createErrorResponse(500, 'Internal Server Error: ' + error.message),
      { status: 500 }
    );
  }
}
