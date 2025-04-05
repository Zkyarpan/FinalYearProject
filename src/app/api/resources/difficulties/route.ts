'use server';

import { NextResponse } from 'next/server';
import connectDB from '@/db/db';
import Resource from '@/models/Resource';
import { createSuccessResponse, createErrorResponse } from '@/lib/response';

export async function GET() {
  try {
    await connectDB();

    // Aggregate to get difficulty level counts (only from published resources)
    const difficultyResults = await Resource.aggregate([
      { $match: { isPublished: true } },
      { $group: { _id: '$difficultyLevel', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    // Transform the data for the frontend
    const difficulties = difficultyResults.map(result => ({
      name: result._id,
      count: result.count,
    }));

    return NextResponse.json(
      createSuccessResponse(200, {
        difficulties,
      })
    );
  } catch (error) {
    console.error('Error fetching resource difficulties:', error);
    return NextResponse.json(
      createErrorResponse(500, 'Failed to fetch resource difficulties'),
      { status: 500 }
    );
  }
}
