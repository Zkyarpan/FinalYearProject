'use client';

import { useEffect, useState } from 'react';
import {
  Users,
  User,
  FileText,
  BookOpen,
  BarChart2,
  Calendar,
  Clock,
  MessageCircle,
  CreditCard,
  CheckCircle,
  XCircle,
  Search,
  Settings,
  ChevronRight,
  AlertCircle,
  List,
  Clipboard,
  PieChart,
  Activity,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

// Define type for Admin Dashboard Data
interface AdminDashboardData {
  systemStats: {
    totalUsers: number;
    totalPsychologists: number;
    pendingPsychologists: number;
    totalAppointments: number;
    totalArticles: number;
    totalBlogs: number;
    totalPayments: number;
    totalRevenue: number;
    activeConversations: number;
  };
  recentUsers: Array<{
    id: string;
    email: string;
    role: string;
    isVerified: boolean;
    createdAt: string;
  }>;
  pendingApprovals: Array<{
    id: string;
    name: string;
    email: string;
    specializations: string[];
    experience: number;
    appliedAt: string;
  }>;
  recentActivities: Array<{
    id: string;
    type: string;
    title: string;
    description: string;
    status: string;
    timestamp: string;
  }>;
  userGrowthData: Array<{
    month: string;
    users: number;
    psychologists: number;
    totalUsers: number;
  }>;
  revenueData: Array<{
    month: string;
    revenue: number;
    transactions: number;
  }>;
  contentStats: {
    articles: {
      total: number;
      published: number;
      draft: number;
    };
    blogs: {
      total: number;
      published: number;
      draft: number;
    };
  };
  appointmentStats: {
    total: number;
    completed: number;
    scheduled: number;
    canceled: number;
  };
}

const AdminDashboard = () => {
  const router = useRouter();
  const [selectedTimeRange, setSelectedTimeRange] = useState('month');
  const [dashboardData, setDashboardData] = useState<AdminDashboardData | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/dashboard/admin');
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
        console.error('Error fetching admin dashboard data:', err);
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
      case 'verified':
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

  // Prepare monthly growth data for simple chart visualization
  const getUserGrowthData = () => {
    if (!dashboardData?.userGrowthData) return [];
    return dashboardData.userGrowthData.map((item, index) => ({
      x: index * (400 / (dashboardData.userGrowthData.length - 1)),
      y: 200 - (item.totalUsers / 10) * 4, // Scale down to fit in 200px height
      month: item.month,
      value: item.totalUsers,
      key: `${item.month}-${index}`,
    }));
  };

  // Prepare monthly revenue data for chart visualization
  const getRevenueData = () => {
    if (!dashboardData?.revenueData) return [];
    return dashboardData.revenueData.map((item, index) => ({
      x: index * (400 / (dashboardData.revenueData.length - 1)),
      y: 200 - (item.revenue / 1000) * 10, // Scale down to fit in 200px height
      month: item.month,
      value: item.revenue,
      key: `${item.month}-${index}`,
    }));
  };

  // Handle psychologist approval
  const handleApprove = async (id: string) => {
    try {
      const response = await fetch(`/api/psychologist/${id}/approve`, {
        method: 'PUT',
      });

      if (response.ok) {
        toast.success('Psychologist approved successfully');
        // Refresh data
        const updatedData = await response.json();
        // Update the pending approvals list
        if (dashboardData) {
          setDashboardData({
            ...dashboardData,
            pendingApprovals: dashboardData.pendingApprovals.filter(
              approval => approval.id !== id
            ),
            systemStats: {
              ...dashboardData.systemStats,
              pendingPsychologists:
                dashboardData.systemStats.pendingPsychologists - 1,
            },
          });
        }
      } else {
        const error = await response.json();
        throw new Error(
          error.ErrorMessage?.[0]?.message || 'Failed to approve psychologist'
        );
      }
    } catch (err) {
      console.error('Error approving psychologist:', err);
      toast.error(
        err instanceof Error ? err.message : 'Failed to approve psychologist'
      );
    }
  };

  // Handle psychologist rejection
  const handleReject = async (id: string) => {
    try {
      const response = await fetch(`/api/psychologist/${id}/reject`, {
        method: 'PUT',
      });

      if (response.ok) {
        toast.success('Psychologist rejected');
        // Refresh data
        const updatedData = await response.json();
        // Update the pending approvals list
        if (dashboardData) {
          setDashboardData({
            ...dashboardData,
            pendingApprovals: dashboardData.pendingApprovals.filter(
              approval => approval.id !== id
            ),
            systemStats: {
              ...dashboardData.systemStats,
              pendingPsychologists:
                dashboardData.systemStats.pendingPsychologists - 1,
            },
          });
        }
      } else {
        const error = await response.json();
        throw new Error(
          error.ErrorMessage?.[0]?.message || 'Failed to reject psychologist'
        );
      }
    } catch (err) {
      console.error('Error rejecting psychologist:', err);
      toast.error(
        err instanceof Error ? err.message : 'Failed to reject psychologist'
      );
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
          <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
            <Skeleton className="h-[100px] w-full rounded-xl" />
            <Skeleton className="h-[100px] w-full rounded-xl" />
            <Skeleton className="h-[100px] w-full rounded-xl" />
            <Skeleton className="h-[100px] w-full rounded-xl" />
          </div>
          <div className="grid gap-6 md:grid-cols-2">
            <Skeleton className="h-[300px] w-full rounded-xl" />
            <Skeleton className="h-[300px] w-full rounded-xl" />
          </div>
          <Skeleton className="h-[400px] w-full rounded-xl" />
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

  // Safely access data with fallbacks
  const data = dashboardData || {
    systemStats: {
      totalUsers: 0,
      totalPsychologists: 0,
      pendingPsychologists: 0,
      totalAppointments: 0,
      totalArticles: 0,
      totalBlogs: 0,
      totalPayments: 0,
      totalRevenue: 0,
      activeConversations: 0,
    },
    recentUsers: [],
    pendingApprovals: [],
    recentActivities: [],
    userGrowthData: Array(6)
      .fill(0)
      .map((_, i) => ({
        month: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'][i],
        users: 0,
        psychologists: 0,
        totalUsers: 0,
      })),
    revenueData: Array(6)
      .fill(0)
      .map((_, i) => ({
        month: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'][i],
        revenue: 0,
        transactions: 0,
      })),
    contentStats: {
      articles: {
        total: 0,
        published: 0,
        draft: 0,
      },
      blogs: {
        total: 0,
        published: 0,
        draft: 0,
      },
    },
    appointmentStats: {
      total: 0,
      completed: 0,
      scheduled: 0,
      canceled: 0,
    },
  };

  const userGrowthData = getUserGrowthData();
  const revenueData = getRevenueData();

  return (
    <div className="min-h-screen p-6">
      <div className="mx-auto max-w-[1200px]">
        {/* Header */}
        <div className="mb-8 flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold">Admin Dashboard</h1>
            <p className="text-sm text-gray-500">
              {new Date().toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <Input placeholder="Search..." className="w-[200px] pl-9" />
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            </div>
            <Button
              variant="outline"
              size="icon"
              onClick={() => router.push('/dashboard/admin/settings')}
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
              <FileText className="mr-2 h-4 w-4" />
              Export Report
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={() => router.push('/dashboard/admin/users')}
            >
              <Users className="mr-2 h-4 w-4" />
              Manage Users
            </Button>
          </div>
        </div>

        {/* Dashboard Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-8">
          <TabsList className="w-full justify-start bg-muted">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="users">Users & Psychologists</TabsTrigger>
            <TabsTrigger value="content">Content</TabsTrigger>
            <TabsTrigger value="appointments">Appointments</TabsTrigger>
            <TabsTrigger value="finance">Finance</TabsTrigger>
          </TabsList>

          {/* Overview Tab Content */}
          <TabsContent value="overview" className="space-y-8">
            {/* Quick Stats Grid */}
            <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
              <Card className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-medium">Total Users</h3>
                  <Users className="h-5 w-5 text-blue-500" />
                </div>
                <p className="text-2xl font-bold">
                  {data.systemStats.totalUsers}
                </p>
                <div className="flex items-center mt-2 text-xs text-gray-500">
                  <p>
                    <span className="text-green-500 font-medium">
                      +
                      {data.userGrowthData[data.userGrowthData.length - 1]
                        ?.totalUsers || 0}
                    </span>{' '}
                    this month
                  </p>
                </div>
              </Card>

              <Card className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-medium">Psychologists</h3>
                  <User className="h-5 w-5 text-purple-500" />
                </div>
                <p className="text-2xl font-bold">
                  {data.systemStats.totalPsychologists}
                </p>
                <div className="flex items-center mt-2 text-xs text-gray-500">
                  <p className="text-yellow-500 font-medium">
                    {data.systemStats.pendingPsychologists} pending approval
                  </p>
                </div>
              </Card>

              <Card className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-medium">Content</h3>
                  <FileText className="h-5 w-5 text-green-500" />
                </div>
                <p className="text-2xl font-bold">
                  {data.systemStats.totalArticles + data.systemStats.totalBlogs}
                </p>
                <div className="flex items-center mt-2 text-xs text-gray-500">
                  <p>
                    {data.systemStats.totalArticles} articles,{' '}
                    {data.systemStats.totalBlogs} blogs
                  </p>
                </div>
              </Card>

              <Card className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-medium">Revenue</h3>
                  <CreditCard className="h-5 w-5 text-green-500" />
                </div>
                <p className="text-2xl font-bold">
                  ${data.systemStats.totalRevenue.toFixed(2)}
                </p>
                <div className="flex items-center mt-2 text-xs text-gray-500">
                  <p>{data.systemStats.totalPayments} successful payments</p>
                </div>
              </Card>
            </div>

            {/* Charts Row */}
            <div className="grid gap-6 md:grid-cols-2">
              <Card className="p-6">
                <h2 className="text-lg font-semibold mb-4">User Growth</h2>
                <div className="relative h-[200px] w-full">
                  <svg className="h-full w-full">
                    <path
                      d={`M ${userGrowthData[0]?.x || 0} ${userGrowthData[0]?.y || 0} ${userGrowthData
                        .map(point => `L ${point.x} ${point.y}`)
                        .join(' ')}`}
                      fill="none"
                      stroke="#3B82F6"
                      strokeWidth="2"
                    />
                    {userGrowthData.map(point => (
                      <circle
                        key={point.key}
                        cx={point.x}
                        cy={point.y}
                        r="4"
                        fill="#3B82F6"
                      />
                    ))}
                  </svg>
                  <div className="absolute bottom-0 flex w-full justify-between text-sm text-gray-500">
                    {data.userGrowthData.map((item, idx) => (
                      <span key={`month-label-${idx}`}>{item.month}</span>
                    ))}
                  </div>
                </div>
                <div className="mt-4 flex justify-between text-sm">
                  <div className="flex items-center">
                    <span className="h-2 w-2 rounded-full bg-blue-500 mr-1"></span>
                    <span>
                      Regular Users:{' '}
                      {data.userGrowthData.reduce((a, b) => a + b.users, 0)}
                    </span>
                  </div>
                  <div className="flex items-center">
                    <span className="h-2 w-2 rounded-full bg-purple-500 mr-1"></span>
                    <span>
                      Psychologists:{' '}
                      {data.userGrowthData.reduce(
                        (a, b) => a + b.psychologists,
                        0
                      )}
                    </span>
                  </div>
                </div>
              </Card>

              <Card className="p-6">
                <h2 className="text-lg font-semibold mb-4">Revenue</h2>
                <div className="relative h-[200px] w-full">
                  <svg className="h-full w-full">
                    <path
                      d={`M ${revenueData[0]?.x || 0} ${revenueData[0]?.y || 0} ${revenueData
                        .map(point => `L ${point.x} ${point.y}`)
                        .join(' ')}`}
                      fill="none"
                      stroke="#10B981"
                      strokeWidth="2"
                    />
                    {revenueData.map(point => (
                      <circle
                        key={point.key}
                        cx={point.x}
                        cy={point.y}
                        r="4"
                        fill="#10B981"
                      />
                    ))}
                  </svg>
                  <div className="absolute bottom-0 flex w-full justify-between text-sm text-gray-500">
                    {data.revenueData.map((item, idx) => (
                      <span key={`month-label-${idx}`}>{item.month}</span>
                    ))}
                  </div>
                </div>
                <div className="mt-4 flex justify-between text-sm">
                  <div className="flex items-center">
                    <span className="h-2 w-2 rounded-full bg-green-500 mr-1"></span>
                    <span>
                      Total Revenue: $
                      {data.revenueData
                        .reduce((a, b) => a + b.revenue, 0)
                        .toFixed(2)}
                    </span>
                  </div>
                  <div className="flex items-center">
                    <span className="h-2 w-2 rounded-full bg-gray-500 mr-1"></span>
                    <span>
                      Transactions:{' '}
                      {data.revenueData.reduce((a, b) => a + b.transactions, 0)}
                    </span>
                  </div>
                </div>
              </Card>
            </div>

            {/* Pending Approvals and Recent Activity */}
            <div className="grid gap-6 md:grid-cols-2">
              <Card className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-semibold">Pending Approvals</h2>
                  {data.systemStats.pendingPsychologists > 0 && (
                    <Badge
                      variant="outline"
                      className="bg-yellow-100 text-yellow-700 border-yellow-200"
                    >
                      {data.systemStats.pendingPsychologists} Pending
                    </Badge>
                  )}
                </div>

                {data.pendingApprovals.length === 0 ? (
                  <div className="text-center py-8">
                    <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                    <p className="text-lg text-gray-500">
                      No pending approvals
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {data.pendingApprovals.map(approval => (
                      <div key={approval.id} className="border rounded-lg p-4">
                        <div className="flex justify-between mb-2">
                          <h3 className="font-medium">{approval.name}</h3>
                          <Badge className="bg-yellow-100 text-yellow-700 border-yellow-200">
                            Pending
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">
                          {approval.email}
                        </p>
                        <div className="mb-2">
                          <span className="text-xs text-gray-500">
                            Specializations:{' '}
                          </span>
                          <span className="text-sm">
                            {approval.specializations.slice(0, 3).join(', ')}
                            {approval.specializations.length > 3 && '...'}
                          </span>
                        </div>
                        <div className="mb-3">
                          <span className="text-xs text-gray-500">
                            Experience:{' '}
                          </span>
                          <span className="text-sm">
                            {approval.experience} years
                          </span>
                        </div>
                        <div className="mb-3">
                          <span className="text-xs text-gray-500">
                            Applied:{' '}
                          </span>
                          <span className="text-sm">
                            {formatDate(approval.appliedAt)}
                          </span>
                        </div>
                        <div className="flex gap-2 mt-2">
                          <Button
                            size="sm"
                            className="w-full"
                            onClick={() => handleApprove(approval.id)}
                          >
                            <CheckCircle className="h-4 w-4 mr-1" /> Approve
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full"
                            onClick={() => handleReject(approval.id)}
                          >
                            <XCircle className="h-4 w-4 mr-1" /> Reject
                          </Button>
                        </div>
                      </div>
                    ))}
                    {data.systemStats.pendingPsychologists >
                      data.pendingApprovals.length && (
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={() =>
                          router.push('/dashboard/admin/psychologists/pending')
                        }
                      >
                        View All Pending Approvals
                      </Button>
                    )}
                  </div>
                )}
              </Card>

              <Card className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-semibold">Recent Activity</h2>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => router.push('/dashboard/admin/activity')}
                  >
                    View All
                  </Button>
                </div>

                {data.recentActivities.length === 0 ? (
                  <div className="text-center py-8">
                    <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-lg text-gray-500">No recent activity</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {data.recentActivities.map(activity => (
                      <div
                        key={activity.id}
                        className="flex items-start space-x-3 pb-3 border-b last:border-0"
                      >
                        <div
                          className={`p-2 rounded-full ${
                            activity.type === 'registration'
                              ? 'bg-blue-100 text-blue-600'
                              : activity.type === 'approval'
                                ? 'bg-purple-100 text-purple-600'
                                : activity.type === 'article' ||
                                    activity.type === 'blog'
                                  ? 'bg-green-100 text-green-600'
                                  : activity.type === 'payment'
                                    ? 'bg-emerald-100 text-emerald-600'
                                    : 'bg-gray-100 text-gray-600'
                          }`}
                        >
                          {activity.type === 'registration' ? (
                            <User className="h-4 w-4" />
                          ) : activity.type === 'approval' ? (
                            <CheckCircle className="h-4 w-4" />
                          ) : activity.type === 'article' ? (
                            <FileText className="h-4 w-4" />
                          ) : activity.type === 'blog' ? (
                            <BookOpen className="h-4 w-4" />
                          ) : activity.type === 'payment' ? (
                            <CreditCard className="h-4 w-4" />
                          ) : (
                            <Activity className="h-4 w-4" />
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="flex justify-between items-start">
                            <p className="font-medium text-sm">
                              {activity.title}
                            </p>
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
            </div>
          </TabsContent>

          {/* Users Tab Content */}
          <TabsContent value="users" className="space-y-8">
            <div className="grid gap-6 grid-cols-1 md:grid-cols-2">
              <Card className="p-6">
                <h2 className="text-lg font-semibold mb-4">User Statistics</h2>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span>Total Users</span>
                    <span className="font-bold">
                      {data.systemStats.totalUsers}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Regular Users</span>
                    <span className="font-bold">
                      {data.systemStats.totalUsers -
                        data.systemStats.totalPsychologists}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Psychologists</span>
                    <span className="font-bold">
                      {data.systemStats.totalPsychologists}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Pending Approvals</span>
                    <span className="font-bold text-yellow-500">
                      {data.systemStats.pendingPsychologists}
                    </span>
                  </div>
                </div>
                <div className="mt-4">
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => router.push('/dashboard/admin/users')}
                  >
                    Manage Users
                  </Button>
                </div>
              </Card>

              <Card className="p-6">
                <h2 className="text-lg font-semibold mb-4">
                  Recent Registrations
                </h2>
                <div className="space-y-3">
                  {data.recentUsers.length === 0 ? (
                    <p className="text-center text-gray-500 py-4">
                      No recent registrations
                    </p>
                  ) : (
                    data.recentUsers.slice(0, 5).map(user => (
                      <div
                        key={user.id}
                        className="flex justify-between items-center border-b pb-2"
                      >
                        <div>
                          <p className="font-medium text-sm">{user.email}</p>
                          <div className="flex items-center gap-2">
                            <Badge
                              variant="outline"
                              className="text-xs capitalize"
                            >
                              {user.role}
                            </Badge>
                            {user.isVerified ? (
                              <Badge className="bg-green-100 text-green-700 text-xs">
                                Verified
                              </Badge>
                            ) : (
                              <Badge className="bg-yellow-100 text-yellow-700 text-xs">
                                Unverified
                              </Badge>
                            )}
                          </div>
                        </div>
                        <p className="text-xs text-gray-500">
                          {formatDate(user.createdAt)}
                        </p>
                      </div>
                    ))
                  )}
                </div>
                <div className="mt-4">
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => router.push('/dashboard/admin/users')}
                  >
                    View All Users
                  </Button>
                </div>
              </Card>
            </div>

            <Card className="p-6">
              <h2 className="text-lg font-semibold mb-4">
                Pending Psychologist Approvals
              </h2>

              {data.pendingApprovals.length === 0 ? (
                <div className="text-center py-8">
                  <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                  <p className="text-lg text-gray-500">No pending approvals</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Specializations</TableHead>
                      <TableHead>Experience</TableHead>
                      <TableHead>Applied On</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.pendingApprovals.map(approval => (
                      <TableRow key={approval.id}>
                        <TableCell className="font-medium">
                          {approval.name}
                        </TableCell>
                        <TableCell>{approval.email}</TableCell>
                        <TableCell>
                          {approval.specializations.slice(0, 2).join(', ')}
                          {approval.specializations.length > 2 && '...'}
                        </TableCell>
                        <TableCell>{approval.experience} years</TableCell>
                        <TableCell>{formatDate(approval.appliedAt)}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-8"
                              onClick={() => handleApprove(approval.id)}
                            >
                              <CheckCircle className="h-3 w-3 mr-1" /> Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-8 border-red-200 text-red-600 hover:bg-red-50"
                              onClick={() => handleReject(approval.id)}
                            >
                              <XCircle className="h-3 w-3 mr-1" /> Reject
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}

              {data.systemStats.pendingPsychologists > 0 && (
                <div className="mt-4">
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() =>
                      router.push('/dashboard/admin/psychologists/pending')
                    }
                  >
                    View All Pending Approvals
                  </Button>
                </div>
              )}
            </Card>
          </TabsContent>

          {/* Content Tab */}
          <TabsContent value="content" className="space-y-8">
            <div className="grid gap-6 grid-cols-1 md:grid-cols-2">
              <Card className="p-6">
                <h2 className="text-lg font-semibold mb-4">Articles</h2>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span>Total Articles</span>
                    <span className="font-bold">
                      {data.contentStats.articles.total}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Published</span>
                    <span className="font-bold text-green-600">
                      {data.contentStats.articles.published}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Drafts</span>
                    <span className="font-bold text-yellow-600">
                      {data.contentStats.articles.draft}
                    </span>
                  </div>
                </div>
                <div className="mt-4">
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => router.push('/dashboard/admin/articles')}
                  >
                    Manage Articles
                  </Button>
                </div>
              </Card>

              <Card className="p-6">
                <h2 className="text-lg font-semibold mb-4">Blogs</h2>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span>Total Blogs</span>
                    <span className="font-bold">
                      {data.contentStats.blogs.total}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Published</span>
                    <span className="font-bold text-green-600">
                      {data.contentStats.blogs.published}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Drafts</span>
                    <span className="font-bold text-yellow-600">
                      {data.contentStats.blogs.draft}
                    </span>
                  </div>
                </div>
                <div className="mt-4">
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => router.push('/dashboard/admin/blogs')}
                  >
                    Manage Blogs
                  </Button>
                </div>
              </Card>
            </div>

            <Card className="p-6">
              <h2 className="text-lg font-semibold mb-4">
                Recent Publications
              </h2>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Published</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.recentActivities
                    .filter(
                      activity =>
                        activity.type === 'article' || activity.type === 'blog'
                    )
                    .slice(0, 5)
                    .map(activity => (
                      <TableRow key={activity.id}>
                        <TableCell className="font-medium">
                          {activity.description}
                        </TableCell>
                        <TableCell className="capitalize">
                          {activity.type}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="secondary"
                            className={getStatusColor(activity.status)}
                          >
                            {activity.status}
                          </Badge>
                        </TableCell>
                        <TableCell>{formatDate(activity.timestamp)}</TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8"
                            onClick={() =>
                              router.push(
                                `/dashboard/admin/${activity.type}s/${activity.id}`
                              )
                            }
                          >
                            View
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>

              <div className="mt-4 flex gap-2">
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => router.push('/dashboard/admin/articles')}
                >
                  All Articles
                </Button>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => router.push('/dashboard/admin/blogs')}
                >
                  All Blogs
                </Button>
              </div>
            </Card>
          </TabsContent>

          {/* Additional tabs content for appointments and finance would go here */}
          <TabsContent value="appointments" className="space-y-8">
            <div className="grid gap-6 grid-cols-2 md:grid-cols-4">
              <Card className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-medium">Total</h3>
                  <Calendar className="h-5 w-5 text-blue-500" />
                </div>
                <p className="text-2xl font-bold">
                  {data.appointmentStats.total}
                </p>
              </Card>

              <Card className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-medium">Scheduled</h3>
                  <Clock className="h-5 w-5 text-yellow-500" />
                </div>
                <p className="text-2xl font-bold">
                  {data.appointmentStats.scheduled}
                </p>
              </Card>

              <Card className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-medium">Completed</h3>
                  <CheckCircle className="h-5 w-5 text-green-500" />
                </div>
                <p className="text-2xl font-bold">
                  {data.appointmentStats.completed}
                </p>
              </Card>

              <Card className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-medium">Canceled</h3>
                  <XCircle className="h-5 w-5 text-red-500" />
                </div>
                <p className="text-2xl font-bold">
                  {data.appointmentStats.canceled}
                </p>
              </Card>
            </div>

            <Card className="p-6">
              <h2 className="text-lg font-semibold mb-4">
                Appointment Management
              </h2>
              <p className="text-gray-500 mb-4">
                View and manage all appointments across the platform.
              </p>
              <Button
                onClick={() => router.push('/dashboard/admin/appointments')}
                className="w-full md:w-auto"
              >
                Go to Appointment Manager
              </Button>
            </Card>
          </TabsContent>

          <TabsContent value="finance" className="space-y-8">
            <div className="grid gap-6 grid-cols-1 md:grid-cols-2">
              <Card className="p-6">
                <h2 className="text-lg font-semibold mb-4">Revenue Overview</h2>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span>Total Revenue</span>
                    <span className="font-bold">
                      ${data.systemStats.totalRevenue.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Transactions</span>
                    <span className="font-bold">
                      {data.systemStats.totalPayments}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Average Transaction</span>
                    <span className="font-bold">
                      $
                      {data.systemStats.totalPayments > 0
                        ? (
                            data.systemStats.totalRevenue /
                            data.systemStats.totalPayments
                          ).toFixed(2)
                        : '0.00'}
                    </span>
                  </div>
                </div>
                <div className="mt-4">
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => router.push('/dashboard/admin/payments')}
                  >
                    View Payment History
                  </Button>
                </div>
              </Card>

              <Card className="p-6">
                <h2 className="text-lg font-semibold mb-4">Monthly Revenue</h2>
                <div className="relative h-[200px] w-full">
                  <svg className="h-full w-full">
                    <path
                      d={`M ${revenueData[0]?.x || 0} ${revenueData[0]?.y || 0} ${revenueData
                        .map(point => `L ${point.x} ${point.y}`)
                        .join(' ')}`}
                      fill="none"
                      stroke="#10B981"
                      strokeWidth="2"
                    />
                    {revenueData.map(point => (
                      <circle
                        key={point.key}
                        cx={point.x}
                        cy={point.y}
                        r="4"
                        fill="#10B981"
                      />
                    ))}
                  </svg>
                  <div className="absolute bottom-0 flex w-full justify-between text-sm text-gray-500">
                    {data.revenueData.map((item, idx) => (
                      <span key={`month-label-${idx}`}>{item.month}</span>
                    ))}
                  </div>
                </div>
              </Card>
            </div>

            <Card className="p-6">
              <h2 className="text-lg font-semibold mb-4">
                Recent Transactions
              </h2>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Transaction ID</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Purpose</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.recentActivities
                    .filter(activity => activity.type === 'payment')
                    .slice(0, 5)
                    .map(activity => (
                      <TableRow key={activity.id}>
                        <TableCell className="font-medium">
                          #{activity.id.slice(-6)}
                        </TableCell>
                        <TableCell className="font-medium">
                          $
                          {parseFloat(
                            activity.description.split('$')[1]
                          ).toFixed(2)}
                        </TableCell>
                        <TableCell>
                          {activity.description.split('for ')[1] || 'Services'}
                        </TableCell>
                        <TableCell>{formatDate(activity.timestamp)}</TableCell>
                        <TableCell>
                          <Badge
                            variant="secondary"
                            className={getStatusColor(activity.status)}
                          >
                            {activity.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>

              <div className="mt-4">
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => router.push('/dashboard/admin/payments')}
                >
                  View All Transactions
                </Button>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminDashboard;
