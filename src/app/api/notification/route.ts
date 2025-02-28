'use server';

import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/db/db';
import Notification from '@/models/Notification';
import { withAuth } from '@/middleware/authMiddleware';
import { createSuccessResponse, createErrorResponse } from '@/lib/response';

// Get all notifications for the current user
export async function GET(req: NextRequest) {
  return withAuth(async (req: NextRequest, user: any) => {
    try {
      await connectDB();
      const userId = user.id;

      // Parse query parameters
      const url = new URL(req.url);
      const limit = parseInt(url.searchParams.get('limit') || '20');
      const page = parseInt(url.searchParams.get('page') || '1');
      const unreadOnly = url.searchParams.get('unreadOnly') === 'true';

      // Build query
      const query: any = { recipient: userId };
      if (unreadOnly) {
        query.isRead = false;
      }

      // Fetch notifications with pagination
      const notifications = await Notification.find(query)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .populate(
          'sender',
          '_id firstName lastName email profilePhotoUrl image'
        );

      // Get total count for pagination
      const totalCount = await Notification.countDocuments(query);

      // Get unread count
      const unreadCount = await Notification.countDocuments({
        recipient: userId,
        isRead: false,
      });

      return NextResponse.json(
        createSuccessResponse(200, {
          notifications,
          pagination: {
            total: totalCount,
            page,
            limit,
            pages: Math.ceil(totalCount / limit),
          },
          unreadCount,
        }),
        { status: 200 }
      );
    } catch (error) {
      console.error('Error fetching notifications:', error);
      return NextResponse.json(
        createErrorResponse(500, 'Internal Server Error'),
        { status: 500 }
      );
    }
  }, req);
}

// Mark notifications as read
export async function PATCH(req: NextRequest) {
  return withAuth(async (req: NextRequest, user: any) => {
    try {
      await connectDB();
      const userId = user.id;
      const { notificationIds, markAll } = await req.json();

      let updateQuery: any = {};

      // If specific notification IDs provided, mark just those
      if (notificationIds && notificationIds.length > 0) {
        updateQuery = {
          _id: { $in: notificationIds },
          recipient: userId,
        };
      }
      // If markAll is true, mark all notifications for the user as read
      else if (markAll) {
        updateQuery = {
          recipient: userId,
          isRead: false,
        };
      } else {
        return NextResponse.json(
          createErrorResponse(
            400,
            'Either notificationIds or markAll parameter is required'
          ),
          { status: 400 }
        );
      }

      // Update notifications to mark as read
      const result = await Notification.updateMany(updateQuery, {
        $set: { isRead: true },
      });

      return NextResponse.json(
        createSuccessResponse(200, {
          message: 'Notifications marked as read',
          count: result.modifiedCount,
        }),
        { status: 200 }
      );
    } catch (error) {
      console.error('Error marking notifications as read:', error);
      return NextResponse.json(
        createErrorResponse(500, 'Internal Server Error'),
        { status: 500 }
      );
    }
  }, req);
}

// Delete notification(s)
export async function DELETE(req: NextRequest) {
  return withAuth(async (req: NextRequest, user: any) => {
    try {
      await connectDB();
      const userId = user.id;
      const { notificationIds } = await req.json();

      if (!notificationIds || !notificationIds.length) {
        return NextResponse.json(
          createErrorResponse(400, 'notificationIds parameter is required'),
          { status: 400 }
        );
      }

      // Delete the specified notifications for this user
      const result = await Notification.deleteMany({
        _id: { $in: notificationIds },
        recipient: userId,
      });

      return NextResponse.json(
        createSuccessResponse(200, {
          message: 'Notifications deleted',
          count: result.deletedCount,
        }),
        { status: 200 }
      );
    } catch (error) {
      console.error('Error deleting notifications:', error);
      return NextResponse.json(
        createErrorResponse(500, 'Internal Server Error'),
        { status: 500 }
      );
    }
  }, req);
}
