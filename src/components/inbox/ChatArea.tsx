'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useSocket } from '@/contexts/SocketContext';
import { useVideoCall } from '@/contexts/VideoCallContext';
import { useUserStore } from '@/store/userStore';
import { toast } from 'sonner';
import { formatDuration } from '@/helpers/formatDuration';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

import {
  Conversation,
  Message,
  Psychologist,
} from '@/app/(sections)/inbox/types';
import MessageList from '@/components/inbox/MessageList';
import ChatHeader from '@/components/inbox/ChatHeader';
import { Send, ArrowLeft, MessageSquare, Paperclip } from 'lucide-react';

interface ChatAreaProps {
  isPsychologist: boolean;
  currentConversation: Conversation | null;
  selectedPsychologist: Psychologist | null;
  showConversationList: () => void;
}

const ChatArea: React.FC<ChatAreaProps> = ({
  isPsychologist,
  currentConversation,
  selectedPsychologist,
  showConversationList,
}) => {
  const { socket, isConnected } = useSocket();
  const { callStatus } = useVideoCall();
  const { user } = useUserStore();
  const [messageInput, setMessageInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [hasMoreMessages, setHasMoreMessages] = useState(true);
  const [oldestMessageId, setOldestMessageId] = useState<string | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [lastAddedCallSummary, setLastAddedCallSummary] = useState<
    string | null
  >(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const messageProcessedIds = useRef(new Set<string>());

  // Load messages when a conversation is selected with better error handling
  const loadMessages = async (conversationId: string) => {
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

  // Set up socket listeners for real-time messaging with better error handling
  useEffect(() => {
    if (!socket || !isConnected || !user?._id || !currentConversation) {
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
      }
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

    // Register socket event listeners
    socket.on('new_message', handleNewMessage);
    socket.on('messages_read', handleMessagesRead);
    socket.on('user_typing', handleUserTyping);

    // Load messages when component mounts or conversation changes
    if (currentConversation) {
      loadMessages(currentConversation._id);
    }

    // Clean up listeners when component unmounts or dependencies change
    return () => {
      socket.off('new_message', handleNewMessage);
      socket.off('messages_read', handleMessagesRead);
      socket.off('user_typing', handleUserTyping);

      // Leave any conversation room
      if (currentConversation) {
        socket.emit('leave_conversation', currentConversation._id);
      }
    };
  }, [
    socket,
    isConnected,
    user?._id,
    currentConversation,
    selectedPsychologist,
    isPsychologist,
  ]);

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
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message. Please try again.');
      // Remove optimistic message on failure
      setMessages(prev => prev.filter(msg => !msg._id.startsWith('temp-')));
    }
  };

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

  if (!currentConversation) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <MessageSquare className="h-12 w-12 text-gray-600 mb-4" />
        <h3 className="text-xl font-semibold mb-2">No conversation selected</h3>
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
    );
  }

  return (
    <>
      {/* Chat Header */}
      <ChatHeader
        isPsychologist={isPsychologist}
        selectedPsychologist={selectedPsychologist}
        currentConversation={currentConversation}
        showConversationList={showConversationList}
        loadMessages={loadMessages}
        loadingMessages={loadingMessages}
      />

      {/* Messages Area */}
      <MessageList
        messages={messages}
        loadingMessages={loadingMessages}
        messagesContainerRef={messagesContainerRef}
        messagesEndRef={messagesEndRef}
        user={user}
        selectedPsychologist={selectedPsychologist}
        isPsychologist={isPsychologist}
        loadMoreMessages={loadMoreMessages}
        hasMoreMessages={hasMoreMessages}
      />

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
  );
};

export default ChatArea;
