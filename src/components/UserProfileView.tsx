'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  MessageCircle,
  Edit,
  Globe,
  Bookmark,
  Clock,
  User,
  Calendar,
  FileText,
  Users,
} from 'lucide-react';
import { toast } from 'sonner';
import Image from 'next/image';

// Component imports
import Location from '@/icons/Location';
import Messages from '@/icons/Messages';
import LoginModal from '@/components/LoginModel';
import { ProfileSkeleton } from '@/components/ProfileSkeleton';

// UI Components
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// Store and Types
import { useUserStore } from '@/store/userStore';

// Types
interface Blog {
  _id: string;
  title: string;
  content: string;
  blogImage: string;
  category: string;
  tags: string[];
  readTime: number;
  publishDate: string;
  isOwner: boolean;
}

interface UserProfile {
  _id: string;
  userId: string;
  firstName: string;
  lastName: string;
  image: string;
  address?: string;
  phone: string;
  age: number;
  gender?: string;
  preferredCommunication: 'video' | 'audio' | 'chat' | 'in-person';
  struggles: string[];
  briefBio: string;
  profileCompleted: boolean;
  createdAt: string;
  updatedAt: string;
}

const UserProfileView: React.FC = () => {
  // Core state
  const params = useParams();
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('about');
  const [showLoginModal, setShowLoginModal] = useState(false);

  // User state from store
  const { isAuthenticated, _id } = useUserStore();

  // Fetch user profile data
  useEffect(() => {
    const fetchUserProfile = async () => {
      setLoading(true);
      try {
        if (!params?.id) throw new Error('User not found');

        // Fetch user profile
        const profileResponse = await fetch(`/api/user/${params.id}`);
        const profileData = await profileResponse.json();

        if (!profileData.IsSuccess || !profileData.Result?.profile) {
          throw new Error(
            profileData.ErrorMessage?.[0]?.message || 'User not found'
          );
        }

        setProfile(profileData.Result.profile);

        // Fetch user's blogs
        const blogsResponse = await fetch(`/api/user/${params.id}/blogs`);
        const blogsData = await blogsResponse.json();

        if (blogsData.IsSuccess) {
          setBlogs(blogsData.Result.blogs || []);
        }
      } catch (error) {
        setError(
          error instanceof Error ? error.message : 'Failed to load user data'
        );
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, [params?.id]);

  // Helper functions for date formatting
  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  // Calculate member since date
  const getMemberSince = (): string => {
    if (!profile) return '';
    return formatDate(profile.createdAt);
  };

  // Get year from date
  const getMemberSinceYear = (): string => {
    if (!profile) return '';
    return new Date(profile.createdAt).getFullYear().toString();
  };

  if (loading) return <ProfileSkeleton />;

  if (error || !profile)
    return <div className="py-10 text-center">User not found</div>;

  const isOwnProfile = isAuthenticated && _id === profile.userId;
  const fullName = `${profile.firstName} ${profile.lastName}`;

  return (
    <div className="flex flex-col gap-6 py-6 px-1 sm:px-4">
      <LoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
      />

      {/* Profile Header Section */}
      <div className="flex flex-col gap-4 items-center justify-center">
        <div className="w-24 h-24 md:w-32 md:h-32 relative rounded-full overflow-hidden mb-2">
          <Image
            src={profile.image}
            alt={fullName}
            fill
            className="object-cover hover:opacity-90 transition-opacity border border-gray-200 dark:border-gray-700"
          />
        </div>

        {/* Profile Info */}
        <div className="flex flex-col gap-2 text-center">
          <h1 className="font-semibold text-xl md:text-2xl">{fullName}</h1>
          <div className="flex items-center justify-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <User className="w-4 h-4" />
            <span>Member since {getMemberSince()}</span>
          </div>
        </div>

        {/* Profile Details */}
        {profile.address && (
          <div className="flex justify-center gap-4 mt-1">
            <div className="flex gap-2 items-center">
              <Location />
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                {profile.address}
              </p>
            </div>
          </div>
        )}

        {/* Struggles/Interests Tags */}
        {profile.struggles && profile.struggles.length > 0 && (
          <div className="w-full flex flex-wrap justify-center items-center gap-2 mt-2 max-w-xl mx-auto">
            {profile.struggles.map((item, index) => (
              <Badge key={index} variant="outline" className="capitalize">
                {item}
              </Badge>
            ))}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3 mt-4">
          {!isOwnProfile && (
            <Button
              variant="default"
              size="sm"
              className="flex items-center gap-2"
              onClick={() => {
                if (!isAuthenticated) {
                  localStorage.setItem(
                    'redirectAfterLogin',
                    `/messages/${profile.userId}`
                  );
                  setShowLoginModal(true);
                  return;
                }
                router.push(`/messages/${profile.userId}`);
              }}
            >
              <MessageCircle className="w-4 h-4" />
              Message
            </Button>
          )}
          {isOwnProfile && (
            <Button
              variant="default"
              size="sm"
              className="flex items-center gap-2"
              onClick={() => router.push('/settings/profile')}
            >
              <Edit className="w-4 h-4" />
              Edit Profile
            </Button>
          )}
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="w-full max-w-3xl mx-auto mt-2">
        <Tabs
          defaultValue="about"
          value={activeTab}
          onValueChange={setActiveTab}
        >
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="about">ABOUT</TabsTrigger>
            <TabsTrigger value="blogs">BLOGS</TabsTrigger>
          </TabsList>

          {/* About Tab Content */}
          <TabsContent value="about" className="mt-6">
            <div className="space-y-6">
              {profile.briefBio && (
                <div className="mb-6">
                  <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">
                    {profile.briefBio}
                  </p>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Personal Info Card */}
                <div className="rounded-lg border dark:border-[#333333] overflow-hidden">
                  <div className="p-5">
                    <div className="flex items-center gap-2 mb-4">
                      <User className="w-5 h-5 text-gray-700 dark:text-gray-300" />
                      <h3 className="font-semibold text-base">Personal Info</h3>
                    </div>

                    <div className="space-y-4">
                      {profile.gender && (
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">
                            Gender
                          </span>
                          <span className="font-medium capitalize">
                            {profile.gender}
                          </span>
                        </div>
                      )}

                      {profile.age && (
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">
                            Age
                          </span>
                          <span className="font-medium">
                            {profile.age} years
                          </span>
                        </div>
                      )}

                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">
                          Preferred Communication
                        </span>
                        <span className="font-medium capitalize">
                          {profile.preferredCommunication.replace('-', ' ')}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Activity Card */}
                <div className="rounded-lg border dark:border-[#333333] overflow-hidden">
                  <div className="p-5">
                    <div className="flex items-center gap-2 mb-4">
                      <Globe className="w-5 h-5 text-gray-700 dark:text-gray-300" />
                      <h3 className="font-semibold text-base">Activity</h3>
                    </div>

                    <div className="space-y-4">
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">
                          Member Since
                        </span>
                        <span className="font-medium">{getMemberSince()}</span>
                      </div>

                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">
                          Blog Posts
                        </span>
                        <span className="font-medium">{blogs.length}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Blogs Tab Content */}
          <TabsContent value="blogs" className="mt-6">
            <div className="space-y-6">
              <h3 className="text-lg font-medium mb-4">
                {blogs.length > 0 ? 'Published Blog Posts' : 'No Blogs Yet'}
              </h3>

              {blogs.length === 0 ? (
                <div className="text-center py-10 text-gray-500">
                  <p className="mb-2">
                    This user hasn't published any blog posts yet.
                  </p>
                  {isOwnProfile && (
                    <Button
                      onClick={() => router.push('/blogs/create')}
                      className="mt-2"
                    >
                      Create Your First Blog
                    </Button>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {blogs.map(blog => (
                    <div
                      key={blog._id}
                      className="rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden group cursor-pointer hover:shadow-md transition-all duration-200"
                      onClick={() => router.push(`/blogs/${blog._id}`)}
                    >
                      {blog.blogImage && (
                        <div className="w-full h-48 overflow-hidden">
                          <img
                            src={blog.blogImage}
                            alt={blog.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        </div>
                      )}
                      <div className="p-4">
                        <div className="flex justify-between items-center mb-2">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">{blog.category}</Badge>
                            <div className="flex items-center text-xs text-gray-500">
                              <Clock className="w-3 h-3 mr-1" />
                              {blog.readTime} min read
                            </div>
                          </div>
                          {blog.isOwner && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="p-1 h-auto"
                              onClick={e => {
                                e.stopPropagation();
                                router.push(`/blogs/edit/${blog._id}`);
                              }}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                        <h3 className="font-semibold text-lg mb-2 group-hover:text-blue-500 transition-colors">
                          {blog.title}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-3">
                          {blog.content
                            .replace(/<[^>]*>/g, '')
                            .substring(0, 120)}
                          ...
                        </p>
                        <div className="flex items-center justify-between">
                          <div className="text-xs text-gray-500">
                            {blog.publishDate}
                          </div>
                          {!blog.isOwner && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="p-1 h-auto"
                              onClick={e => {
                                e.stopPropagation();
                                toast.success('Blog saved to bookmarks');
                              }}
                            >
                              <Bookmark className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default UserProfileView;
