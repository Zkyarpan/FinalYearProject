'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useSocket } from '@/contexts/SocketContext';
import { useUserStore } from '@/store/userStore';
import { toast } from 'sonner';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  RefreshCcw,
  Loader2,
  AlertCircle,
  UserSquare,
  Search,
} from 'lucide-react';
import InboxRightSection from '@/components/InboxRightSection';
import { Conversation, Psychologist } from '@/app/(sections)/inbox/types';

interface ConversationListProps {
  isPsychologist: boolean;
  selectedPsychologist: Psychologist | null;
  currentConversation: Conversation | null;
  setCurrentConversation: (conversation: Conversation) => void;
  setSelectedPsychologist: (psychologist: any) => void;
  setIsMobileListVisible: (visible: boolean) => void;
  onSelectPsychologist: (psychologist: Psychologist) => void;
}

const ConversationList: React.FC<ConversationListProps> = ({
  isPsychologist,
  selectedPsychologist,
  currentConversation,
  setCurrentConversation,
  setSelectedPsychologist,
  setIsMobileListVisible,
  onSelectPsychologist,
}) => {
  const { socket, isConnected, onlineUsers } = useSocket();
  const { user } = useUserStore();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState(false);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Robust fetch conversations function with retry mechanism
  const fetchConversations = async (showLoading = true) => {
    if (!user?._id) return;

    try {
      if (showLoading) {
        setLoading(true);
      }

      // Add cache-busting query parameters
      const timestamp = new Date().getTime();
      const response = await fetch(`/api/conversations?t=${timestamp}`, {
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          Pragma: 'no-cache',
          Expires: '0',
        },
      });

      if (!response.ok) {
        console.error(
          `Failed to fetch conversations: ${response.status} ${response.statusText}`
        );
        setFetchError(true);

        // Set up retry if not already scheduled
        if (!retryTimeoutRef.current) {
          retryTimeoutRef.current = setTimeout(() => {
            retryTimeoutRef.current = null;
            fetchConversations(false);
          }, 5000); // Retry after 5 seconds
        }

        return;
      }

      const data = await response.json();
      setFetchError(false);

      if (data.IsSuccess) {
        console.log(`Loaded ${data.Result?.length || 0} conversations`);
        setConversations(data.Result || []);

        // Auto-select the first conversation for psychologists
        if (
          isPsychologist &&
          data.Result &&
          data.Result.length > 0 &&
          !currentConversation
        ) {
          const firstConvo = data.Result[0];
          setCurrentConversation(firstConvo);
          // For psychologists, we want to select the user, not the psychologist
          setSelectedPsychologist(firstConvo.user);
          loadMessages(firstConvo._id);
          setIsMobileListVisible(false);
        }
      } else {
        console.warn(
          'API returned IsSuccess: false when fetching conversations'
        );
        setConversations([]);
      }
    } catch (error) {
      console.error('Error fetching conversations:', error);
      setFetchError(true);
      toast.error('Failed to load conversations. Retrying...');

      // Set up retry if not already scheduled
      if (!retryTimeoutRef.current) {
        retryTimeoutRef.current = setTimeout(() => {
          retryTimeoutRef.current = null;
          fetchConversations(false);
        }, 5000); // Retry after 5 seconds
      }
    } finally {
      if (showLoading) {
        setLoading(false);
      }
    }
  };

  // Load messages when a conversation is selected
  const loadMessages = async (conversationId: string) => {
    if (!user?._id) return;

    // Join the conversation room via socket
    if (socket && isConnected) {
      socket.emit('join_conversation', conversationId);
    }

    // Mark messages as read
    if (socket && isConnected) {
      socket.emit('mark_read', { conversationId, userId: user._id });
    }

    // Update conversation unread count
    setConversations(prev =>
      prev.map(convo =>
        convo._id === conversationId ? { ...convo, unreadCount: 0 } : convo
      )
    );
  };

  // Initial fetch of conversations
  useEffect(() => {
    fetchConversations();

    // Clear any retry timeout when unmounting
    return () => {
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
    };
  }, [user?._id, isPsychologist]);

  // Socket connection status monitoring
  useEffect(() => {
    if (isConnected) {
      console.log('Socket connected, refreshing conversations');
      fetchConversations(false);
    }
  }, [isConnected]);

  // Set up socket listeners for real-time messaging
  useEffect(() => {
    if (!socket || !isConnected || !user?._id) {
      console.log('Socket not connected or user not available');
      return;
    }

    // Handle new conversation notifications
    const handleMessageNotification = () => {
      // Refresh the conversation list
      fetchConversations(false);
    };

    // Register socket event listeners
    socket.on('message_notification', handleMessageNotification);
    socket.on('new_conversation', fetchConversations);

    // Join user's room for notifications
    socket.emit('join_user_room', user?._id || '');

    if (isPsychologist) {
      socket.emit('join_psychologist_room');
    }

    // Clean up listeners when component unmounts or dependencies change
    return () => {
      socket.off('message_notification', handleMessageNotification);
      socket.off('new_conversation', fetchConversations);

      // Leave user room
      socket.emit('leave_user_room', user._id);

      if (isPsychologist) {
        socket.emit('leave_psychologist_room');
      }
    };
  }, [socket, isConnected, user?._id, isPsychologist]);

  // Check if a user is online
  const isOnline = (userId: string) => {
    return onlineUsers.some(user => user.userId === userId);
  };

  // Get initials for avatar fallback
  const getInitials = (firstName?: string | null, lastName?: string | null) => {
    if (!firstName && !lastName) return '??';
    return `${firstName?.[0] || ''}${lastName?.[0] || ''}`;
  };

  // Format timestamp
  const formatTimestamp = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();

    // If less than a day, show time
    if (diff < 24 * 60 * 60 * 1000) {
      return date.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      });
    }
    // Otherwise show date
    return date.toLocaleDateString();
  };

  // Handle refresh button click
  const handleRefresh = () => {
    fetchConversations();
    if (currentConversation) {
      loadMessages(currentConversation._id);
    }
    toast.success('Refreshing conversations and messages');
  };

  if (isPsychologist) {
    // PSYCHOLOGIST VIEW
    return (
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b dark:border-[#333333]">
          <h2 className="text-xl font-semibold dark:text-white text-black">
            Patients
          </h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleRefresh}
            disabled={loading}
            className="h-8 w-8 rounded-full text-gray-400 hover:text-white hover:bg-[#2a2a2a]"
          >
            <RefreshCcw
              className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`}
            />
          </Button>
        </div>

        {/* Search */}
        <div className="p-2 border-b dark:border-[#333333]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
            <Input
              placeholder="Search patients..."
              className="pl-9 h-9 text-sm border dark:border-[#333333] rounded-md focus-visible:ring-0 focus-visible:ring-offset-0 dark:text-white text-black"
            />
          </div>
        </div>

        {/* Patient List */}
        <div className="flex-1 overflow-y-auto scrollbar-hide">
          {loading ? (
            <div className="flex justify-center items-center h-full">
              <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
            </div>
          ) : fetchError ? (
            <div className="flex flex-col justify-center items-center h-full p-4 space-y-2">
              <AlertCircle className="h-6 w-6 text-red-500" />
              <p className="text-sm text-red-400">
                Failed to load conversations
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => fetchConversations(true)}
                className="rounded-md border-[#2a2a2a] text-gray-300 hover:bg-[#2a2a2a]"
              >
                Retry
              </Button>
            </div>
          ) : conversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full p-4 text-center">
              <UserSquare className="h-10 w-10 text-gray-500 mb-3" />
              <h3 className="font-medium text-gray-300 mb-1">
                No patients yet
              </h3>
              <p className="text-sm text-gray-500">
                You'll see your patients here when they start conversations with
                you
              </p>
            </div>
          ) : (
            conversations.map(conversation => {
              const patient = conversation.user;
              const isSelected = currentConversation?._id === conversation._id;
              const hasUnread = (conversation.unreadCount ?? 0) > 0;

              return (
                <div
                  key={conversation._id}
                  className={`px-3 py-3 cursor-pointer transition-colors dark:hover:bg-[#1a1a1a] bg-gray-200 ${
                    isSelected ? 'dark:bg-[#1e1e1e]' : ''
                  }`}
                  onClick={() => {
                    setCurrentConversation(conversation);
                    setSelectedPsychologist(patient);
                    setIsMobileListVisible(false);
                    loadMessages(conversation._id);
                  }}
                >
                  <div className="flex items-center">
                    <div className="relative mr-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage
                          src={patient?.image || ''}
                          alt={patient?.firstName || ''}
                        />
                        <AvatarFallback className="bg-[#1e293b] text-blue-400">
                          {getInitials(patient?.firstName, patient?.lastName)}
                        </AvatarFallback>
                      </Avatar>
                      <span
                        className={`absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-[#121212] ${
                          isOnline(patient?._id || '')
                            ? 'bg-green-500'
                            : 'bg-gray-500'
                        }`}
                      />
                    </div>

                    <div className="flex flex-col min-w-0 flex-1">
                      <div className="flex justify-between items-center">
                        <span className="font-medium text-sm truncate">
                          {patient?.firstName} {patient?.lastName}
                        </span>
                        {conversation.lastMessage && (
                          <span className="text-xs text-gray-500 ml-2 whitespace-nowrap">
                            {formatTimestamp(
                              conversation.lastMessage.createdAt
                            )}
                          </span>
                        )}
                      </div>

                      <div className="flex">
                        <p
                          className={`text-xs truncate ${
                            hasUnread
                              ? 'text-white font-medium'
                              : 'text-gray-500'
                          }`}
                        >
                          {conversation.lastMessage?.content ||
                            'Start a conversation'}
                        </p>
                        {hasUnread && (
                          <div className="ml-auto">
                            <span className="bg-blue-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                              {conversation.unreadCount}
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="mt-1">
                        {isOnline(patient?._id || '') ? (
                          <span className="text-xs text-green-500">Online</span>
                        ) : (
                          <span className="text-xs text-gray-500">Offline</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    );
  } else {
    // REGULAR USER VIEW
    return (
      <InboxRightSection
        selectedPsychologist={selectedPsychologist}
        currentConversation={currentConversation}
        conversations={conversations}
        onSelectPsychologist={onSelectPsychologist}
        onSelectConversation={conversation => {
          setCurrentConversation(conversation);
          setSelectedPsychologist(
            conversation.psychologist._id === user?._id
              ? conversation.user
              : conversation.psychologist
          );
          setIsMobileListVisible(false);
          loadMessages(conversation._id);
        }}
        onRefresh={handleRefresh}
        loading={loading}
        fetchError={fetchError}
      />
    );
  }
};

export default ConversationList;
