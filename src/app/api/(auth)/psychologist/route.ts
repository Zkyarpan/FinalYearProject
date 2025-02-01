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

// export async function POST(req: NextRequest) {
//   try {
//     await connectDB();

//     const { fields, files } = await parseForm(req);
//     const { profilePhoto, certificateOrLicense } = files;

//     const existingUser = await Psychologist.findOne({ email: fields.email });
//     if (existingUser) {
//       return NextResponse.json(
//         createErrorResponse(400, 'Email already registered.'),
//         { status: 400 }
//       );
//     }

//     const tempToken = await TemporaryToken.findOne({
//       email: fields.email,
//       verificationCodeExpiry: { $gt: new Date() },
//     });

//     if (!tempToken) {
//       const verificationCode = Math.floor(
//         100000 + Math.random() * 900000
//       ).toString();
//       await TemporaryToken.findOneAndUpdate(
//         { email: fields.email },
//         {
//           email: fields.email,
//           verificationCode: verificationCode,
//           verificationCodeExpiry: new Date(Date.now() + 15 * 60 * 1000),
//         },
//         { upsert: true, new: true }
//       );

//       const emailSent = await sendVerificationEmail(
//         fields.email,
//         verificationCode
//       );
//       if (!emailSent) {
//         return NextResponse.json(
//           createErrorResponse(500, 'Failed to send verification email.'),
//           { status: 500 }
//         );
//       }
//       return NextResponse.json(
//         createErrorResponse(
//           400,
//           'Please verify your email to complete registration.'
//         ),
//         { status: 400 }
//       );
//     }

//     const hashedPassword = await bcrypt.hash(fields.password, 10);
//     const profilePhotoUrl = await uploadToCloudinary({
//       fileBuffer: profilePhoto.buffer,
//       folder: 'photos/profile-images',
//       filename: profilePhoto.originalFilename,
//       mimetype: profilePhoto.mimetype,
//     });

//     const certificateOrLicenseUrl = await uploadToCloudinary({
//       fileBuffer: certificateOrLicense.buffer,
//       folder: 'photos/certificates',
//       filename: certificateOrLicense.originalFilename,
//       mimetype: certificateOrLicense.mimetype,
//     });

//     const psychologist = new Psychologist({
//       firstName: fields.firstName,
//       lastName: fields.lastName,
//       email: fields.email.toLowerCase(),
//       password: hashedPassword,
//       country: fields.country,
//       streetAddress: fields.streetAddress,
//       city: fields.city,
//       about: fields.about,
//       profilePhotoUrl,
//       certificateOrLicenseUrl,
//       licenseNumber: fields.licenseNumber,
//       licenseType: fields.licenseType,
//       yearsOfExperience: fields.yearsOfExperience,
//       education: JSON.parse(fields.education),
//       specializations: JSON.parse(fields.specializations),
//       languages: JSON.parse(fields.languages),
//       sessionDuration: parseInt(fields.sessionDuration),
//       sessionFee: parseFloat(fields.sessionFee),
//       sessionFormats: JSON.parse(fields.sessionFormats),
//       acceptsInsurance: Boolean(fields.acceptsInsurance),
//       insuranceProviders: JSON.parse(fields.insuranceProviders),
//       availability: JSON.parse(fields.availability),
//       acceptingNewClients: Boolean(fields.acceptingNewClients),
//       ageGroups: JSON.parse(fields.ageGroups),
//       isVerified: true,
//       role: 'psychologist',
//     });

//     await psychologist.save();

//     const accessToken = await encrypt({
//       id: psychologist._id,
//       role: 'psychologist',
//       isVerified: true,
//       email: psychologist.email,
//     });

//     const response = NextResponse.json(
//       createSuccessResponse(201, {
//         message: 'Account created successfully. Please log in.',
//         user_data: {
//           id: psychologist._id,
//           email: psychologist.email,
//           role: 'psychologist',
//         },
//       }),
//       { status: 201 }
//     );

//     response.cookies.set('accessToken', accessToken, {
//       httpOnly: true,
//       secure: process.env.NODE_ENV === 'production',
//       sameSite: 'lax',
//       path: '/',
//       maxAge: 60 * 60 * 24,
//     });

//     return response;
//   } catch (error) {
//     console.error('Server Error:', error);
//     return NextResponse.json(
//       createErrorResponse(500, 'Internal Server Error'),
//       { status: 500 }
//     );
//   }
// }

export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const { fields, files } = await parseForm(req);
    const { profilePhoto, certificateOrLicense } = files;
    const { email, password } = fields;

    if (!email || !password) {
      return NextResponse.json(
        createErrorResponse(400, 'All fields are required.'),
        { status: 400 }
      );
    }

    const existingUser = await Psychologist.findOne({
      email: email.toLowerCase(),
    });
    if (existingUser) {
      return NextResponse.json(
        createErrorResponse(400, 'Email already registered.'),
        { status: 400 }
      );
    }

    // Upload files to Cloudinary first
    const profilePhotoUrl = await uploadToCloudinary({
      fileBuffer: profilePhoto.buffer,
      folder: 'photos/profile-images',
      filename: profilePhoto.originalFilename,
      mimetype: profilePhoto.mimetype,
    });

    const certificateOrLicenseUrl = await uploadToCloudinary({
      fileBuffer: certificateOrLicense.buffer,
      folder: 'photos/certificates',
      filename: certificateOrLicense.originalFilename,
      mimetype: certificateOrLicense.mimetype,
    });

    // Generate verification code
    const verificationCode = Math.floor(
      100000 + Math.random() * 900000
    ).toString();
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create temporary token with all psychologist data
    const psychologistData = {
      firstName: fields.firstName,
      lastName: fields.lastName,
      email: email.toLowerCase(),
      password: hashedPassword,
      country: fields.country,
      streetAddress: fields.streetAddress,
      city: fields.city,
      about: fields.about,
      profilePhotoUrl,
      certificateOrLicenseUrl,
      licenseNumber: fields.licenseNumber,
      licenseType: fields.licenseType,
      yearsOfExperience: fields.yearsOfExperience,
      education: JSON.parse(fields.education),
      specializations: JSON.parse(fields.specializations),
      languages: JSON.parse(fields.languages),
      sessionDuration: parseInt(fields.sessionDuration),
      sessionFee: parseFloat(fields.sessionFee),
      sessionFormats: JSON.parse(fields.sessionFormats),
      acceptsInsurance: Boolean(fields.acceptsInsurance),
      insuranceProviders: JSON.parse(fields.insuranceProviders),
      availability: JSON.parse(fields.availability),
      acceptingNewClients: Boolean(fields.acceptingNewClients),
      ageGroups: JSON.parse(fields.ageGroups),
      isVerified: false,
      role: 'psychologist',
    };

    const token = await encrypt({ ...psychologistData });

    // Save verification data
    await TemporaryToken.findOneAndUpdate(
      { email: email.toLowerCase() },
      {
        email: email.toLowerCase(),
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
