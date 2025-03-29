'use server';

import { NextRequest, NextResponse } from 'next/server';
import { createErrorResponse, createSuccessResponse } from '@/lib/response';
import connectDB from '@/db/db';
import Notification from '@/models/Notification';

export async function GET(req: NextRequest) {
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

    // Count unread notifications for the user
    const unreadCount = await Notification.countDocuments({
      recipient: userId,
      isRead: false
    });

    return NextResponse.json(
      createSuccessResponse(200, {
        unreadCount,
        message: 'Notification count retrieved successfully'
      }),
      { status: 200 }
    );
  } catch (error) {
    console.error('Error fetching notification count:', error);
    return NextResponse.json(
      createErrorResponse(500, 'Failed to fetch notification count'),
      { status: 500 }
    );
  }
}