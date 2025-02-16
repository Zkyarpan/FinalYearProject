'use server';

import { decrypt } from '@/lib/token';
import { NextRequest, NextResponse } from 'next/server';
import { createErrorResponse } from '@/lib/response';
import User from '@/models/User';

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer')) {
      return NextResponse.json(createErrorResponse(401, 'No token provided'), {
        status: 401,
      });
    }

    const token = authHeader.split(' ')[1];
    const decoded = await decrypt(token);

    if (!decoded) {
      return NextResponse.json(createErrorResponse(401, 'Invalid token'), {
        status: 401,
      });
    }

    const userData = await User.findById(decoded.id);

    const response = NextResponse.json({
      _id: userData._id,
      email: userData.email,
      role: userData.role,
      isVerified: userData.isVerified,
      profileComplete: userData.profileComplete,
      firstName: userData.firstName,
      lastName: userData.lastName,
      profileImage: userData.profileImage,
      country: userData.country,
      streetAddress: userData.streetAddress,
      city: userData.city,
      about: userData.about,
      certificateOrLicense: userData.certificateOrLicense,
      licenseNumber: userData.licenseNumber,
      licenseType: userData.licenseType,
      education: userData.education,
      specializations: userData.specializations,
      yearsOfExperience: userData.yearsOfExperience,
      languages: userData.languages,
      sessionDuration: userData.sessionDuration,
      sessionFee: userData.sessionFee,
      sessionFormats: userData.sessionFormats,
      acceptsInsurance: userData.acceptsInsurance,
      insuranceProviders: userData.insuranceProviders,
      availability: userData.availability,
      acceptingNewClients: userData.acceptingNewClients,
      ageGroups: userData.ageGroups,
    });

    // Set strict cache control headers
    response.headers.set(
      'Cache-Control',
      'private, no-cache, no-store, must-revalidate'
    );
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');

    return response;
  } catch (error) {
    console.error('Token validation error:', error);
    return NextResponse.json(createErrorResponse(401, 'Invalid token'), {
      status: 401,
    });
  }
}
