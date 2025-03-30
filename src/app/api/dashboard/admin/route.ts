import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import connectDB from '@/db/db';
import User from '@/models/User';
import Psychologist from '@/models/Psychologist';
import Appointment from '@/models/Appointment';
import Blog from '@/models/Blogs';
import Article from '@/models/Articles';
import Conversation from '@/models/Conversation';
import Payment from '@/models/Payment';
import { createSuccessResponse, createErrorResponse } from '@/lib/response';
import { withAuth } from '@/middleware/authMiddleware';
import { Types } from 'mongoose';

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

        // Get system overview statistics
        const [
          totalUsers,
          totalPsychologists,
          pendingPsychologists,
          totalAppointments,
          completedAppointments,
          totalArticles,
          totalBlogs,
          totalPayments,
          totalRevenue,
          activeConversations,
        ] = await Promise.all([
          User.countDocuments({ role: 'user' }),
          Psychologist.countDocuments({}),
          Psychologist.countDocuments({ approvalStatus: 'pending' }),
          Appointment.countDocuments({}),
          Appointment.countDocuments({ status: 'completed' }),
          Article.countDocuments({}),
          Blog.countDocuments({}),
          Payment.countDocuments({ status: 'completed' }),
          Payment.find({ status: 'completed' }).then(payments =>
            payments.reduce(
              (total, payment) => total + (payment.amount || 0),
              0
            )
          ),
          Conversation.countDocuments({ status: 'active' }),
        ]);

        // Get recent user signups (last 10)
        const recentUsers = await User.find({})
          .sort({ createdAt: -1 })
          .limit(10)
          .lean<
            {
              _id: Types.ObjectId;
              email: string;
              role: string;
              isVerified: boolean;
              createdAt: Date;
            }[]
          >();

        // Get pending psychologist approvals
        const pendingApprovals = await Psychologist.find({
          approvalStatus: 'pending',
        })
          .sort({ createdAt: -1 })
          .limit(5)
          .select(
            'firstName lastName email createdAt specializations yearsOfExperience'
          )
          .lean<
            {
              _id: Types.ObjectId;
              firstName: string;
              lastName: string;
              email: string;
              specializations: string[];
              yearsOfExperience: number;
              createdAt: Date;
            }[]
          >();

        // Get recent activities (combined from different sources)
        const recentActivities = await getRecentSystemActivities();

        // Get monthly user growth for the last 6 months
        const userGrowthData = await getUserGrowthData();

        // Get revenue statistics for the last 6 months
        const revenueData = await getRevenueData();

        // Get content statistics
        const contentStats = {
          articles: {
            total: totalArticles,
            published: await Article.countDocuments({ isPublished: true }),
            draft: await Article.countDocuments({ isPublished: false }),
          },
          blogs: {
            total: totalBlogs,
            published: await Blog.countDocuments({ isPublished: true }),
            draft: await Blog.countDocuments({ isPublished: false }),
          },
        };

        // Get appointment statistics
        const appointmentStats = {
          total: totalAppointments,
          completed: completedAppointments,
          scheduled: await Appointment.countDocuments({ status: 'scheduled' }),
          canceled: await Appointment.countDocuments({ status: 'canceled' }),
        };

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
          recentUsers: recentUsers.map(user => ({
            id: user._id.toString(),
            email: user.email,
            role: user.role,
            isVerified: user.isVerified,
            createdAt: user.createdAt,
          })),
          pendingApprovals: pendingApprovals.map(psych => ({
            id: psych._id.toString(),
            name: `${psych.firstName} ${psych.lastName}`,
            email: psych.email,
            specializations: psych.specializations,
            experience: psych.yearsOfExperience,
            appliedAt: psych.createdAt,
          })),
          recentActivities,
          userGrowthData,
          revenueData,
          contentStats,
          appointmentStats,
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

