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
      const userId = user.id;
      const { psychologistId, initialMessage } = await req.json();

      if (!psychologistId) {
        return NextResponse.json(
          createErrorResponse(400, 'Psychologist ID is required'),
          { status: 400 }
        );
      }

      await connectDB();

      // Check if conversation already exists
      let conversation = await Conversation.findOne({
        user: userId,
        psychologist: psychologistId,
        isActive: true,
      });

      // If no conversation exists, create a new one
      if (!conversation) {
        conversation = new Conversation({
          participants: [userId, psychologistId],
          user: userId,
          psychologist: psychologistId,
          isActive: true,
        });

        await conversation.save();
      }

      // If initial message provided, create a message
      if (initialMessage) {
        const message = new Message({
          conversation: conversation._id,
          sender: userId,
          receiver: psychologistId,
          content: initialMessage,
          isRead: false,
        });

        await message.save();

        // Update conversation with last message
        conversation.lastMessage = message._id;
        await conversation.save();
      }

      // Return the conversation with populated fields
      const populatedConversation = await Conversation.findById(
        conversation._id
      )
        .populate('user', 'firstName lastName email image')
        .populate('psychologist', 'firstName lastName email profilePhotoUrl')
        .populate({
          path: 'lastMessage',
          select: 'content createdAt isRead sender',
        });

      return NextResponse.json(
        createSuccessResponse(201, populatedConversation),
        { status: 201 }
      );
    } catch (error) {
      console.error('Error creating conversation:', error);
      return NextResponse.json(
        createErrorResponse(500, 'Internal Server Error'),
        { status: 500 }
      );
    }
  }, req);
}
