'use server';

import { NextRequest, NextResponse } from 'next/server';
import { createErrorResponse, createSuccessResponse } from '@/lib/response';
import connectDB from '@/db/db';
import Notification from '@/models/Notification';

export async function DELETE(req: NextRequest) {
  try {
    await connectDB();

    // Get the authenticated user ID from the authorization header
    const authHeader = req.headers.get('authorization');
    const userId = authHeader ? authHeader.split(' ')[1] : null;

    if (!userId) {
      return NextResponse.json(
        createErrorResponse(401, 'Authentication required'),
        { status: 401 }
      );
    }

    // Check if we should only delete read notifications
    const url = new URL(req.url);
    const readOnly = url.searchParams.get('readOnly') === 'true';

    // Set up the query
    const query: any = { recipient: userId };
    if (readOnly) {
      query.isRead = true;
    }

    // Delete notifications
    const result = await Notification.deleteMany(query);

    return NextResponse.json(
      createSuccessResponse(200, {
        message: readOnly
          ? 'All read notifications deleted successfully'
          : 'All notifications deleted successfully',
        deletedCount: result.deletedCount,
      }),
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deleting notifications:', error);
    return NextResponse.json(
      createErrorResponse(500, 'Failed to delete notifications'),
      { status: 500 }
    );
  }
}
