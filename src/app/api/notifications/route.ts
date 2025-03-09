'use server';

import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import connectDB from '@/db/db';
import { withAuth } from '@/middleware/authMiddleware';
import { createErrorResponse, createSuccessResponse } from '@/lib/response';
import Notification from '@/models/Notification';

// GET handler to fetch notifications
export async function GET(req: NextRequest) {
  return withAuth(async (req: NextRequest, token: any) => {
    try {
      await connectDB();

      const url = new URL(req.url);
      const limit = parseInt(url.searchParams.get('limit') || '20');
      const skip = parseInt(url.searchParams.get('skip') || '0');
      const onlyUnread = url.searchParams.get('unread') === 'true';

      // Build query
      const query: { recipient: any; isRead?: boolean } = {
        recipient: token.id,
      };
      if (onlyUnread) {
        query.isRead = false;
      }

      // Execute query
      const [notifications, unreadCount, totalCount] = await Promise.all([
        Notification.find(query)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .populate('sender', 'firstName lastName profilePhotoUrl')
          .lean(),
        Notification.countDocuments({ recipient: token.id, isRead: false }),
        Notification.countDocuments(query),
      ]);

      return NextResponse.json(
        createSuccessResponse(200, {
          notifications,
          unreadCount,
          totalCount,
          pagination: {
            limit,
            skip,
            hasMore: skip + limit < totalCount,
          },
        })
      );
    } catch (error: any) {
      console.error('Error fetching notifications:', error);
      return NextResponse.json(
        createErrorResponse(500, error.message || 'Internal Server Error')
      );
    }
  }, req);
}

// PUT handler to mark notifications as read
export async function PUT(req: NextRequest) {
  return withAuth(async (req: NextRequest, token: any) => {
    try {
      await connectDB();

      const { notificationId, markAll } = await req.json();

      if (markAll) {
        // Mark all as read
        const result = await Notification.updateMany(
          { recipient: token.id, isRead: false },
          { isRead: true }
        );

        return NextResponse.json(
          createSuccessResponse(200, {
            message: `Marked ${result.modifiedCount} notifications as read`,
            modifiedCount: result.modifiedCount,
          })
        );
      } else if (notificationId) {
        // Mark single notification as read
        const notification = await Notification.findOneAndUpdate(
          { _id: notificationId, recipient: token.id },
          { isRead: true },
          { new: true }
        );

        if (!notification) {
          return NextResponse.json(
            createErrorResponse(404, 'Notification not found')
          );
        }

        return NextResponse.json(
          createSuccessResponse(200, {
            message: 'Notification marked as read',
            notification,
          })
        );
      } else {
        return NextResponse.json(
          createErrorResponse(
            400,
            'Missing notificationId or markAll parameter'
          )
        );
      }
    } catch (error: any) {
      console.error('Error marking notifications as read:', error);
      return NextResponse.json(
        createErrorResponse(500, error.message || 'Internal Server Error')
      );
    }
  }, req);
}

// DELETE handler to delete notifications
export async function DELETE(req: NextRequest) {
  return withAuth(async (req: NextRequest, token: any) => {
    try {
      await connectDB();

      const url = new URL(req.url);
      const notificationId = url.searchParams.get('id');
      const deleteAll = url.searchParams.get('all') === 'true';

      if (deleteAll) {
        // Delete all notifications
        const result = await Notification.deleteMany({ recipient: token.id });

        return NextResponse.json(
          createSuccessResponse(200, {
            message: `Deleted ${result.deletedCount} notifications`,
            deletedCount: result.deletedCount,
          })
        );
      } else if (notificationId) {
        // Delete a single notification
        const result = await Notification.findOneAndDelete({
          _id: notificationId,
          recipient: token.id,
        });

        if (!result) {
          return NextResponse.json(
            createErrorResponse(404, 'Notification not found')
          );
        }

        return NextResponse.json(
          createSuccessResponse(200, {
            message: 'Notification deleted successfully',
          })
        );
      } else {
        return NextResponse.json(
          createErrorResponse(
            400,
            'Missing notificationId or deleteAll parameter'
          )
        );
      }
    } catch (error: any) {
      console.error('Error deleting notifications:', error);
      return NextResponse.json(
        createErrorResponse(500, error.message || 'Internal Server Error')
      );
    }
  }, req);
}
