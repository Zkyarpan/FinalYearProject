'use server';

import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/db/db';
import { withAuth } from '@/middleware/authMiddleware';
import Psychologist from '@/models/Psychologist';
import { createErrorResponse, createSuccessResponse } from '@/lib/response';

export async function GET(req: NextRequest) {
  return withAuth(
    async (req: NextRequest, user: any) => {
      try {
        await connectDB();
        const profile = await Psychologist.findById(user.id).exec();

        if (!profile) {
          return NextResponse.json(
            createSuccessResponse(200, {
              message: 'Profile not found',
              profile: null,
            })
          );
        }

        return NextResponse.json(
          createSuccessResponse(200, {
            message: 'Psychologists fetched successfully',
            profile: {
              id: profile._id,
              firstName: profile.firstName || null,
              lastName: profile.lastName || null,
              email: profile.email || null,
              country: profile.country || null,
              streetAddress: profile.streetAddress || null,
              city: profile.city || null,
              about: profile.about || null,
              profilePhoto: profile.profilePhotoUrl || null,
              certificateOrLicense: profile.certificateOrLicenseUrl || null,
              licenseType: profile.licenseType || null,
              licenseNumber: profile.licenseNumber || null,
              yearsOfExperience: profile.yearsOfExperience || null,
              education: profile.education || [],
              languages: profile.languages || [],
              specializations: profile.specializations || [],
              sessionDuration: profile.sessionDuration || null,
              sessionFee: profile.sessionFee || null,
              sessionFormats: profile.sessionFormats || [],
              acceptsInsurance: profile.acceptsInsurance || false,
              insuranceProviders: profile.insuranceProviders || [],
              acceptingNewClients: profile.acceptingNewClients || false,
              ageGroups: profile.ageGroups || [],
              availability: profile.availability || {},
              createdAt: profile.createdAt,
              updatedAt: profile.updatedAt,
            },
          })
        );
      } catch (error) {
        console.error('Server Error:', error);
        return NextResponse.json(
          createErrorResponse(500, 'Internal Server Error: ' + error.message)
        );
      }
    },
    req,
    ['psychologist']
  );
}
