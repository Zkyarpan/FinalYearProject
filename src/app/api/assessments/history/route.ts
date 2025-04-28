'use server';

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import connectDB from '@/db/db';
import UserAssessment from '@/models/UserAssessment';
import { createSuccessResponse, createErrorResponse } from '@/lib/response';
import { withAuth } from '@/middleware/authMiddleware';

export async function GET(req: NextRequest) {
  return withAuth(async (req: NextRequest, token: any) => {
    try {
      await connectDB();

      // Get URL parameters for pagination
      const { searchParams } = new URL(req.url);
      const limit = parseInt(searchParams.get('limit') || '10');
      const page = parseInt(searchParams.get('page') || '1');
      const type = searchParams.get('type') || '';
      const userId = searchParams.get('userId') || token.id;
      const skip = (page - 1) * limit;

      // Build query
      const query: any = { userId };

      // Add type filter if specified
      if (type && type !== 'all') {
        query.assessmentType = type;
      }

      // If requesting another user's data, check permissions
      if (userId !== token.id) {
        // Only admins and psychologists can view other users' assessments
        if (!['admin', 'psychologist'].includes(token.role)) {
          return NextResponse.json(
            createErrorResponse(
              403,
              "You do not have permission to view another user's assessments"
            ),
            { status: 403 }
          );
        }

        // For psychologists, further check if this is their patient (in a real app)
        // This would require a patient-psychologist relationship model
        if (token.role === 'psychologist') {
          // In a real app, check if the requested user is a patient of this psychologist
          // For now, we'll just allow it
        }
      }

      // Get total count
      const total = await UserAssessment.countDocuments(query);

      // Get user's assessment history
      const assessments = await UserAssessment.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

      // Return assessment history
      return NextResponse.json(
        createSuccessResponse(200, {
          assessments,
          pagination: {
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
          },
        }),
        { status: 200 }
      );
    } catch (error: any) {
      console.error('Error fetching assessment history:', error);
      return NextResponse.json(
        createErrorResponse(
          500,
          error.message || 'Failed to fetch assessment history'
        ),
        { status: 500 }
      );
    }
  }, req);
}
