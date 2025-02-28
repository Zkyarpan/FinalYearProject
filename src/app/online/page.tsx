'use client';

import { useState, useEffect } from 'react';
import { getSocket } from '@/lib/socketService';
import { Badge } from '@/components/ui/badge';

interface OnlineUser {
  socketId: string;
  userId: string;
  userData: {
    firstName?: string;
    email: string;
  };
}

export default function OnlineUsers() {
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const socket = getSocket();

    // Set connection status
    setIsConnected(socket.connected);

    // Handle connection
    const onConnect = () => {
      setIsConnected(true);
    };

    // Handle disconnection
    const onDisconnect = () => {
      setIsConnected(false);
    };

    // Handle users update event
    const onUsersUpdate = users => {
      setOnlineUsers(users);
    };

    // Subscribe to events
    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('users_update', onUsersUpdate);

    // Cleanup function
    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('users_update', onUsersUpdate);
    };
  }, []);

  return (
    <div className="p-4 border rounded-lg">
      <div className="flex items-center mb-4">
        <h2 className="text-lg font-semibold">Online Users</h2>
        <Badge
          className={`ml-2 ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}
        >
          {isConnected ? 'Connected' : 'Disconnected'}
        </Badge>
      </div>

      {onlineUsers.length === 0 ? (
        <p className="text-sm text-muted-foreground">No users online</p>
      ) : (
        <ul className="space-y-2">
          {onlineUsers.map(user => (
            <li key={user.socketId} className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>{user.userData.firstName || user.userData.email}</span>
              <span className="text-xs text-muted-foreground">
                ({user.userId})
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
