'use server';

import { NextRequest, NextResponse } from 'next/server';
import { createErrorResponse, createSuccessResponse } from '@/lib/response';
import connectDB from '@/db/db';
import Notification from '@/models/Notification';

export async function POST(req: NextRequest) {
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

    // Update all unread notifications for this user
    const result = await Notification.updateMany(
      { recipient: userId, isRead: false },
      { $set: { isRead: true } }
    );

    return NextResponse.json(
      createSuccessResponse(200, {
        message: 'All notifications marked as read',
        modifiedCount: result.modifiedCount,
      }),
      { status: 200 }
    );
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    return NextResponse.json(
      createErrorResponse(500, 'Failed to mark all notifications as read'),
      { status: 500 }
    );
  }
}
