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
  Users,
  CreditCard,
  Check,
  X,
  Search,
  Settings,
  Clipboard,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useRouter } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { useUserStore } from '@/store/userStore';

// Add type definitions
interface PsychologistDashboardData {
  psychologistInfo: {
    firstName: string;
    lastName: string;
    fullName: string;
    approvalStatus: string;
    profilePhotoUrl: string | null;
    specializations: string[];
    experience: number;
    rating: number;
  };
  metrics: {
    totalAppointments: number;
    upcomingAppointments: number;
    completedAppointments: number;
    canceledAppointments: number;
    totalPatients: number;
    totalArticles: number;
    totalBlogs: number;
    totalRevenue: number;
    activeConversations: number;
  };
  recentAppointments: Array<{
    id: string;
    patientName: string;
    patientPhoto: string | null;
    date: string;
    duration: number;
    format: string;
    status: string;
    notes?: string;
  }>;
  upcomingAppointmentsList: Array<{
    id: string;
    patientName: string;
    patientPhoto: string | null;
    date: string;
    duration: number;
    format: string;
    status: string;
  }>;
  patientStats: {
    totalPatients: number;
    newPatients: number;
    returningPatients: number;
    genderDistribution: {
      male: number;
      female: number;
      other: number;
      notSpecified: number;
    };
    ageGroups: {
      under18: number;
      '18to24': number;
      '25to34': number;
      '35to44': number;
      '45to54': number;
      '55plus': number;
      notSpecified: number;
    };
  };
  recentActivities: Array<{
    id: string;
    type: string;
    title: string;
    description: string;
    timestamp: string;
    status: string;
  }>;
  monthlyEarnings: Array<{
    month: string;
    earnings: number;
    appointments: number;
  }>;
}

