// File: /app/api/dashboard/admin/route.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import connectDB from '@/db/db';
import User from '@/models/User';
import Psychologist, { IPsychologist } from '@/models/Psychologist';
import Appointment from '@/models/Appointment';
import Blog from '@/models/Blogs';
import Article from '@/models/Articles';
import Conversation from '@/models/Conversation';
import Payment from '@/models/Payment';
import { createSuccessResponse, createErrorResponse } from '@/lib/response';
import { withAuth } from '@/middleware/authMiddleware';
import { Types } from 'mongoose';

// Define interfaces for data objects used in the dashboard
interface IUser {
  _id?: Types.ObjectId;
  email: string;
  role: 'admin' | 'psychologist' | 'user';
  isVerified: boolean;
  createdAt: Date;
}

interface IArticle {
  _id?: Types.ObjectId;
  title?: string;
  author?: string;
  createdAt?: Date;
  updatedAt?: Date;
  isPublished?: boolean;
}

interface IBlog {
  _id?: Types.ObjectId;
  title?: string;
  author?: string;
  createdAt?: Date;
  updatedAt?: Date;
  isPublished?: boolean;
}

interface IPayment {
  _id?: Types.ObjectId;
  amount?: number;
  purpose?: string;
  status?: string;
  createdAt?: Date;
}

interface SystemActivity {
  id: string;
  type: string;
  title: string;
  description: string;
  status: string;
  timestamp: Date;
}

interface MonthlyUserData {
  month: string;
  monthYear: string;
  users: number;
  psychologists: number;
  totalUsers: number;
}

interface MonthlyRevenueData {
  month: string;
  monthYear: string;
  revenue: number;
  transactions: number;
}

