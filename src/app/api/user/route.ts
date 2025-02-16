'use server';

import { NextRequest, NextResponse } from 'next/server';
import Profile from '@/models/Profile';
import connectDB from '@/db/db';
import { createSuccessResponse, createErrorResponse } from '@/lib/response';
import { decrypt } from '@/lib/token';
import Busboy from 'busboy';
import { uploadToCloudinary, validateFile } from '@/utils/fileUpload';
import { DEFAULT_AVATAR } from '@/constants';

interface ParsedForm {
  fields: { [key: string]: string };
  imageFile?: {
    buffer: Buffer;
    filename: string;
    mimetype: string;
    size: number;
  };
}

async function parseForm(req: NextRequest): Promise<ParsedForm> {
  return new Promise((resolve, reject) => {
    const busboy = Busboy({
      headers: Object.fromEntries(req.headers.entries()),
    });
    const fields: { [key: string]: string } = {};
    let imageFile: ParsedForm['imageFile'];

    busboy.on('field', (fieldname, val) => {
      fields[fieldname] = val;
    });

    busboy.on(
      'file',
      (
        fieldname: string,
        file: NodeJS.ReadableStream,
        info: { filename: string; encoding: string; mimeType: string }
      ) => {
        if (fieldname === 'image') {
          const chunks: Buffer[] = [];
          let fileSize = 0;

          file.on('data', (chunk: Buffer) => {
            chunks.push(chunk);
            fileSize += chunk.length;
          });

          file.on('end', () => {
            imageFile = {
              buffer: Buffer.concat(chunks),
              filename: info.filename,
              mimetype: info.mimeType,
              size: fileSize,
            };
          });
        }
      }
    );

    busboy.on('finish', () => {
      resolve({ fields, imageFile });
    });

    busboy.on('error', error => {
      console.error('Form parsing error:', error);
      reject(new Error('Error parsing form data'));
    });

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
      reject(new Error('Request body is empty'));
    }
  });
}

export async function POST(req: NextRequest) {
  try {
    await connectDB();

    // Validate access token
    const accessToken = req.cookies.get('accessToken')?.value;
    if (!accessToken) {
      return NextResponse.json(
        createErrorResponse(401, 'Unauthorized - No access token'),
        { status: 401 }
      );
    }

    // Decrypt and validate token payload
    const payload = await decrypt(accessToken);
    if (!payload?.id) {
      console.error('Invalid token payload:', payload);
      return NextResponse.json(
        createErrorResponse(401, 'Unauthorized - Invalid token'),
        { status: 401 }
      );
    }

    // Check for existing profile
    const existingProfile = await Profile.findOne({ user: payload.id });
    if (existingProfile) {
      return NextResponse.json(
        createErrorResponse(400, 'Profile already exists'),
        { status: 400 }
      );
    }

    // Parse form data
    const { fields, imageFile } = await parseForm(req);

    // Handle image upload
    let imageUrl = DEFAULT_AVATAR;
    if (imageFile) {
      try {
        // Validate file before upload
        const validation = validateFile({
          size: imageFile.size,
          type: imageFile.mimetype,
        });

        if (!validation.isValid) {
          return NextResponse.json(
            createErrorResponse(400, `Invalid image file: ${validation.error}`),
            { status: 400 }
          );
        }

        // Generate unique filename with timestamp
        const timestamp = new Date().getTime();
        const sanitizedFilename = imageFile.filename
          .replace(/[^a-zA-Z0-9.]/g, '')
          .replace(/\s+/g, '-');
        const uniqueFilename = `${timestamp}-${sanitizedFilename}`;

        // Upload to Cloudinary
        imageUrl = await uploadToCloudinary({
          fileBuffer: imageFile.buffer,
          folder: 'profile-images',
          filename: uniqueFilename,
          mimetype: imageFile.mimetype,
        });
      } catch (uploadError) {
        console.error('Image upload error:', uploadError);
        // Continue with default avatar if upload fails
        imageUrl = DEFAULT_AVATAR;
      }
    }

    // Validate required fields
    const requiredFields = ['firstName', 'lastName', 'age', 'gender', 'phone'];
    const missingFields = requiredFields.filter(field => !fields[field]);
    if (missingFields.length > 0) {
      return NextResponse.json(
        createErrorResponse(
          400,
          `Missing required fields: ${missingFields.join(', ')}`
        ),
        { status: 400 }
      );
    }

    // Create and save new profile
    const newProfile = new Profile({
      user: payload.id,
      ...fields,
      image: imageUrl,
      profileCompleted: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    await newProfile.save();

    // Log successful profile creation
    console.info('Profile created successfully:', {
      userId: payload.id,
      profileId: newProfile._id,
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json(
      createSuccessResponse(201, {
        message: 'Profile created successfully',
        profile: {
          ...newProfile.toObject(),
          _id: newProfile._id.toString(),
        },
      }),
      { status: 201 }
    );
  } catch (error) {
    console.error('Profile creation error:', error);
    return NextResponse.json(
      createErrorResponse(
        500,
        'An error occurred while creating your profile. Please try again.'
      ),
      { status: 500 }
    );
  }
}
