'use server';

import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/db/db';
import Account from '@/models/User';
import Psychologist from '@/models/Psychologist';
import Profile from '@/models/Profile';
import bcrypt from 'bcryptjs';
import { createSuccessResponse, createErrorResponse } from '@/lib/response';
import { encrypt } from '@/lib/token';

// export async function POST(req: NextRequest) {
//   try {
//     await connectDB();

//     const body = await req.json();

//     const { email, password } = body;
//     if (!email || !password) {
//       return NextResponse.json(
//         createErrorResponse(400, 'All fields are required'),
//         { status: 400 }
//       );
//     }

//     let user = await Account.findOne({ email }).select('+password');
//     let userType = 'user';

//     if (user) {
//       userType = user.role || 'user';
//     } else {
//       user = await Psychologist.findOne({ email }).select('+password');
//       if (user) {
//         userType = 'psychologist';
//       }
//     }

//     if (!user) {
//       return NextResponse.json(
//         createErrorResponse(400, 'Invalid email or password'),
//         { status: 400 }
//       );
//     }

//     const isPasswordValid = await bcrypt.compare(password, user.password);
//     if (!isPasswordValid) {
//       return NextResponse.json(
//         createErrorResponse(400, 'Invalid email or password'),
//         { status: 400 }
//       );
//     }

//     const profile = await Profile.findOne({ user: user._id });

//     const profileComplete = profile ? profile.profileCompleted : false;

//     const accessToken = await encrypt({
//       id: user._id,
//       email: user.email,
//       role: userType,
//       isVerified: user.isVerified,
//       profileComplete,
//     });

//     const response = NextResponse.json(
//       createSuccessResponse(200, {
//         message: 'Login successful',
//         accessToken,
//         user_data: {
//           id: user._id,
//           email: user.email,
//           role: userType,
//           isVerified: user.isVerified,
//           profileComplete: profile ? profile.profileCompleted : false,
//           firstName: profile ? profile.firstName : null,
//           lastName: profile ? profile.lastName : null,
//           profileImage: profile ? profile.image : null,
//         },
//       }),
//       { status: 200 }
//     );

//     response.cookies.set('accessToken', accessToken, {
//       httpOnly: true,
//       secure: true,
//       sameSite: 'lax',
//       path: '/',
//       maxAge: 60 * 60 * 24,
//     });

//     return response;
//   } catch (error) {
//     console.error('Server Error:', error);
//     return NextResponse.json(
//       createErrorResponse(
//         500,
//         'Internal Server Error due to: ' + error.message
//       ),
//       { status: 500 }
//     );
//   }
// }

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        createErrorResponse(400, 'All fields are required'),
        { status: 400 }
      );
    }

    let user = await Account.findOne({ email }).select('+password');
    let userType = 'user';
    let profile;

    if (user) {
      userType = user.role || 'user';
      profile = await Profile.findOne({ user: user._id });
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

    const isAdminOrPsychologist = ['admin', 'psychologist'].includes(userType);

    const accessToken = await encrypt({
      id: user._id,
      email: user.email,
      role: userType,
      isVerified: user.isVerified,
      profileComplete: isAdminOrPsychologist
        ? true
        : profile?.profileCompleted || false,
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
        certificateOrLicense: user.certificateOrLicenseUrl,
        country: user.country,
        streetAddress: user.streetAddress,
        city: user.city,
        about: user.about,
        licenseNumber: user.licenseNumber,
        licenseType: user.licenseType,
        education: user.education,
        specializations: user.specializations,
        yearsOfExperience: user.yearsOfExperience,
        languages: user.languages,
        sessionDuration: user.sessionDuration,
        sessionFee: user.sessionFee,
        sessionFormats: user.sessionFormats,
        acceptsInsurance: user.acceptsInsurance,
        insuranceProviders: user.insuranceProviders || [],
        availability: user.availability,
        acceptingNewClients: user.acceptingNewClients,
        ageGroups: user.ageGroups,
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
      };
    }

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
      secure: true,
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24,
    });

    return response;
  } catch (error) {
    console.error('Server Error:', error);
    return NextResponse.json(
      createErrorResponse(500, 'Internal Server Error: ' + error.message),
      { status: 500 }
    );
  }
}
