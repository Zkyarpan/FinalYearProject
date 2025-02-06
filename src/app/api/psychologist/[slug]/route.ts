'use server';

import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/db/db';
import Psychologist from '@/models/Psychologist';
import { createErrorResponse, createSuccessResponse } from '@/lib/response';

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    await connectDB();

    const slug = await params.slug;

    if (!slug) {
      return NextResponse.json(createErrorResponse(400, 'Slug is required'), {
        status: 400,
      });
    }

    const nameParts = slug
      .toLowerCase()
      .replace(/^dr-/, '')
      .split('-')
      .filter(Boolean);

    if (nameParts.length < 2) {
      return NextResponse.json(
        createErrorResponse(400, 'Invalid name format in slug'),
        { status: 400 }
      );
    }

    const firstName = nameParts[0];
    const lastName = nameParts.slice(1).join(' ');

    const psychologist: any = await Psychologist.findOne({
      firstName: new RegExp(`^${firstName}$`, 'i'),
      lastName: new RegExp(`^${lastName}$`, 'i'),
    }).lean();

    if (!psychologist) {
      return NextResponse.json(
        createErrorResponse(404, 'Psychologist not found'),
        { status: 404 }
      );
    }

    const formattedPsychologist = {
      id: psychologist._id.toString(),
      firstName: psychologist.firstName || '',
      lastName: psychologist.lastName || '',
      email: psychologist.email || '',
      country: psychologist.country || '',
      streetAddress: psychologist.streetAddress || '',
      city: psychologist.city || '',
      about: psychologist.about || '',
      profilePhoto: psychologist.profilePhotoUrl || '',
      certificateOrLicense: psychologist.certificateOrLicenseUrl || '',
      licenseType: psychologist.licenseType || '',
      licenseNumber: psychologist.licenseNumber || '',
      yearsOfExperience: psychologist.yearsOfExperience || 0,
      education: psychologist.education || [],
      languages: psychologist.languages || [],
      specializations: psychologist.specializations || [],
      sessionDuration: psychologist.sessionDuration || 0,
      sessionFee: psychologist.sessionFee || 0,
      sessionFormats: psychologist.sessionFormats || [],
      acceptsInsurance: psychologist.acceptsInsurance || false,
      insuranceProviders: psychologist.insuranceProviders || [],
      acceptingNewClients: psychologist.acceptingNewClients || false,
      ageGroups: psychologist.ageGroups || [],
      availability: psychologist.availability || {},
      fullName: `Dr. ${psychologist.firstName} ${psychologist.lastName}`,
    };

    return NextResponse.json(
      createSuccessResponse(200, {
        message: 'Psychologist fetched successfully',
        psychologist: formattedPsychologist,
      }),
      { status: 200 }
    );
  } catch (error) {
    console.error('Server error:', error);
    return NextResponse.json(
      createErrorResponse(500, 'Internal Server Error'),
      { status: 500 }
    );
  }
}
