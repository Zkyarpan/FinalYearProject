'use client';

import { useState, useEffect } from 'react';
import { useSocket } from '@/contexts/SocketContext';
import { useUserStore } from '@/store/userStore';

export function useUserConnections() {
  const { socket, onlineUsers } = useSocket();
  const { user } = useUserStore();
  const [userSocketInfo, setUserSocketInfo] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (!user) return;
    
    // Check if current user is admin
    setIsAdmin(user.role === 'admin');
    
    // Find current user's socket info
    if (socket && onlineUsers.length > 0) {
      const currentUserInfo = onlineUsers.find(u => u.userId === user._id);
      if (currentUserInfo) {
        setUserSocketInfo(currentUserInfo);
      }
    }
  }, [user, socket, onlineUsers]);

  return {
    currentUser: user,
    currentUserSocketInfo: userSocketInfo,
    onlineUsers,
    isAdmin,
    socket
  };
}