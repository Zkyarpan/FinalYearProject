// 'use server';

// import { decrypt, encrypt, getTokenExpirationDate } from '@/lib/token';
// import { NextRequest, NextResponse } from 'next/server';
// import TemporaryToken from '@/models/TemporaryToken';
// import Account from '@/models/User';
// import connectDB from '@/db/db';
// import { createErrorResponse, createSuccessResponse } from '@/lib/response';

// export async function POST(req: NextRequest) {
//   try {
//     await connectDB();
//     const { code } = await req.json();

//     if (!code) {
//       return NextResponse.json(
//         createErrorResponse(400, 'Verification code is required.'),
//         { status: 400 }
//       );
//     }

//     const record = await TemporaryToken.findOne({ verificationCode: code });

//     if (!record) {
//       return NextResponse.json(
//         createErrorResponse(400, 'Invalid verification code.'),
//         { status: 400 }
//       );
//     }

//     if (new Date() > new Date(record.verificationCodeExpiry)) {
//       return NextResponse.json(
//         createErrorResponse(400, 'Verification code expired.'),
//         { status: 400 }
//       );
//     }

//     const payload = await decrypt(record.token);
//     if (!payload || !payload.email || !payload.hashedPassword) {
//       return NextResponse.json(
//         createErrorResponse(400, 'Invalid token data.'),
//         { status: 400 }
//       );
//     }

//     const { email, hashedPassword } = payload;

//     const existingAccount = await Account.findOne({ email });
//     if (existingAccount) {
//       return NextResponse.json(
//         createErrorResponse(400, 'Account already exists.'),
//         { status: 400 }
//       );
//     }

//     const newAccount = new Account({
//       email,
//       password: hashedPassword,
//       isVerified: true,
//       role: 'user',
//     });

//     await newAccount.save();
//     await TemporaryToken.deleteOne({ verificationCode: code });

//     const tokenPayload = {
//       id: newAccount._id.toString(),
//       email: newAccount.email,
//       role: newAccount.role,
//       isVerified: true,
//     };

//     // Generate access token with 24h expiration
//     const sessionToken = await encrypt(tokenPayload, '24h');

//     // Get expiration date for the token
//     const expires = await getTokenExpirationDate('24h');

//     const response = NextResponse.json(
//       createSuccessResponse(200, {
//         message: 'Account verified successfully.',
//         redirectUrl: '/dashboard',
//         user: {
//           id: newAccount._id.toString(),
//           email: newAccount.email,
//           role: newAccount.role,
//           isVerified: true,
//           profileComplete: false,
//         },
//       })
//     );

//     response.cookies.set('accessToken', sessionToken, {
//       httpOnly: true,
//       secure: true,
//       sameSite: 'lax',
//       path: '/',
//       expires,
//     });
//     return response;
//   } catch (error) {
//     console.error('Verification Error:', error);
//     return NextResponse.json(
//       createErrorResponse(500, 'Internal server error'),
//       { status: 500 }
//     );
//   }
// }

'use server';

import { decrypt, encrypt, getTokenExpirationDate } from '@/lib/token';
import { NextRequest, NextResponse } from 'next/server';
import TemporaryToken from '@/models/TemporaryToken';
import Account from '@/models/User';
import connectDB from '@/db/db';
import { createErrorResponse, createSuccessResponse } from '@/lib/response';

export async function POST(req: NextRequest) {
  try {
    await connectDB();

    // Input validation
    const body = await req.json();
    const { code } = body;

    if (!code || typeof code !== 'string') {
      return NextResponse.json(
        createErrorResponse(400, 'Valid verification code is required.'),
        { status: 400 }
      );
    }

    // Find verification record
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

    // Check expiration with a more precise comparison
    const now = new Date();
    const expiryDate = new Date(record.verificationCodeExpiry);

    if (now > expiryDate) {
      // Clean up expired token
      await TemporaryToken.deleteOne({ _id: record._id });

      return NextResponse.json(
        createErrorResponse(
          410,
          'Verification code has expired. Please request a new code.'
        ),
        { status: 410 }
      );
    }

    // Decrypt and validate token data
    const payload = await decrypt(record.token);
    if (!payload || !payload.email || !payload.hashedPassword) {
      await TemporaryToken.deleteOne({ _id: record._id });

      return NextResponse.json(
        createErrorResponse(400, 'Invalid token data. Please sign up again.'),
        { status: 400 }
      );
    }

    const { email, hashedPassword } = payload;

    // Check for existing account (case-insensitive email check)
    const existingAccount = await Account.findOne({
      email: { $regex: new RegExp(`^${email}$`, 'i') },
    });

    if (existingAccount) {
      await TemporaryToken.deleteOne({ _id: record._id });

      return NextResponse.json(
        createErrorResponse(409, 'An account with this email already exists.'),
        { status: 409 }
      );
    }

    // Create new account
    const newAccount = new Account({
      email: email.toLowerCase(), // Normalize email
      password: hashedPassword,
      isVerified: true,
      role: 'user',
      createdAt: new Date(),
    });

    await newAccount.save();

    // Clean up used verification code
    await TemporaryToken.deleteOne({ _id: record._id });

    // Generate session token
    const tokenPayload = {
      id: newAccount._id.toString(),
      email: newAccount.email,
      role: newAccount.role,
      isVerified: true,
      profileComplete: false,
    };

    const sessionToken = await encrypt(tokenPayload, '24h');
    const expires = await getTokenExpirationDate('24h');

    // Create response with user data
    const response = NextResponse.json(
      createSuccessResponse(201, {
        message: 'Account verified and created successfully.',
        redirectUrl: '/dashboard',
        user: {
          id: newAccount._id.toString(),
          email: newAccount.email,
          role: newAccount.role,
          isVerified: true,
          profileComplete: false,
        },
      }),
      { status: 201 }
    );

    // Set authentication cookies
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
