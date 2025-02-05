'use server';

import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/db/db';
import Psychologist from '@/models/Psychologist';
import { createErrorResponse, createSuccessResponse } from '@/lib/response';

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const psychologists = await Psychologist.find({}).exec();

    if (!psychologists || psychologists.length === 0) {
      return NextResponse.json(
        createSuccessResponse(200, {
          message: 'No psychologists found',
          psychologists: [],
        })
      );
    }

    const formattedPsychologists = psychologists.map(profile => ({
      id: profile._id,
      firstName: profile.firstName || null,
      lastName: profile.lastName || null,
      email: profile.email || null,
      country: profile.country || null,
      city: profile.city || null,
      about: profile.about || null,
      profilePhoto: profile.profilePhotoUrl || null,
      licenseType: profile.licenseType || null,
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
    }));

    return NextResponse.json(
      createSuccessResponse(200, {
        message: 'Psychologists fetched successfully',
        psychologists: formattedPsychologists,
      })
    );
  } catch (error) {
    console.error('Server Error:', error);
    return NextResponse.json(
      createErrorResponse(500, 'Internal Server Error: ' + error.message)
    );
  }
}
