'use server';

import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/db/db';
import Resource from '@/models/Resource';
import { createErrorResponse, createSuccessResponse } from '@/lib/response';
import { withAuth, TokenPayload } from '@/middleware/authMiddleware';
import { deleteFromCloudinary, getPublicIdFromUrl } from '@/utils/fileUpload';

export async function DELETE(
  request: NextRequest,
  context: { params: { id: string } }
) {
  return withAuth(
    async (req: NextRequest, user: TokenPayload) => {
      try {
        await connectDB();
        const resourceId = context.params.id;
        console.log('DELETE request for resource ID:', resourceId);

        if (!resourceId || !/^[0-9a-fA-F]{24}$/.test(resourceId)) {
          return NextResponse.json(
            createErrorResponse(400, 'Valid resource ID is required'),
            { status: 400 }
          );
        }

        // Find the resource first to check ownership
        const resource = await Resource.findById(resourceId);

        if (!resource) {
          return NextResponse.json(
            createErrorResponse(404, 'Resource not found'),
            { status: 404 }
          );
        }

        // Check if user is authorized to delete this resource
        // Allow owners and admins to delete
        const isOwner = resource.author.toString() === user.id;
        const isAdmin = user.role === 'admin';

        if (!isOwner && !isAdmin) {
          return NextResponse.json(
            createErrorResponse(
              403,
              'You are not authorized to delete this resource'
            ),
            { status: 403 }
          );
        }

        // Delete resource image from Cloudinary if it exists
        if (
          resource.resourceImage &&
          resource.resourceImage.includes('cloudinary')
        ) {
          const publicId = getPublicIdFromUrl(resource.resourceImage);
          if (publicId) {
            try {
              await deleteFromCloudinary(`photos/resource-images/${publicId}`);
              console.log('Resource image deleted from Cloudinary');
            } catch (deleteError) {
              console.warn(
                'Could not delete resource image from Cloudinary:',
                deleteError
              );
              // Continue with deletion even if image deletion fails
            }
          }
        }

        // Delete the resource
        const result = await Resource.findByIdAndDelete(resourceId);

        if (!result) {
          return NextResponse.json(
            createErrorResponse(404, 'Failed to delete resource'),
            { status: 404 }
          );
        }

        return NextResponse.json(
          createSuccessResponse(200, {
            message: 'Resource deleted successfully',
          }),
          { status: 200 }
        );
      } catch (error) {
        console.error('Failed to delete resource:', error);
        const errorMessage =
          error instanceof Error ? error.message : 'Unknown error';
        return NextResponse.json(
          createErrorResponse(500, `Internal Server Error: ${errorMessage}`),
          { status: 500 }
        );
      }
    },
    request,
    ['user', 'psychologist', 'admin'] // Allow all these roles, but we check specific ownership in the handler
  );
}
