'use server';

import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/db/db';
import Resource from '@/models/Resource';
import { createErrorResponse, createSuccessResponse } from '@/lib/response';
import { withAuth, TokenPayload } from '@/middleware/authMiddleware';
import User from '@/models/User';
import Profile from '@/models/Profile';
import Psychologist from '@/models/Psychologist';
import { DEFAULT_AVATAR } from '@/constants';
import { Types } from 'mongoose';
import {
  uploadToCloudinary,
  deleteFromCloudinary,
  getPublicIdFromUrl,
} from '@/utils/fileUpload';
import { cleanContent } from '@/utils/contentCleaner';

// GET handler to fetch a resource for editing
export async function GET(
  request: NextRequest,
  context: { params: { id: string } }
) {
  return withAuth(
    async (req: NextRequest, user: TokenPayload) => {
      try {
        await connectDB();

        const resourceId = context.params.id;
        if (!resourceId || !/^[0-9a-fA-F]{24}$/.test(resourceId)) {
          return NextResponse.json(
            createErrorResponse(400, 'Valid resource ID is required'),
            { status: 400 }
          );
        }

        // Find the resource
        const resource = (await Resource.findById(resourceId).lean()) as any;

        if (!resource) {
          return NextResponse.json(
            createErrorResponse(404, 'Resource not found'),
            { status: 404 }
          );
        }

        // Check if user is authorized to edit this resource
        if (resource.author.toString() !== user.id) {
          return NextResponse.json(
            createErrorResponse(
              403,
              'You are not authorized to edit this resource'
            ),
            { status: 403 }
          );
        }

        // Get author details
        let authorName = 'Unknown';
        let authorAvatar = DEFAULT_AVATAR;
        const authorId = resource.author.toString();

        try {
          if (resource.authorType === 'user') {
            // Get user profile
            interface ProfileType {
              firstName?: string;
              lastName?: string;
              image?: string;
            }

            const profile = (await Profile.findOne({
              user: resource.author,
            }).lean()) as ProfileType;

            if (profile) {
              authorName =
                `${profile.firstName || ''} ${profile.lastName || ''}`.trim() ||
                'User';
              authorAvatar = profile.image || DEFAULT_AVATAR;
            } else {
              // Fallback to email if profile not found
              interface UserData {
                email?: string;
              }
              const userData = (await User.findById(resource.author)
                .select('email')
                .lean()) as UserData;

              if (userData && userData.email) {
                authorName = userData.email.split('@')[0];
              }
            }
          } else if (resource.authorType === 'psychologist') {
            // Get psychologist details
            interface PsychologistType {
              name?: string;
              avatar?: string;
            }

            const psychologist = (await Psychologist.findById(
              resource.author
            ).lean()) as PsychologistType;

            if (psychologist) {
              authorName = psychologist.name || 'Psychologist';
              authorAvatar = psychologist.avatar || DEFAULT_AVATAR;
            }
          }
        } catch (error) {
          console.error('Error fetching author details:', error);
        }

        // Format dates
        const publishDate = new Date(resource.publishDate).toLocaleDateString(
          'en-US',
          {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          }
        );

        // Ensure mediaUrls, steps, and tags are arrays
        const mediaUrls = Array.isArray(resource.mediaUrls)
          ? resource.mediaUrls
          : [];
        const steps = Array.isArray(resource.steps) ? resource.steps : [];
        const tags = Array.isArray(resource.tags) ? resource.tags : [];

        const formattedResource = {
          ...resource,
          _id: resource._id.toString(),
          author: {
            _id: authorId,
            name: authorName,
            avatar: authorAvatar,
          },
          mediaUrls,
          steps,
          tags,
          publishDate,
          isOwner: true, // User is the owner since we checked authorization
        };

        return NextResponse.json(
          createSuccessResponse(200, {
            message: 'Resource fetched successfully',
            resource: formattedResource,
          }),
          { status: 200 }
        );
      } catch (error) {
        console.error('Failed to fetch resource for editing:', error);
        return NextResponse.json(
          createErrorResponse(500, 'Internal Server Error'),
          { status: 500 }
        );
      }
    },
    request,
    ['user', 'psychologist', 'admin']
  );
}

