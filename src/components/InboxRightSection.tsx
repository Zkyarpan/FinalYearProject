'use client';

import React, { useState, useEffect } from 'react';
import {
  MessageSquare,
  Search,
  MoreVertical,
  MessageCircle,
  RefreshCcw,
  Loader2,
  AlertCircle,
  Filter,
  User,
  Trash2,
  Ban,
  UserRound,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useSocket } from '@/context/SocketContext';
import { useUserStore } from '@/store/userStore';
import { format } from 'date-fns';
import { toast } from 'sonner';

// Psychologist interface
interface Psychologist {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  profilePhotoUrl: string;
  image?: string;
  specializations: string[];
  country?: string;
  city?: string;
  licenseType?: string;
  yearsOfExperience?: number;
  lastMessage?: string;
  timestamp?: string;
  unreadCount?: number;
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

interface InboxSectionProps {
  selectedPsychologist: Psychologist | null;
  currentConversation: Conversation | null;
  conversations: Conversation[];
  onSelectPsychologist: (psychologist: Psychologist) => void;
  onSelectConversation: (conversation: Conversation) => void;
  onRefresh?: () => void;
  loading?: boolean;
  fetchError?: boolean;
}

export default function InboxRightSection({
  selectedPsychologist,
  currentConversation,
  conversations,
  onSelectPsychologist,
  onSelectConversation,
  onRefresh,
  loading = false,
  fetchError = false,
}: InboxSectionProps) {
  const { onlineUsers } = useSocket();
  const { user } = useUserStore();
  const [activeTab, setActiveTab] = useState<string>('conversations');
  const [psychologists, setPsychologists] = useState<Psychologist[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [psychologistsLoading, setPsychologistsLoading] = useState(false);
  const [specialtyFilter, setSpecialtyFilter] = useState<string>('all');

  // Fetch all psychologists for the "Find Psychologists" tab
  useEffect(() => {
    const fetchPsychologists = async () => {
      if (activeTab !== 'psychologists') return;

      try {
        setPsychologistsLoading(true);
        const timestamp = new Date().getTime();
        const response = await fetch(
          `/api/psychologist/profile?t=${timestamp}`,
          {
            headers: {
              'Cache-Control': 'no-cache, no-store, must-revalidate',
              Pragma: 'no-cache',
              Expires: '0',
            },
          }
        );

        if (response.ok) {
          const data = await response.json();
          if (data.IsSuccess && data.Result && data.Result.psychologists) {
            const formattedPsychologists = data.Result.psychologists.map(
              psych => ({
                _id: psych.id,
                firstName: psych.firstName || '',
                lastName: psych.lastName || '',
                email: psych.email || '',
                profilePhotoUrl: psych.profilePhoto || '',
                image: psych.profilePhoto || '',
                specializations: psych.specializations || [],
                country: psych.country || '',
                city: psych.city || '',
                licenseType: psych.licenseType || '',
                yearsOfExperience: psych.yearsOfExperience || 0,
              })
            );
            setPsychologists(formattedPsychologists);
          } else {
            setPsychologists([]);
          }
        }
      } catch (error) {
        console.error('Error fetching psychologists:', error);
      } finally {
        setPsychologistsLoading(false);
      }
    };

    fetchPsychologists();
  }, [activeTab]);

  // Get all unique specializations for filtering
  const allSpecializations = React.useMemo(() => {
    const specs = new Set<string>();
    psychologists.forEach(psych => {
      psych.specializations?.forEach(spec => specs.add(spec));
    });
    return Array.from(specs).sort();
  }, [psychologists]);

  // Filter psychologists based on search query and specialty
  const filteredPsychologists = psychologists.filter(psych => {
    const fullName = `${psych.firstName || ''} ${
      psych.lastName || ''
    }`.toLowerCase();
    const specializations = (psych.specializations || [])
      .join(' ')
      .toLowerCase();
    const searchLower = searchQuery.toLowerCase();

    const matchesSearch =
      fullName.includes(searchLower) || specializations.includes(searchLower);
    const matchesSpecialty =
      specialtyFilter === 'all' ||
      psych.specializations?.some(
        s => s.toLowerCase() === specialtyFilter.toLowerCase()
      );

    return matchesSearch && matchesSpecialty;
  });

  // Filter conversations based on search query
  const filteredConversations = conversations.filter(convo => {
    if (!user) return false;

    const otherPerson =
      convo.user._id === user._id ? convo.psychologist : convo.user;
    const fullName = `${otherPerson.firstName || ''} ${
      otherPerson.lastName || ''
    }`.toLowerCase();
    const searchLower = searchQuery.toLowerCase();

    return (
      fullName.includes(searchLower) ||
      (convo.lastMessage?.content || '').toLowerCase().includes(searchLower)
    );
  });

  // Check if a psychologist is online
  const isOnline = (psychologistId: string) => {
    return onlineUsers.some(user => user.userId === psychologistId);
  };

  // Get initials for avatar
  const getInitials = (firstName?: string, lastName?: string) => {
    if (!firstName && !lastName) return '??';
    return `${firstName?.[0] || ''}${lastName?.[0] || ''}`;
  };

  // Format timestamp for conversations
  const formatTimestamp = (timestamp: string) => {
    if (!timestamp) return '';

    const date = new Date(timestamp);
    const now = new Date();
    const diffHours = Math.abs(now.getTime() - date.getTime()) / 36e5;

    if (diffHours < 24) {
      return format(date, 'h:mm a');
    } else if (diffHours < 48) {
      return 'Yesterday';
    } else {
      return format(date, 'MMM d');
    }
  };

  // Get the other person in the conversation (not the current user)
  const getOtherPerson = (conversation: Conversation) => {
    if (!user) return null;

    // If current user is the user in the conversation, return the psychologist
    if (conversation.user._id === user._id) {
      return conversation.psychologist;
    }
    // Otherwise return the user
    return conversation.user;
  };

  // Handle refresh button click
  const handleRefresh = () => {
    if (onRefresh) {
      onRefresh();
    }
  };
  return (
    <div className="flex flex-col h-full bg-background border-none rounded-s-2xl">
      {/* Header - Inbox title and refresh button */}
      <div className="flex items-center justify-between p-4 border-b dark:border-[#333333]">
        <h2 className="text-xl font-semibold text-black dark:text-white">
          Inbox
        </h2>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleRefresh}
          disabled={loading || psychologistsLoading}
          className="h-8 w-8 rounded-full text-gray-400 hover:text-white hover:bg-[#2a2a2a]"
        >
          <RefreshCcw
            className={`h-4 w-4 ${
              loading || psychologistsLoading ? 'animate-spin' : ''
            }`}
          />
        </Button>
      </div>

      {/* Tabs navigation */}
      <Tabs
        value={activeTab}
        onValueChange={value =>
          setActiveTab(value as 'conversations' | 'psychologists')
        }
        className="mx-2 mt-3 mb-2"
      >
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="conversations">Conversations</TabsTrigger>
          <TabsTrigger value="psychologists">Find Psychologists</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Search bar */}
      <div className="px-3 pb-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
          <Input
            placeholder={
              activeTab === 'conversations'
                ? 'Search conversations...'
                : 'Search psychologists...'
            }
            className="pl-9 h-9 text-sm  border dark:border-[#333333]  rounded-md focus-visible:ring-0 focus-visible:ring-offset-0 text-gray-200"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Specialty filters (show only on psychologists tab) */}
      {activeTab === 'psychologists' && allSpecializations.length > 0 && (
        <div className="px-3 pb-3 flex items-center gap-2">
          <Filter className="h-4 w-4 text-gray-500" />
          <div className="flex-1 overflow-x-auto scrollbar-hide">
            <div className="flex gap-1.5">
              <Badge
                variant={specialtyFilter === 'all' ? 'default' : 'outline'}
                className={`cursor-pointer text-xs px-2 py-0.5 rounded-full whitespace-nowrap ${
                  specialtyFilter === 'all'
                    ? 'bg-blue-600 hover:bg-blue-700 text-white'
                    : 'border-[#2a2a2a] text-gray-400 hover:bg-[#2a2a2a] hover:text-white'
                }`}
                onClick={() => setSpecialtyFilter('all')}
              >
                All
              </Badge>
              {allSpecializations.slice(0, 3).map(spec => (
                <Badge
                  key={spec}
                  variant={specialtyFilter === spec ? 'default' : 'outline'}
                  className={`cursor-pointer text-xs px-2 py-0.5 rounded-full whitespace-nowrap ${
                    specialtyFilter === spec
                      ? 'bg-blue-600 hover:bg-blue-700 text-white'
                      : 'border-[#2a2a2a] text-gray-400 hover:bg-[#2a2a2a] hover:text-white'
                  }`}
                  onClick={() => setSpecialtyFilter(spec)}
                >
                  {spec}
                </Badge>
              ))}
              {allSpecializations.length > 3 && (
                <Badge
                  variant="outline"
                  className="cursor-pointer text-xs px-2 py-0.5 rounded-full whitespace-nowrap border-[#2a2a2a] text-gray-400 hover:bg-[#2a2a2a] hover:text-white"
                  onClick={() =>
                    toast.info('More specializations coming soon!')
                  }
                >
                  More...
                </Badge>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Main content area */}
      <div className="flex-1 overflow-hidden">
        {/* Conversations Tab */}
        {activeTab === 'conversations' && (
          <div className="h-full">
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
                  onClick={handleRefresh}
                  className="rounded-md border-[#2a2a2a] text-gray-300 hover:bg-[#2a2a2a]"
                >
                  Retry
                </Button>
              </div>
            ) : filteredConversations.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full p-4 text-center">
                <MessageSquare className="h-10 w-10 text-gray-600 mb-3" />
                <h3 className="font-medium text-gray-300 mb-1">
                  No conversations yet
                </h3>
                <p className="text-sm text-gray-500">
                  Start a new conversation with a psychologist
                </p>
                <Button
                  variant="outline"
                  className="mt-4 rounded-md border-[#2a2a2a] text-gray-300 hover:bg-[#2a2a2a]"
                  onClick={() => setActiveTab('psychologists')}
                >
                  <MessageCircle className="mr-2 h-4 w-4" />
                  Find Psychologists
                </Button>
              </div>
            ) : (
              <div className="h-full overflow-y-auto scrollbar-hide">
                {filteredConversations.map(conversation => {
                  const otherPerson = getOtherPerson(conversation);
                  const online = isOnline(otherPerson?._id || '');
                  const isSelected =
                    currentConversation?._id === conversation._id;
                  const hasUnread = (conversation.unreadCount ?? 0) > 0;

                  // Determine last message display
                  const lastMessage =
                    conversation.lastMessage?.content || 'Start a conversation';
                  const timestamp = conversation.lastMessage
                    ? formatTimestamp(conversation.lastMessage.createdAt)
                    : formatTimestamp(conversation.updatedAt);

                  return (
                    <div
                      key={conversation._id}
                      className={`px-3 py-3 cursor-pointer hover:bg-[#1a1a1a] ${
                        isSelected ? 'bg-[#1e1e1e]' : ''
                      }`}
                      onClick={() => onSelectConversation(conversation)}
                    >
                      <div className="flex items-center">
                        <div className="relative mr-3">
                          <Avatar className="h-10 w-10">
                            <AvatarImage
                              src={
                                otherPerson?.image ||
                                otherPerson?.profilePhotoUrl ||
                                ''
                              }
                              alt={`${otherPerson?.firstName} ${otherPerson?.lastName}`}
                            />
                            <AvatarFallback className="bg-[#1e293b] text-blue-400">
                              {getInitials(
                                otherPerson?.firstName,
                                otherPerson?.lastName
                              )}
                            </AvatarFallback>
                          </Avatar>
                          <span
                            className={`absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-[#121212] ${
                              online ? 'bg-green-500' : 'bg-gray-500'
                            }`}
                          />
                        </div>

                        <div className="flex flex-col min-w-0 flex-1">
                          <div className="flex justify-between items-center">
                            <span className="font-medium text-sm truncate">
                              {otherPerson?.role === 'psychologist'
                                ? 'Dr. '
                                : ''}
                              {otherPerson?.firstName} {otherPerson?.lastName}
                            </span>
                            <span className="text-xs text-gray-500 ml-2 whitespace-nowrap">
                              {timestamp}
                            </span>
                          </div>

                          <div className="flex items-center">
                            <p
                              className={`text-xs truncate max-w-[200px] ${
                                hasUnread
                                  ? 'text-white font-medium'
                                  : 'text-gray-500'
                              }`}
                            >
                              {lastMessage}
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
                            {online ? (
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
                })}
              </div>
            )}
          </div>
        )}

        {/* Psychologists Tab */}
        {activeTab === 'psychologists' && (
          <div className="h-full">
            {psychologistsLoading ? (
              <div className="flex justify-center items-center h-full">
                <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
              </div>
            ) : filteredPsychologists.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full p-4 text-center">
                <UserRound className="h-10 w-10 text-gray-600 mb-3" />
                <h3 className="font-medium text-gray-300 mb-1">
                  No psychologists found
                </h3>
                <p className="text-sm text-gray-500">
                  {searchQuery
                    ? 'Try adjusting your search criteria'
                    : 'No psychologists are available right now'}
                </p>
                <Button
                  variant="outline"
                  className="mt-4 rounded-md border-[#2a2a2a] text-gray-300 hover:bg-[#2a2a2a]"
                  onClick={handleRefresh}
                >
                  <RefreshCcw className="mr-2 h-4 w-4" />
                  Refresh List
                </Button>
              </div>
            ) : (
              <div className="h-full overflow-y-auto scrollbar-hide">
                {filteredPsychologists.map(psychologist => {
                  const online = isOnline(psychologist._id);
                  const isSelected =
                    selectedPsychologist?._id === psychologist._id;

                  return (
                    <div
                      key={psychologist._id}
                      className={`px-3 py-3 cursor-pointer hover:bg-[#1a1a1a] ${
                        isSelected ? 'bg-[#1e1e1e]' : ''
                      }`}
                      onClick={() => onSelectPsychologist(psychologist)}
                    >
                      <div className="flex items-center">
                        <div className="relative mr-3">
                          <Avatar className="h-10 w-10">
                            <AvatarImage
                              src={
                                psychologist.profilePhotoUrl ||
                                psychologist.image ||
                                ''
                              }
                              alt={`${psychologist.firstName} ${psychologist.lastName}`}
                            />
                            <AvatarFallback className="bg-[#1e293b] text-blue-400">
                              {getInitials(
                                psychologist.firstName,
                                psychologist.lastName
                              )}
                            </AvatarFallback>
                          </Avatar>
                          <span
                            className={`absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-[#121212] ${
                              online ? 'bg-green-500' : 'bg-gray-500'
                            }`}
                          />
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-center">
                            <h4 className="font-medium text-sm truncate">
                              Dr. {psychologist.firstName}{' '}
                              {psychologist.lastName}
                            </h4>
                            <span
                              className={`text-xs px-2 py-0.5 rounded-full ${
                                online
                                  ? 'bg-green-500/20 text-green-500'
                                  : 'bg-[#2a2a2a] text-gray-400'
                              }`}
                            >
                              {online ? 'Online' : 'Offline'}
                            </span>
                          </div>

                          <div className="flex flex-wrap gap-1 mt-1">
                            {psychologist.specializations
                              ?.slice(0, 2)
                              .map(spec => (
                                <span
                                  key={spec}
                                  className="text-xs px-1.5 py-0.5 rounded-full bg-[#2a2a2a] text-gray-300"
                                >
                                  {spec}
                                </span>
                              ))}
                            {psychologist.specializations?.length > 2 && (
                              <span className="text-xs px-1.5 py-0.5 rounded-full bg-[#2a2a2a] text-gray-300">
                                +{psychologist.specializations.length - 2}
                              </span>
                            )}
                          </div>

                          <div className="flex items-center justify-between mt-2">
                            <span className="text-xs bg-[#2a2a2a] px-2 py-0.5 rounded-full text-gray-300">
                              {psychologist.yearsOfExperience || 0}+ yrs
                            </span>
                            <Button
                              size="sm"
                              className="h-7 text-xs rounded-full px-2 bg-blue-600 hover:bg-blue-700 text-white"
                              onClick={e => {
                                e.stopPropagation();
                                onSelectPsychologist(psychologist);
                              }}
                            >
                              <MessageSquare className="h-3 w-3 mr-1" />
                              Message
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
