'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useSocket } from '@/context/SocketContext';
import { useUserStore } from '@/store/userStore';

// Define types
type Conversation = {
  _id: string;
  user: any;
  psychologist: any;
  lastMessage: any;
  unreadCount: number;
};

type Message = {
  _id: string;
  conversation: string;
  sender: any;
  receiver: any;
  senderId?: string;
  receiverId?: string;
  content: string;
  isRead: boolean;
  readAt: string | null;
  createdAt: string;
  updatedAt: string;
};

type ChatContextType = {
  conversations: Conversation[];
  currentConversation: Conversation | null;
  messages: Message[];
  loadingMessages: boolean;
  loadingConversations: boolean;
  hasMoreMessages: boolean;
  unreadCount: number;
  isTyping: { [key: string]: boolean };
  loadConversations: () => Promise<void>;
  setCurrentConversation: (conversation: Conversation | null) => void;
  loadMessages: (conversationId: string, reset?: boolean) => Promise<void>;
  loadMoreMessages: () => Promise<void>;
  sendMessage: (content: string) => Promise<void>;
  startNewConversation: (
    psychologistId: string,
    initialMessage?: string
  ) => Promise<void>;
  markAsRead: (conversationId: string) => Promise<void>;
  setTyping: (conversationId: string, typing: boolean) => void;
};

const ChatContext = createContext<ChatContextType | null>(null);

