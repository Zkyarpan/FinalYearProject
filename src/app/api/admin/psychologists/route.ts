'use server';

import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/db/db';
import Psychologist from '@/models/Psychologist';
import { createSuccessResponse, createErrorResponse } from '@/lib/response';
import { withAuth } from '@/middleware/authMiddleware';

type StatusType = 'pending' | 'approved' | 'rejected' | 'all';

export async function GET(req: NextRequest) {
  return withAuth(
    async (req: NextRequest, token: any) => {
      try {
        await connectDB();
        console.log('Connected to database for psychologists query');

        // Get status from query params
        const searchParams = req.nextUrl.searchParams;
        const status = (searchParams.get('status') || 'pending') as StatusType;

        // Validate status parameter
        if (!['pending', 'approved', 'rejected', 'all'].includes(status)) {
          console.log(`Invalid status parameter: ${status}`);
          return NextResponse.json(
            createErrorResponse(400, 'Invalid status parameter'),
            { status: 400 }
          );
        }

        console.log(`Fetching psychologists with status: ${status}`);

        // Build query
        const query = status === 'all' ? {} : { approvalStatus: status };

        // Get psychologists with sort by newest first
        const psychologists = await Psychologist.find(query)
          .sort({ createdAt: -1 })
          .select('-password');

        console.log(
          `Found ${psychologists.length} psychologists with status: ${status}`
        );

        return NextResponse.json(createSuccessResponse(200, psychologists), {
          status: 200,
        });
      } catch (error: any) {
        console.error('Error fetching psychologists:', error);
        return NextResponse.json(
          createErrorResponse(500, error.message || 'Internal Server Error'),
          { status: 500 }
        );
      }
    },
    req,
    ['admin']
  );
}
