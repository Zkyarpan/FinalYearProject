'use client';

import { useEffect, useState } from 'react';
import {
  Bell,
  Calendar,
  ChevronRight,
  Clock,
  MessageCircle,
  FileText,
  BookOpen,
  BarChart2,
  User,
  ArrowUp,
  ArrowDown,
  Moon,
  Sun,
  Zap,
  Heart,
  Search,
  Settings,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useUserStore } from '@/store/userStore';
import { useRouter } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

// Add type definitions
interface DashboardMetrics {
  profileCompletion: number;
  totalBlogs: number;
  publishedBlogs: number;
  draftBlogs: number;
  totalStories: number;
  publishedStories: number;
  totalAppointments: number;
  upcomingAppointments: number;
  completedAppointments: number;
  activeConversations: number;
}

interface WellnessData {
  wellnessScore: number;
  moodData: { date: string; value: number }[];
  sleepData: { date: string; value: number }[];
  mindfulnessData: { date: string; value: number }[];
  stressLevel: number;
  insights: {
    title: string;
    value: string;
    change: string;
    status: 'improved' | 'declined' | 'stable';
  }[];
}

interface Activity {
  id: string;
  type: string;
  title: string;
  description: string;
  timestamp: string;
  status: string;
}

interface Appointment {
  id: string;
  providerName: string;
  providerPhoto: string | null;
  date: string;
  duration: number;
  format: string;
  status: string;
}

interface Conversation {
  id: string;
  otherUserName: string;
  otherUserPhoto: string;
  lastMessage: string;
  timestamp: string;
}

interface DashboardData {
  metrics: DashboardMetrics;
  wellnessData: WellnessData;
  recentActivities: Activity[];
  nearestAppointments: Appointment[];
  recentConversations: Conversation[];
}

