'use server';

import { NextRequest, NextResponse } from 'next/server';
import Profile from '@/models/Profile';
import connectDB from '@/db/db';
import { createSuccessResponse, createErrorResponse } from '@/lib/response';
import { decrypt } from '@/lib/token';
import Busboy from 'busboy';
import { uploadToCloudinary } from '@/utils/fileUpload';

interface ParsedForm {
  fields: { [key: string]: string };
  imageFile?: {
    buffer: Buffer;
    filename: string;
    mimetype: string;
  };
}

async function parseForm(req: NextRequest): Promise<ParsedForm> {
  return new Promise((resolve, reject) => {
    const busboy = Busboy({
      headers: Object.fromEntries(req.headers.entries()),
    });
    const fields = {};
    let imageFile;

    busboy.on('field', (fieldname, val) => {
      fields[fieldname] = val;
    });

    busboy.on(
      'file',
      (
        fieldname: string,
        file: NodeJS.ReadableStream,
        filename: string,
        encoding: string,
        mimetype: string
      ) => {
        if (fieldname === 'image') {
          const chunks: Buffer[] = [];
          file.on('data', (chunk: Buffer) => {
            chunks.push(chunk);
          });
          file.on('end', () => {
            imageFile = {
              buffer: Buffer.concat(chunks),
              filename,
              mimetype,
            };
          });
        }
      }
    );

    busboy.on('finish', () => {
      resolve({ fields, imageFile });
    });

    busboy.on('error', error => {
      reject(error);
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
      reject(new Error('Request body is null'));
    }
  });
}

export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const { fields, imageFile } = await parseForm(req);

    const accessToken = req.cookies.get('accessToken')?.value;
    if (!accessToken) {
      return NextResponse.json(
        createErrorResponse(401, 'Unauthorized - No access token'),
        { status: 401 }
      );
    }

    const payload = await decrypt(accessToken);
    if (!payload || !payload.id) {
      console.log('Failed to decrypt token or no user ID found');
      return NextResponse.json(
        createErrorResponse(401, 'Unauthorized - Invalid token'),
        { status: 401 }
      );
    }

    const existingProfile = await Profile.findOne({ user: payload.id });
    if (existingProfile) {
      return NextResponse.json(
        createErrorResponse(400, 'Profile already exists.'),
        { status: 400 }
      );
    }

    let imageUrl;
    if (imageFile) {
      try {
        imageUrl = await uploadToCloudinary({
          fileBuffer: imageFile.buffer,
          folder: 'profile-images',
          filename: imageFile.filename,
          mimetype: imageFile.mimetype,
        });
      } catch (uploadError) {
        return NextResponse.json(
          createErrorResponse(500, 'Error uploading image'),
          { status: 500 }
        );
      }
    }

    const newProfile = new Profile({
      user: payload.id,
      ...fields,
      image: imageUrl || '',
      profileCompleted: true,
    });

    await newProfile.save();

    return NextResponse.json(
      createSuccessResponse(201, {
        message: 'Profile created successfully.',
        profile: newProfile,
      }),
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      createErrorResponse(500, 'Internal server error.'),
      { status: 500 }
    );
  }
}
