'use server';

import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/db/db';
import Psychologist from '@/models/Psychologist';
import bcrypt from 'bcryptjs';
import { uploadToCloudinary } from '@/utils/fileUpload';
import Busboy from 'busboy';
import { createErrorResponse, createSuccessResponse } from '@/lib/response';
import { encrypt } from '@/lib/token';
import { sendVerificationEmail } from '@/helpers/sendEmailVerification';
import TemporaryToken from '@/models/TemporaryToken';

async function parseForm(
  req: NextRequest
): Promise<{ fields: any; files: any }> {
  return new Promise((resolve, reject) => {
    const busboy = Busboy({
      headers: Object.fromEntries(req.headers.entries()),
    });

    const fields: Record<string, any> = {};
    const files: Record<string, any> = {};

    busboy.on('field', (fieldname, val) => {
      fields[fieldname] = val;
    });

    interface ParsedFiles {
      [key: string]: {
        buffer: Buffer;
        filename: string;
        mimetype: string;
      };
    }

    busboy.on(
      'file',
      (
        fieldname: string,
        file: NodeJS.ReadableStream,
        filename: string,
        encoding: string,
        mimetype: string
      ) => {
        const chunks: Buffer[] = [];
        file.on('data', (chunk: Buffer) => chunks.push(chunk));
        file.on('end', () => {
          (files as ParsedFiles)[fieldname] = {
            buffer: Buffer.concat(chunks),
            filename,
            mimetype,
          };
        });
      }
    );

    busboy.on('finish', () => {
      resolve({ fields, files });
    });

    busboy.on('error', error => reject(error));

    if (req.body) {
      const reader = req.body.getReader();
      const stream = new ReadableStream({
        start(controller) {
          function push() {
            reader.read().then(({ done, value }) => {
              if (done) {
                controller.close();
                return;
              }
              controller.enqueue(value);
              push();
            });
          }
          push();
        },
      });

      const nodeStream = require('stream').Readable.from(stream);
      nodeStream.pipe(busboy);
    } else {
      reject(new Error('Request body is null'));
    }
  });
}

export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const { fields, files } = await parseForm(req);

    // Validate required fields first
    const requiredFields = ['email', 'password', 'firstName', 'lastName'];
    for (const field of requiredFields) {
      if (!fields[field]) {
        return NextResponse.json(
          createErrorResponse(400, `${field} is required.`),
          { status: 400 }
        );
      }
    }

    // Validate required files
    if (!files.profilePhoto?.buffer || !files.certificateOrLicense?.buffer) {
      return NextResponse.json(
        createErrorResponse(
          400,
          'Profile photo and certificate/license are required.'
        ),
        { status: 400 }
      );
    }

    const { email, password } = fields;

    // Check for existing user
    const existingUser = await Psychologist.findOne({
      email: email.toString().toLowerCase(),
    });

    if (existingUser) {
      return NextResponse.json(
        createErrorResponse(400, 'Email already registered.'),
        { status: 400 }
      );
    }

    // Upload files with proper error handling
    let profilePhotoUrl, certificateOrLicenseUrl;
    try {
      profilePhotoUrl = await uploadToCloudinary({
        fileBuffer: files.profilePhoto.buffer,
        folder: 'photos/profile-images',
        filename: files.profilePhoto.originalFilename || 'profile-photo',
        mimetype: files.profilePhoto.mimetype || 'image/jpeg',
      });

      certificateOrLicenseUrl = await uploadToCloudinary({
        fileBuffer: files.certificateOrLicense.buffer,
        folder: 'photos/certificates',
        filename: files.certificateOrLicense.originalFilename || 'certificate',
        mimetype: files.certificateOrLicense.mimetype || 'image/jpeg',
      });
    } catch (error) {
      console.error('File upload error:', error);
      return NextResponse.json(
        createErrorResponse(500, 'Failed to upload files.'),
        { status: 500 }
      );
    }

    // Safely parse JSON fields with fallbacks
    const safeJSONParse = (value: any, defaultValue: any) => {
      try {
        return value ? JSON.parse(value) : defaultValue;
      } catch {
        return defaultValue;
      }
    };

    const verificationCode = Math.floor(
      100000 + Math.random() * 900000
    ).toString();
    const hashedPassword = await bcrypt.hash(password, 12);

    const psychologistData = {
      firstName: fields.firstName,
      lastName: fields.lastName,
      email: email.toString().toLowerCase(),
      password: hashedPassword,
      country: fields.country || '',
      streetAddress: fields.streetAddress || '',
      city: fields.city || '',
      about: fields.about || '',
      profilePhotoUrl,
      certificateOrLicenseUrl,
      licenseNumber: fields.licenseNumber || '',
      licenseType: fields.licenseType || '',
      yearsOfExperience: fields.yearsOfExperience || 0,
      education: safeJSONParse(fields.education, []),
      specializations: safeJSONParse(fields.specializations, []),
      languages: safeJSONParse(fields.languages, []),
      sessionDuration: 60, 
      sessionFee: parseFloat(fields.sessionFee) || 0,
      sessionFormats: safeJSONParse(fields.sessionFormats, []),
      acceptsInsurance: Boolean(fields.acceptsInsurance),
      insuranceProviders: safeJSONParse(fields.insuranceProviders, []),
      availability: safeJSONParse(fields.availability, {}),
      acceptingNewClients: Boolean(fields.acceptingNewClients),
      ageGroups: safeJSONParse(fields.ageGroups, []),
      isVerified: false,
      role: 'psychologist',
    };

    const token = await encrypt({ ...psychologistData });

    // Update or create temporary token
    await TemporaryToken.findOneAndUpdate(
      { email: email.toString().toLowerCase() },
      {
        email: email.toString().toLowerCase(),
        token,
        verificationCode,
        verificationCodeExpiry: new Date(Date.now() + 15 * 60 * 1000),
      },
      { upsert: true, new: true }
    );

    // Send verification email
    const emailResult = await sendVerificationEmail(email, verificationCode);
    if (!emailResult.success) {
      return NextResponse.json(
        createErrorResponse(500, 'Failed to send verification email.'),
        { status: 500 }
      );
    }

    const response = NextResponse.json(
      createSuccessResponse(200, {
        message: 'Please verify your email to complete registration.',
        token: token,
      }),
      { status: 200 }
    );

    // Set cookie
    response.cookies.set('tempToken', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      expires: new Date(Date.now() + 15 * 60 * 1000),
    });

    return response;
  } catch (error) {
    console.error('Server Error:', error);
    return NextResponse.json(
      createErrorResponse(500, 'Internal Server Error'),
      { status: 500 }
    );
  }
}
