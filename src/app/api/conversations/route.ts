'use server';

import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/db/db';
import Conversation from '@/models/Conversation';
import Message from '@/models/Message';
import { withAuth } from '@/middleware/authMiddleware';
import { createSuccessResponse, createErrorResponse } from '@/lib/response';
import Profile from '@/models/Profile';

// Get all conversations for the current user
export async function GET(req: NextRequest) {
  return withAuth(async (req: NextRequest, user: any) => {
    try {
      await connectDB();
      const userId = user.id;

      // Find all conversations where the user is a participant
      const conversations = await Conversation.find({
        participants: userId,
        isActive: true,
      })
        .populate('user', '_id email') // Just get basic user info
        .populate('psychologist', 'firstName lastName email profilePhotoUrl') // Use profilePhotoUrl for psychologists
        .populate({
          path: 'lastMessage',
          select: 'content createdAt isRead sender',
          populate: {
            path: 'sender',
            select: '_id email firstName lastName profilePhotoUrl', // Include both possible fields
          },
        })
        .sort({ updatedAt: -1 });

      // Get all unique user IDs to fetch their profiles
      const userIds = conversations
        .map(convo => convo.user?._id?.toString())
        .filter(id => id);

      // Fetch all profiles for these users in one query
      const profiles = await Profile.find(
        {
          user: { $in: userIds },
        },
        'user firstName lastName image'
      );

      // Create a map for quick lookup
      const profileMap = {};
      profiles.forEach(profile => {
        profileMap[profile.user.toString()] = profile;
      });

      // For each conversation, get unread messages count and enhance with profile info
      const conversationsWithUnreadCount = await Promise.all(
        conversations.map(async conversation => {
          const convoObj = conversation.toObject();
          const userId = convoObj.user?._id?.toString();

          // Add profile data to user if available
          if (userId && profileMap[userId]) {
            convoObj.user = {
              _id: convoObj.user._id,
              email: convoObj.user.email,
              firstName: profileMap[userId].firstName,
              lastName: profileMap[userId].lastName,
              image: profileMap[userId].image,
            };
          }

          // For consistency in frontend, add image property to psychologist
          if (convoObj.psychologist) {
            convoObj.psychologist.image = convoObj.psychologist.profilePhotoUrl;
          }

          const unreadCount = await Message.countDocuments({
            conversation: convoObj._id,
            receiver: user.id,
            isRead: false,
          });

          return {
            ...convoObj,
            unreadCount,
          };
        })
      );

      return NextResponse.json(
        createSuccessResponse(200, conversationsWithUnreadCount),
        { status: 200 }
      );
    } catch (error) {
      console.error('Error fetching conversations:', error);
      return NextResponse.json(
        createErrorResponse(500, 'Internal Server Error'),
        { status: 500 }
      );
    }
  }, req);
}

// Create a new conversation
export async function POST(req: NextRequest) {
  return withAuth(async (req: NextRequest, user: any) => {
    try {
      console.log('Conversation POST endpoint called by user:', user.id);

      // Parse request body with error handling
      let requestBody;
      try {
        requestBody = await req.json();
      } catch (e) {
        console.error('Failed to parse request body:', e);
        return NextResponse.json(
          createErrorResponse(400, 'Invalid request body format'),
          { status: 400 }
        );
      }

      const { psychologistId, initialMessage } = requestBody;

      if (!psychologistId) {
        console.log('Missing psychologistId in request');
        return NextResponse.json(
          createErrorResponse(400, 'Psychologist ID is required'),
          { status: 400 }
        );
      }

      console.log(
        `Looking for conversation between user ${user.id} and psychologist ${psychologistId}`
      );

      try {
        await connectDB();
      } catch (dbError) {
        console.error('Database connection error:', dbError);
        return NextResponse.json(
          createErrorResponse(503, 'Database connection failed'),
          { status: 503 }
        );
      }

      // Check if conversation already exists
      let conversation;
      try {
        conversation = await Conversation.findOne({
          user: user.id,
          psychologist: psychologistId,
          isActive: true,
        });

        console.log(
          'Existing conversation found:',
          conversation ? conversation._id : 'None'
        );
      } catch (findError) {
        console.error('Error finding conversation:', findError);
        return NextResponse.json(
          createErrorResponse(500, 'Failed to check for existing conversation'),
          { status: 500 }
        );
      }

      // If no conversation exists, create a new one
      if (!conversation) {
        try {
          console.log('Creating new conversation');
          conversation = new Conversation({
            participants: [user.id, psychologistId],
            user: user.id,
            psychologist: psychologistId,
            isActive: true,
          });

          await conversation.save();
          console.log('New conversation created with ID:', conversation._id);
        } catch (createError) {
          console.error('Failed to create conversation:', createError);
          return NextResponse.json(
            createErrorResponse(500, 'Failed to create new conversation'),
            { status: 500 }
          );
        }
      }

      // If initial message provided, create a message
      if (initialMessage) {
        try {
          console.log('Adding initial message to conversation');
          const message = new Message({
            conversation: conversation._id,
            sender: user.id,
            receiver: psychologistId,
            content: initialMessage,
            isRead: false,
          });

          await message.save();

          // Update conversation with last message
          conversation.lastMessage = message._id;
          await conversation.save();
        } catch (messageError) {
          console.error('Failed to add initial message:', messageError);
          // Continue anyway since we have the conversation
        }
      }

      // Return the conversation with populated fields
      try {
        const populatedConversation = await Conversation.findById(
          conversation._id
        )
          .populate('user', 'firstName lastName email image')
          .populate('psychologist', 'firstName lastName email profilePhotoUrl')
          .populate({
            path: 'lastMessage',
            select: 'content createdAt isRead sender',
          });

        console.log('Returning populated conversation');

        return NextResponse.json(
          createSuccessResponse(
            conversation ? 200 : 201,
            populatedConversation
          ),
          { status: conversation ? 200 : 201 }
        );
      } catch (populateError) {
        console.error('Failed to populate conversation:', populateError);

        // Return the unpopulated conversation as fallback
        return NextResponse.json(
          createSuccessResponse(conversation ? 200 : 201, conversation),
          { status: conversation ? 200 : 201 }
        );
      }
    } catch (error) {
      console.error('Unhandled error creating/finding conversation:', error);

      // Check if headers are already sent to avoid "Cannot set headers after they are sent" error
      const response = NextResponse.json(
        createErrorResponse(500, 'Internal Server Error'),
        { status: 500 }
      );

      // Add CORS headers to ensure browsers can read the response
      response.headers.set('Access-Control-Allow-Origin', '*');
      response.headers.set(
        'Access-Control-Allow-Methods',
        'GET, POST, OPTIONS'
      );
      response.headers.set(
        'Access-Control-Allow-Headers',
        'Content-Type, Authorization'
      );

      return response;
    }
  }, req);
}