export async function GET(req: NextRequest) {
  return withAuth(
    async (req: NextRequest, token: any) => {
      try {
        await connectDB();
        console.log('Connected to database for admin dashboard metrics');

        // Check if user is admin
        if (token.role !== 'admin') {
          return NextResponse.json(
            createErrorResponse(
              403,
              'Access denied. Admin privileges required.'
            ),
            { status: 403 }
          );
        }

        // Get system overview statistics with proper error handling
        let totalUsers = 0;
        let totalPsychologists = 0;
        let pendingPsychologists = 0;
        let totalAppointments = 0;
        let completedAppointments = 0;
        let totalArticles = 0;
        let totalBlogs = 0;
        let totalPayments = 0;
        let totalRevenue = 0;
        let activeConversations = 0;

        try {
          // Use Promise.allSettled for better error handling
          const stats = await Promise.allSettled([
            User.countDocuments({ role: 'user' }).exec(),
            Psychologist.countDocuments({}).exec(),
            Psychologist.countDocuments({ approvalStatus: 'pending' }).exec(),
            Appointment.countDocuments({}).exec(),
            Appointment.countDocuments({ status: 'completed' }).exec(),
            Article.countDocuments({}).exec(),
            Blog.countDocuments({}).exec(),
            Payment.countDocuments({ status: 'completed' }).exec(),
            Conversation.countDocuments({ status: 'active' }).exec(),
          ]);

          // Safely extract values
          if (stats[0].status === 'fulfilled') totalUsers = stats[0].value || 0;
          if (stats[1].status === 'fulfilled')
            totalPsychologists = stats[1].value || 0;
          if (stats[2].status === 'fulfilled')
            pendingPsychologists = stats[2].value || 0;
          if (stats[3].status === 'fulfilled')
            totalAppointments = stats[3].value || 0;
          if (stats[4].status === 'fulfilled')
            completedAppointments = stats[4].value || 0;
          if (stats[5].status === 'fulfilled')
            totalArticles = stats[5].value || 0;
          if (stats[6].status === 'fulfilled') totalBlogs = stats[6].value || 0;
          if (stats[7].status === 'fulfilled')
            totalPayments = stats[7].value || 0;
          if (stats[8].status === 'fulfilled')
            activeConversations = stats[8].value || 0;
        } catch (error) {
          console.error('Error fetching statistics:', error);
        }

        // Get total revenue
        try {
          const payments = await Payment.find({ status: 'completed' }).lean();
          totalRevenue = payments.reduce(
            (total, payment) => total + (payment?.amount || 0),
            0
          );
        } catch (error) {
          console.error('Error calculating revenue:', error);
        }

        // Get recent user signups (last 10)
        const recentUsers: Array<{
          id: string;
          email: string;
          role: string;
          isVerified: boolean;
          createdAt: Date;
        }> = [];

        try {
          const users = await User.find({})
            .sort({ createdAt: -1 })
            .limit(10)
            .lean<IUser[]>();

          users.forEach(user => {
            if (user) {
              recentUsers.push({
                id: user._id ? user._id.toString() : `temp-${Date.now()}`,
                email: user.email || 'unknown@email.com',
                role: user.role || 'user',
                isVerified: !!user.isVerified,
                createdAt: user.createdAt || new Date(),
              });
            }
          });
        } catch (error) {
          console.error('Error fetching recent users:', error);
        }

        // Get pending psychologist approvals
        const pendingApprovals: Array<{
          id: string;
          name: string;
          email: string;
          specializations: string[];
          experience: number;
          appliedAt: Date;
        }> = [];

        try {
          const psychologists = await Psychologist.find({
            approvalStatus: 'pending',
          })
            .sort({ createdAt: -1 })
            .limit(5)
            .select(
              'firstName lastName email createdAt specializations yearsOfExperience'
            )
            .lean<Partial<IPsychologist>[]>();

          psychologists.forEach(psych => {
            if (psych) {
              pendingApprovals.push({
                id: psych._id ? psych._id.toString() : `temp-${Date.now()}`,
                name:
                  `${psych.firstName || ''} ${psych.lastName || ''}`.trim() ||
                  'Unknown Name',
                email: psych.email || 'unknown@email.com',
                specializations: psych.specializations || [],
                experience: psych.yearsOfExperience || 0,
                appliedAt: psych.createdAt || new Date(),
              });
            }
          });
        } catch (error) {
          console.error('Error fetching pending approvals:', error);
        }

        // Get recent activities
        let recentActivities: SystemActivity[] = [];
        try {
          recentActivities = await getRecentSystemActivities();
        } catch (error) {
          console.error('Error fetching recent activities:', error);
        }

        // Get content statistics
        let publishedArticles = 0;
        let draftArticles = 0;
        let publishedBlogs = 0;
        let draftBlogs = 0;

        try {
          publishedArticles =
            (await Article.countDocuments({ isPublished: true }).exec()) || 0;
          draftArticles =
            (await Article.countDocuments({ isPublished: false }).exec()) || 0;
        } catch (error) {
          console.error('Error counting article stats:', error);
        }

        try {
          publishedBlogs =
            (await Blog.countDocuments({ isPublished: true }).exec()) || 0;
          draftBlogs =
            (await Blog.countDocuments({ isPublished: false }).exec()) || 0;
        } catch (error) {
          console.error('Error counting blog stats:', error);
        }

        // Get appointment statistics
        let scheduledAppointments = 0;
        let canceledAppointments = 0;

        try {
          scheduledAppointments =
            (await Appointment.countDocuments({
              status: 'scheduled',
            }).exec()) || 0;
        } catch (error) {
          console.error('Error counting scheduled appointments:', error);
        }

        try {
          canceledAppointments =
            (await Appointment.countDocuments({ status: 'canceled' }).exec()) ||
            0;
        } catch (error) {
          console.error('Error counting canceled appointments:', error);
        }

        // Get monthly user growth
        let userGrowthData: {
          month: string;
          users: number;
          psychologists: number;
          totalUsers: number;
        }[] = [];
        try {
          userGrowthData = await getUserGrowthData();
        } catch (error) {
          console.error('Error getting user growth data:', error);
          userGrowthData = generateFallbackGrowthData();
        }

        // Get revenue data
        let revenueData: {
          month: string;
          revenue: number;
          transactions: number;
        }[] = [];
        try {
          revenueData = await getRevenueData();
        } catch (error) {
          console.error('Error getting revenue data:', error);
          revenueData = generateFallbackRevenueData();
        }

        // Create the dashboard data object
        const dashboardData = {
          systemStats: {
            totalUsers,
            totalPsychologists,
            pendingPsychologists,
            totalAppointments,
            totalArticles,
            totalBlogs,
            totalPayments,
            totalRevenue,
            activeConversations,
          },
          recentUsers,
          pendingApprovals,
          recentActivities,
          userGrowthData,
          revenueData,
          contentStats: {
            articles: {
              total: totalArticles,
              published: publishedArticles,
              draft: draftArticles,
            },
            blogs: {
              total: totalBlogs,
              published: publishedBlogs,
              draft: draftBlogs,
            },
          },
          appointmentStats: {
            total: totalAppointments,
            completed: completedAppointments,
            scheduled: scheduledAppointments,
            canceled: canceledAppointments,
          },
        };

        return NextResponse.json(createSuccessResponse(200, dashboardData), {
          status: 200,
        });
      } catch (error: any) {
        console.error('Error fetching admin dashboard data:', error);
        return NextResponse.json(
          createErrorResponse(500, error.message || 'Internal Server Error'),
          { status: 500 }
        );
      }
    },
    req,
    ['admin'] // Only allow admins
  );
}