// PATCH handler to update a resource
export async function PATCH(
  request: NextRequest,
  context: { params: { id: string } }
) {
  return withAuth(
    async (req: NextRequest, user: TokenPayload) => {
      try {
        await connectDB();
        const resourceId = context.params.id;
        console.log('PATCH request for resource ID:', resourceId);

        if (!resourceId || !/^[0-9a-fA-F]{24}$/.test(resourceId)) {
          return NextResponse.json(
            createErrorResponse(400, 'Valid resource ID is required'),
            { status: 400 }
          );
        }

        // Find the resource
        const resource = await Resource.findById(resourceId);

        if (!resource) {
          return NextResponse.json(
            createErrorResponse(404, 'Resource not found'),
            { status: 404 }
          );
        }

        // Check if user is authorized to edit this resource
        if (resource.author.toString() !== user.id) {
          return NextResponse.json(
            createErrorResponse(
              403,
              'You are not authorized to edit this resource'
            ),
            { status: 403 }
          );
        }

        const formData = await req.formData();
        const updateData: Record<string, any> = {};

        // Parse form data
        const fieldsStr = formData.get('fields');
        if (fieldsStr && typeof fieldsStr === 'string') {
          try {
            const fields = JSON.parse(fieldsStr);

            // Clean content if it exists
            if (fields.content) {
              fields.content = cleanContent(fields.content);
            }

            Object.assign(updateData, fields);
          } catch (err) {
            console.error('Error parsing fields JSON:', err);
            return NextResponse.json(
              createErrorResponse(400, 'Invalid JSON in fields parameter'),
              { status: 400 }
            );
          }
        }

        // Handle image upload
        const resourceImage = formData.get('resourceImage');
        if (resourceImage instanceof Blob) {
          try {
            // First try to delete old image if it exists
            if (
              resource.resourceImage &&
              resource.resourceImage.includes('cloudinary')
            ) {
              const publicId = getPublicIdFromUrl(resource.resourceImage);
              if (publicId) {
                try {
                  await deleteFromCloudinary(
                    `photos/resource-images/${publicId}`
                  );
                  console.log('Old image deleted from Cloudinary');
                } catch (deleteError) {
                  console.warn(
                    'Could not delete old image from Cloudinary:',
                    deleteError
                  );
                }
              }
            }

            // Upload new image
            const timestamp = Date.now();
            const imageFile = {
              buffer: Buffer.from(await resourceImage.arrayBuffer()),
              filename: `resource-${resource._id}-${timestamp}`,
              mimetype: resourceImage.type,
            };

            const imageUrl = await uploadToCloudinary({
              fileBuffer: imageFile.buffer,
              folder: 'photos/resource-images',
              filename: imageFile.filename,
              mimetype: imageFile.mimetype,
            });

            updateData.resourceImage = imageUrl;
            console.log('New image uploaded to Cloudinary:', imageUrl);
          } catch (uploadError) {
            console.error('Image upload error:', uploadError);
            return NextResponse.json(
              createErrorResponse(400, 'Failed to upload image'),
              { status: 400 }
            );
          }
        }

        console.log('Updating resource with data:', {
          resourceId: resource._id,
          updateFields: Object.keys(updateData),
        });

        const updatedResource = await Resource.findByIdAndUpdate(
          resourceId,
          {
            $set: {
              ...updateData,
              updatedAt: new Date(),
            },
          },
          { new: true, runValidators: true }
        );

        if (!updatedResource) {
          return NextResponse.json(
            createErrorResponse(404, 'Failed to update resource'),
            { status: 404 }
          );
        }

        return NextResponse.json(
          createSuccessResponse(200, {
            message: 'Resource updated successfully',
            resource: {
              _id: updatedResource._id,
              title: updatedResource.title,
              slug: updatedResource.slug,
            },
          }),
          { status: 200 }
        );
      } catch (error) {
        console.error('Failed to update resource:', error);
        const errorMessage =
          error instanceof Error ? error.message : 'Unknown error';
        return NextResponse.json(
          createErrorResponse(500, `Internal Server Error: ${errorMessage}`),
          { status: 500 }
        );
      }
    },
    request,
    ['user', 'psychologist', 'admin']
  );
}
