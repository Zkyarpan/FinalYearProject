'use server';

import { NextResponse } from 'next/server';
import connectDB from '@/db/db';
import Resource from '@/models/Resource';
import { createSuccessResponse, createErrorResponse } from '@/lib/response';

export async function GET() {
  try {
    await connectDB();

    // Aggregate to get tag counts
    // First unwind the tags array, then group by tag name
    const tagResults = await Resource.aggregate([
      { $match: { isPublished: true } },
      { $unwind: '$tags' },
      { $group: { _id: '$tags', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }, // Get only top 10 tags
    ]);

    // Transform the data for the frontend
    const tags = tagResults.map(result => ({
      name: result._id,
      count: result.count,
    }));

    return NextResponse.json(
      createSuccessResponse(200, {
        tags,
      })
    );
  } catch (error) {
    console.error('Error fetching resource tags:', error);
    return NextResponse.json(
      createErrorResponse(500, 'Failed to fetch resource tags'),
      { status: 500 }
    );
  }
}
