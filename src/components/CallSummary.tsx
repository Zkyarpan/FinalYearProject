'use client';

import React from 'react';
import { Phone, Video, PhoneOff } from 'lucide-react';

interface CallSummaryProps {
  callData: {
    type: string;
    callType: 'video' | 'audio';
    duration: number;
    endedAt: string;
    initiator: string;
    receiver: string;
    status?: 'missed' | 'rejected' | 'ended';
  };
  timestamp: string;
  isCurrentUser: boolean;
  otherUserName: string;
}

// Format seconds to a readable duration
const formatDuration = (seconds: number): string => {
  if (!seconds || seconds === 0) {
    return 'No duration';
  }

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;

  if (hours > 0) {
    return `${hours}h ${minutes}m ${remainingSeconds}s`;
  } else if (minutes > 0) {
    return `${minutes}m ${remainingSeconds}s`;
  }
  return `${remainingSeconds}s`;
};

// Format time to show as HH:MM AM/PM
const formatTimeAMPM = (isoString: string): string => {
  const date = new Date(isoString);
  return date.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });
};

const CallSummaryMessage: React.FC<CallSummaryProps> = ({
  callData,
  timestamp,
  isCurrentUser,
  otherUserName,
}) => {
  // Determine call status text and icon
  const getCallStatusInfo = () => {
    const status = callData.status || 'ended';

    if (status === 'missed') {
      return {
        icon: <PhoneOff className="h-4 w-4 mr-2 text-red-400" />,
        text: isCurrentUser
          ? `${otherUserName} missed your call`
          : `You missed a call from ${otherUserName}`,
      };
    } else if (status === 'rejected') {
      return {
        icon: <PhoneOff className="h-4 w-4 mr-2 text-red-400" />,
        text: isCurrentUser
          ? `${otherUserName} declined your call`
          : `You declined a call from ${otherUserName}`,
      };
    } else {
      // Regular ended call
      const callTypeIcon =
        callData.callType === 'video' ? (
          <Video className="h-4 w-4 mr-2 text-blue-400" />
        ) : (
          <Phone className="h-4 w-4 mr-2 text-green-400" />
        );

      return {
        icon: callTypeIcon,
        text: isCurrentUser
          ? `You called ${otherUserName}`
          : `${otherUserName} called you`,
      };
    }
  };

  const { icon, text } = getCallStatusInfo();
  const showDuration =
    callData.duration > 0 &&
    callData.status !== 'missed' &&
    callData.status !== 'rejected';

  return (
    <div className="flex justify-center my-3">
      <div className="bg-gray-800/50 text-gray-300 rounded-full py-2 px-4 flex items-center text-sm shadow-md">
        {icon}
        <div className="flex flex-col">
          <span className="font-medium">{text}</span>
          <div className="flex items-center text-xs text-gray-400 mt-0.5">
            {showDuration && (
              <>
                <span>{formatDuration(callData.duration)}</span>
                <span className="mx-1.5">•</span>
              </>
            )}
            <span>{formatTimeAMPM(timestamp)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CallSummaryMessage;
