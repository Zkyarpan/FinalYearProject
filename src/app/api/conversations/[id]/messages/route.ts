'use server';

// src/app/api/conversations/[id]/messages/route.ts
import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/db/db';
import Message from '@/models/Message';
import Conversation from '@/models/Conversation';
import { withAuth } from '@/middleware/authMiddleware';
import { createSuccessResponse, createErrorResponse } from '@/lib/response';
import { Types } from 'mongoose';

// Helper function to check if a string is a valid MongoDB ObjectId
function isValidObjectId(id: string) {
  return Types.ObjectId.isValid(id);
}

// Get messages for a conversation
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return withAuth(async (req: NextRequest, user: any) => {
    try {
      // Get conversation ID from params directly - no await
      const conversationId = params.id;
      console.log('conversationId:', conversationId);
      console.log('user id:', user.id);

      // Validate that the ID is a proper MongoDB ObjectId
      if (!isValidObjectId(conversationId)) {
        console.error('Invalid conversation ID format:', conversationId);
        return NextResponse.json(
          createErrorResponse(400, 'Invalid conversation ID format'),
          { status: 400 }
        );
      }

      // Parse query parameters
      const url = new URL(req.url);
      const before = url.searchParams.get('before');
      const limit = parseInt(url.searchParams.get('limit') || '50');

      await connectDB();

      // Check if conversation exists and user is a participant
      const conversation = await Conversation.findOne({
        _id: conversationId,
        participants: user.id,
      });

      console.log('Found conversation:', conversation ? 'Yes' : 'No');

      if (!conversation) {
        // Try to find if the conversation exists at all
        const anyConversation = await Conversation.findById(conversationId);
        console.log(
          'Conversation exists but user not participant:',
          anyConversation ? 'Yes' : 'No'
        );

        // If ID is same as user ID, provide more helpful error
        if (conversationId === user.id) {
          console.log(
            'User is trying to access a conversation using their own user ID'
          );
          return NextResponse.json(
            createErrorResponse(
              400,
              'You are using your user ID instead of a conversation ID'
            ),
            { status: 400 }
          );
        }

        return NextResponse.json(
          createErrorResponse(
            404,
            'Conversation not found or user not authorized'
          ),
          { status: 404 }
        );
      }

      // Build query
      let query: any = { conversation: conversationId };
      if (before) {
        query._id = { $lt: before };
      }

      // Get messages with pagination
      const messages = await Message.find(query)
        .sort({ createdAt: -1 }) // Sort by newest first (for pagination)
        .limit(limit)
        .populate(
          'sender',
          'firstName lastName email profileImage profilePhotoUrl role'
        )
        .populate(
          'receiver',
          'firstName lastName email profileImage profilePhotoUrl role'
        );

      // Sort messages chronologically for display
      const sortedMessages = [...messages].sort(
        (a, b) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );

      console.log(`Found ${sortedMessages.length} messages for conversation`);

      return NextResponse.json(createSuccessResponse(200, sortedMessages), {
        status: 200,
      });
    } catch (error: any) {
      console.error('Error fetching messages:', error);
      return NextResponse.json(
        createErrorResponse(500, 'Internal Server Error: ' + error.message),
        { status: 500 }
      );
    }
  }, request);
}

// Send a new message
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return withAuth(async (req: NextRequest, user: any) => {
    try {
      // Get conversation ID - no await
      const conversationId = params.id;

      // Validate that the ID is a proper MongoDB ObjectId
      if (!isValidObjectId(conversationId)) {
        return NextResponse.json(
          createErrorResponse(400, 'Invalid conversation ID format'),
          { status: 400 }
        );
      }

      const { content } = await req.json();

      if (!content) {
        return NextResponse.json(
          createErrorResponse(400, 'Message content is required'),
          { status: 400 }
        );
      }

      await connectDB();

      console.log('Looking for conversation ID:', conversationId);
      console.log('User ID for participant check:', user.id);

      // Check if conversation exists and user is a participant
      const conversation = await Conversation.findOne({
        _id: conversationId,
        participants: user.id,
      })
        .populate(
          'user',
          '_id role firstName lastName email profileImage profilePhotoUrl'
        )
        .populate(
          'psychologist',
          '_id role firstName lastName email profileImage profilePhotoUrl'
        );

      if (!conversation) {
        // If ID is same as user ID, provide more helpful error
        if (conversationId === user.id) {
          return NextResponse.json(
            createErrorResponse(
              400,
              'You are using your user ID instead of a conversation ID'
            ),
            { status: 400 }
          );
        }

        return NextResponse.json(
          createErrorResponse(
            404,
            'Conversation not found or user not authorized'
          ),
          { status: 404 }
        );
      }

      // Determine receiver and appropriate models
      let receiver, receiverModel, senderModel;

      // Check if sender is user or psychologist
      if (user.role === 'psychologist') {
        senderModel = 'Psychologist';
        receiverModel = 'User';
        receiver = conversation.user._id;
      } else {
        senderModel = 'User';
        receiverModel = 'Psychologist';
        receiver = conversation.psychologist._id;
      }

      // Create new message with proper model references
      const newMessage = new Message({
        conversation: conversationId,
        sender: user.id,
        senderModel: senderModel,
        senderId: user.id,
        receiver: receiver,
        receiverModel: receiverModel,
        receiverId: receiver,
        content,
        isRead: false,
      });

      await newMessage.save();

      // Update conversation's last message
      conversation.lastMessage = newMessage._id;
      await conversation.save();

      // Populate message with sender and receiver details
      const populatedMessage = await Message.findById(newMessage._id)
        .populate(
          'sender',
          'firstName lastName email profileImage profilePhotoUrl role'
        )
        .populate(
          'receiver',
          'firstName lastName email profileImage profilePhotoUrl role'
        );

      return NextResponse.json(createSuccessResponse(201, populatedMessage), {
        status: 201,
      });
    } catch (error: any) {
      console.error('Error sending message:', error);
      return NextResponse.json(
        createErrorResponse(500, 'Internal Server Error: ' + error.message),
        { status: 500 }
      );
    }
  }, request);
}
