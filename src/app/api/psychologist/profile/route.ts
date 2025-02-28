// app/api/psychologist/ui/route.ts
'use server';

import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/db/db';
import Psychologist from '@/models/Psychologist';
import { createErrorResponse, createSuccessResponse } from '@/lib/response';

export async function GET(req: NextRequest) {
  try {
    await connectDB();

    // Get query parameters
    const { searchParams } = new URL(req.url);
    const specialization = searchParams.get('specialization');
    const limit = parseInt(searchParams.get('limit') || '50');

    // Build query
    let query: any = {};
    if (specialization) {
      query.specializations = { $in: [specialization] };
    }

    const psychologists = await Psychologist.find(query)
      .limit(limit)
      .sort({ firstName: 1 })
      .exec();

    if (!psychologists || psychologists.length === 0) {
      return NextResponse.json(
        createSuccessResponse(200, {
          message: 'No psychologists found',
          psychologists: [],
        })
      );
    }

    // Format exactly as expected by your UI component
    const formattedPsychologists = psychologists.map(profile => {
      // Convert Mongoose document to plain object
      const plainProfile = profile.toObject ? profile.toObject() : profile;

      return {
        id: plainProfile._id.toString(), // Use id, not _id
        firstName: plainProfile.firstName || '',
        lastName: plainProfile.lastName || '',
        email: plainProfile.email || '',
        country: plainProfile.country || '',
        city: plainProfile.city || '',
        about: plainProfile.about || '',
        profilePhoto: plainProfile.profilePhotoUrl || '', // Use profilePhoto, not profilePhotoUrl
        licenseType: plainProfile.licenseType || '',
        yearsOfExperience: plainProfile.yearsOfExperience || 0,
        education: plainProfile.education || [],
        languages: plainProfile.languages || [],
        specializations: plainProfile.specializations || [],
        sessionDuration: plainProfile.sessionDuration || '',
        sessionFee: plainProfile.sessionFee || 0,
        sessionFormats: plainProfile.sessionFormats || [],
        acceptsInsurance: plainProfile.acceptsInsurance || false,
        insuranceProviders: plainProfile.insuranceProviders || [],
        acceptingNewClients: plainProfile.acceptingNewClients || false,
        ageGroups: plainProfile.ageGroups || [],
        availability: plainProfile.availability || {},
      };
    });

    // Return in the exact format expected by your component
    return NextResponse.json(
      createSuccessResponse(200, {
        message: 'Psychologists fetched successfully',
        psychologists: formattedPsychologists,
      })
    );
  } catch (error) {
    console.error('Server Error:', error);
    return NextResponse.json(
      createErrorResponse(500, 'Internal Server Error: ' + error.message),
      { status: 500 }
    );
  }
}
