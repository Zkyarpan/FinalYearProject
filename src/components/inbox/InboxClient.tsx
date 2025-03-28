'use client';

import React, { useState, useEffect } from 'react';
import { useUserStore } from '@/store/userStore';
import { useSocket } from '@/contexts/SocketContext';
import { useVideoCall } from '@/contexts/VideoCallContext';
import { toast } from 'sonner';
import ConversationList from '@/components/inbox/ConversationList';
import ChatArea from '@/components/inbox/ChatArea';
import { Conversation, Psychologist } from '@/app/(sections)/inbox/types';

const InboxClient = () => {
  const { user } = useUserStore();
  const { socket, isConnected } = useSocket();
  const { callStatus } = useVideoCall();
  const [selectedPsychologist, setSelectedPsychologist] =
    useState<Psychologist | null>(null);
  const [currentConversation, setCurrentConversation] =
    useState<Conversation | null>(null);
  const [isMobileListVisible, setIsMobileListVisible] = useState(true);

  // Check if user is a psychologist
  const isPsychologist = user?.role === 'psychologist';

  // Handle psychologist selection - only for regular users
  const handleSelectPsychologist = async (psychologist: Psychologist) => {
    if (!user || isPsychologist) return;

    try {
      console.log(
        'Attempting to find/create conversation with psychologist',
        psychologist._id
      );

      // Skip the "find" endpoint and directly try to create the conversation
      // The server will handle checking if it already exists
      const createResponse = await fetch('/api/conversations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user._id,
          psychologistId: psychologist._id,
          // No initialMessage needed
        }),
      });

      // Check if response is OK
      if (!createResponse.ok) {
        const errorText = await createResponse.text();
        console.error('API error:', createResponse.status, errorText);

        if (createResponse.status === 401 || createResponse.status === 403) {
          toast.error('Your session has expired. Please log in again.');
          // Optionally redirect to login
          return;
        }

        throw new Error(`API error: ${createResponse.status}`);
      }

      const createResult = await createResponse.json();
      console.log('Conversation result:', createResult);

      if (createResult.IsSuccess) {
        // Set the conversation
        setCurrentConversation(createResult.Result);
        setSelectedPsychologist(psychologist);
        setIsMobileListVisible(false);

        // Notify via socket if possible
        if (socket && isConnected) {
          socket.emit('new_conversation', createResult.Result);
        }
      } else {
        console.error('API returned failure:', createResult);
        toast.error(createResult.Message || 'Failed to start a conversation');
      }
    } catch (error) {
      console.error('Error creating conversation:', error);

      if (error instanceof SyntaxError) {
        // JSON parsing error - likely received HTML instead of JSON
        toast.error(
          'Authentication error or server issue. Please try logging out and back in.'
        );
      } else {
        toast.error('Could not start conversation. Please try again later.');
      }
    }
  };

  // Show back button on mobile
  const showConversationList = () => {
    setIsMobileListVisible(true);
  };

  return (
    <div className="flex h-screen bg-background border dark:border-[#333333] text-white rounded-2xl mt-5">
      {/* Left sidebar - Conversations */}
      <div
        className={`w-[350px] border-r dark:border-[#333333] flex flex-col ${
          isMobileListVisible ? 'block' : 'hidden md:block'
        }`}
      >
        <ConversationList
          isPsychologist={isPsychologist}
          selectedPsychologist={selectedPsychologist}
          currentConversation={currentConversation}
          setCurrentConversation={setCurrentConversation}
          setSelectedPsychologist={setSelectedPsychologist}
          setIsMobileListVisible={setIsMobileListVisible}
          onSelectPsychologist={handleSelectPsychologist}
        />
      </div>

      {/* Main Chat Area */}
      <div
        className={`flex-1 flex flex-col ${
          isMobileListVisible ? 'hidden md:flex' : 'flex'
        }`}
      >
        <ChatArea
          isPsychologist={isPsychologist}
          currentConversation={currentConversation}
          selectedPsychologist={selectedPsychologist}
          showConversationList={showConversationList}
        />
      </div>
    </div>
  );
};

export default InboxClient;
