'use server';

import { NextResponse } from 'next/server';
import connectDB from '@/db/db';
import Resource from '@/models/Resource';
import { createSuccessResponse, createErrorResponse } from '@/lib/response';

export async function GET() {
  try {
    await connectDB();

    // Aggregate to get category counts (only from published resources)
    const categoryResults = await Resource.aggregate([
      { $match: { isPublished: true } },
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    // Get total count of published resources
    const totalCount = await Resource.countDocuments({ isPublished: true });

    // Transform the data for the frontend
    const categories = categoryResults.map(result => ({
      name: result._id,
      count: result.count,
    }));

    return NextResponse.json(
      createSuccessResponse(200, {
        categories,
        totalCount,
      })
    );
  } catch (error) {
    console.error('Error fetching resource categories:', error);
    return NextResponse.json(
      createErrorResponse(500, 'Failed to fetch resource categories'),
      { status: 500 }
    );
  }
}