const UserDashboard = () => {
  const router = useRouter();
  const { firstName, lastName, profileImage } = useUserStore();
  const [selectedTimeRange, setSelectedTimeRange] = useState('week');
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/dashboard/user');
        if (!response.ok) {
          throw new Error('Failed to fetch dashboard data');
        }

        const data = await response.json();

        if (data.IsSuccess) {
          setDashboardData(data.Result);
        } else {
          throw new Error(data.ErrorMessage?.[0]?.message || 'Unknown error');
        }
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError(
          err instanceof Error ? err.message : 'Failed to load dashboard data'
        );
        toast.error('Could not load dashboard data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  // Helper function to format date
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  // Function to get status badge color
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'published':
      case 'completed':
      case 'improved':
        return 'bg-green-500 text-white';
      case 'scheduled':
      case 'stable':
        return 'bg-blue-500 text-white';
      case 'draft':
      case 'upcoming':
        return 'bg-yellow-500 text-white';
      case 'canceled':
      case 'declined':
        return 'bg-red-500 text-white';
      default:
        return 'bg-gray-500 text-white';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen p-6">
        <div className="mx-auto max-w-[1200px] space-y-6">
          <div className="flex items-center justify-between">
            <Skeleton className="h-10 w-48" />
            <Skeleton className="h-10 w-24" />
          </div>
          <div className="grid gap-6 lg:grid-cols-2">
            <Skeleton className="h-[300px] w-full rounded-xl" />
            <Skeleton className="h-[300px] w-full rounded-xl" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Skeleton className="h-[150px] w-full rounded-xl" />
            <Skeleton className="h-[150px] w-full rounded-xl" />
            <Skeleton className="h-[150px] w-full rounded-xl" />
            <Skeleton className="h-[150px] w-full rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen p-6 flex items-center justify-center">
        <Card className="p-6 text-center max-w-md">
          <h2 className="text-xl font-bold mb-2">Error Loading Dashboard</h2>
          <p className="text-gray-500 mb-4">{error}</p>
          <Button onClick={() => window.location.reload()}>Try Again</Button>
        </Card>
      </div>
    );
  }

  // Safely access data
  const data = dashboardData || {
    metrics: {
      profileCompletion: 0,
      totalBlogs: 0,
      publishedBlogs: 0,
      draftBlogs: 0,
      totalStories: 0,
      publishedStories: 0,
      totalAppointments: 0,
      upcomingAppointments: 0,
      completedAppointments: 0,
      activeConversations: 0,
    },
    wellnessData: {
      wellnessScore: 0,
      moodData: [],
      sleepData: [],
      mindfulnessData: [],
      stressLevel: 0,
      insights: [],
    },
    recentActivities: [],
    nearestAppointments: [],
    recentConversations: [],
  };

  return (
    <div className="min-h-screen p-6">
      {/* Main Content Area */}
      <div className="mx-auto max-w-[1200px]">
        {/* Header */}
        <div className="mb-8 flex items-start justify-between">
          <div className="flex items-center">
            <Avatar className="h-12 w-12 mr-4">
              <AvatarImage
                src={profileImage || '/default-avatar.jpg'}
                alt={firstName || ''}
              />
              <AvatarFallback>
                {firstName?.charAt(0)}
                {lastName?.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-2xl font-bold main-font">
                Hello, {firstName || 'User'}! 👋
              </h1>
              <p className="text-sm text-gray-500">
                {new Date().toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <Input placeholder="Search..." className="w-[200px] pl-9" />
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            </div>
            <Button
              variant="outline"
              size="icon"
              onClick={() => router.push('/settings')}
            >
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Time Range and Actions */}
        <div className="mb-8 flex items-center justify-between">
          <Select
            value={selectedTimeRange}
            onValueChange={setSelectedTimeRange}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select time range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="day">Today</SelectItem>
              <SelectItem value="week">This Week</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
              <SelectItem value="year">This Year</SelectItem>
            </SelectContent>
          </Select>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <Clock className="mr-2 h-4 w-4" />
              Set Goals
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={() => router.push('/appointments')}
            >
              <Calendar className="mr-2 h-4 w-4" />
              Schedule
            </Button>
          </div>
        </div>

        {/* Profile Completion Bar - only shown if not 100% complete */}
        {data.metrics.profileCompletion < 100 && (
          <Card className="mb-6 p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-medium">Profile Completion</h3>
              <Button
                variant="link"
                size="sm"
                className="p-0 h-auto text-blue-500"
                onClick={() => router.push('/settings/profile')}
              >
                Complete Now
              </Button>
            </div>
            <Progress value={data.metrics.profileCompletion} className="h-2" />
            <p className="mt-2 text-xs text-gray-500">
              Complete your profile to get better recommendations and services
            </p>
          </Card>
        )}

        {/* Main Stats Grid */}
        <div className="mb-8 grid gap-6 lg:grid-cols-2">
          {/* Mental Wellness Score */}
          <Card className="p-6">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="text-4xl font-bold">
                  {data.wellnessData.wellnessScore.toFixed(1)}%
                </h2>
                <p className="text-sm text-gray-500">Mental Wellness Score</p>
              </div>
              <Button
                variant="secondary"
                className="gap-2"
                onClick={() => router.push('/wellness-tracker')}
              >
                View Details <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            <div className="relative h-[200px] w-full">
              <svg className="h-full w-full">
                <path
                  d={`M 0 ${200 - data.wellnessData.moodData[0]?.value * 1.5} ${data.wellnessData.moodData
                    .map(
                      (point, i) =>
                        `L ${i * (400 / (data.wellnessData.moodData.length - 1))} ${200 - point.value * 1.5}`
                    )
                    .join(' ')}`}
                  fill="none"
                  stroke="#5C4033"
                  strokeWidth="2"
                />
                {data.wellnessData.moodData.map((point, index) => (
                  <circle
                    key={index}
                    cx={index * (400 / (data.wellnessData.moodData.length - 1))}
                    cy={200 - point.value * 1.5}
                    r="4"
                    fill="#5C4033"
                  />
                ))}
              </svg>
              <div className="absolute bottom-0 flex w-full justify-between text-sm text-gray-500">
                {data.wellnessData.moodData.map(point => (
                  <span key={point.date}>{point.date}</span>
                ))}
              </div>
            </div>
          </Card>

          {/* Stress Level & Quick Statistics */}
          <Card className="p-6">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="text-4xl font-bold">
                  {data.wellnessData.stressLevel}%
                </h2>
                <p className="text-sm text-gray-500">Stress Level</p>
              </div>
              <Button
                variant="secondary"
                className="gap-2"
                onClick={() => router.push('/wellness-tracker')}
              >
                Manage Stress <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            <div className="grid grid-cols-3 gap-4">
              {data.wellnessData.insights.map((insight, index) => (
                <div key={index} className="rounded-lg border p-3">
                  <h3 className="text-sm font-medium mb-2">{insight.title}</h3>
                  <div className="flex justify-between items-center">
                    <span className="text-xl font-bold">{insight.value}</span>
                    <div
                      className={`flex items-center text-xs ${
                        insight.status === 'improved'
                          ? 'text-green-500'
                          : insight.status === 'declined'
                            ? 'text-red-500'
                            : 'text-yellow-500'
                      }`}
                    >
                      {insight.status === 'improved' ? (
                        <ArrowUp className="h-3 w-3 mr-1" />
                      ) : insight.status === 'declined' ? (
                        <ArrowDown className="h-3 w-3 mr-1" />
                      ) : null}
                      {insight.change}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Quick Stats Grid */}
        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium">Blog Posts</h3>
              <FileText className="h-5 w-5 text-blue-500" />
            </div>
            <div className="flex items-end justify-between">
              <div>
                <p className="text-2xl font-bold">
                  {data.metrics.publishedBlogs}
                </p>
                <p className="text-xs text-gray-500">published</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium">{data.metrics.draftBlogs}</p>
                <p className="text-xs text-gray-500">drafts</p>
              </div>
            </div>
            <Button
              variant="ghost"
              className="w-full mt-3 text-blue-500"
              size="sm"
              onClick={() => router.push('/blogs')}
            >
              View All
            </Button>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium">Stories</h3>
              <BookOpen className="h-5 w-5 text-purple-500" />
            </div>
            <div className="flex items-end justify-between">
              <div>
                <p className="text-2xl font-bold">
                  {data.metrics.publishedStories}
                </p>
                <p className="text-xs text-gray-500">shared</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium">
                  {data.metrics.totalStories - data.metrics.publishedStories}
                </p>
                <p className="text-xs text-gray-500">private</p>
              </div>
            </div>
            <Button
              variant="ghost"
              className="w-full mt-3 text-purple-500"
              size="sm"
              onClick={() => router.push('/stories')}
            >
              View All
            </Button>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium">Appointments</h3>
              <Calendar className="h-5 w-5 text-green-500" />
            </div>
            <div className="flex items-end justify-between">
              <div>
                <p className="text-2xl font-bold">
                  {data.metrics.upcomingAppointments}
                </p>
                <p className="text-xs text-gray-500">upcoming</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium">
                  {data.metrics.completedAppointments}
                </p>
                <p className="text-xs text-gray-500">completed</p>
              </div>
            </div>
            <Button
              variant="ghost"
              className="w-full mt-3 text-green-500"
              size="sm"
              onClick={() => router.push('/appointments')}
            >
              Schedule
            </Button>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium">Messages</h3>
              <MessageCircle className="h-5 w-5 text-orange-500" />
            </div>
            <div className="flex items-center justify-between">
              <p className="text-2xl font-bold">
                {data.metrics.activeConversations}
              </p>
              <p className="text-xs text-gray-500">active chats</p>
            </div>
            <Button
              variant="ghost"
              className="w-full mt-3 text-orange-500"
              size="sm"
              onClick={() => router.push('/messages')}
            >
              Go to Messages
            </Button>
          </Card>
        </div>

        {/* Recent Activity & Upcoming Appointments */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Recent Activity */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4">Recent Activity</h2>

            {data.recentActivities.length === 0 ? (
              <div className="text-center py-6">
                <p className="text-gray-500">No recent activities</p>
              </div>
            ) : (
              <div className="space-y-4">
                {data.recentActivities.map((activity, index) => (
                  <div
                    key={activity.id}
                    className="flex items-start gap-3 pb-4 border-b last:border-0"
                  >
                    <div
                      className={`p-2 rounded-full ${
                        activity.type === 'blog'
                          ? 'bg-blue-100 text-blue-600'
                          : activity.type === 'story'
                            ? 'bg-purple-100 text-purple-600'
                            : activity.type === 'appointment'
                              ? 'bg-green-100 text-green-600'
                              : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {activity.type === 'blog' ? (
                        <FileText className="h-4 w-4" />
                      ) : activity.type === 'story' ? (
                        <BookOpen className="h-4 w-4" />
                      ) : activity.type === 'appointment' ? (
                        <Calendar className="h-4 w-4" />
                      ) : (
                        <Bell className="h-4 w-4" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-start">
                        <h3 className="font-medium text-sm">
                          {activity.title}
                        </h3>
                        <Badge
                          variant="secondary"
                          className={getStatusColor(activity.status)}
                        >
                          {activity.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        {activity.description}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        {formatDate(activity.timestamp)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Upcoming Appointments & Messages */}
          <div className="space-y-6">
            <Card className="p-6">
              <h2 className="text-lg font-semibold mb-4">
                Upcoming Appointments
              </h2>

              {data.nearestAppointments.length === 0 ? (
                <div className="text-center py-6">
                  <p className="text-gray-500">No upcoming appointments</p>
                  <Button
                    variant="outline"
                    className="mt-2"
                    onClick={() => router.push('/psychologist')}
                  >
                    Find a Therapist
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {data.nearestAppointments.map(appointment => (
                    <div
                      key={appointment.id}
                      className="flex items-start gap-3 pb-4 border-b last:border-0"
                    >
                      <Avatar className="h-10 w-10">
                        <AvatarImage
                          src={
                            appointment.providerPhoto || '/default-avatar.jpg'
                          }
                          alt={appointment.providerName}
                        />
                        <AvatarFallback>
                          {appointment.providerName.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <h3 className="font-medium text-sm">
                          {appointment.providerName}
                        </h3>
                        <p className="text-sm text-gray-600 mt-1">
                          {new Date(appointment.date).toLocaleDateString(
                            'en-US',
                            {
                              weekday: 'short',
                              month: 'short',
                              day: 'numeric',
                              hour: 'numeric',
                              minute: '2-digit',
                            }
                          )}
                        </p>
                        <div className="flex items-center mt-1">
                          <Badge variant="outline" className="mr-2 text-xs">
                            {appointment.duration} min
                          </Badge>
                          <Badge
                            variant="outline"
                            className="text-xs capitalize"
                          >
                            {appointment.format}
                          </Badge>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          router.push(`/appointments/${appointment.id}`)
                        }
                      >
                        Details
                      </Button>
                    </div>
                  ))}

                  <Button
                    className="w-full"
                    variant="outline"
                    onClick={() => router.push('/appointments')}
                  >
                    View All Appointments
                  </Button>
                </div>
              )}
            </Card>

            {data.recentConversations.length > 0 && (
              <Card className="p-6">
                <h2 className="text-lg font-semibold mb-4">Recent Messages</h2>
                <div className="space-y-4">
                  {data.recentConversations.map(conversation => (
                    <div
                      key={conversation.id}
                      className="flex items-start gap-3 pb-4 border-b last:border-0"
                    >
                      <Avatar className="h-10 w-10">
                        <AvatarImage
                          src={conversation.otherUserPhoto}
                          alt={conversation.otherUserName}
                        />
                        <AvatarFallback>
                          {conversation.otherUserName.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <h3 className="font-medium text-sm">
                          {conversation.otherUserName}
                        </h3>
                        <p className="text-sm text-gray-600 mt-1 truncate">
                          {conversation.lastMessage}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          {new Date(conversation.timestamp).toLocaleTimeString(
                            'en-US',
                            {
                              hour: '2-digit',
                              minute: '2-digit',
                            }
                          )}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          router.push(`/messages/${conversation.id}`)
                        }
                      >
                        <MessageCircle className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  <Button
                    className="w-full"
                    variant="outline"
                    onClick={() => router.push('/messages')}
                  >
                    Go to Messages
                  </Button>
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserDashboard;