const PsychologistDashboard = () => {
  const router = useRouter();
  const { firstName, lastName, profileImage } = useUserStore();
  const [selectedTimeRange, setSelectedTimeRange] = useState('week');
  const [dashboardData, setDashboardData] =
    useState<PsychologistDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/dashboard/psychologist');
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
      case 'approved':
        return 'bg-green-500 text-white';
      case 'scheduled':
      case 'stable':
        return 'bg-blue-500 text-white';
      case 'draft':
      case 'upcoming':
      case 'pending':
        return 'bg-yellow-500 text-white';
      case 'canceled':
      case 'declined':
      case 'rejected':
        return 'bg-red-500 text-white';
      default:
        return 'bg-gray-500 text-white';
    }
  };

  // Prepare monthly earnings data for simple chart visualization
  const getMonthlyEarningsData = () => {
    if (!dashboardData?.monthlyEarnings) return [];

    // Add an index to make each point's key unique
    return dashboardData.monthlyEarnings.map((item, index) => ({
      x: index * (400 / (dashboardData.monthlyEarnings.length - 1)),
      y: 200 - (item.earnings / 1000) * 40, // Scale down to fit in 200px height
      month: item.month,
      value: item.earnings,
      // Add a unique identifier by combining month and index
      key: `${item.month}-${index}`,
    }));
  };

  // Prepare patient gender distribution data
  const getGenderDistribution = () => {
    if (!dashboardData?.patientStats) return [];

    const { genderDistribution } = dashboardData.patientStats;
    const total =
      genderDistribution.male +
      genderDistribution.female +
      genderDistribution.other +
      genderDistribution.notSpecified;

    return [
      {
        label: 'Male',
        value: genderDistribution.male,
        percent: Math.round((genderDistribution.male / total) * 100) || 0,
        color: '#3B82F6',
      },
      {
        label: 'Female',
        value: genderDistribution.female,
        percent: Math.round((genderDistribution.female / total) * 100) || 0,
        color: '#EC4899',
      },
      {
        label: 'Other',
        value: genderDistribution.other,
        percent: Math.round((genderDistribution.other / total) * 100) || 0,
        color: '#10B981',
      },
      {
        label: 'Not Specified',
        value: genderDistribution.notSpecified,
        percent:
          Math.round((genderDistribution.notSpecified / total) * 100) || 0,
        color: '#6B7280',
      },
    ].filter(item => item.value > 0);
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
    psychologistInfo: {
      firstName: firstName || 'Doctor',
      lastName: lastName || '',
      fullName: `Dr. ${firstName || 'Doctor'} ${lastName || ''}`,
      approvalStatus: 'approved',
      profilePhotoUrl: profileImage || null,
      specializations: [],
      experience: 0,
      rating: 0,
    },
    metrics: {
      totalAppointments: 0,
      upcomingAppointments: 0,
      completedAppointments: 0,
      canceledAppointments: 0,
      totalPatients: 0,
      totalArticles: 0,
      totalBlogs: 0,
      totalRevenue: 0,
      activeConversations: 0,
    },
    recentAppointments: [],
    upcomingAppointmentsList: [],
    patientStats: {
      totalPatients: 0,
      newPatients: 0,
      returningPatients: 0,
      genderDistribution: {
        male: 0,
        female: 0,
        other: 0,
        notSpecified: 0,
      },
      ageGroups: {
        under18: 0,
        '18to24': 0,
        '25to34': 0,
        '35to44': 0,
        '45to54': 0,
        '55plus': 0,
        notSpecified: 0,
      },
    },
    recentActivities: [],
    monthlyEarnings: Array(6)
      .fill(0)
      .map((_, i) => ({
        month: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'][i],
        earnings: 0,
        appointments: 0,
      })),
  };

  const monthlyEarningsData = getMonthlyEarningsData();
  const genderData = getGenderDistribution();

  return (
    <div className="min-h-screen p-6">
      {/* Main Content Area */}
      <div className="mx-auto max-w-[1200px]">
        {/* Header */}
        <div className="mb-8 flex items-start justify-between">
          <div className="flex items-center">
            <Avatar className="h-12 w-12 mr-4">
              <AvatarImage
                src={
                  data.psychologistInfo.profilePhotoUrl ||
                  profileImage ||
                  '/default-avatar.jpg'
                }
                alt={data.psychologistInfo.firstName || ''}
              />
              <AvatarFallback>
                {data.psychologistInfo.firstName?.charAt(0) || 'D'}
                {data.psychologistInfo.lastName?.charAt(0) || 'R'}
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-2xl font-bold main-font">
                Hello, Dr.{' '}
                {data.psychologistInfo.firstName || firstName || 'Doctor'}! 👋
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
              <CreditCard className="mr-2 h-4 w-4" />
              View Earnings
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={() => router.push('/appointments/calendar')}
            >
              <Calendar className="mr-2 h-4 w-4" />
              Schedule
            </Button>
          </div>
        </div>

        {/* Main Stats Grid */}
        <div className="mb-8 grid gap-6 lg:grid-cols-2">
          {/* Monthly Earnings */}
          <Card className="p-6">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="text-4xl font-bold">
                  ${data.metrics.totalRevenue.toFixed(2)}
                </h2>
                <p className="text-sm text-gray-500">Total Revenue</p>
              </div>
              <Button
                variant="secondary"
                className="gap-2"
                onClick={() => router.push('/dashboard/psychologist/reports')}
              >
                View Reports <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            <div className="relative h-[200px] w-full">
              <svg className="h-full w-full">
                <path
                  d={`M ${monthlyEarningsData[0]?.x || 0} ${monthlyEarningsData[0]?.y || 0} ${monthlyEarningsData
                    .map(point => `L ${point.x} ${point.y}`)
                    .join(' ')}`}
                  fill="none"
                  stroke="#3B82F6"
                  strokeWidth="2"
                />
                {monthlyEarningsData.map(point => (
                  <circle
                    key={point.key} // Use the unique key instead of index
                    cx={point.x}
                    cy={point.y}
                    r="4"
                    fill="#3B82F6"
                  />
                ))}
              </svg>
              <div className="absolute bottom-0 flex w-full justify-between text-sm text-gray-500">
                {data.monthlyEarnings.map((item, idx) => (
                  <span key={`month-label-${idx}`}>{item.month}</span> // Add unique key here too
                ))}
              </div>
            </div>
          </Card>

          {/* Patient Demographics */}
          <Card className="p-6">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="text-4xl font-bold">
                  {data.patientStats.totalPatients}
                </h2>
                <p className="text-sm text-gray-500">Total Patients</p>
              </div>
              <Button
                variant="secondary"
                className="gap-2"
                onClick={() => router.push('/patients')}
              >
                Patient List <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-lg border p-3">
                <h3 className="text-sm font-medium mb-2">New vs Returning</h3>
                <div className="flex flex-col space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">New</span>
                    <span className="text-sm font-medium">
                      {data.patientStats.newPatients}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Returning</span>
                    <span className="text-sm font-medium">
                      {data.patientStats.returningPatients}
                    </span>
                  </div>
                </div>
              </div>

              <div className="rounded-lg border p-3">
                <h3 className="text-sm font-medium mb-2">
                  Gender Distribution
                </h3>
                <div className="flex flex-col space-y-2">
                  {genderData.map(item => (
                    <div
                      key={item.label}
                      className="flex justify-between items-center"
                    >
                      <div className="flex items-center">
                        <div
                          className="w-2 h-2 rounded-full mr-2"
                          style={{ backgroundColor: item.color }}
                        ></div>
                        <span className="text-sm">{item.label}</span>
                      </div>
                      <span className="text-sm font-medium">
                        {item.percent}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Quick Stats Grid */}
        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium">Appointments</h3>
              <Calendar className="h-5 w-5 text-blue-500" />
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
              className="w-full mt-3 text-blue-500"
              size="sm"
              onClick={() => router.push('/appointments')}
            >
              View Schedule
            </Button>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium">Content</h3>
              <FileText className="h-5 w-5 text-green-500" />
            </div>
            <div className="flex items-end justify-between">
              <div>
                <p className="text-2xl font-bold">
                  {data.metrics.totalArticles}
                </p>
                <p className="text-xs text-gray-500">articles</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium">{data.metrics.totalBlogs}</p>
                <p className="text-xs text-gray-500">blogs</p>
              </div>
            </div>
            <Button
              variant="ghost"
              className="w-full mt-3 text-green-500"
              size="sm"
              onClick={() => router.push('/content')}
            >
              Manage Content
            </Button>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium">Sessions</h3>
              <Clock className="h-5 w-5 text-purple-500" />
            </div>
            <div className="flex items-end justify-between">
              <div>
                <p className="text-2xl font-bold">
                  {data.metrics.completedAppointments}
                </p>
                <p className="text-xs text-gray-500">completed</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium">
                  {data.metrics.canceledAppointments}
                </p>
                <p className="text-xs text-gray-500">canceled</p>
              </div>
            </div>
            <Button
              variant="ghost"
              className="w-full mt-3 text-purple-500"
              size="sm"
              onClick={() => router.push('/dashboard/psychologist/reports')}
            >
              View Reports
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
                {data.recentActivities.map(activity => (
                  <div
                    key={activity.id}
                    className="flex items-start gap-3 pb-4 border-b last:border-0"
                  >
                    <div
                      className={`p-2 rounded-full ${
                        activity.type === 'blog'
                          ? 'bg-blue-100 text-blue-600'
                          : activity.type === 'article'
                            ? 'bg-green-100 text-green-600'
                            : activity.type === 'appointment'
                              ? 'bg-purple-100 text-purple-600'
                              : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {activity.type === 'blog' ? (
                        <BookOpen className="h-4 w-4" />
                      ) : activity.type === 'article' ? (
                        <FileText className="h-4 w-4" />
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

          {/* Upcoming Appointments */}
          <div className="space-y-6">
            <Card className="p-6">
              <h2 className="text-lg font-semibold mb-4">
                Upcoming Appointments
              </h2>

              {data.upcomingAppointmentsList.length === 0 ? (
                <div className="text-center py-6">
                  <p className="text-gray-500">No upcoming appointments</p>
                  <Button
                    variant="outline"
                    className="mt-2"
                    onClick={() => router.push('/appointments/calendar')}
                  >
                    View Calendar
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {data.upcomingAppointmentsList.map(appointment => (
                    <div
                      key={appointment.id}
                      className="flex items-start gap-3 pb-4 border-b last:border-0"
                    >
                      <Avatar className="h-10 w-10">
                        <AvatarImage
                          src={
                            appointment.patientPhoto || '/default-avatar.jpg'
                          }
                          alt={appointment.patientName}
                        />
                        <AvatarFallback>
                          {appointment.patientName.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <h3 className="font-medium text-sm">
                          {appointment.patientName}
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

            {/* Session Statistics */}
            <Card className="p-6">
              <h2 className="text-lg font-semibold mb-4">Session Statistics</h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center mr-3">
                      <Check className="w-4 h-4 text-green-600" />
                    </div>
                    <span className="text-sm">Completed</span>
                  </div>
                  <span className="font-semibold">
                    {data.metrics.completedAppointments}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center mr-3">
                      <Calendar className="w-4 h-4 text-blue-600" />
                    </div>
                    <span className="text-sm">Upcoming</span>
                  </div>
                  <span className="font-semibold">
                    {data.metrics.upcomingAppointments}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center mr-3">
                      <X className="w-4 h-4 text-red-600" />
                    </div>
                    <span className="text-sm">Canceled</span>
                  </div>
                  <span className="font-semibold">
                    {data.metrics.canceledAppointments}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center mr-3">
                      <Users className="w-4 h-4 text-purple-600" />
                    </div>
                    <span className="text-sm">Total Patients</span>
                  </div>
                  <span className="font-semibold">
                    {data.patientStats.totalPatients}
                  </span>
                </div>
              </div>
              <Button
                className="w-full mt-4"
                variant="outline"
                onClick={() => router.push('/dashboard/psychologist/reports')}
              >
                View Detailed Analytics
              </Button>
            </Card>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-8">
          <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button
              variant="outline"
              className="flex flex-col items-center justify-center h-24 p-2"
              onClick={() => router.push('/psychologist/availability')}
            >
              <Calendar className="h-6 w-6 mb-2 text-blue-500" />
              <span className="text-sm">Schedule Appointment</span>
            </Button>

            <Button
              variant="outline"
              className="flex flex-col items-center justify-center h-24 p-2"
              onClick={() => router.push('/content/new')}
            >
              <FileText className="h-6 w-6 mb-2 text-green-500" />
              <span className="text-sm">Create Content</span>
            </Button>

            <Button
              variant="outline"
              className="flex flex-col items-center justify-center h-24 p-2"
              onClick={() => router.push('/dashboard/psychologist/reports')}
            >
              <BarChart2 className="h-6 w-6 mb-2 text-purple-500" />
              <span className="text-sm">View Reports</span>
            </Button>

            <Button
              variant="outline"
              className="flex flex-col items-center justify-center h-24 p-2"
              onClick={() => router.push('/patients')}
            >
              <Users className="h-6 w-6 mb-2 text-orange-500" />
              <span className="text-sm">Patient Records</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PsychologistDashboard;
