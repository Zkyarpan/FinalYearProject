'use server';

import { NextRequest, NextResponse } from 'next/server';
import { createErrorResponse, createSuccessResponse } from '@/lib/response';
import connectDB from '@/db/db';
import Notification from '@/models/Notification';
import mongoose from 'mongoose';

// GET a single notification
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
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

    // Validate MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(params.id)) {
      return NextResponse.json(
        createErrorResponse(400, 'Invalid notification ID'),
        { status: 400 }
      );
    }

    // Find the notification
    const notification = await Notification.findOne({
      _id: params.id,
      recipient: userId,
    }).populate('sender', 'firstName lastName image');

    if (!notification) {
      return NextResponse.json(
        createErrorResponse(404, 'Notification not found'),
        { status: 404 }
      );
    }

    return NextResponse.json(
      createSuccessResponse(200, {
        message: 'Notification retrieved successfully',
        notification,
      }),
      { status: 200 }
    );
  } catch (error) {
    console.error('Error fetching notification:', error);
    return NextResponse.json(
      createErrorResponse(500, 'Failed to fetch notification'),
      { status: 500 }
    );
  }
}

// PATCH to update (mark as read) a notification
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
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

    // Validate MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(params.id)) {
      return NextResponse.json(
        createErrorResponse(400, 'Invalid notification ID'),
        { status: 400 }
      );
    }

    const body = await req.json();

    // Only allow updating isRead status for security
    const updateData = {
      isRead: body.isRead === true,
    };

    // Update the notification
    const notification = await Notification.findOneAndUpdate(
      { _id: params.id, recipient: userId },
      { $set: updateData },
      { new: true }
    );

    if (!notification) {
      return NextResponse.json(
        createErrorResponse(404, 'Notification not found'),
        { status: 404 }
      );
    }

    // Get updated unread count
    const unreadCount = await Notification.countDocuments({
      recipient: userId,
      isRead: false,
    });

    return NextResponse.json(
      createSuccessResponse(200, {
        message: 'Notification updated successfully',
        notification,
        unreadCount,
      }),
      { status: 200 }
    );
  } catch (error) {
    console.error('Error updating notification:', error);
    return NextResponse.json(
      createErrorResponse(500, 'Failed to update notification'),
      { status: 500 }
    );
  }
}

// DELETE a notification
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
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

    // Validate MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(params.id)) {
      return NextResponse.json(
        createErrorResponse(400, 'Invalid notification ID'),
        { status: 400 }
      );
    }

    // Delete the notification
    const result = await Notification.deleteOne({
      _id: params.id,
      recipient: userId,
    });

    if (result.deletedCount === 0) {
      return NextResponse.json(
        createErrorResponse(404, 'Notification not found'),
        { status: 404 }
      );
    }

    // Get updated unread count
    const unreadCount = await Notification.countDocuments({
      recipient: userId,
      isRead: false,
    });

    return NextResponse.json(
      createSuccessResponse(200, {
        message: 'Notification deleted successfully',
        deletedCount: result.deletedCount,
        unreadCount,
      }),
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deleting notification:', error);
    return NextResponse.json(
      createErrorResponse(500, 'Failed to delete notification'),
      { status: 500 }
    );
  }
}
