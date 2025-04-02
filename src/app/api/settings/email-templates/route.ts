import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import connectDB from '@/db/db';
import { createSuccessResponse, createErrorResponse } from '@/lib/response';
import { withAuth } from '@/middleware/authMiddleware';
import EmailTemplate from '@/models/EmailTemplate';

export async function POST(req: NextRequest) {
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

        // Get request data
        const data = await req.json();

        // Create new email template
        const newTemplate = new EmailTemplate({
          ...data,
          createdBy: token.userId,
        });

        await newTemplate.save();

        return NextResponse.json(
          createSuccessResponse(201, {
            message: 'Email template created successfully',
            template: newTemplate,
          }),
          { status: 201 }
        );
      } catch (error: any) {
        console.error('Error creating email template:', error);
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
