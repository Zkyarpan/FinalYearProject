import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import connectDB from '@/db/db';
import { createSuccessResponse, createErrorResponse } from '@/lib/response';
import { withAuth } from '@/middleware/authMiddleware';
import EmailTemplate from '@/models/EmailTemplate';

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  return withAuth(
    async (req: NextRequest, token: any) => {
      try {
        await connectDB();

        // Check if user is admin
        if (token.role !== 'admin') {
          return NextResponse.json(
            createErrorResponse(
              403,
              'Access denied. Admin privileges required.'
            ),
            { status: 403 }
          );
        }

        const { id } = params;
        const data = await req.json();

        // Update email template
        const updatedTemplate = await EmailTemplate.findByIdAndUpdate(
          id,
          {
            ...data,
            updatedBy: token.userId,
            updatedAt: new Date(),
          },
          { new: true }
        );

        if (!updatedTemplate) {
          return NextResponse.json(
            createErrorResponse(404, 'Email template not found'),
            { status: 404 }
          );
        }

        return NextResponse.json(
          createSuccessResponse(200, {
            message: 'Email template updated successfully',
            template: updatedTemplate,
          }),
          { status: 200 }
        );
      } catch (error: any) {
        console.error('Error updating email template:', error);
        return NextResponse.json(
          createErrorResponse(500, error.message || 'Internal Server Error'),
          { status: 500 }
        );
      }
    },
    req,
    ['admin'] // Only allow admins
  );
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  return withAuth(
    async (req: NextRequest, token: any) => {
      try {
        await connectDB();

        // Check if user is admin
        if (token.role !== 'admin') {
          return NextResponse.json(
            createErrorResponse(
              403,
              'Access denied. Admin privileges required.'
            ),
            { status: 403 }
          );
        }

        const { id } = params;

        // Delete email template
        const deletedTemplate = await EmailTemplate.findByIdAndDelete(id);

        if (!deletedTemplate) {
          return NextResponse.json(
            createErrorResponse(404, 'Email template not found'),
            { status: 404 }
          );
        }

        return NextResponse.json(
          createSuccessResponse(200, {
            message: 'Email template deleted successfully',
          }),
          { status: 200 }
        );
      } catch (error: any) {
        console.error('Error deleting email template:', error);
        return NextResponse.json(
          createErrorResponse(500, error.message || 'Internal Server Error'),
          { status: 500 }
        );
      }
    },
    req,
    ['admin'] // Only allow admins
  );
}
