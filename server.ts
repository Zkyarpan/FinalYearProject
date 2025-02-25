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

  // Initialize Socket.IO
  const io = new Server(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
  });

  // Socket.IO connection handling
  io.on('connection', socket => {
    console.log('New client connected', socket.id);

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
        connectedAt: new Date().toISOString(),
      });

      // Map user ID to socket ID for direct messaging
      userSocketMap.set(userId, socket.id);

      // Join a personal room based on user ID for direct messages
      socket.join(userId);

      console.log(`User logged in: ${userId} with socket: ${socket.id}`);

      // Broadcast to all clients
      io.emit('users_update', Array.from(connectedUsers.values()));
    });

    // Handle client requests for online users
    socket.on('get_online_users', () => {
      socket.emit('users_update', Array.from(connectedUsers.values()));
    });

    // CHAT FUNCTIONALITY

    // Join a specific conversation room
    socket.on('join_conversation', conversationId => {
      socket.join(`conversation:${conversationId}`);
      console.log(`Socket ${socket.id} joined conversation: ${conversationId}`);
    });

    // Leave a specific conversation room
    socket.on('leave_conversation', conversationId => {
      socket.leave(`conversation:${conversationId}`);
      console.log(`Socket ${socket.id} left conversation: ${conversationId}`);
    });

    // Handle new message
    socket.on('send_message', async messageData => {
      try {
        const { conversationId, content, senderId, receiverId } = messageData;

        // Validate required data
        if (!conversationId || !content || !senderId || !receiverId) {
          socket.emit('message_error', {
            error: 'Missing required message data',
          });
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

        // Update the conversation's last message
        await Conversation.findByIdAndUpdate(conversationId, {
          lastMessage: newMessage._id,
        });

        // Get populated message to broadcast
        const populatedMessage = await Message.findById(newMessage._id)
          .populate('sender', 'firstName lastName email profileImage')
          .populate('receiver', 'firstName lastName email profileImage');

        // Broadcast to the conversation room
        io.to(`conversation:${conversationId}`).emit(
          'new_message',
          populatedMessage
        );

        // Also send to the receiver's personal room
        io.to(receiverId).emit('message_notification', {
          message: populatedMessage,
          conversation: conversationId,
        });

        console.log(
          `Message sent in conversation ${conversationId} from ${senderId} to ${receiverId}`
        );
      } catch (error) {
        console.error('Error sending message:', error);
        socket.emit('message_error', { error: 'Failed to send message' });
      }
    });

    // Mark messages as read
    socket.on('mark_read', async ({ conversationId, userId }) => {
      try {
        // Update all unread messages in this conversation sent to this user
        await Message.updateMany(
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

        // Notify conversation room that messages have been read
        io.to(`conversation:${conversationId}`).emit('messages_read', {
          conversationId,
          userId,
        });

        console.log(
          `Messages marked as read in conversation ${conversationId} by user ${userId}`
        );
      } catch (error) {
        console.error('Error marking messages as read:', error);
      }
    });

    // Handle typing indicator
    socket.on('typing', ({ conversationId, userId, typing }) => {
      socket.to(`conversation:${conversationId}`).emit('user_typing', {
        conversationId,
        userId,
        typing,
      });
    });

    // Handle disconnect
    socket.on('disconnect', () => {
      // Get user data before removing from maps
      const userData = connectedUsers.get(socket.id);

      if (userData) {
        const userId = userData.userId;
        console.log(`User disconnected: ${userId} (${socket.id})`);

        // Remove from maps
        connectedUsers.delete(socket.id);
        userSocketMap.delete(userId);

        // Emit user disconnection event
        io.emit('user_disconnected', {
          userId,
          socketId: socket.id,
        });

        // Broadcast updated user list
        io.emit('users_update', Array.from(connectedUsers.values()));
      }
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
function resolve(arg0: string, arg1: string) {
  throw new Error('Function not implemented.');
}