// Get recent system activities (registrations, approvals, content, etc.)
async function getRecentSystemActivities() {
  try {
    // Get recent user registrations
    const recentRegistrations = await User.find({})
      .sort({ createdAt: -1 })
      .limit(5)
      .select('email role createdAt isVerified')
      .lean();

    // Get recent psychologist status changes
    const recentPsychologistUpdates = await Psychologist.find({
      $or: [{ approvalStatus: 'approved' }, { approvalStatus: 'rejected' }],
    })
      .sort({ updatedAt: -1 })
      .limit(5)
      .select('firstName lastName email approvalStatus approvedAt rejectedAt')
      .lean();

    // Get recent content publications
    const recentArticles = await Article.find({ isPublished: true })
      .sort({ updatedAt: -1 })
      .limit(5)
      .select('title author createdAt updatedAt')
      .lean();

    const recentBlogs = await Blog.find({ isPublished: true })
      .sort({ updatedAt: -1 })
      .limit(5)
      .select('title author createdAt updatedAt')
      .lean();

    // Get recent completed payments
    const recentPayments = await Payment.find({ status: 'completed' })
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();

    // Format all activities in a unified way
    const activities = [
      ...recentRegistrations.map((user: any) => ({
        id: user._id.toString(),
        type: 'registration',
        title: 'New User Registration',
        description: `${user.email} registered as ${user.role}`,
        status: user.isVerified ? 'verified' : 'pending',
        timestamp: user.createdAt,
      })),
      ...recentPsychologistUpdates.map((psych: any) => ({
        id: psych._id.toString(),
        type: 'approval',
        title: `Psychologist ${
          psych.approvalStatus === 'approved' ? 'Approved' : 'Rejected'
        }`,
        description: `${psych.firstName} ${psych.lastName} (${psych.email})`,
        status: psych.approvalStatus,
        timestamp:
          psych.approvalStatus === 'approved'
            ? psych.approvedAt
            : psych.rejectedAt,
      })),
      ...recentArticles.map((article: any) => ({
        id: article._id.toString(),
        type: 'article',
        title: 'Article Published',
        description: article.title,
        status: 'published',
        timestamp: article.updatedAt,
      })),
      ...recentBlogs.map((blog: any) => ({
        id: blog._id.toString(),
        type: 'blog',
        title: 'Blog Published',
        description: blog.title,
        status: 'published',
        timestamp: blog.updatedAt,
      })),
      ...recentPayments.map((payment: any) => ({
        id: payment._id.toString(),
        type: 'payment',
        title: 'Payment Received',
        description: `$${payment.amount.toFixed(2)} for ${payment.purpose || 'services'}`,
        status: 'completed',
        timestamp: payment.createdAt,
      })),
    ];

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

// Get user growth data for the last 6 months
async function getUserGrowthData() {
  try {
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    sixMonthsAgo.setDate(1);
    sixMonthsAgo.setHours(0, 0, 0, 0);

    const users = await User.find({
      createdAt: { $gte: sixMonthsAgo },
    }).lean();

    // Initialize monthly data
    type MonthlyUserData = {
      month: string;
      monthYear: string;
      users: number;
      psychologists: number;
      totalUsers: number;
    };

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
    return [];
  }
}

// Get revenue data for the last 6 months
async function getRevenueData() {
  try {
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    sixMonthsAgo.setDate(1);
    sixMonthsAgo.setHours(0, 0, 0, 0);

    const payments = await Payment.find({
      createdAt: { $gte: sixMonthsAgo },
      status: 'completed',
    }).lean();

    // Initialize monthly data
    type MonthlyRevenueData = {
      month: string;
      monthYear: string;
      revenue: number;
      transactions: number;
    };

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
      const paymentDate = new Date(payment.createdAt);
      const paymentMonth = paymentDate.toLocaleString('default', {
        month: 'short',
      });
      const paymentYear = paymentDate.getFullYear();
      const paymentMonthYear = `${paymentMonth} ${paymentYear}`;

      const monthData = monthlyData.find(m => m.monthYear === paymentMonthYear);
      if (monthData) {
        monthData.revenue += payment.amount;
        monthData.transactions += 1;
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
    return [];
  }
}
