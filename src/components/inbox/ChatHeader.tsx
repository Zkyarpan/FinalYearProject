'use client';

import React, { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { useSocket } from '@/contexts/SocketContext';
import { useVideoCall } from '@/contexts/VideoCallContext';
import { Conversation, Psychologist } from '@/app/(sections)/inbox/types';

import {
  ArrowLeft,
  MoreVertical,
  Video,
  Phone,
  RefreshCcw,
  User,
  Ban,
  Trash2,
  PhoneCall,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface ChatHeaderProps {
  isPsychologist: boolean;
  selectedPsychologist: Psychologist | null;
  currentConversation: Conversation | null;
  showConversationList: () => void;
  loadMessages: (conversationId: string) => void;
  loadingMessages: boolean;
}

const ChatHeader: React.FC<ChatHeaderProps> = ({
  isPsychologist,
  selectedPsychologist,
  currentConversation,
  showConversationList,
  loadMessages,
  loadingMessages,
}) => {
  const { isUserOnline } = useSocket();
  const { startCall, callStatus } = useVideoCall();
  const [isInitiatingCall, setIsInitiatingCall] = useState<boolean>(false);

  // Check if a user is online
  const isOnline = (userId: string): boolean => {
    if (!userId) return false;
    return isUserOnline(userId);
  };

  // Get initials for avatar fallback
  const getInitials = (
    firstName?: string | null,
    lastName?: string | null
  ): string => {
    if (!firstName && !lastName) return '??';
    return `${firstName?.[0] || ''}${lastName?.[0] || ''}`;
  };

  // Safely check if call actions are possible
  const canMakeCall = (): boolean => {
    const isRecipientOnline = isOnline(selectedPsychologist?._id || '');
    const isCallActive = callStatus !== 'idle';

    return !!(
      selectedPsychologist?._id &&
      currentConversation?._id &&
      isRecipientOnline &&
      !isCallActive &&
      !isInitiatingCall
    );
  };

  return (
    <div className="flex items-center px-4 py-3 border-b dark:border-[#333333]">
      <Button
        variant="ghost"
        size="icon"
        className="md:hidden mr-2 text-gray-400 hover:text-white dark:border-[#333333] rounded-full"
        onClick={showConversationList}
        aria-label="Show conversation list"
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
              alt={`${selectedPsychologist?.firstName || ''} ${
                selectedPsychologist?.lastName || ''
              }`}
            />
            <AvatarFallback className="bg-[#1e293b] text-blue-400">
              {getInitials(
                selectedPsychologist?.firstName,
                selectedPsychologist?.lastName
              )}
            </AvatarFallback>
          </Avatar>
          <span
            className={`absolute bottom-0 right-3 h-3 w-3 rounded-full border-2 dark:border-[#333333] ${
              isOnline(selectedPsychologist?._id || '')
                ? 'bg-green-500'
                : 'bg-gray-500'
            }`}
            aria-hidden="true"
          />
        </div>

        <div>
          <h2 className="font-semibold text-base">
            {isPsychologist
              ? `${selectedPsychologist?.firstName || ''} ${
                  selectedPsychologist?.lastName || ''
                }`
              : `Dr. ${selectedPsychologist?.firstName || ''} ${
                  selectedPsychologist?.lastName || ''
                }`}
          </h2>
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
          aria-label="Refresh messages"
          title="Refresh messages"
        >
          <RefreshCcw
            className={`h-4 w-4 ${loadingMessages ? 'animate-spin' : ''}`}
          />
        </Button>
      </div>
    </div>
  );
};

export default ChatHeader;
