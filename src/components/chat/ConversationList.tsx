'use client';

import { useState, useEffect } from 'react';
import { useChat } from '@/context/ChatContext';
import { useUserStore } from '@/store/userStore';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Search, MessageCircle } from 'lucide-react';
import { format, isToday, isYesterday } from 'date-fns';

interface ConversationListProps {
  onSelectConversation: () => void;
}

export default function ConversationList({
  onSelectConversation,
}: ConversationListProps) {
  const {
    conversations,
    loadingConversations,
    currentConversation,
    setCurrentConversation,
    loadMessages,
  } = useChat();
  const { user } = useUserStore();
  const [searchQuery, setSearchQuery] = useState('');

  // Filter conversations based on search query
  const filteredConversations = conversations.filter(convo => {
    const psychologistName = `${convo.psychologist.firstName || ''} ${
      convo.psychologist.lastName || ''
    }`.trim();
    const userName = `${convo.user.firstName || ''} ${
      convo.user.lastName || ''
    }`.trim();

    const searchTerms = searchQuery.toLowerCase();
    return (
      psychologistName.toLowerCase().includes(searchTerms) ||
      userName.toLowerCase().includes(searchTerms) ||
      (convo.lastMessage?.content || '').toLowerCase().includes(searchTerms)
    );
  });

  // Format date for last message
  const formatMessageDate = dateString => {
    const date = new Date(dateString);

    if (isToday(date)) {
      return format(date, 'h:mm a');
    } else if (isYesterday(date)) {
      return 'Yesterday';
    } else {
      return format(date, 'MMM d');
    }
  };

  // Handle conversation selection
  const handleSelectConversation = conversation => {
    setCurrentConversation(conversation);
    loadMessages(conversation._id);
  };

  // Get the other person in the conversation (not the current user)
  const getOtherPerson = conversation => {
    if (!user) return null;

    // If current user is the user in the conversation, return the psychologist
    if (conversation.user._id === user._id) {
      return conversation.psychologist;
    }
    // Otherwise return the user
    return conversation.user;
  };

  // Get initials for avatar fallback
  const getInitials = person => {
    if (!person) return '?';

    if (person.firstName && person.lastName) {
      return `${person.firstName[0]}${person.lastName[0]}`;
    }
    if (person.firstName) {
      return person.firstName[0];
    }
    if (person.email) {
      return person.email[0].toUpperCase();
    }
    return '?';
  };

  // Get avatar URL for person
  const getAvatarUrl = person => {
    if (!person) return null;

    if (person.profileImage) {
      return person.profileImage;
    }
    if (person.profilePhotoUrl) {
      return person.profilePhotoUrl;
    }
    return null;
  };

  if (loadingConversations) {
    return (
      <div className="flex items-center justify-center h-full p-4">
        <span className="loading loading-spinner loading-md"></span>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="p-3 border-b">
        <div className="relative">
          <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="pl-8 py-2 text-sm"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {filteredConversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full p-4 text-center">
            <MessageCircle className="h-12 w-12 text-muted-foreground mb-2" />
            <h3 className="font-medium">No conversations yet</h3>
            <p className="text-sm text-muted-foreground">
              Start a conversation with a psychologist
            </p>
          </div>
        ) : (
          <ul className="divide-y">
            {filteredConversations.map(conversation => {
              const otherPerson = getOtherPerson(conversation);
              const isActive = currentConversation?._id === conversation._id;

              return (
                <li
                  key={conversation._id}
                  className={`hover:bg-accent/50 cursor-pointer ${
                    isActive ? 'bg-accent' : ''
                  }`}
                  onClick={() => handleSelectConversation(conversation)}
                >
                  <div className="flex items-start p-3 gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage
                        src={getAvatarUrl(otherPerson)}
                        alt={otherPerson?.firstName}
                      />
                      <AvatarFallback>
                        {getInitials(otherPerson)}
                      </AvatarFallback>
                    </Avatar>

                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start">
                        <h4 className="font-medium text-sm truncate">
                          {otherPerson?.firstName} {otherPerson?.lastName}
                        </h4>
                        {conversation.lastMessage && (
                          <span className="text-xs text-muted-foreground whitespace-nowrap ml-1">
                            {formatMessageDate(
                              conversation.lastMessage.createdAt
                            )}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center justify-between">
                        <p className="text-sm text-muted-foreground truncate">
                          {conversation.lastMessage?.content ||
                            'Start a conversation'}
                        </p>

                        {conversation.unreadCount > 0 && (
                          <Badge variant="default" className="ml-2 text-xs">
                            {conversation.unreadCount}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
