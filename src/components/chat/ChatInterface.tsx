'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useChat } from '@/contexts/ChatContext';
import { useUserStore } from '@/store/userStore';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Send, ChevronLeft, Loader2, RefreshCw } from 'lucide-react';
import ChatMessage from '@/components/chat/ChatMessage';

interface ChatInterfaceProps {
  onBack?: () => void;
  selectedPsychologistId: string | null;
}

export default function ChatInterface({
  onBack,
  selectedPsychologistId,
}: ChatInterfaceProps) {
  const {
    currentConversation,
    messages,
    sendMessage,
    loadingMessages,
    hasMoreMessages,
    loadMoreMessages,
    isTyping,
    setTyping,
    loadMessages,
  } = useChat();

  const { user } = useUserStore();
  const [messageInput, setMessageInput] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const processedIds = useRef(new Set<string>());

  // Deduplicate messages
  const uniqueMessages = useMemo(() => {
    const uniqueMap = new Map();

    // Process permanent messages first
    messages.forEach(msg => {
      if (!msg._id.startsWith('temp-')) {
        uniqueMap.set(msg._id, msg);
      }
    });

    // Then add temp messages if not duplicated
    messages.forEach(msg => {
      if (msg._id.startsWith('temp-')) {
        // Check if this temp message already has a permanent version
        const hasPermanent = Array.from(uniqueMap.values()).some(
          permanent =>
            !permanent._id.startsWith('temp-') &&
            permanent.content === msg.content &&
            permanent.senderId === msg.senderId
        );

        if (!hasPermanent) {
          uniqueMap.set(msg._id, msg);
        }
      }
    });

    // Sort by creation time
    return Array.from(uniqueMap.values()).sort(
      (a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
  }, [messages]);

  // Get other person in conversation
  const getOtherPerson = () => {
    if (!currentConversation || !user) return null;

    // If user is the conversation user, return the psychologist
    if (currentConversation.user._id === user._id) {
      return currentConversation.psychologist;
    }
    // Otherwise return the user
    return currentConversation.user;
  };

  const otherPerson = getOtherPerson();

  // Get initials for avatar
  const getInitials = person => {
    if (!person) return '?';

    if (person.firstName && person.lastName) {
      return `${person.firstName[0]}${person.lastName[0]}`.toUpperCase();
    }
    if (person.firstName) {
      return person.firstName[0].toUpperCase();
    }
    if (person.email) {
      return person.email[0].toUpperCase();
    }
    return '?';
  };

  // Get avatar image
  const getAvatarImage = person => {
    if (!person) return '';
    return person.profilePhotoUrl || person.profileImage || '';
  };

  // Handle sending a message
  const handleSendMessage = async () => {
    if (!messageInput.trim() || sending) return;

    setSending(true);
    const messageContent = messageInput.trim();
    setMessageInput('');

    // Stop typing indicator
    if (currentConversation) {
      setTyping(currentConversation._id, false);
    }

    try {
      await sendMessage(messageContent);
    } catch (error) {
      console.error('Error sending message:', error);
      // Restore message input if sending fails
      setMessageInput(messageContent);
    } finally {
      setSending(false);
    }
  };

  // Handle typing indicator
  const handleTyping = e => {
    setMessageInput(e.target.value);

    if (currentConversation) {
      // Only send typing event if user is actually typing
      const isUserTyping = e.target.value.trim().length > 0;
      setTyping(currentConversation._id, isUserTyping);
    }
  };

  // Handle key press (Enter to send)
  const handleKeyPress = e => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Refresh messages
  const handleRefresh = () => {
    if (currentConversation) {
      loadMessages(currentConversation._id);
    }
  };

  // Scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current && uniqueMessages.length > 0) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [uniqueMessages]);

  // Handler for loading more messages when scrolling to top
  const handleScroll = () => {
    if (!messagesContainerRef.current) return;
    const { scrollTop } = messagesContainerRef.current;

    // If scrolled near the top and we have more messages to load
    if (scrollTop < 50 && hasMoreMessages && !loadingMessages) {
      loadMoreMessages();
    }
  };

  // Add scroll event listener
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll);
      return () => container.removeEventListener('scroll', handleScroll);
    }
  }, [hasMoreMessages, loadingMessages]);

  // If no conversation is selected
  if (!currentConversation) {
    return (
      <div className="flex items-center justify-center h-full p-4 text-center">
        <div>
          <h3 className="font-medium mb-2">Select a conversation</h3>
          <p className="text-sm text-muted-foreground">
            Choose a conversation from the list or start a new one
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Chat header */}
      <div className="border-b p-3 flex items-center gap-3">
        {onBack && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onBack}
            className="md:hidden"
            aria-label="Back"
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
        )}

        <Avatar className="h-10 w-10">
          <AvatarImage
            src={getAvatarImage(otherPerson)}
            alt={otherPerson?.firstName || 'User'}
          />
          <AvatarFallback>{getInitials(otherPerson)}</AvatarFallback>
        </Avatar>

        <div className="flex-1">
          <h3 className="font-medium text-sm">
            {otherPerson?.role === 'psychologist' ? 'Dr. ' : ''}
            {otherPerson?.firstName || ''} {otherPerson?.lastName || ''}
          </h3>
          <p className="text-xs text-muted-foreground">
            {isTyping[currentConversation._id] ? (
              <span className="text-primary">Typing...</span>
            ) : (
              otherPerson?.role || 'User'
            )}
          </p>
        </div>

        <Button
          variant="ghost"
          size="icon"
          onClick={handleRefresh}
          disabled={loadingMessages}
          aria-label="Refresh messages"
        >
          <RefreshCw
            className={`h-4 w-4 ${loadingMessages ? 'animate-spin' : ''}`}
          />
        </Button>
      </div>

      {/* Messages */}
      <div
        className="flex-1 overflow-y-auto p-4"
        ref={messagesContainerRef}
        data-testid="messages-container"
      >
        {/* Loading indicator for older messages */}
        {loadingMessages && hasMoreMessages && (
          <div className="flex justify-center my-2">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        )}

        {/* No messages placeholder */}
        {uniqueMessages.length === 0 && !loadingMessages && (
          <div className="flex flex-col items-center justify-center h-full p-4 text-center">
            <h3 className="font-medium mb-2">No messages yet</h3>
            <p className="text-sm text-muted-foreground">
              Start the conversation by sending a message
            </p>
          </div>
        )}

        {/* Message list */}
        {uniqueMessages.map((message, index) => (
          <ChatMessage key={`${message._id}-${index}`} message={message} />
        ))}

        {/* Element to scroll to on new messages */}
        <div ref={messagesEndRef} />
      </div>

      {/* Message input */}
      <div className="border-t p-3">
        <div className="flex items-end gap-2">
          <Textarea
            value={messageInput}
            onChange={handleTyping}
            onKeyDown={handleKeyPress}
            placeholder="Type your message..."
            className="min-h-10 py-2 resize-none"
            rows={1}
            disabled={sending}
            data-testid="message-input"
          />

          <Button
            onClick={handleSendMessage}
            disabled={!messageInput.trim() || sending}
            size="icon"
            aria-label="Send message"
            data-testid="send-button"
          >
            {sending ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Send className="h-5 w-5" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