// Get recent system activities with proper type safety
async function getRecentSystemActivities(): Promise<SystemActivity[]> {
  try {
    const activities: SystemActivity[] = [];

    // Get recent user registrations
    try {
      const recentRegistrations = await User.find({})
        .sort({ createdAt: -1 })
        .limit(5)
        .select('email role createdAt isVerified')
        .lean<IUser[]>();

      recentRegistrations.forEach(user => {
        if (user) {
          activities.push({
            id: user._id ? user._id.toString() : `reg-${Date.now()}`,
            type: 'registration',
            title: 'New User Registration',
            description: `${user.email || 'Unknown email'} registered as ${user.role || 'user'}`,
            status: user.isVerified ? 'verified' : 'pending',
            timestamp: user.createdAt || new Date(),
          });
        }
      });
    } catch (error) {
      console.error('Error getting recent registrations:', error);
    }

    // Get recent psychologist status changes
    try {
      const recentPsychologistUpdates = await Psychologist.find({
        $or: [{ approvalStatus: 'approved' }, { approvalStatus: 'rejected' }],
      })
        .sort({ updatedAt: -1 })
        .limit(5)
        .select('firstName lastName email approvalStatus approvedAt rejectedAt')
        .lean<Partial<IPsychologist>[]>();

      recentPsychologistUpdates.forEach(psych => {
        if (psych) {
          activities.push({
            id: psych._id ? psych._id.toString() : `psych-${Date.now()}`,
            type: 'approval',
            title: `Psychologist ${
              psych.approvalStatus === 'approved' ? 'Approved' : 'Rejected'
            }`,
            description: `${psych.firstName || ''} ${psych.lastName || ''} (${psych.email || 'Unknown'})`,
            status: psych.approvalStatus || 'unknown',
            timestamp:
              (psych.approvalStatus === 'approved'
                ? psych.approvedAt
                : psych.rejectedAt) || new Date(),
          });
        }
      });
    } catch (error) {
      console.error('Error getting recent psychologist updates:', error);
    }

    // Get recent content publications
    try {
      const recentArticles = await Article.find({ isPublished: true })
        .sort({ updatedAt: -1 })
        .limit(5)
        .select('title author createdAt updatedAt')
        .lean<IArticle[]>();

      recentArticles.forEach(article => {
        if (article) {
          activities.push({
            id: article._id ? article._id.toString() : `article-${Date.now()}`,
            type: 'article',
            title: 'Article Published',
            description: article.title || 'Untitled Article',
            status: 'published',
            timestamp: article.updatedAt || article.createdAt || new Date(),
          });
        }
      });
    } catch (error) {
      console.error('Error getting recent articles:', error);
    }

    try {
      const recentBlogs = await Blog.find({ isPublished: true })
        .sort({ updatedAt: -1 })
        .limit(5)
        .select('title author createdAt updatedAt')
        .lean<IBlog[]>();

      recentBlogs.forEach(blog => {
        if (blog) {
          activities.push({
            id: blog._id ? blog._id.toString() : `blog-${Date.now()}`,
            type: 'blog',
            title: 'Blog Published',
            description: blog.title || 'Untitled Blog',
            status: 'published',
            timestamp: blog.updatedAt || blog.createdAt || new Date(),
          });
        }
      });
    } catch (error) {
      console.error('Error getting recent blogs:', error);
    }

    // Get recent completed payments
    try {
      const recentPayments = await Payment.find({ status: 'completed' })
        .sort({ createdAt: -1 })
        .limit(5)
        .lean<IPayment[]>();

      recentPayments.forEach(payment => {
        if (payment) {
          activities.push({
            id: payment._id ? payment._id.toString() : `payment-${Date.now()}`,
            type: 'payment',
            title: 'Payment Received',
            description: `$${(payment.amount || 0).toFixed(2)} for ${payment.purpose || 'services'}`,
            status: payment.status || 'completed',
            timestamp: payment.createdAt || new Date(),
          });
        }
      });
    } catch (error) {
      console.error('Error getting recent payments:', error);
    }

    // Sort by timestamp (newest first) and return the top 10
    return activities
      .sort(
        (a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      )
      .slice(0, 10);
  } catch (error) {
    console.error('Error getting system activities:', error);
    return [];
  }
}

// Get user growth data with proper type safety
async function getUserGrowthData() {
  try {
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    sixMonthsAgo.setDate(1);
    sixMonthsAgo.setHours(0, 0, 0, 0);

    const users = await User.find({
      createdAt: { $gte: sixMonthsAgo },
    }).lean<IUser[]>();

    // Initialize monthly data
    const monthlyData: MonthlyUserData[] = [];
    for (let i = 0; i < 6; i++) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const year = date.getFullYear();
      const month = date.getMonth();

      const monthName = new Date(year, month, 1).toLocaleString('default', {
        month: 'short',
      });

      const monthYear = `${monthName} ${year}`;

      monthlyData.unshift({
        month: monthName,
        monthYear: monthYear,
        users: 0,
        psychologists: 0,
        totalUsers: 0,
      });
    }

    // Calculate user growth by month
    users.forEach(user => {
      if (!user || !user.createdAt) return;

      try {
        const userDate = new Date(user.createdAt);
        const userMonth = userDate.toLocaleString('default', {
          month: 'short',
        });
        const userYear = userDate.getFullYear();
        const userMonthYear = `${userMonth} ${userYear}`;

        const monthData = monthlyData.find(m => m.monthYear === userMonthYear);
        if (monthData) {
          if (user.role === 'psychologist') {
            monthData.psychologists += 1;
          } else if (user.role === 'user') {
            monthData.users += 1;
          }
          monthData.totalUsers += 1;
        }
      } catch (err) {
        console.error('Error processing user data:', err);
      }
    });

    // Return just what the frontend expects
    return monthlyData.map(({ month, users, psychologists, totalUsers }) => ({
      month,
      users,
      psychologists,
      totalUsers,
    }));
  } catch (error) {
    console.error('Error getting user growth data:', error);
    return generateFallbackGrowthData();
  }
}

