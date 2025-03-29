'use client';

import { useState, useEffect } from 'react';
import { MessageCircle, Users, FileText, Calendar, Award } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useUserStore } from '@/store/userStore';
import { useRouter } from 'next/navigation';
import ArticlesIcon from '@/icons/Atricles';

const UserProfileRightSection = ({ userId, userName }) => {
  const [userStats, setUserStats] = useState({
    blogCount: 0,
    followerCount: 0,
    joinDate: '',
    interests: [] as string[],
  });
  const [isLoading, setIsLoading] = useState(true);
  const { isAuthenticated, _id } = useUserStore();
  const router = useRouter();
  const isOwnProfile = isAuthenticated && _id === userId;

  useEffect(() => {
    // Simulate fetching user stats
    setIsLoading(true);
    const fetchUserStats = async () => {
      try {
        // In a real implementation, you would fetch this data from your API
        // const response = await fetch(`/api/user/${userId}/stats`);
        // const data = await response.json();

        // For now, simulating data
        setTimeout(() => {
          setUserStats({
            blogCount: Math.floor(Math.random() * 10) + 1,
            followerCount: Math.floor(Math.random() * 100) + 10,
            joinDate: 'January 2025',
            interests: [
              'Mental Health',
              'Anxiety',
              'Depression',
              'Self Care',
              'Mindfulness',
            ],
          });
          setIsLoading(false);
        }, 1000);
      } catch (error) {
        console.error('Error fetching user stats:', error);
        setIsLoading(false);
      }
    };

    fetchUserStats();
  }, [userId]);

  const handleMessage = () => {
    router.push(`/messages/${userId}`);
  };

  const handleFollow = () => {
    // Implement follow functionality
    alert('Follow functionality will be implemented here');
  };

  return (
    <div className="rounded-2xl border border-border p-6 dark:border-[#333333] min-h-[calc(100vh-8rem)] bg-gradient-to-br from-primary/5 to-background">
      <div className="h-full flex flex-col space-y-6">
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-center">
            {isOwnProfile ? 'Your Profile' : `${userName}'s Profile`}
          </h2>

          {isLoading ? (
            <div className="space-y-4">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-3/4 mx-auto"></div>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-sm text-center text-muted-foreground">
                Community member sharing insights and experiences
              </p>
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold">Profile Stats</h3>

          {isLoading ? (
            <div className="space-y-3">
              <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
              <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
              <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between p-2 bg-card/50 rounded-lg border border-border/50">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-primary" />
                  <span className="text-sm">Blog Posts</span>
                </div>
                <span className="font-medium">{userStats.blogCount}</span>
              </div>

              <div className="flex items-center justify-between p-2 bg-card/50 rounded-lg border border-border/50">
                <div className="flex items-center gap-2">
                  <ArticlesIcon  />
                  <span className="text-sm">Atricles</span>
                </div>
                <span className="font-medium">{userStats.followerCount}</span>
              </div>

              <div className="flex items-center justify-between p-2 bg-card/50 rounded-lg border border-border/50">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-primary" />
                  <span className="text-sm">Member Since</span>
                </div>
                <span className="font-medium">{userStats.joinDate}</span>
              </div>
            </div>
          )}
        </div>

        {/* Interests/Topics */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold">Interests & Topics</h3>

          {isLoading ? (
            <div className="flex flex-wrap gap-2">
              <div className="h-6 w-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
              <div className="h-6 w-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
              <div className="h-6 w-14 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {userStats.interests.map((interest, index) => (
                <Badge key={index} variant="outline" className="bg-card/50">
                  {interest}
                </Badge>
              ))}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="mt-auto space-y-3">
          {!isOwnProfile && (
            <>
              <Button
                className="w-full flex items-center gap-2"
                onClick={handleMessage}
              >
                <MessageCircle className="h-4 w-4" />
                Message
              </Button>

              <Button
                variant="outline"
                className="w-full flex items-center gap-2"
                onClick={handleFollow}
              >
                <Users className="h-4 w-4" />
                Follow
              </Button>
            </>
          )}

          {isOwnProfile && (
            <Button
              className="w-full flex items-center gap-2"
              onClick={() => router.push('/account')}
            >
              <Award className="h-4 w-4" />
              Edit Profile
            </Button>
          )}

          <p className="text-xs text-center text-muted-foreground pt-4">
            {isOwnProfile
              ? 'This is how others see your profile'
              : 'Connect with this community member'}
          </p>
        </div>
      </div>
    </div>
  );
};

export default UserProfileRightSection;
