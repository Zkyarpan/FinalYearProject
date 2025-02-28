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
  MessageSquare,
  User,
  Ban,
  Trash2,
  Search,
  UserSquare,
  Paperclip,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useSocket } from '@/context/SocketContext';
import { useUserStore } from '@/store/userStore';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { formatTime } from '@/helpers/formatTime';

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

  function shouldShowAvatar(
    message: Message,
    index: number,
    messages: Message[]
  ) {
    // Always show avatar for the first message
    if (index === 0) return true;

    // Get the previous message
    const previousMessage = messages[index - 1];

    // Show avatar if sender changes
    if (previousMessage.senderId !== message.senderId) return true;

    // Show avatar if more than 5 minutes have passed since previous message
    const timeDiff =
      new Date(message.createdAt).getTime() -
      new Date(previousMessage.createdAt).getTime();
    if (timeDiff > 5 * 60 * 1000) return true;

    // Don't show avatar for consecutive messages from same sender within 5 minutes
    return false;
  }

  return (
    <div className="flex h-screen bg-background border dark:border-[#333333]  text-white rounded-2xl mt-5">
      {/* Left sidebar - Conversations */}
      <div
        className={`w-[350px] border-r dark:border-[#333333] flex flex-col ${
          isMobileListVisible ? 'block' : 'hidden md:block'
        }`}
      >
        {isPsychologist ? (
          // PSYCHOLOGIST VIEW
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
                  className="pl-9 h-9 text-sm  border dark:border-[#333333] rounded-md focus-visible:ring-0 focus-visible:ring-offset-0 dark:text-white text-black"
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
                    You'll see your patients here when they start conversations
                    with you
                  </p>
                </div>
              ) : (
                conversations.map(conversation => {
                  const patient = conversation.user;
                  const isSelected =
                    currentConversation?._id === conversation._id;
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
                              {getInitials(
                                patient?.firstName,
                                patient?.lastName
                              )}
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
                              <span className="text-xs text-green-500">
                                Online
                              </span>
                            ) : (
                              <span className="text-xs text-gray-500">
                                Offline
                              </span>
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
        ) : (
          // REGULAR USER VIEW
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

      {/* Main Chat Area */}
      <div
        className={`flex-1 flex flex-col ${
          isMobileListVisible ? 'hidden md:flex' : 'flex'
        }`}
      >
        {!currentConversation ? (
          <div className="flex flex-col items-center justify-center h-full">
            <MessageSquare className="h-12 w-12 text-gray-600 mb-4" />
            <h3 className="text-xl font-semibold mb-2">
              No conversation selected
            </h3>
            <p className="text-gray-500 text-center max-w-md">
              {isPsychologist
                ? 'Select a patient from the list to view your conversation'
                : 'Choose a psychologist from the list to start or continue a conversation'}
            </p>
            <Button
              variant="outline"
              className="mt-6 rounded-md border-[#2a2a2a] text-gray-300 hover:bg-[#2a2a2a]"
              onClick={showConversationList}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              {isPsychologist ? 'View Patients' : 'Find Psychologists'}
            </Button>
          </div>
        ) : (
          <>
            {/* Chat Header */}
            <div className="flex items-center px-4 py-3 border-b dark:border-[#333333]">
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden mr-2 text-gray-400 hover:text-white dark:border-[#333333] rounded-full"
                onClick={showConversationList}
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>

              <div className="flex items-center flex-1">
                <div className="relative">
                  <Avatar className="h-10 w-10 mr-3">
                    <AvatarImage
                      src={
                        isPsychologist
                          ? selectedPsychologist?.image
                          : selectedPsychologist?.image ||
                            selectedPsychologist?.profilePhotoUrl
                      }
                      alt={`${selectedPsychologist?.firstName} ${selectedPsychologist?.lastName}`}
                    />
                    <AvatarFallback className="bg-[#1e293b] text-blue-400">
                      {getInitials(
                        selectedPsychologist?.firstName,
                        selectedPsychologist?.lastName
                      )}
                    </AvatarFallback>
                  </Avatar>
                  <span
                    className={`absolute bottom-0 right-3 h-3 w-3 rounded-full border-2 dark:border-[#333333]  ${
                      isOnline(selectedPsychologist?._id || '')
                        ? 'bg-green-500'
                        : 'bg-gray-500'
                    }`}
                  />
                </div>

                <div>
                  <h2 className="font-semibold text-base">
                    {isPsychologist
                      ? `${selectedPsychologist?.firstName} ${selectedPsychologist?.lastName}`
                      : `Dr. ${selectedPsychologist?.firstName} ${selectedPsychologist?.lastName}`}
                  </h2>
                  <p className="text-xs text-gray-500">
                    {isOnline(selectedPsychologist?._id || '')
                      ? 'Online'
                      : 'Last seen recently'}
                  </p>
                </div>
              </div>

              <div className="flex items-center">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    if (currentConversation) {
                      loadMessages(currentConversation._id);
                    }
                  }}
                  className="rounded-full h-8 w-8 text-gray-400 hover:text-white hover:bg-[#2a2a2a]"
                  disabled={loadingMessages}
                >
                  <RefreshCcw
                    className={`h-4 w-4 ${
                      loadingMessages ? 'animate-spin' : ''
                    }`}
                  />
                </Button>

                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-full h-8 w-8 text-gray-400 hover:text-white hover:bg-[#2a2a2a]"
                  onClick={() => toast.info('Video call feature coming soon!')}
                >
                  <Video className="h-4 w-4" />
                </Button>

                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-full h-8 w-8 text-gray-400 hover:text-white hover:bg-[#2a2a2a]"
                  onClick={() => toast.info('Audio call feature coming soon!')}
                >
                  <Phone className="h-4 w-4" />
                </Button>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="rounded-full h-8 w-8 text-gray-400 hover:text-white hover:bg-[#2a2a2a]"
                    >
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="end"
                    className="bg-[#1a1a1a] border-[#2a2a2a] text-gray-300"
                  >
                    <DropdownMenuItem className="hover:bg-[#2a2a2a] hover:text-white focus:bg-[#2a2a2a] focus:text-white">
                      <User className="h-4 w-4 mr-2" />
                      View Profile
                    </DropdownMenuItem>
                    <DropdownMenuItem className="hover:bg-[#2a2a2a] hover:text-white focus:bg-[#2a2a2a] focus:text-white">
                      <Trash2 className="h-4 w-4 mr-2" />
                      Clear Chat
                    </DropdownMenuItem>
                    <DropdownMenuSeparator className="bg-[#2a2a2a]" />
                    <DropdownMenuItem className="text-red-500 hover:bg-[#2a2a2a] hover:text-red-500 focus:bg-[#2a2a2a] focus:text-red-500">
                      <Ban className="h-4 w-4 mr-2" />
                      Block
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            {/* Messages Area */}
            <div
              className="flex-1 overflow-y-auto scrollbar-hide p-4"
              ref={messagesContainerRef}
              onScroll={e => {
                const container = e.currentTarget;
                if (
                  container.scrollTop < 50 &&
                  hasMoreMessages &&
                  !loadingMessages
                ) {
                  loadMoreMessages();
                }
              }}
            >
              {/* Date separator */}
              <div className="flex justify-center my-4">
                <div className="px-2 py-1 bg-[#1a1a1a] rounded-md text-xs text-gray-500">
                  {new Date().toLocaleDateString('en-US', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })}
                </div>
              </div>

              {loadingMessages && (
                <div className="flex justify-center py-2">
                  <Loader2 className="h-5 w-5 animate-spin text-gray-500" />
                </div>
              )}

              {messages.length === 0 && !loadingMessages ? (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <MessageSquare className="h-10 w-10 text-gray-600 mb-3" />
                  <h3 className="font-medium text-gray-300 mb-1">
                    No messages yet
                  </h3>
                  <p className="text-sm text-gray-500">
                    Send a message to start the conversation
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {messages.map((message, index) => {
                    const isCurrentUser = message.senderId === user?._id;
                    const showAvatar = shouldShowAvatar(
                      message,
                      index,
                      messages
                    );

                    return (
                      <div
                        key={`${message._id}-${index}`}
                        className={`flex ${
                          isCurrentUser ? 'justify-end' : 'justify-start'
                        }`}
                      >
                        {!isCurrentUser && showAvatar && (
                          <Avatar className="h-8 w-8 mr-2 flex-shrink-0 self-end">
                            <AvatarImage
                              src={
                                selectedPsychologist?.image ||
                                selectedPsychologist?.profilePhotoUrl ||
                                ''
                              }
                              alt={`${selectedPsychologist?.firstName} ${selectedPsychologist?.lastName}`}
                            />
                            <AvatarFallback className="bg-[#1e293b] text-gray-300 text-xs">
                              {getInitials(
                                selectedPsychologist?.firstName,
                                selectedPsychologist?.lastName
                              )}
                            </AvatarFallback>
                          </Avatar>
                        )}

                        <div
                          className={`max-w-md flex flex-col ${
                            !showAvatar && !isCurrentUser ? 'ml-10' : ''
                          }`}
                        >
                          <div
                            className={`px-3 py-1.5 rounded-md ${
                              isCurrentUser
                                ? 'bg-blue-600 text-white'
                                : 'bg-[#2a2a2a] text-gray-300'
                            }`}
                          >
                            <p className="text-sm whitespace-pre-wrap">
                              {message.content}
                            </p>
                          </div>

                          <div
                            className={`flex items-center mt-1 ${
                              isCurrentUser ? 'justify-end' : 'justify-start'
                            }`}
                          >
                            <span className="text-xs text-gray-500">
                              {formatTime(message.createdAt)}
                            </span>
                            {isCurrentUser && (
                              <span className="ml-1">
                                {message.isRead ? (
                                  <CheckCheck className="h-3 w-3 text-blue-500" />
                                ) : message._id.startsWith('temp-') ? (
                                  <Loader2 className="h-3 w-3 animate-spin" />
                                ) : (
                                  <Check className="h-3 w-3 text-gray-500" />
                                )}
                              </span>
                            )}
                          </div>
                        </div>

                        {isCurrentUser && showAvatar && (
                          <Avatar className="h-8 w-8 ml-2 flex-shrink-0 self-end">
                            <AvatarImage
                              src={user.image || ''}
                              alt={`${user.firstName} ${user.lastName}`}
                            />
                            <AvatarFallback className="bg-blue-600 text-white text-xs">
                              {getInitials(user.firstName, user.lastName)}
                            </AvatarFallback>
                          </Avatar>
                        )}
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>

            {/* Input Area */}
            <div className="p-3 border-t dark:border-[#333333]">
              {isTyping && (
                <div className="flex items-center mb-1 ml-2">
                  <span className="flex space-x-1 mr-1">
                    <span className="h-1.5 w-1.5 bg-blue-500/60 rounded-full animate-bounce"></span>
                    <span
                      className="h-1.5 w-1.5 bg-blue-500/60 rounded-full animate-bounce"
                      style={{ animationDelay: '0.2s' }}
                    ></span>
                    <span
                      className="h-1.5 w-1.5 bg-blue-500/60 rounded-full animate-bounce"
                      style={{ animationDelay: '0.4s' }}
                    ></span>
                  </span>
                  <p className="text-xs text-gray-500">
                    {selectedPsychologist?.firstName} is typing...
                  </p>
                </div>
              )}

              <div className="flex items-center gap-2 rounded-full dark:bg-[#1a1a1a] p-1 border dark:border-[#333333]">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-full text-gray-400 hover:text-white hover:bg-[#2a2a2a]"
                  onClick={() => toast.info('Attachments coming soon!')}
                >
                  <Paperclip className="h-4 w-4" />
                </Button>

                <Input
                  placeholder={`Type message for ${selectedPsychologist?.firstName}...`}
                  value={messageInput}
                  onChange={handleInputChange}
                  className="flex-1 h-8 bg-transparent border-0 focus-visible:ring-0 focus-visible:ring-offset-0 text-black dark:placeholder:text-gray-500 dark:text-muted-foreground"
                  onKeyDown={e => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                />

                <Button
                  className="h-8 w-8 rounded-full p-0 bg-blue-600 hover:bg-blue-700 text-white disabled:bg-[#2a2a2a] disabled:text-gray-600"
                  onClick={handleSendMessage}
                  disabled={!messageInput.trim()}
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Inbox;