// Get revenue data with proper type safety
async function getRevenueData() {
  try {
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    sixMonthsAgo.setDate(1);
    sixMonthsAgo.setHours(0, 0, 0, 0);

    const payments = await Payment.find({
      createdAt: { $gte: sixMonthsAgo },
      status: 'completed',
    }).lean<IPayment[]>();

    // Initialize monthly data
    const monthlyData: MonthlyRevenueData[] = [];
    for (let i = 0; i < 6; i++) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const year = date.getFullYear();
      const month = date.getMonth();

      const monthName = new Date(year, month, 1).toLocaleString('default', {
        month: 'short',
      });

      const monthYear = `${monthName} ${year}`;

      monthlyData.unshift({
        month: monthName,
        monthYear: monthYear,
        revenue: 0,
        transactions: 0,
      });
    }

    // Calculate revenue by month
    payments.forEach(payment => {
      if (!payment || !payment.createdAt) return;

      try {
        const paymentDate = new Date(payment.createdAt);
        const paymentMonth = paymentDate.toLocaleString('default', {
          month: 'short',
        });
        const paymentYear = paymentDate.getFullYear();
        const paymentMonthYear = `${paymentMonth} ${paymentYear}`;

        const monthData = monthlyData.find(
          m => m.monthYear === paymentMonthYear
        );
        if (monthData) {
          monthData.revenue += payment.amount || 0;
          monthData.transactions += 1;
        }
      } catch (err) {
        console.error('Error processing payment data:', err);
      }
    });

    // Return just what the frontend expects
    return monthlyData.map(({ month, revenue, transactions }) => ({
      month,
      revenue,
      transactions,
    }));
  } catch (error) {
    console.error('Error getting revenue data:', error);
    return generateFallbackRevenueData();
  }
}

// Fallback data generators
function generateFallbackGrowthData() {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
  return months.map(month => ({
    month,
    users: Math.floor(Math.random() * 20),
    psychologists: Math.floor(Math.random() * 5),
    totalUsers: Math.floor(Math.random() * 25),
  }));
}

function generateFallbackRevenueData() {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
  return months.map(month => ({
    month,
    revenue: Math.floor(Math.random() * 1000),
    transactions: Math.floor(Math.random() * 20),
  }));
}
