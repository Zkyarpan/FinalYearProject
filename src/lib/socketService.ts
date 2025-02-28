import { io } from 'socket.io-client';

let socket;

export const initializeSocket = () => {
  if (!socket) {
    const socketUrl =
      process.env.NEXT_PUBLIC_SOCKET_URL || window.location.origin;
    socket = io(socketUrl);

    socket.on('connect', () => {
      console.log('Socket connected:', socket.id);
    });

    socket.on('disconnect', () => {
      console.log('Socket disconnected');
    });

    socket.on('connect_error', err => {
      console.error('Socket connection error:', err);
    });
  }

  return socket;
};

export const getSocket = () => {
  if (!socket) {
    return initializeSocket();
  }
  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = undefined;
  }
};

export const emitUserLogin = userData => {
  const socket = getSocket();
  socket.emit('user_login', userData);
};
