'use client';

import React, { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { useSocket } from '@/contexts/SocketContext';
import { useVideoCall } from '@/contexts/VideoCallContext';
import { Conversation, Psychologist } from '@/app/(sections)/inbox/types';
import { toast } from 'sonner';

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

  // Handle video call button click
  const handleVideoCall = async () => {
    if (!canMakeCall()) {
      if (!selectedPsychologist?._id || !currentConversation?._id) {
        toast.error(
          'Unable to start call: Missing conversation or recipient information'
        );
        return;
      }

      if (!isOnline(selectedPsychologist._id)) {
        toast.error(`${selectedPsychologist.firstName} is not online`);
        return;
      }

      if (callStatus !== 'idle') {
        toast.error('You are already in a call');
        return;
      }

      return;
    }

    try {
      setIsInitiatingCall(true);

      await startCall(
        selectedPsychologist?._id || '',
        currentConversation?._id || '',
        'video'
      );

      toast.success(`Calling ${selectedPsychologist?.firstName}...`);
    } catch (error) {
      toast.error(`Failed to start video call: ${(error as Error).message}`);
    } finally {
      setIsInitiatingCall(false);
    }
  };

  // Handle audio call button click
  const handleAudioCall = async () => {
    if (!canMakeCall()) {
      if (!selectedPsychologist?._id || !currentConversation?._id) {
        toast.error(
          'Unable to start call: Missing conversation or recipient information'
        );
        return;
      }

      if (!isOnline(selectedPsychologist._id)) {
        toast.error(`${selectedPsychologist.firstName} is not online`);
        return;
      }

      if (callStatus !== 'idle') {
        toast.error('You are already in a call');
        return;
      }

      return;
    }

    try {
      setIsInitiatingCall(true);

      await startCall(
        selectedPsychologist?._id || '',
        currentConversation?._id || '',
        'audio'
      );
      toast.success(`Calling ${selectedPsychologist?.firstName}...`);
    } catch (error) {
      toast.error(`Failed to start audio call: ${(error as Error).message}`);
    } finally {
      setIsInitiatingCall(false);
    }
  };

  // Get call button status message for accessible tooltips
  const getCallButtonStatus = (): string => {
    if (!selectedPsychologist?._id) return 'No recipient selected';
    if (!isOnline(selectedPsychologist._id)) return 'User is offline';
    if (callStatus !== 'idle') return 'Already in a call';
    if (isInitiatingCall) return 'Initiating call...';
    return 'Start call';
  };

  // Determine if there's an active call
  const isInCall =
    callStatus === 'connected' ||
    callStatus === 'calling' ||
    callStatus === 'connecting';

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
          <p className="text-xs text-gray-500">
            {isInCall
              ? `${
                  callStatus === 'calling'
                    ? 'Calling...'
                    : callStatus === 'connecting'
                    ? 'Connecting...'
                    : 'In call'
                }`
              : isOnline(selectedPsychologist?._id || '')
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
          aria-label="Refresh messages"
          title="Refresh messages"
        >
          <RefreshCcw
            className={`h-4 w-4 ${loadingMessages ? 'animate-spin' : ''}`}
          />
        </Button>

        {/* Video Call Button */}
        {isInCall ? (
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full h-8 w-8 bg-green-600 text-white"
            aria-label="In call"
            title="Currently in call"
          >
            <PhoneCall
              className={`h-4 w-4 ${
                callStatus === 'connecting' ? 'animate-pulse' : ''
              }`}
            />
          </Button>
        ) : (
          <Button
            variant="ghost"
            size="icon"
            className={`rounded-full h-8 w-8 
              ${
                !canMakeCall()
                  ? 'text-gray-600'
                  : 'text-gray-400 hover:text-white hover:bg-[#2a2a2a]'
              }
              ${isInitiatingCall ? 'animate-pulse' : ''}
            `}
            onClick={handleVideoCall}
            disabled={!canMakeCall() || isInitiatingCall}
            aria-label="Start video call"
            title={getCallButtonStatus()}
          >
            <Video className="h-4 w-4" />
          </Button>
        )}

        {/* Audio Call Button - Only show if not in call */}
        {!isInCall && (
          <Button
            variant="ghost"
            size="icon"
            className={`rounded-full h-8 w-8 
              ${
                !canMakeCall()
                  ? 'text-gray-600'
                  : 'text-gray-400 hover:text-white hover:bg-[#2a2a2a]'
              }
              ${isInitiatingCall ? 'animate-pulse' : ''}
            `}
            onClick={handleAudioCall}
            disabled={!canMakeCall() || isInitiatingCall}
            aria-label="Start audio call"
            title={getCallButtonStatus()}
          >
            <Phone className="h-4 w-4" />
          </Button>
        )}

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full h-8 w-8 text-gray-400 hover:text-white hover:bg-[#2a2a2a]"
              aria-label="More options"
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
  );
};

export default ChatHeader;