export const ChatProvider = ({ children }: { children: React.ReactNode }) => {
  const { user } = useUserStore();
  const { socket, isConnected } = useSocket();

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversation, setCurrentConversation] =
    useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [loadingConversations, setLoadingConversations] = useState(false);
  const [hasMoreMessages, setHasMoreMessages] = useState(true);
  const [oldestMessageId, setOldestMessageId] = useState<string | null>(null);
  const [isTyping, setIsTyping] = useState<{ [key: string]: boolean }>({});

  // Calculate total unread count
  const unreadCount = conversations.reduce(
    (total, convo) => total + (convo.unreadCount || 0),
    0
  );

  // Load conversations
  const loadConversations = async () => {
    if (!user?._id) return;

    setLoadingConversations(true);
    try {
      const timestamp = new Date().getTime();
      const response = await fetch(`/api/conversations?t=${timestamp}`, {
        headers: {
          'Cache-Control': 'no-cache',
          Pragma: 'no-cache',
          Expires: '0',
        },
      });

      if (!response.ok) {
        console.warn('Failed to load conversations, returning empty list');
        setConversations([]);
        return;
      }

      const data = await response.json();
      setConversations(data.Result || []);
    } catch (error) {
      console.warn('Error loading conversations:', error);
      setConversations([]);
    } finally {
      setLoadingConversations(false);
    }
  };

  // Load messages for a conversation
  const loadMessages = async (conversationId: string, reset = true) => {
    if (!user?._id) return;

    setLoadingMessages(true);

    if (reset) {
      setMessages([]);
      setOldestMessageId(null);
      setHasMoreMessages(true);
    }

    try {
      // Join the conversation room via socket
      if (socket && isConnected) {
        socket.emit('join_conversation', conversationId);
      }

      const timestamp = new Date().getTime();
      const response = await fetch(
        `/api/conversations/${conversationId}/messages?t=${timestamp}`,
        {
          headers: {
            'Cache-Control': 'no-cache',
            Pragma: 'no-cache',
            Expires: '0',
          },
        }
      );

      if (!response.ok) throw new Error('Failed to load messages');

      const data = await response.json();
      const fetchedMessages = data.Result || [];

      // Process messages to ensure sender/receiver properties are properly formatted
      const processedMessages = fetchedMessages.map(msg => {
        const processedMsg = { ...msg };

        // Save senderId/receiverId if only objects are available
        if (
          !processedMsg.senderId &&
          processedMsg.sender &&
          processedMsg.sender._id
        ) {
          processedMsg.senderId = processedMsg.sender._id;
        }

        if (
          !processedMsg.receiverId &&
          processedMsg.receiver &&
          processedMsg.receiver._id
        ) {
          processedMsg.receiverId = processedMsg.receiver._id;
        }

        return processedMsg;
      });

      setMessages(processedMessages);

      if (processedMessages.length > 0) {
        setOldestMessageId(processedMessages[0]._id);
      }

      setHasMoreMessages(processedMessages.length >= 50);

      // Mark messages as read via socket
      if (socket && isConnected) {
        socket.emit('mark_read', { conversationId, userId: user._id });
      }

      // Update unread count in conversations list
      setConversations(prev =>
        prev.map(convo =>
          convo._id === conversationId ? { ...convo, unreadCount: 0 } : convo
        )
      );
    } catch (error) {
      console.error('Error loading messages:', error);
    } finally {
      setLoadingMessages(false);
    }
  };

  // Load more (older) messages
  const loadMoreMessages = async () => {
    if (
      !currentConversation ||
      !oldestMessageId ||
      !hasMoreMessages ||
      loadingMessages
    ) {
      return;
    }

    setLoadingMessages(true);

    try {
      const timestamp = new Date().getTime();
      const response = await fetch(
        `/api/conversations/${currentConversation._id}/messages?before=${oldestMessageId}&t=${timestamp}`,
        {
          headers: {
            'Cache-Control': 'no-cache',
            Pragma: 'no-cache',
            Expires: '0',
          },
        }
      );

      if (!response.ok) throw new Error('Failed to load more messages');

      const data = await response.json();
      const olderMessages = data.Result || [];

      // Process messages like in loadMessages
      const processedMessages = olderMessages.map(msg => {
        const processedMsg = { ...msg };

        if (
          !processedMsg.senderId &&
          processedMsg.sender &&
          processedMsg.sender._id
        ) {
          processedMsg.senderId = processedMsg.sender._id;
        }

        if (
          !processedMsg.receiverId &&
          processedMsg.receiver &&
          processedMsg.receiver._id
        ) {
          processedMsg.receiverId = processedMsg.receiver._id;
        }

        return processedMsg;
      });

      if (processedMessages.length > 0) {
        setMessages(prev => [...processedMessages, ...prev]);
        setOldestMessageId(processedMessages[0]._id);
      }

      setHasMoreMessages(processedMessages.length >= 50);
    } catch (error) {
      console.error('Error loading more messages:', error);
    } finally {
      setLoadingMessages(false);
    }
  };

  // Send a message
  const sendMessage = async (content: string) => {
    if (!user?._id || !currentConversation || !content.trim()) {
      return;
    }

    try {
      // Find the receiver (the other participant)
      const receiverId =
        currentConversation.user._id === user._id
          ? currentConversation.psychologist._id
          : currentConversation.user._id;

      const receiverInfo =
        currentConversation.user._id === user._id
          ? currentConversation.psychologist
          : currentConversation.user;

      // Create a temporary message for immediate display
      const tempId = `temp-${Date.now()}-${Math.random()
        .toString(36)
        .substr(2, 9)}`;
      const tempMessage = {
        _id: tempId,
        conversation: currentConversation._id,
        sender: {
          _id: user._id,
          firstName: user.firstName || '',
          lastName: user.lastName || '',
          profileImage: user.profileImage || '',
          role: user.role || 'user',
        },
        senderId: user._id,
        receiver: {
          _id: receiverId,
          firstName: receiverInfo?.firstName || '',
          lastName: receiverInfo?.lastName || '',
          profileImage:
            receiverInfo?.profileImage || receiverInfo?.profilePhotoUrl || '',
          role:
            receiverInfo?.role ||
            (user.role === 'psychologist' ? 'user' : 'psychologist'),
        },
        receiverId: receiverId,
        content,
        isRead: false,
        readAt: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Add to messages immediately for better UX
      setMessages(prev => [...prev, tempMessage]);

      // Send via Socket.IO for real-time delivery with complete details
      if (socket && isConnected) {
        socket.emit('send_message', {
          conversationId: currentConversation._id,
          content,
          senderId: user._id,
          senderDetails: {
            _id: user._id,
            firstName: user.firstName,
            lastName: user.lastName,
            profileImage: user.profileImage,
            role: user.role,
          },
          receiverId: receiverId,
          receiverDetails: {
            _id: receiverId,
            firstName: receiverInfo?.firstName,
            lastName: receiverInfo?.lastName,
            profileImage:
              receiverInfo?.profileImage || receiverInfo?.profilePhotoUrl,
            role: receiverInfo?.role,
          },
        });
      }

      // Also send via API for persistence
      const response = await fetch(
        `/api/conversations/${currentConversation._id}/messages`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache',
          },
          body: JSON.stringify({ content }),
        }
      );

      if (!response.ok) throw new Error('Failed to send message');

      // Get the saved message
      const data = await response.json();

      if (data.IsSuccess && data.Result) {
        // Replace temp message with real one
        setMessages(prev =>
          prev.map(msg => (msg._id === tempId ? data.Result : msg))
        );
      }

      // Update conversation's last message
      setConversations(prev =>
        prev.map(convo =>
          convo._id === currentConversation._id
            ? {
                ...convo,
                lastMessage: {
                  content,
                  createdAt: new Date().toISOString(),
                  isRead: false,
                },
              }
            : convo
        )
      );
    } catch (error) {
      console.error('Error sending message:', error);
      // Remove temp message on error
      setMessages(prev => prev.filter(msg => !msg._id.startsWith('temp-')));
    }
  };

  // Start a new conversation with a psychologist
  const startNewConversation = async (
    psychologistId: string,
    initialMessage?: string
  ) => {
    if (!user?._id) return;

    try {
      const response = await fetch('/api/conversations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          psychologistId,
          initialMessage,
        }),
      });

      if (!response.ok) throw new Error('Failed to create conversation');

      const data = await response.json();
      const newConversation = data.Result;

      // Update conversations list and set as current
      await loadConversations();

      // Find the newly created conversation in the updated list
      const timestamp = new Date().getTime();
      const updatedConversations = await fetch(
        `/api/conversations?t=${timestamp}`
      ).then(res => res.json());
      const createdConversation = updatedConversations.Result.find(
        (c: Conversation) => c._id === newConversation._id
      );

      if (createdConversation) {
        setCurrentConversation(createdConversation);
        loadMessages(createdConversation._id);
      }

      return newConversation;
    } catch (error) {
      console.error('Error starting conversation:', error);
    }
  };

  // Mark messages as read
  const markAsRead = async (conversationId: string) => {
    if (!user?._id || !socket || !isConnected) return;

    socket.emit('mark_read', { conversationId, userId: user._id });

    // Update unread count in conversations list
    setConversations(prev =>
      prev.map(convo =>
        convo._id === conversationId ? { ...convo, unreadCount: 0 } : convo
      )
    );
  };

  const getSenderInfoFromConversations = (senderId: string) => {
    if (!senderId) return {};

    // Check all conversations to find the sender
    for (const convo of conversations) {
      if (convo.user && convo.user._id === senderId) {
        return {
          firstName: convo.user.firstName || '',
          lastName: convo.user.lastName || '',
          profileImage: convo.user.profileImage || '',
          role: 'user',
        };
      }
      if (convo.psychologist && convo.psychologist._id === senderId) {
        return {
          firstName: convo.psychologist.firstName || '',
          lastName: convo.psychologist.lastName || '',
          profileImage:
            convo.psychologist.profilePhotoUrl ||
            convo.psychologist.profileImage ||
            '',
          role: 'psychologist',
        };
      }
    }

    return {};
  };

  // Helper function to get receiver info from conversation list
  const getReceiverInfoFromConversations = (receiverId: string) => {
    if (!receiverId) return {};

    // Check all conversations to find the receiver
    for (const convo of conversations) {
      if (convo.user && convo.user._id === receiverId) {
        return {
          firstName: convo.user.firstName || '',
          lastName: convo.user.lastName || '',
          profileImage: convo.user.profileImage || '',
          role: 'user',
        };
      }
      if (convo.psychologist && convo.psychologist._id === receiverId) {
        return {
          firstName: convo.psychologist.firstName || '',
          lastName: convo.psychologist.lastName || '',
          profileImage:
            convo.psychologist.profilePhotoUrl ||
            convo.psychologist.profileImage ||
            '',
          role: 'psychologist',
        };
      }
    }

    return {};
  };

  // Send typing indicator
  const setTyping = (conversationId: string, typing: boolean) => {
    if (!user?._id || !socket || !isConnected) return;

    socket.emit('typing', {
      conversationId,
      userId: user._id,
      typing,
    });
  };

  // Socket event handlers
  useEffect(() => {
    if (!socket || !isConnected || !user?._id) return;

    // Handle new messages with null checks
    const handleNewMessage = (message: any) => {
      // Skip processing if message is invalid
      if (!message || !message.conversation) {
        console.warn('Received invalid message object:', message);
        return;
      }

      // Safely access properties with fallbacks
      const processedMessage = {
        ...message,
        // Ensure we have ID values in common formats
        senderId: message.senderId || (message.sender && message.sender._id),
        receiverId:
          message.receiverId || (message.receiver && message.receiver._id),
        // Ensure we have sender info
        sender: message.sender || {
          _id: message.senderId,
          // Try to get sender info from conversations if available
          ...getSenderInfoFromConversations(message.senderId),
        },
        // Ensure we have receiver info
        receiver: message.receiver || {
          _id: message.receiverId,
          // Try to get receiver info from conversations if available
          ...getReceiverInfoFromConversations(message.receiverId),
        },
      };

      // If message belongs to current conversation, add it to messages
      if (
        currentConversation &&
        processedMessage.conversation === currentConversation._id
      ) {
        // Check for duplicates before adding
        setMessages(prev => {
          // Don't add if message with same ID already exists
          if (prev.some(m => m._id === processedMessage._id)) {
            return prev;
          }

          // Replace temp message if it exists (for optimistic updates)
          if (
            processedMessage.content &&
            prev.some(
              m =>
                m._id.startsWith('temp-') &&
                m.content === processedMessage.content
            )
          ) {
            return prev.map(m =>
              m._id.startsWith('temp-') &&
              m.content === processedMessage.content
                ? processedMessage
                : m
            );
          }

          // Add as new message
          return [...prev, processedMessage];
        });

        // Mark as read if user is the receiver
        const isReceiver =
          processedMessage.receiverId === user._id ||
          (processedMessage.receiver &&
            processedMessage.receiver._id === user._id);

        if (isReceiver && socket && isConnected) {
          socket.emit('mark_read', {
            conversationId: processedMessage.conversation,
            userId: user._id,
          });
        }
      }

      // Update conversations list with new message
      setConversations(prev => {
        return prev.map(convo => {
          if (convo._id === processedMessage.conversation) {
            // Determine if message is unread for current user
            const isReceiver =
              processedMessage.receiverId === user._id ||
              (processedMessage.receiver &&
                processedMessage.receiver._id === user._id);

            // Only increment unread count if this is not the current conversation
            const unreadIncrement =
              currentConversation && currentConversation._id === convo._id
                ? 0
                : isReceiver
                ? 1
                : 0;

            return {
              ...convo,
              lastMessage: processedMessage,
              unreadCount: (convo.unreadCount || 0) + unreadIncrement,
            };
          }
          return convo;
        });
      });
    };

    // Handle message notifications
    const handleMessageNotification = (data: any) => {
      // Reload conversations to update unread count and last message
      loadConversations();
    };

    // Handle messages read event
    const handleMessagesRead = (data: {
      conversationId: string;
      userId: string;
    }) => {
      // Update read status of sent messages if the reader is the receiver
      if (data.userId !== user._id) {
        setMessages(prev =>
          prev.map(msg => {
            const isSender =
              msg.senderId === user._id ||
              (msg.sender && msg.sender._id === user._id);

            return isSender && !msg.isRead
              ? { ...msg, isRead: true, readAt: new Date().toISOString() }
              : msg;
          })
        );
      }
    };

    // Handle typing indicator
    const handleUserTyping = (data: {
      conversationId: string;
      userId: string;
      typing: boolean;
    }) => {
      if (data.userId !== user._id) {
        setIsTyping(prev => ({
          ...prev,
          [data.conversationId]: data.typing,
        }));
      }
    };

    // Subscribe to events
    socket.on('new_message', handleNewMessage);
    socket.on('message_notification', handleMessageNotification);
    socket.on('messages_read', handleMessagesRead);
    socket.on('user_typing', handleUserTyping);

    // Clean up on unmount
    return () => {
      socket.off('new_message', handleNewMessage);
      socket.off('message_notification', handleMessageNotification);
      socket.off('messages_read', handleMessagesRead);
      socket.off('user_typing', handleUserTyping);

      // Leave current conversation room if any
      if (currentConversation) {
        socket.emit('leave_conversation', currentConversation._id);
      }
    };
  }, [socket, isConnected, user?._id, currentConversation]);

  // Initial load of conversations
  useEffect(() => {
    if (user?._id) {
      loadConversations();
    }
  }, [user?._id]);

  // Leave conversation room when changing conversations
  useEffect(() => {
    if (socket && isConnected && currentConversation) {
      // Join the current conversation room
      socket.emit('join_conversation', currentConversation._id);

      return () => {
        socket.emit('leave_conversation', currentConversation._id);
      };
    }
  }, [currentConversation?._id, socket, isConnected]);

  const value = {
    conversations,
    currentConversation,
    messages,
    loadingMessages,
    loadingConversations,
    hasMoreMessages,
    unreadCount,
    isTyping,
    loadConversations,
    setCurrentConversation,
    loadMessages,
    loadMoreMessages,
    sendMessage,
    startNewConversation,
    markAsRead,
    setTyping,
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
};

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};
