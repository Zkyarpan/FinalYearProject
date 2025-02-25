import { createServer } from 'http';
import { parse } from 'url';
import next from 'next';
import { Server } from 'socket.io';

const port = parseInt(process.env.PORT || '3000', 10);
const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

// Store for connected users
const connectedUsers = new Map();

app.prepare().then(() => {
  const server = createServer((req, res) => {
    const parsedUrl = parse(req.url!, true);
    handle(req, res, parsedUrl);
  });

  // Initialize Socket.IO
  const io = new Server(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST']
    }
  });

  // Socket.IO connection handling
  io.on('connection', (socket) => {
    console.log('New client connected', socket.id);

    // Handle user login
    socket.on('user_login', (userData) => {
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
        connectedAt: new Date().toISOString()
      });

      console.log(`User logged in: ${userId} with socket: ${socket.id}`);
      
      // Broadcast to all clients
      io.emit('users_update', Array.from(connectedUsers.values()));
      
      // Emit specific user connection event (for admins)
      io.emit('user_connected', {
        userId,
        socketId: socket.id,
        userData
      });
    });

    // Handle client requests for online users
    socket.on('get_online_users', () => {
      socket.emit('users_update', Array.from(connectedUsers.values()));
    });

    // Handle disconnect
    socket.on('disconnect', () => {
      // Remove user from connected users
      if (connectedUsers.has(socket.id)) {
        const userData = connectedUsers.get(socket.id);
        console.log(`User disconnected: ${userData.userId} (${socket.id})`);
        
        // Emit user disconnection event
        io.emit('user_disconnected', {
          userId: userData.userId,
          socketId: socket.id
        });
        
        connectedUsers.delete(socket.id);
        
        // Broadcast updated user list
        io.emit('users_update', Array.from(connectedUsers.values()));
      }
    });
  });

  // Listen for API requests to get connected users
  server.on('request', (req, res) => {
    const parsedUrl = parse(req.url!, true);
    
    // Add an API endpoint to get all connected users
    if (parsedUrl.pathname === '/api/connected-users') {
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({
        users: Array.from(connectedUsers.values()),
        count: connectedUsers.size
      }));
      return;
    }
  });

  server.listen(port, () => {
    console.log(
      `> Server listening at http://localhost:${port} as ${
        dev ? 'development' : process.env.NODE_ENV
      }`
    );
    console.log('> Socket.IO server initialized');
  });
});