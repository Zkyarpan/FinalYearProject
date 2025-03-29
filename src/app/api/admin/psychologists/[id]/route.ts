'use server';

import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/db/db';
import Psychologist from '@/models/Psychologist';
import { createSuccessResponse, createErrorResponse } from '@/lib/response';
import { withAuth } from '@/middleware/authMiddleware';
import { isValidObjectId } from 'mongoose';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  return withAuth(
    async (req: NextRequest, token: any) => {
      try {
        // Ensure params is available
        const { id } = params;

        await connectDB();

        // Validate ID format
        if (!isValidObjectId(id)) {
          console.log(`Invalid psychologist ID format: ${id}`);
          return NextResponse.json(
            createErrorResponse(400, 'Invalid psychologist ID format'),
            { status: 400 }
          );
        }

        console.log(`Fetching psychologist with ID: ${id}`);

        // Find psychologist by ID
        const psychologist =
          await Psychologist.findById(id).select('-password');

        if (!psychologist) {
          console.log(`Psychologist not found with ID: ${id}`);
          return NextResponse.json(
            createErrorResponse(404, 'Psychologist not found'),
            { status: 404 }
          );
        }

        console.log(
          `Successfully retrieved psychologist: ${psychologist.firstName} ${psychologist.lastName}`
        );

        return NextResponse.json(createSuccessResponse(200, psychologist), {
          status: 200,
        });
      } catch (error: any) {
        console.error('Error fetching psychologist details:', error);
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
