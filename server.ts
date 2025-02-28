import { createServer } from 'http';
import { parse } from 'url';
import next from 'next';
import { Server } from 'socket.io';
import connectDB from './src/db/db';
import Message from './src/models/Message';
import Conversation from './src/models/Conversation';

const port = parseInt(process.env.PORT || '3000', 10);
const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

// Store for connected users
const connectedUsers = new Map();

// In-memory mapping of user IDs to socket IDs for direct messages
const userSocketMap = new Map();

// Room tracking
const conversationRooms = new Map();
const psychologistRoom = 'psychologists';

// Connect to MongoDB at server start
connectDB().catch(err => {
  console.error('Failed to connect to MongoDB:', err);
  process.exit(1);
});

app.prepare().then(() => {
  const server = createServer((req, res) => {
    const parsedUrl = parse(req.url!, true);
    handle(req, res, parsedUrl);
  });

  // Initialize Socket.IO with better connection settings
  const io = new Server(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
    pingTimeout: 60000, // 1 minute ping timeout
    pingInterval: 30000, // Send ping every 30 seconds
    connectTimeout: 45000, // 45 second connection timeout
    maxHttpBufferSize: 1e8, // 100 MB max buffer size
  });

  // Socket.IO connection handling
  io.on('connection', socket => {
    console.log('New client connected', socket.id);

    // Extract user info from socket connection
    const userId =
      socket.handshake.auth.userId || socket.handshake.query.userId;
    const userRole =
      socket.handshake.auth.userRole || socket.handshake.query.userRole;

    if (!userId) {
      console.warn(
        'Connection without userId detected, disconnecting:',
        socket.id
      );
      socket.disconnect(true);
      return;
    }

    console.log(
      `User connected: ${userId}, role: ${userRole}, socket: ${socket.id}`
    );

    // Handle user login
    socket.on('user_login', userData => {
      const userId = userData._id || userData.id;

      if (!userId) {
        console.warn('User login event received without a user ID');
        return;
      }

      // Store user data with socket ID
      connectedUsers.set(socket.id, {
        userId,
        socketId: socket.id,
        userData,
        userRole,
        connectedAt: new Date().toISOString(),
      });

      // Map user ID to socket ID for direct messaging
      userSocketMap.set(userId, socket.id);

      // Join a personal room based on user ID for direct messages
      socket.join(userId);

      // If user is a psychologist, add to psychologist room
      if (userRole === 'psychologist') {
        console.log(`Psychologist ${userId} joined the psychologist room`);
        socket.join(psychologistRoom);
      }

      console.log(`User logged in: ${userId} with socket: ${socket.id}`);

      // Broadcast to all clients
      io.emit(
        'users_update',
        Array.from(connectedUsers.values()).map(user => ({
          userId: user.userId,
          socketId: user.socketId,
          userRole: user.userRole,
          firstName: user.userData?.firstName,
          lastName: user.userData?.lastName,
        }))
      );
    });

    // Handle client requests for online users
    socket.on('get_online_users', () => {
      const onlineUsers = Array.from(connectedUsers.values()).map(user => ({
        userId: user.userId,
        socketId: user.socketId,
        userRole: user.userRole,
        firstName: user.userData?.firstName,
        lastName: user.userData?.lastName,
      }));

      socket.emit('users_update', onlineUsers);
      console.log(
        `Sent online users list to ${socket.id}, count: ${onlineUsers.length}`
      );
    });

    // Handle ping to keep connection alive
    socket.on('ping', data => {
      // Response with pong
      socket.emit('pong', { timestamp: new Date().toISOString() });
    });

    // CHAT FUNCTIONALITY

    // Join a specific conversation room
    socket.on('join_conversation', conversationId => {
      if (!conversationId) {
        console.warn(
          'Join conversation event received without conversation ID'
        );
        return;
      }

      // Leave any other conversation rooms first
      Array.from(socket.rooms).forEach(room => {
        if (
          room !== socket.id &&
          room !== userId &&
          room !== psychologistRoom
        ) {
          socket.leave(room);
        }
      });

      const roomName = `conversation:${conversationId}`;
      socket.join(roomName);

      // Keep track of who's in the conversation
      if (!conversationRooms.has(conversationId)) {
        conversationRooms.set(conversationId, new Set());
      }
      conversationRooms.get(conversationId).add(userId);

      console.log(
        `Socket ${socket.id} (user ${userId}) joined conversation: ${conversationId}`
      );
      console.log(
        `Room ${roomName} now has ${
          io.sockets.adapter.rooms.get(roomName)?.size || 0
        } members`
      );
    });

    // Leave a specific conversation room
    socket.on('leave_conversation', conversationId => {
      if (!conversationId) return;

      const roomName = `conversation:${conversationId}`;
      socket.leave(roomName);

      // Update room tracking
      if (conversationRooms.has(conversationId)) {
        conversationRooms.get(conversationId).delete(userId);
      }

      console.log(
        `Socket ${socket.id} (user ${userId}) left conversation: ${conversationId}`
      );
    });

    // Join psychologist room
    socket.on('join_psychologist_room', () => {
      if (userRole === 'psychologist') {
        socket.join(psychologistRoom);
        console.log(`Psychologist ${userId} joined the psychologist room`);
      }
    });

    // Leave psychologist room
    socket.on('leave_psychologist_room', () => {
      socket.leave(psychologistRoom);
      console.log(`User ${userId} left the psychologist room`);
    });
    // socket-server.js - Updated socket server code

    // Handle new message with improved error handling and complete user information
    socket.on('send_message', async messageData => {
      try {
        const { conversationId, content, senderId, receiverId } = messageData;

        // Validate required data
        if (!conversationId || !content || !senderId || !receiverId) {
          console.warn(
            `Missing data in message: ${JSON.stringify(messageData)}`
          );
          socket.emit('message_error', {
            error: 'Missing required message data',
          });
          return;
        }

        console.log(
          `Processing message in conversation ${conversationId} from ${senderId} to ${receiverId}`
        );

        // Find sender and receiver information for proper display
        const conversation = await Conversation.findById(conversationId)
          .populate('user', '_id firstName lastName email image role')
          .populate(
            'psychologist',
            '_id firstName lastName email profilePhotoUrl role'
          );

        if (!conversation) {
          console.warn(`Conversation not found: ${conversationId}`);
          socket.emit('message_error', { error: 'Conversation not found' });
          return;
        }

        // Create new message in database
        const newMessage = new Message({
          conversation: conversationId,
          sender: senderId,
          receiver: receiverId,
          content,
          isRead: false,
          readAt: null,
        });

        await newMessage.save();
        console.log(`Message saved to database with ID: ${newMessage._id}`);

        // Update the conversation's last message
        await Conversation.findByIdAndUpdate(conversationId, {
          lastMessage: newMessage._id,
          updatedAt: new Date(), // Force update the updatedAt timestamp
        });

        // Get populated message to broadcast with complete sender/receiver info
        const populatedMessage = await Message.findById(newMessage._id)
          .populate(
            'sender',
            '_id firstName lastName email image profilePhotoUrl role'
          )
          .populate(
            'receiver',
            '_id firstName lastName email image profilePhotoUrl role'
          );

        // Ensure the message has proper sender information
        const enhancedMessage = {
          ...populatedMessage.toObject(),
          sender: populatedMessage.sender || {
            _id: senderId,
            firstName:
              conversation.user._id.toString() === senderId
                ? conversation.user.firstName
                : conversation.psychologist.firstName,
            lastName:
              conversation.user._id.toString() === senderId
                ? conversation.user.lastName
                : conversation.psychologist.lastName,
            email:
              conversation.user._id.toString() === senderId
                ? conversation.user.email
                : conversation.psychologist.email,
            image:
              conversation.user._id.toString() === senderId
                ? conversation.user.image
                : conversation.psychologist.profilePhotoUrl,
            role:
              conversation.user._id.toString() === senderId
                ? 'user'
                : 'psychologist',
          },
        };

        // SIMPLIFIED NOTIFICATION STRATEGY to avoid duplicates
        const roomName = `conversation:${conversationId}`;

        // 1. Broadcast to conversation room
        io.to(roomName).emit('new_message', enhancedMessage);

        // 2. Check if the receiver is in the conversation room
        const receiverInRoom = io.sockets.adapter.rooms
          .get(roomName)
          ?.has(userSocketMap.get(receiverId));

        // 3. Only send direct notification if receiver is not in the room
        if (!receiverInRoom) {
          io.to(receiverId).emit('message_notification', {
            message: enhancedMessage,
            conversation: conversationId,
          });
        }

        console.log(`Message processing complete for ID: ${newMessage._id}`);
      } catch (error) {
        console.error('Error sending message:', error);
        socket.emit('message_error', {
          error: 'Failed to send message',
          details: error.message,
        });
      }
    });

    // Add typing indicator support
    socket.on('typing', ({ conversationId, userId, typing }) => {
      if (!conversationId) return;

      const roomName = `conversation:${conversationId}`;
      socket.to(roomName).emit('user_typing', {
        conversationId,
        userId,
        typing,
      });
    });

    // Enhanced mark read function
    socket.on('mark_read', async ({ conversationId, userId }) => {
      try {
        if (!conversationId || !userId) {
          console.warn('Mark read event missing data:', {
            conversationId,
            userId,
          });
          return;
        }

        console.log(
          `Marking messages as read in conversation ${conversationId} for user ${userId}`
        );

        // Update all unread messages in this conversation sent to this user
        const result = await Message.updateMany(
          {
            conversation: conversationId,
            receiver: userId,
            isRead: false,
          },
          {
            isRead: true,
            readAt: new Date(),
          }
        );

        console.log(`Updated ${result.modifiedCount} messages as read`);

        // Notify conversation room that messages have been read
        const roomName = `conversation:${conversationId}`;
        io.to(roomName).emit('messages_read', {
          conversationId,
          userId,
        });

        // Also notify senders directly
        const messages = await Message.find({
          conversation: conversationId,
          receiver: userId,
          isRead: true,
        }).select('sender');

        const senderIds = [
          ...new Set(messages.map(msg => msg.sender.toString())),
        ];

        senderIds.forEach(senderId => {
          const senderSocketId = userSocketMap.get(senderId);
          if (senderSocketId) {
            io.to(senderSocketId).emit('messages_read', {
              conversationId,
              userId,
            });
          }
        });
      } catch (error) {
        console.error('Error marking messages as read:', error);
      }
    });

    // Mark messages as read
    socket.on('mark_read', async ({ conversationId, userId }) => {
      try {
        if (!conversationId || !userId) {
          console.warn('Mark read event missing data:', {
            conversationId,
            userId,
          });
          return;
        }

        console.log(
          `Marking messages as read in conversation ${conversationId} for user ${userId}`
        );

        // Update all unread messages in this conversation sent to this user
        const result = await Message.updateMany(
          {
            conversation: conversationId,
            receiver: userId,
            isRead: false,
          },
          {
            isRead: true,
            readAt: new Date(),
          }
        );

        console.log(`Updated ${result.modifiedCount} messages as read`);

        // Notify conversation room that messages have been read
        const roomName = `conversation:${conversationId}`;
        io.to(roomName).emit('messages_read', {
          conversationId,
          userId,
        });
        console.log(`Read status broadcast to room ${roomName}`);

        // Also notify sender directly
        const messages = await Message.find({
          conversation: conversationId,
          receiver: userId,
          isRead: true,
        }).select('sender');

        const senderIds = [
          ...new Set(messages.map(msg => msg.sender.toString())),
        ];
        senderIds.forEach(senderId => {
          io.to(senderId).emit('messages_read', {
            conversationId,
            userId,
          });
        });
      } catch (error) {
        console.error('Error marking messages as read:', error);
      }
    });

    // Handle typing indicator
    socket.on('typing', ({ conversationId, userId, typing }) => {
      if (!conversationId) return;

      const roomName = `conversation:${conversationId}`;
      socket.to(roomName).emit('user_typing', {
        conversationId,
        userId,
        typing,
      });
    });

    // Handle explicit user logout
    socket.on('user_logout', () => {
      handleDisconnect();
    });

    // Handle disconnect
    const handleDisconnect = () => {
      // Get user data before removing from maps
      const userData = connectedUsers.get(socket.id);

      if (userData) {
        const userId = userData.userId;
        console.log(`User disconnected: ${userId} (${socket.id})`);

        // Remove from maps
        connectedUsers.delete(socket.id);
        userSocketMap.delete(userId);

        // Remove from any conversation rooms
        conversationRooms.forEach((users, roomId) => {
          users.delete(userId);
        });

        // Emit user disconnection event
        io.emit('user_disconnected', {
          userId,
          socketId: socket.id,
        });

        // Broadcast updated user list
        io.emit(
          'users_update',
          Array.from(connectedUsers.values()).map(user => ({
            userId: user.userId,
            socketId: user.socketId,
            userRole: user.userRole,
            firstName: user.userData?.firstName,
            lastName: user.userData?.lastName,
          }))
        );
      }
    };

    socket.on('disconnect', () => {
      handleDisconnect();
    });
  });

  server.listen(port, () => {
    console.log(
      `> Server listening at http://localhost:${port} as ${
        dev ? 'development' : process.env.NODE_ENV
      }`
    );
    console.log('> Socket.IO server initialized.');
  });
});
