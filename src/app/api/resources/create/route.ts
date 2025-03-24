'use server';

import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/db/db';
import Resource from '@/models/Resource';
import { createErrorResponse, createSuccessResponse } from '@/lib/response';
import { withAuth, TokenPayload } from '@/middleware/authMiddleware';
import { uploadToCloudinary, validateFile } from '@/utils/fileUpload';
import { generateSlug } from '@/helpers/generateSlug';
import { cleanContent } from '@/utils/contentCleaner';

// Helper function to validate media URL structure
function validateMediaUrl(media) {
  if (!media || typeof media !== 'object') return false;
  if (!media.url || !media.type) return false;
  if (media.type !== 'audio' && media.type !== 'video') return false;

  try {
    // Validate URL format (basic check)
    new URL(media.url);
    return true;
  } catch (e) {
    console.error('Invalid URL format in media:', media.url);
    return false;
  }
}

export async function POST(req: NextRequest) {
  return withAuth(
    async (req: NextRequest, user: TokenPayload) => {
      try {
        await connectDB();
        console.log('Creating a new resource');

        // Check content type to handle different request formats
        const contentType = req.headers.get('content-type') || '';
        console.log('Content-Type:', contentType);

        let body;
        let resourceImage: FormDataEntryValue | null = null;

        if (contentType.includes('multipart/form-data')) {
          // Handle form data with files
          const formData = await req.formData();
          console.log('FormData keys:', Array.from(formData.keys()));

          const fieldsJson = formData.get('fields');
          resourceImage = formData.get('resourceImage');

          if (typeof fieldsJson === 'string') {
            try {
              body = JSON.parse(fieldsJson);
              console.log('Successfully parsed fields JSON');

              // Log media URLs
              if (body.mediaUrls && Array.isArray(body.mediaUrls)) {
                console.log(
                  'Found mediaUrls in fields JSON:',
                  JSON.stringify(body.mediaUrls)
                );
              } else {
                console.warn(
                  'No mediaUrls found in fields JSON or invalid format'
                );
                body.mediaUrls = [];
              }
            } catch (e) {
              console.error('Error parsing fields JSON:', e);
              return NextResponse.json(
                createErrorResponse(
                  400,
                  'Invalid JSON in fields: ' + e.message
                ),
                { status: 400 }
              );
            }
          } else {
            // Fallback to processing individual form fields
            console.warn(
              'No fields JSON found, processing individual form fields'
            );
            body = {};
            for (const [key, value] of formData.entries()) {
              if (key !== 'resourceImage') {
                if (key === 'mediaUrls' || key === 'steps' || key === 'tags') {
                  try {
                    body[key] = JSON.parse(value.toString());
                    console.log(
                      `Parsed ${key} from form:`,
                      JSON.stringify(body[key])
                    );
                  } catch (e) {
                    console.error(`Error parsing ${key} as JSON:`, e);
                    body[key] = [];
                  }
                } else {
                  body[key] = value;
                }
              }
            }
          }
        } else {
          // Handle regular JSON request
          try {
            body = await req.json();
            console.log('Parsed JSON body');

            // Log media URLs
            if (body.mediaUrls && Array.isArray(body.mediaUrls)) {
              console.log(
                'Found mediaUrls in JSON body:',
                JSON.stringify(body.mediaUrls)
              );
            } else {
              console.warn('No mediaUrls found in JSON body or invalid format');
              body.mediaUrls = [];
            }
          } catch (e) {
            console.error('Error parsing request JSON:', e);
            return NextResponse.json(
              createErrorResponse(
                400,
                'Invalid JSON in request body: ' + e.message
              ),
              { status: 400 }
            );
          }
        }

        // Basic validation for required fields
        if (
          !body?.title ||
          !body?.description ||
          !body?.category ||
          !body?.content
        ) {
          return NextResponse.json(
            createErrorResponse(400, 'Missing required fields'),
            { status: 400 }
          );
        }

        // Clean content if it exists
        if (body.content) {
          body.content = cleanContent(body.content);
        }

        // Process and validate mediaUrls
        if (!Array.isArray(body.mediaUrls)) {
          console.warn(
            'mediaUrls is not an array, initializing as empty array'
          );
          body.mediaUrls = [];
        } else {
          console.log(
            'Initial mediaUrls array:',
            JSON.stringify(body.mediaUrls)
          );

          // Filter and validate media URLs
          const validMediaUrls = body.mediaUrls.filter(validateMediaUrl);

          if (validMediaUrls.length !== body.mediaUrls.length) {
            console.warn(
              `Filtered out ${
                body.mediaUrls.length - validMediaUrls.length
              } invalid media URLs`
            );
          }

          body.mediaUrls = validMediaUrls;
          console.log(
            'Validated mediaUrls array:',
            JSON.stringify(body.mediaUrls)
          );
        }

        // Ensure other arrays are properly initialized
        if (!Array.isArray(body.steps)) {
          body.steps = [];
        }

        if (!Array.isArray(body.tags)) {
          body.tags = [];
        }

        // Process image if provided
        let resourceImageUrl = '';
        if (resourceImage instanceof Blob) {
          try {
            const timestamp = Date.now();
            const imageFile = {
              buffer: Buffer.from(await resourceImage.arrayBuffer()),
              filename: `resource-${timestamp}`,
              mimetype: resourceImage.type,
            };

            // Validate image file
            const imageValidation = validateFile(
              { size: resourceImage.size, type: resourceImage.type },
              {
                maxSize: 5 * 1024 * 1024,
                allowedTypes: ['image/jpeg', 'image/png', 'image/webp'],
              }
            );

            if (!imageValidation.isValid) {
              return NextResponse.json(
                createErrorResponse(
                  400,
                  `Resource image validation failed: ${imageValidation.error}`
                ),
                { status: 400 }
              );
            }

            resourceImageUrl = await uploadToCloudinary({
              fileBuffer: imageFile.buffer,
              folder: 'photos/resource-images',
              filename: imageFile.filename,
              mimetype: imageFile.mimetype,
            });

            console.log('Image uploaded to Cloudinary:', resourceImageUrl);
          } catch (uploadError) {
            console.error('Image upload error:', uploadError);
            return NextResponse.json(
              createErrorResponse(
                400,
                'Failed to upload image: ' + uploadError.message
              ),
              { status: 400 }
            );
          }
        }

        // Generate a slug from the title
        const slug = generateSlug(body.title);

        // Final log before saving
        console.log(
          'Final mediaUrls before saving:',
          JSON.stringify(body.mediaUrls)
        );

        // Create new resource with properly structured mediaUrls
        const newResource = new Resource({
          ...body,
          resourceImage: resourceImageUrl || body.resourceImage || '',
          author: user.id,
          authorType: user.role,
          publishDate: new Date(),
          slug,
          isPublished: true,
          viewCount: 0,
          // Explicitly set mediaUrls to ensure proper structure
          mediaUrls: body.mediaUrls.map(media => ({
            type: media.type,
            url: media.url,
            ...(media.title ? { title: media.title } : {}),
          })),
        });

        // Save to database
        await newResource.save();

        console.log('Resource saved successfully with ID:', newResource._id);
        console.log(
          'Saved resource mediaUrls:',
          JSON.stringify(newResource.mediaUrls)
        );

        return NextResponse.json(
          createSuccessResponse(201, {
            message: 'Resource created successfully',
            resource: {
              _id: newResource._id,
              title: newResource.title,
              slug: newResource.slug,
              mediaUrls: newResource.mediaUrls,
            },
          }),
          { status: 201 }
        );
      } catch (error: any) {
        console.error('Failed to create resource:', error);

        return NextResponse.json(
          createErrorResponse(
            500,
            'Internal Server Error: ' + (error.message || 'Unknown error')
          ),
          { status: 500 }
        );
      }
    },
    req,
    ['user', 'psychologist', 'admin']
  );
}
