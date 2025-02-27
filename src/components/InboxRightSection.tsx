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
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useSocket } from '@/context/SocketContext';
import { useUserStore } from '@/store/userStore';
import { format } from 'date-fns';

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
    <Card className="h-full flex flex-col rounded-lg shadow-sm">
      <CardHeader className="space-y-0 pb-2 pt-4 px-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold">Inbox</CardTitle>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleRefresh}
            disabled={loading || psychologistsLoading}
            className="h-8 w-8 rounded-full"
          >
            <RefreshCcw
              className={`h-4 w-4 ${
                loading || psychologistsLoading ? 'animate-spin' : ''
              }`}
            />
          </Button>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="conversations" className="text-xs">
              Conversations
            </TabsTrigger>
            <TabsTrigger value="psychologists" className="text-xs">
              Find Psychologists
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="relative mt-2">
          <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder={
              activeTab === 'conversations'
                ? 'Search conversations...'
                : 'Search psychologists...'
            }
            className="pl-8 h-9 text-sm"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>

        {activeTab === 'psychologists' && allSpecializations.length > 0 && (
          <div className="flex items-center mt-2 gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <div className="flex-1 overflow-auto no-scrollbar">
              <div className="flex gap-1">
                <Badge
                  variant={specialtyFilter === 'all' ? 'default' : 'outline'}
                  className="cursor-pointer text-xs"
                  onClick={() => setSpecialtyFilter('all')}
                >
                  All
                </Badge>
                {allSpecializations.slice(0, 4).map(spec => (
                  <Badge
                    key={spec}
                    variant={specialtyFilter === spec ? 'default' : 'outline'}
                    className="cursor-pointer whitespace-nowrap text-xs"
                    onClick={() => setSpecialtyFilter(spec)}
                  >
                    {spec}
                  </Badge>
                ))}
                {allSpecializations.length > 4 && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Badge
                        variant="outline"
                        className="cursor-pointer text-xs"
                      >
                        More...
                      </Badge>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      {allSpecializations.slice(4).map(spec => (
                        <DropdownMenuItem
                          key={spec}
                          onClick={() => setSpecialtyFilter(spec)}
                          className="text-xs"
                        >
                          {spec}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            </div>
          </div>
        )}
      </CardHeader>

      <CardContent className="flex-1 overflow-hidden p-0 pt-2">
        <Tabs value={activeTab} className="h-full">
          <TabsContent value="conversations" className="m-0 h-full">
            <ScrollArea className="h-full px-3">
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
                  <Button variant="outline" size="sm" onClick={handleRefresh}>
                    Retry
                  </Button>
                </div>
              ) : filteredConversations.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full p-4 text-center">
                  <MessageSquare className="h-12 w-12 text-muted-foreground mb-2" />
                  <h3 className="font-medium">No conversations yet</h3>
                  <p className="text-sm text-muted-foreground">
                    Start a new conversation with a psychologist
                  </p>
                  <Button
                    variant="outline"
                    className="mt-4"
                    onClick={() => setActiveTab('psychologists')}
                  >
                    <MessageCircle className="mr-2 h-4 w-4" />
                    Find Psychologists
                  </Button>
                </div>
              ) : (
                <div className="space-y-1 pr-3">
                  {filteredConversations.map(conversation => {
                    const otherPerson = getOtherPerson(conversation);
                    const online = isOnline(otherPerson?._id || '');
                    const isSelected =
                      currentConversation?._id === conversation._id;

                    // Determine last message display
                    const lastMessage =
                      conversation.lastMessage?.content ||
                      'Start a conversation';
                    const timestamp = conversation.lastMessage
                      ? formatTimestamp(conversation.lastMessage.createdAt)
                      : formatTimestamp(conversation.updatedAt);

                    return (
                      <div
                        key={conversation._id}
                        className={`p-3 rounded-md cursor-pointer transition-colors ${
                          isSelected ? 'bg-primary/10' : 'hover:bg-muted'
                        }`}
                        onClick={() => onSelectConversation(conversation)}
                      >
                        <div className="flex items-center gap-3">
                          <div className="relative">
                            <Avatar className="h-10 w-10 border">
                              <AvatarImage
                                src={
                                  otherPerson?.image ||
                                  otherPerson?.profilePhotoUrl ||
                                  ''
                                }
                                alt={`${otherPerson?.firstName} ${otherPerson?.lastName}`}
                              />
                              <AvatarFallback className="bg-primary/10 text-primary">
                                {getInitials(
                                  otherPerson?.firstName,
                                  otherPerson?.lastName
                                )}
                              </AvatarFallback>
                            </Avatar>
                            <span
                              className={`absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-background ${
                                online ? 'bg-green-500' : 'bg-gray-400'
                              }`}
                            />
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <h4 className="font-medium text-sm truncate">
                                {otherPerson?.role === 'psychologist'
                                  ? 'Dr. '
                                  : ''}
                                {otherPerson?.firstName} {otherPerson?.lastName}
                              </h4>
                              <div className="flex items-center space-x-1">
                                {conversation.unreadCount &&
                                conversation.unreadCount > 0 ? (
                                  <Badge
                                    variant="default"
                                    className="h-5 w-5 rounded-full p-0 text-xs flex items-center justify-center"
                                  >
                                    {conversation.unreadCount}
                                  </Badge>
                                ) : (
                                  <span className="text-xs text-muted-foreground">
                                    {timestamp}
                                  </span>
                                )}
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-6 w-6"
                                      onClick={e => e.stopPropagation()}
                                    >
                                      <MoreVertical className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent
                                    align="end"
                                    className="text-xs"
                                  >
                                    <DropdownMenuItem>
                                      View Profile
                                    </DropdownMenuItem>
                                    <DropdownMenuItem>
                                      Clear Chat
                                    </DropdownMenuItem>
                                    <DropdownMenuItem className="text-destructive">
                                      Block
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                            </div>

                            <p className="text-xs text-muted-foreground truncate mt-1">
                              {lastMessage}
                            </p>

                            <div className="flex items-center mt-1">
                              <Badge
                                variant="secondary"
                                className={`text-xs h-5 px-2 ${
                                  online ? 'bg-green-100 text-green-800' : ''
                                }`}
                              >
                                {online ? 'Online' : 'Offline'}
                              </Badge>
                              {otherPerson?.role === 'psychologist' &&
                                otherPerson?.specializations?.length > 0 && (
                                  <Badge
                                    variant="outline"
                                    className="text-xs ml-1 h-5 px-2"
                                  >
                                    {otherPerson.specializations[0]}
                                  </Badge>
                                )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </ScrollArea>
          </TabsContent>

          <TabsContent value="psychologists" className="m-0 h-full">
            <ScrollArea className="h-full px-3">
              {psychologistsLoading ? (
                <div className="flex justify-center p-4">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : filteredPsychologists.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full p-4 text-center">
                  <MessageCircle className="h-12 w-12 text-muted-foreground mb-2" />
                  <h3 className="font-medium">No psychologists found</h3>
                  <p className="text-sm text-muted-foreground">
                    {searchQuery
                      ? 'Try adjusting your search criteria'
                      : 'No psychologists are available right now'}
                  </p>
                  <Button
                    variant="outline"
                    className="mt-4"
                    onClick={handleRefresh}
                  >
                    <RefreshCcw className="mr-2 h-4 w-4" />
                    Refresh List
                  </Button>
                </div>
              ) : (
                <div className="space-y-1 pr-3">
                  {filteredPsychologists.map(psychologist => {
                    const online = isOnline(psychologist._id);
                    const isSelected =
                      selectedPsychologist?._id === psychologist._id;

                    return (
                      <div
                        key={psychologist._id}
                        className={`p-3 rounded-md cursor-pointer transition-colors ${
                          isSelected ? 'bg-primary/10' : 'hover:bg-muted'
                        }`}
                        onClick={() => onSelectPsychologist(psychologist)}
                      >
                        <div className="flex items-center gap-3">
                          <div className="relative">
                            <Avatar className="h-10 w-10 border">
                              <AvatarImage
                                src={
                                  psychologist.profilePhotoUrl ||
                                  psychologist.image ||
                                  ''
                                }
                                alt={`${psychologist.firstName} ${psychologist.lastName}`}
                              />
                              <AvatarFallback className="bg-primary/10 text-primary">
                                {getInitials(
                                  psychologist.firstName,
                                  psychologist.lastName
                                )}
                              </AvatarFallback>
                            </Avatar>
                            <span
                              className={`absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-background ${
                                online ? 'bg-green-500' : 'bg-gray-400'
                              }`}
                            />
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-center">
                              <h4 className="font-medium text-sm">
                                Dr. {psychologist.firstName}{' '}
                                {psychologist.lastName}
                              </h4>
                              <Badge
                                variant={online ? 'default' : 'secondary'}
                                className={`text-xs ${
                                  online ? 'bg-green-600' : ''
                                }`}
                              >
                                {online ? 'Online' : 'Offline'}
                              </Badge>
                            </div>

                            <div className="flex flex-wrap gap-1 mt-1">
                              {psychologist.specializations
                                ?.slice(0, 2)
                                .map(spec => (
                                  <Badge
                                    key={spec}
                                    variant="outline"
                                    className="text-xs"
                                  >
                                    {spec}
                                  </Badge>
                                ))}
                              {psychologist.specializations?.length > 2 && (
                                <Badge variant="outline" className="text-xs">
                                  +{psychologist.specializations.length - 2}{' '}
                                  more
                                </Badge>
                              )}
                            </div>

                            <div className="flex items-center justify-between mt-2">
                              <div className="flex items-center">
                                <Badge
                                  variant="secondary"
                                  className="text-xs mr-2"
                                >
                                  {psychologist.yearsOfExperience || 0}+ yrs
                                </Badge>
                                {psychologist.city && (
                                  <span className="text-xs text-muted-foreground">
                                    {psychologist.city}
                                  </span>
                                )}
                              </div>
                              <Button
                                size="sm"
                                variant="default"
                                className="h-7 text-xs rounded-full"
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
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
