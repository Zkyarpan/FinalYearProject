'use client';

import React, { useState, useEffect, useRef } from 'react';
import InboxRightSection from '@/components/InboxRightSection';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Send,
  ArrowLeft,
  MoreVertical,
  Video,
  Phone,
  RefreshCcw,
  Plus,
  Check,
  CheckCheck,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useSocket } from '@/context/SocketContext';
import { useUserStore } from '@/store/userStore';
import { toast } from 'sonner';

// Interface definitions remain the same
interface Psychologist {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  profilePhotoUrl: string;
  image?: string;
  specializations: string[];
  country: string;
  city: string;
  licenseType: string;
  yearsOfExperience: number;
  lastMessage?: string;
  timestamp?: string;
  unreadCount?: number;
}

interface Message {
  _id: string;
  senderId: string;
  receiverId: string;
  content: string;
  conversation: string;
  createdAt: string;
  updatedAt: string;
  isRead: boolean;
  readAt?: string;
  sender?: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    image?: string;
  };
}

interface Conversation {
  _id: string;
  user: any;
  psychologist: any;
  lastMessage?: any;
  unreadCount?: number;
  createdAt: string;
  updatedAt: string;
}

const Inbox = () => {
  const { socket, isConnected, onlineUsers } = useSocket();
  const { user } = useUserStore();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedPsychologist, setSelectedPsychologist] =
    useState<Psychologist | null>(null);
  const [currentConversation, setCurrentConversation] =
    useState<Conversation | null>(null);
  const [messageInput, setMessageInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isMobileListVisible, setIsMobileListVisible] = useState(true);
  const [loading, setLoading] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [hasMoreMessages, setHasMoreMessages] = useState(true);
  const [oldestMessageId, setOldestMessageId] = useState<string | null>(null);
  const [fetchError, setFetchError] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const messageProcessedIds = useRef(new Set<string>());

  // Check if user is a psychologist
  const isPsychologist = user?.role === 'psychologist';

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

  // Set up socket listeners for real-time messaging with better error handling
  useEffect(() => {
    if (!socket || !isConnected || !user?._id) {
      console.log('Socket not connected or user not available');
      return;
    }

    // Reset the processed message IDs when setting up new listeners
    messageProcessedIds.current.clear();

    // Handle new message with robust handling and deduplication
    const handleNewMessage = message => {
      // Validate message object
      if (!message || !message.conversation || !message.content) {
        console.warn('Received malformed message:', message);
        return;
      }

      // Skip if we've already processed this message
      if (messageProcessedIds.current.has(message._id)) {
        console.log('Skipping already processed message:', message._id);
        return;
      }

      // Add to processed set
      messageProcessedIds.current.add(message._id);

      // If the message belongs to the current conversation, add it to the messages
      if (
        currentConversation &&
        message.conversation === currentConversation._id
      ) {
        // Make sure the sender information is preserved correctly
        const processedMessage = { ...message };

        // Create sender object if missing
        if (!processedMessage.sender && processedMessage.senderId) {
          // Try to construct sender from available user data
          if (processedMessage.senderId === user._id) {
            processedMessage.sender = {
              _id: user._id,
              firstName: user.firstName || '',
              lastName: user.lastName || '',
              email: user.email || '',
              image: user.image || '',
              role: user.role || 'user',
            };
          } else if (
            selectedPsychologist &&
            processedMessage.senderId === selectedPsychologist._id
          ) {
            processedMessage.sender = {
              _id: selectedPsychologist._id,
              firstName: selectedPsychologist.firstName || '',
              lastName: selectedPsychologist.lastName || '',
              email: selectedPsychologist.email || '',
              image:
                selectedPsychologist.image ||
                selectedPsychologist.profilePhotoUrl ||
                '',
              role: isPsychologist ? 'user' : 'psychologist',
            };
          }
        }

        // Add to messages if it doesn't already exist
        setMessages(prev => {
          // Skip if we've already processed this message by ID
          if (prev.some(m => m._id === processedMessage._id)) {
            console.log(
              'Skipping duplicate message with ID:',
              processedMessage._id
            );
            return prev;
          }

          // Check for temp messages to replace (more thorough check)
          const tempMessageIndex = prev.findIndex(
            m =>
              m._id.startsWith('temp-') &&
              m.content === processedMessage.content &&
              m.senderId === processedMessage.senderId
          );

          if (tempMessageIndex >= 0) {
            console.log(
              'Replacing temp message with permanent one:',
              processedMessage._id
            );
            const newMessages = [...prev];
            newMessages[tempMessageIndex] = processedMessage;
            return newMessages;
          }

          // Otherwise add as new message
          return [...prev, processedMessage];
        });

        // Mark as read if user is the receiver
        if (message.receiverId === user._id) {
          socket.emit('mark_read', {
            conversationId: currentConversation._id,
            userId: user?._id || '',
          });
        }

        // Scroll to bottom
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      } else {
        // Message is for a different conversation, refresh the conversation list
        console.log('Message for a different conversation, refreshing list');
        fetchConversations(false);
      }

      // Update conversations list with new message
      setConversations(prev => {
        const updatedConversations = prev.map(convo => {
          if (convo._id === message.conversation) {
            const unreadIncrement =
              currentConversation &&
              currentConversation._id === convo._id &&
              message.receiverId === user._id
                ? 0
                : message.receiverId === user._id
                ? 1
                : 0;

            return {
              ...convo,
              lastMessage: message,
              unreadCount: (convo.unreadCount || 0) + unreadIncrement,
            };
          }
          return convo;
        });

        // Return updated conversations, or if we couldn't find the conversation
        // in our list, trigger a full refresh
        if (
          updatedConversations.some(convo => convo._id === message.conversation)
        ) {
          return updatedConversations;
        } else {
          // Couldn't find the conversation, schedule a refresh
          setTimeout(() => fetchConversations(false), 100);
          return prev;
        }
      });
    };

    // Handle messages being read
    const handleMessagesRead = data => {
      if (!data || !data.userId || !data.conversationId) {
        console.warn('Received malformed messages_read event:', data);
        return;
      }

      if (data.userId !== user._id) {
        setMessages(prev =>
          prev.map(msg =>
            msg.sender?._id === user._id && !msg.isRead
              ? { ...msg, isRead: true, readAt: new Date().toISOString() }
              : msg
          )
        );
      }
    };

    // Handle typing indicator
    const handleUserTyping = data => {
      if (
        data.userId !== user._id &&
        currentConversation &&
        data.conversationId === currentConversation._id
      ) {
        setIsTyping(data.typing);
      }
    };

    // Handle new conversation notifications
    const handleMessageNotification = data => {
      // Refresh the conversation list
      fetchConversations(false);
    };

    // Register socket event listeners
    socket.on('new_message', handleNewMessage);
    socket.on('messages_read', handleMessagesRead);
    socket.on('message_notification', handleMessageNotification);
    socket.on('new_conversation', fetchConversations);
    socket.on('user_typing', handleUserTyping);

    // Join user's room for notifications
    socket.emit('join_user_room', user?._id || '');

    if (isPsychologist) {
      socket.emit('join_psychologist_room');
    }

    // Clean up listeners when component unmounts or dependencies change
    return () => {
      socket.off('new_message', handleNewMessage);
      socket.off('messages_read', handleMessagesRead);
      socket.off('message_notification', handleMessageNotification);
      socket.off('new_conversation', fetchConversations);
      socket.off('user_typing', handleUserTyping);

      // Leave any conversation room
      if (currentConversation) {
        socket.emit('leave_conversation', currentConversation._id);
      }

      // Leave user room
      socket.emit('leave_user_room', user._id);

      if (isPsychologist) {
        socket.emit('leave_psychologist_room');
      }
    };
  }, [
    socket,
    isConnected,
    user?._id,
    currentConversation,
    isPsychologist,
    selectedPsychologist,
  ]);

  // Load messages when a conversation is selected with better error handling
  const loadMessages = async conversationId => {
    if (!user?._id) return;

    try {
      setLoadingMessages(true);
      // Clear messages completely before loading new ones
      setMessages([]);
      setOldestMessageId(null); // Reset oldest message ID too
      messageProcessedIds.current.clear(); // Reset processed message IDs

      // Join the conversation room via socket
      if (socket && isConnected) {
        socket.emit('join_conversation', conversationId);
      }

      // Add cache-busting parameter
      const timestamp = new Date().getTime();
      const response = await fetch(
        `/api/conversations/${conversationId}/messages?t=${timestamp}`,
        {
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            Pragma: 'no-cache',
            Expires: '0',
          },
        }
      );

      if (!response.ok) {
        throw new Error(
          `Failed to load messages: ${response.status} ${response.statusText}`
        );
      }

      const data = await response.json();
      if (data.IsSuccess) {
        // Track all message IDs we're loading
        if (data.Result?.length > 0) {
          data.Result.forEach(msg => {
            messageProcessedIds.current.add(msg._id);
          });
        }

        setMessages(data.Result || []);

        if (data.Result?.length > 0) {
          setOldestMessageId(data.Result[0]._id);
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

        // Check if there might be more messages
        setHasMoreMessages(data.Result?.length >= 50);
      } else {
        console.warn('API returned IsSuccess: false when loading messages');
        setMessages([]);
      }
    } catch (error) {
      console.error('Error loading messages:', error);
      toast.error('Failed to load messages. Please try again.');
      setMessages([]);
    } finally {
      setLoadingMessages(false);

      // Scroll to bottom after messages load
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'auto' });
      }, 100);
    }
  };

  // Load more (older) messages with better error handling
  const loadMoreMessages = async () => {
    if (
      !currentConversation ||
      !oldestMessageId ||
      !hasMoreMessages ||
      loadingMessages
    ) {
      return;
    }

    try {
      setLoadingMessages(true);

      const timestamp = new Date().getTime();
      const response = await fetch(
        `/api/conversations/${currentConversation._id}/messages?before=${oldestMessageId}&t=${timestamp}`,
        {
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            Pragma: 'no-cache',
            Expires: '0',
          },
        }
      );

      if (!response.ok) {
        throw new Error(
          `Failed to load more messages: ${response.status} ${response.statusText}`
        );
      }

      const data = await response.json();
      if (data.IsSuccess) {
        const olderMessages = data.Result || [];

        // Track all message IDs we're loading
        if (olderMessages.length > 0) {
          olderMessages.forEach(msg => {
            messageProcessedIds.current.add(msg._id);
          });
        }

        if (olderMessages.length > 0) {
          // Preserve scroll position when adding messages at the top
          const scrollContainer = messagesContainerRef.current;
          const prevScrollHeight = scrollContainer?.scrollHeight || 0;

          setMessages(prev => [...olderMessages, ...prev]);
          setOldestMessageId(olderMessages[0]._id);

          // Restore scroll position after new messages are added
          setTimeout(() => {
            if (scrollContainer) {
              const newScrollHeight = scrollContainer.scrollHeight;
              scrollContainer.scrollTop = newScrollHeight - prevScrollHeight;
            }
          }, 50);
        }

        setHasMoreMessages(olderMessages.length >= 50);
      }
    } catch (error) {
      console.error('Error loading more messages:', error);
      toast.error('Failed to load older messages');
    } finally {
      setLoadingMessages(false);
    }
  };

  // Check if a user is online
  const isOnline = userId => {
    return onlineUsers.some(user => user.userId === userId);
  };

  // Get initials for avatar fallback
  const getInitials = (firstName?: string | null, lastName?: string | null) => {
    if (!firstName && !lastName) return '??';
    return `${firstName?.[0] || ''}${lastName?.[0] || ''}`;
  };

  // Handle psychologist selection - only for regular users
  const handleSelectPsychologist = async psychologist => {
    setSelectedPsychologist(psychologist);
    setIsMobileListVisible(false);

    // Find existing conversation with this psychologist
    const existingConversation = conversations.find(
      convo => convo.psychologist?._id === psychologist._id
    );

    if (existingConversation) {
      setCurrentConversation(existingConversation);
      loadMessages(existingConversation._id);
    } else {
      // If no conversation exists, create a new one
      try {
        const response = await fetch('/api/conversations', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            psychologistId: psychologist._id,
          }),
        });

        if (!response.ok) {
          throw new Error(
            `Failed to create conversation: ${response.status} ${response.statusText}`
          );
        }

        const data = await response.json();
        if (data.IsSuccess) {
          const newConversation = data.Result;
          setCurrentConversation(newConversation);

          // Update conversations list
          setConversations(prev => [newConversation, ...prev]);

          // Load empty message list for new conversation
          setMessages([]);
        } else {
          toast.error('Failed to start conversation. Please try again.');
        }
      } catch (error) {
        console.error('Error creating conversation:', error);
        toast.error('Failed to start conversation');
      }
    }
  };

  // Handle sending a message
  const handleSendMessage = async () => {
    if (!messageInput.trim() || !currentConversation || !user?._id) return;

    try {
      // Determine the receiver ID
      const receiverId =
        currentConversation.user._id === user._id
          ? currentConversation.psychologist._id
          : currentConversation.user._id;

      // Generate a unique temporary ID
      const tempId = `temp-${Date.now()}-${Math.random()
        .toString(36)
        .substring(2, 9)}`;

      // Create optimistic message with better structure
      const optimisticMessage = {
        _id: tempId,
        senderId: user._id,
        receiverId,
        content: messageInput,
        conversation: currentConversation._id,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isRead: false,
        sender: {
          _id: user._id,
          firstName: user.firstName || '',
          lastName: user.lastName || '',
          email: user.email || '',
          image: user.image || '',
          role: user.role || 'user',
        },
      };

      // Add message to current message list immediately
      setMessages(prev => [...prev, optimisticMessage]);

      // Clear input field
      const messageToBeSent = messageInput;
      setMessageInput('');

      // Scroll to bottom
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 50);

      // Send via Socket.IO for real-time delivery
      if (socket && isConnected) {
        socket.emit('send_message', {
          _id: tempId,
          conversationId: currentConversation._id,
          senderId: user._id,
          receiverId,
          content: messageToBeSent,
          userRole: user.role,
          senderDetails: {
            _id: user._id,
            firstName: user.firstName || '',
            lastName: user.lastName || '',
            email: user.email || '',
            image: user.image || '',
            role: user.role || 'user',
          },
        });
      } else {
        // Only use API if socket is unavailable
        const response = await fetch(
          `/api/conversations/${currentConversation._id}/messages`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ content: messageToBeSent }),
          }
        );

        if (!response.ok) {
          throw new Error(
            `Failed to send message: ${response.status} ${response.statusText}`
          );
        }

        // Only process the response if socket isn't available
        const data = await response.json();
        if (data.IsSuccess && data.Result) {
          messageProcessedIds.current.add(data.Result._id);
          setMessages(prev =>
            prev.map(msg =>
              msg._id === tempId
                ? {
                    ...data.Result,
                    sender: data.Result.sender || optimisticMessage.sender,
                  }
                : msg
            )
          );
        }
      }

      // Update the conversation's lastMessage in the list
      setConversations(prev =>
        prev.map(convo =>
          convo._id === currentConversation._id
            ? {
                ...convo,
                lastMessage: {
                  content: messageToBeSent,
                  createdAt: new Date().toISOString(),
                  isRead: false,
                },
              }
            : convo
        )
      );
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message. Please try again.');
      // Remove optimistic message on failure
      setMessages(prev => prev.filter(msg => !msg._id.startsWith('temp-')));
    }
  };

  // Format timestamp
  const formatTimestamp = dateString => {
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

  // Show back button on mobile
  const showConversationList = () => {
    setIsMobileListVisible(true);
  };

  // Handle refresh button click
  const handleRefresh = () => {
    fetchConversations();
    if (currentConversation) {
      loadMessages(currentConversation._id);
    }
    toast.success('Refreshing conversations and messages');
  };

  // Handle scroll for infinite loading
  useEffect(() => {
    const handleScroll = () => {
      const container = messagesContainerRef.current;
      if (!container) return;

      // If scrolled near the top and more messages are available
      if (container.scrollTop < 50 && hasMoreMessages && !loadingMessages) {
        loadMoreMessages();
      }
    };

    const container = messagesContainerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll);
      return () => container.removeEventListener('scroll', handleScroll);
    }
  }, [hasMoreMessages, loadingMessages]);

  // Typing indicator effect
  const handleInputChange = e => {
    setMessageInput(e.target.value);

    if (socket && isConnected && currentConversation) {
      socket.emit('typing', {
        conversationId: currentConversation._id,
        userId: user?._id || '',
        typing: e.target.value.length > 0,
      });
    }
  };

  return (
    <div className="h-screen max-h-[calc(100vh-6rem)]">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-full">
        {/* Conversations list (left side) */}
        <div
          className={`md:col-span-1 h-full ${
            isMobileListVisible ? 'block' : 'hidden md:block'
          }`}
        >
          {isPsychologist ? (
            // Psychologist view - just show patient conversations
            <Card className="h-full flex flex-col rounded-lg shadow-sm">
              <CardHeader className="pb-3 pt-4 flex flex-row justify-between items-center">
                <CardTitle>Patients</CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleRefresh}
                  disabled={loading}
                  className="h-8 w-8 rounded-full"
                >
                  <RefreshCcw
                    className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`}
                  />
                </Button>
              </CardHeader>
              <CardContent className="flex-1 overflow-hidden p-0 px-3">
                {loading ? (
                  <div className="flex justify-center p-4">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : fetchError ? (
                  <div className="text-center p-4 space-y-2">
                    <AlertCircle className="h-8 w-8 mx-auto text-destructive" />
                    <p className="text-sm text-destructive">
                      Failed to load conversations
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => fetchConversations(true)}
                    >
                      Retry
                    </Button>
                  </div>
                ) : (
                  <ScrollArea className="h-full">
                    <div className="space-y-1 pr-3">
                      {conversations.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-64 p-4 text-center">
                          <AlertCircle className="h-12 w-12 text-muted-foreground mb-2" />
                          <h3 className="font-medium">No patients yet</h3>
                          <p className="text-sm text-muted-foreground">
                            You'll see your patients here when they start
                            conversations with you
                          </p>
                        </div>
                      ) : (
                        conversations.map(conversation => {
                          // For psychologists, we're interested in the user, not the psychologist
                          const patient = conversation.user;
                          return (
                            <div
                              key={conversation._id}
                              className={`p-3 rounded-md cursor-pointer transition-colors ${
                                currentConversation?._id === conversation._id
                                  ? 'bg-primary/10'
                                  : 'hover:bg-muted'
                              }`}
                              onClick={() => {
                                setCurrentConversation(conversation);
                                setSelectedPsychologist(patient);
                                setIsMobileListVisible(false);
                                loadMessages(conversation._id);
                              }}
                            >
                              <div className="flex items-center gap-3">
                                <div className="relative">
                                  <Avatar className="h-10 w-10 border">
                                    <AvatarImage
                                      src={patient?.image || ''}
                                      alt={patient?.firstName || ''}
                                    />
                                    <AvatarFallback className="bg-primary/10 text-primary">
                                      {getInitials(
                                        patient?.firstName,
                                        patient?.lastName
                                      )}
                                    </AvatarFallback>
                                  </Avatar>
                                  <span
                                    className={`absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-background ${
                                      isOnline(patient?._id || '')
                                        ? 'bg-green-500'
                                        : 'bg-gray-400'
                                    }`}
                                  />
                                </div>
                                <div className="flex-1 overflow-hidden">
                                  <div className="flex items-center justify-between">
                                    <h4 className="font-medium text-sm truncate">
                                      {patient?.firstName} {patient?.lastName}
                                    </h4>
                                    {conversation.lastMessage && (
                                      <span className="text-xs text-muted-foreground">
                                        {formatTimestamp(
                                          conversation.lastMessage.createdAt
                                        )}
                                      </span>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <p className="text-xs text-muted-foreground truncate">
                                      {conversation.lastMessage?.content ||
                                        'No messages yet'}
                                    </p>
                                    {(conversation.unreadCount ?? 0) > 0 && (
                                      <Badge
                                        variant="default"
                                        className="ml-auto h-5 w-5 rounded-full p-0 text-xs flex items-center justify-center"
                                      >
                                        {conversation.unreadCount}
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </ScrollArea>
                )}
              </CardContent>
            </Card>
          ) : (
            // Regular user view - original InboxSection
            <InboxRightSection
              selectedPsychologist={selectedPsychologist}
              currentConversation={currentConversation}
              conversations={conversations}
              onSelectPsychologist={handleSelectPsychologist}
              onSelectConversation={conversation => {
                setMessages([]);
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
          )}
        </div>

        {/* Chat interface (right side) */}
        <div
          className={`md:col-span-2 h-full ${
            isMobileListVisible ? 'hidden md:block' : 'block'
          }`}
        >
          {!currentConversation ? (
            <Card className="h-full flex flex-col items-center justify-center rounded-lg shadow-sm">
              <CardContent className="flex flex-col items-center justify-center text-center p-6">
                <div className="rounded-full bg-primary/10 p-6 mb-4">
                  <Send className="h-10 w-10 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">
                  No conversation selected
                </h3>
                <p className="text-muted-foreground max-w-md">
                  {isPsychologist
                    ? 'Select a patient from the list to view your conversation'
                    : 'Choose a psychologist from the list to start or continue a conversation'}
                </p>
              </CardContent>
            </Card>
          ) : (
            <Card className="h-full flex flex-col rounded-lg shadow-sm">
              {/* Chat header */}
              <CardHeader className="border-b flex flex-row items-center p-4 space-y-0">
                <Button
                  variant="ghost"
                  size="icon"
                  className="md:hidden mr-2"
                  onClick={showConversationList}
                >
                  <ArrowLeft className="h-5 w-5" />
                </Button>

                <div className="flex items-center flex-1">
                  <div className="relative">
                    <Avatar className="h-10 w-10 mr-3 border">
                      <AvatarImage
                        src={
                          isPsychologist
                            ? selectedPsychologist?.image
                            : selectedPsychologist?.image ||
                              selectedPsychologist?.profilePhotoUrl
                        }
                        alt={`${selectedPsychologist?.firstName} ${selectedPsychologist?.lastName}`}
                      />
                      <AvatarFallback className="bg-primary/10 text-primary">
                        {getInitials(
                          selectedPsychologist?.firstName,
                          selectedPsychologist?.lastName
                        )}
                      </AvatarFallback>
                    </Avatar>
                    <span
                      className={`absolute bottom-0 right-3 h-3 w-3 rounded-full border-2 border-background ${
                        isOnline(selectedPsychologist?._id || '')
                          ? 'bg-green-500'
                          : 'bg-gray-400'
                      }`}
                    />
                  </div>

                  <div>
                    <CardTitle className="text-base font-semibold">
                      {isPsychologist
                        ? `${selectedPsychologist?.firstName} ${selectedPsychologist?.lastName}`
                        : `Dr. ${selectedPsychologist?.firstName} ${selectedPsychologist?.lastName}`}
                    </CardTitle>
                    <p className="text-xs text-muted-foreground">
                      {isOnline(selectedPsychologist?._id || '')
                        ? 'Online'
                        : 'Last seen recently'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => {
                      if (currentConversation) {
                        loadMessages(currentConversation._id);
                      }
                    }}
                    className="rounded-full h-8 w-8"
                    disabled={loadingMessages}
                  >
                    <RefreshCcw
                      className={`h-4 w-4 ${
                        loadingMessages ? 'animate-spin' : ''
                      }`}
                    />
                  </Button>

                  <Button
                    variant="outline"
                    size="icon"
                    className="rounded-full h-8 w-8"
                    onClick={() =>
                      toast.info('Video call feature coming soon!')
                    }
                  >
                    <Video className="h-4 w-4" />
                  </Button>

                  <Button
                    variant="outline"
                    size="icon"
                    className="rounded-full h-8 w-8"
                    onClick={() =>
                      toast.info('Audio call feature coming soon!')
                    }
                  >
                    <Phone className="h-4 w-4" />
                  </Button>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreVertical className="h-5 w-5" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>View Profile</DropdownMenuItem>
                      <DropdownMenuItem>Clear Chat</DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive">
                        Block
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>

              {/* Chat messages */}
              <CardContent className="flex-1 overflow-hidden p-0">
                <div
                  className="h-full overflow-y-auto p-4"
                  ref={messagesContainerRef}
                >
                  {/* Loading indicator for older messages */}
                  {loadingMessages && (
                    <div className="flex justify-center my-2">
                      <Loader2 className="h-5 w-5 animate-spin text-primary" />
                    </div>
                  )}

                  <div className="flex flex-col space-y-4">
                    {messages.length === 0 && !loadingMessages ? (
                      <div className="flex-1 flex flex-col items-center justify-center h-64 text-center p-4">
                        <AlertCircle className="h-12 w-12 text-muted-foreground mb-2" />
                        <h3 className="font-medium">No messages yet</h3>
                        <p className="text-sm text-muted-foreground max-w-md">
                          Send a message to start the conversation
                        </p>
                      </div>
                    ) : (
                      messages.map((message, index) => {
                        const isCurrentUser = message.senderId === user?._id;
                        const uniqueKey = `${message._id}-${index}-${message.createdAt}`;
                        const prevMessage =
                          index > 0 ? messages[index - 1] : null;
                        const nextMessage =
                          index < messages.length - 1
                            ? messages[index + 1]
                            : null;

                        // Group messages by sender
                        const isFirstInGroup =
                          !prevMessage ||
                          prevMessage.senderId !== message.senderId;
                        const isLastInGroup =
                          !nextMessage ||
                          nextMessage.senderId !== message.senderId;

                        return (
                          <div
                            key={uniqueKey}
                            className={`flex ${
                              isCurrentUser ? 'justify-end' : 'justify-start'
                            }`}
                          >
                            <div
                              className={`flex max-w-[85%] ${
                                isCurrentUser ? 'flex-row-reverse' : 'flex-row'
                              } ${!isLastInGroup ? 'mb-1' : ''}`}
                            >
                              {/* Only show avatar for the first message in a group from the same sender */}
                              {!isCurrentUser && isFirstInGroup && (
                                <Avatar
                                  className={`h-8 w-8 ${
                                    isCurrentUser ? 'ml-2' : 'mr-2'
                                  } self-end mb-1`}
                                >
                                  <AvatarImage
                                    src={
                                      selectedPsychologist?.image ||
                                      selectedPsychologist?.profilePhotoUrl ||
                                      ''
                                    }
                                    alt={`${selectedPsychologist?.firstName} ${selectedPsychologist?.lastName}`}
                                  />
                                  <AvatarFallback className="bg-secondary text-secondary-foreground text-xs">
                                    {getInitials(
                                      selectedPsychologist?.firstName,
                                      selectedPsychologist?.lastName
                                    )}
                                  </AvatarFallback>
                                </Avatar>
                              )}

                              {/* Message content - don't show avatar placeholder for non-first messages */}
                              <div
                                className={`flex flex-col ${
                                  !isCurrentUser && !isFirstInGroup
                                    ? 'ml-10'
                                    : ''
                                }`}
                              >
                                <div
                                  className={`px-4 py-2 ${
                                    isCurrentUser
                                      ? 'bg-primary text-primary-foreground'
                                      : 'bg-secondary text-secondary-foreground'
                                  } ${
                                    isFirstInGroup && isLastInGroup
                                      ? 'rounded-lg'
                                      : isFirstInGroup
                                      ? isCurrentUser
                                        ? 'rounded-t-lg rounded-bl-lg rounded-br-sm'
                                        : 'rounded-t-lg rounded-br-lg rounded-bl-sm'
                                      : isLastInGroup
                                      ? isCurrentUser
                                        ? 'rounded-b-lg rounded-bl-lg rounded-tr-sm'
                                        : 'rounded-b-lg rounded-br-lg rounded-tl-sm'
                                      : isCurrentUser
                                      ? 'rounded-bl-lg rounded-tr-sm rounded-br-sm'
                                      : 'rounded-br-lg rounded-tl-sm rounded-bl-sm'
                                  }`}
                                >
                                  <p className="text-sm whitespace-pre-wrap">
                                    {message.content}
                                  </p>
                                </div>

                                {isLastInGroup && (
                                  <span
                                    className={`text-xs mt-1 text-muted-foreground flex items-center ${
                                      isCurrentUser
                                        ? 'justify-end'
                                        : 'justify-start'
                                    }`}
                                  >
                                    {formatTimestamp(message.createdAt)}
                                    {isCurrentUser && (
                                      <span className="ml-1">
                                        {message.isRead ? (
                                          <CheckCheck className="h-3 w-3 text-blue-500" />
                                        ) : message._id.startsWith('temp-') ? (
                                          <Loader2 className="h-3 w-3 animate-spin" />
                                        ) : (
                                          <Check className="h-3 w-3" />
                                        )}
                                      </span>
                                    )}
                                  </span>
                                )}
                              </div>

                              {/* Current user's avatar - only show for first message in group */}
                              {isCurrentUser && isFirstInGroup && (
                                <Avatar
                                  className={`h-8 w-8 ${
                                    isCurrentUser ? 'ml-2' : 'mr-2'
                                  } self-end mb-1`}
                                >
                                  <AvatarImage
                                    src={user.image || ''}
                                    alt={`${user.firstName} ${user.lastName}`}
                                  />
                                  <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                                    {getInitials(user.firstName, user.lastName)}
                                  </AvatarFallback>
                                </Avatar>
                              )}
                            </div>
                          </div>
                        );
                      })
                    )}
                    <div ref={messagesEndRef} />
                  </div>
                </div>
              </CardContent>

              {/* Message input */}
              <CardFooter className="p-3 border-t">
                <div className="flex w-full space-x-2 items-end">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 rounded-full flex-shrink-0"
                    onClick={() => toast.info('Attachments coming soon!')}
                  >
                    <Plus className="h-5 w-5" />
                  </Button>
                  <Textarea
                    placeholder="Type your message..."
                    value={messageInput}
                    onChange={handleInputChange}
                    className="min-h-[40px] max-h-32 flex-1 resize-none px-3 py-2 text-sm rounded-full"
                    onKeyDown={e => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                  />
                  <Button
                    className="h-9 w-9 rounded-full flex-shrink-0 p-0"
                    size="icon"
                    onClick={handleSendMessage}
                    disabled={!messageInput.trim()}
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
                {isTyping && (
                  <p className="text-xs text-muted-foreground mt-1 ml-2">
                    {selectedPsychologist?.firstName} is typing...
                  </p>
                )}
              </CardFooter>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default Inbox;
