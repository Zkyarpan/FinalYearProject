'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { MessageCircle, Calendar } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface UserProfileData {
  _id: string;
  firstName: string;
  lastName: string;
  image: string;
  briefBio?: string;
  struggles?: string[];
  createdAt: string;
}

interface UserProfilePopoverProps {
  userId: string;
  userName: string;
  userAvatar: string;
}

const UserProfilePopover: React.FC<UserProfilePopoverProps> = ({
  userId,
  userName,
  userAvatar,
}) => {
  const [userData, setUserData] = useState<UserProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/user/${userId}`);
        const data = await response.json();

        if (data.IsSuccess && data.Result?.profile) {
          setUserData(data.Result.profile);
        } else {
          setError('Failed to load user data');
        }
      } catch (err) {
        setError('Failed to load user data');
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [userId]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
    });
  };

  return (
    <div className="fixed z-50 w-64 rounded-lg shadow-lg bg-[hsl(0,0%,15%)] text-white border border-gray-700 p-3 animate-in fade-in zoom-in duration-300">
      {loading ? (
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 animate-pulse"></div>
            <div className="h-4 w-28 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
          </div>
          <div className="h-3 w-full bg-gray-200 dark:bg-gray-700 rounded animate-pulse mt-3"></div>
          <div className="h-3 w-3/4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
          <div className="flex gap-2 mt-2">
            <div className="h-5 w-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
            <div className="h-5 w-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
          </div>
        </div>
      ) : error ? (
        <div className="text-center py-3">
          <p className="text-sm text-gray-300">Could not load profile data</p>
        </div>
      ) : userData ? (
        <>
          <div className="flex items-center gap-3 mb-2">
            <div className="relative w-10 h-10 rounded-full overflow-hidden border border-gray-700">
              <Image
                src={userData.image || userAvatar || '/default-avatar.jpg'}
                alt={`${userData.firstName} ${userData.lastName}`}
                fill
                className="object-cover"
              />
            </div>
            <div>
              <h4 className="font-semibold text-white">
                {userData.firstName} {userData.lastName}
              </h4>
              <div className="flex items-center text-xs text-gray-300">
                <Calendar className="h-3 w-3 mr-1" />
                <span>Member since {formatDate(userData.createdAt)}</span>
              </div>
            </div>
          </div>

          {userData.briefBio && (
            <p className="text-xs text-gray-300 line-clamp-2 mb-2">
              {userData.briefBio}
            </p>
          )}

          {userData.struggles && userData.struggles.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {userData.struggles.slice(0, 3).map((struggle, index) => (
                <Badge
                  key={index}
                  variant="outline"
                  className="text-xs px-1.5 py-0 text-gray-200 border-gray-600"
                >
                  {struggle}
                </Badge>
              ))}
              {userData.struggles.length > 3 && (
                <span className="text-xs text-gray-400">
                  +{userData.struggles.length - 3} more
                </span>
              )}
            </div>
          )}

          <div className="mt-2 pt-2 border-t border-gray-700">
            <button className="w-full text-xs flex items-center justify-center gap-1 text-blue-400 hover:text-blue-300 transition-colors">
              <MessageCircle className="h-3 w-3" />
              Send Message
            </button>
          </div>
        </>
      ) : (
        <div className="text-center py-3">
          <p className="text-sm text-gray-300">User not found</p>
        </div>
      )}
    </div>
  );
};

export default UserProfilePopover;
