'use server';

import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/db/db';
import User from '@/models/User';
import Psychologist from '@/models/Psychologist';
import Appointment from '@/models/Appointment';
import Article from '@/models/Articles';
import Blog from '@/models/Blogs';
import Conversation from '@/models/Conversation';
import Payment from '@/models/Payment';
import { createSuccessResponse, createErrorResponse } from '@/lib/response';
import { withAuth } from '@/middleware/authMiddleware';

export async function GET(req: NextRequest) {
  return withAuth(
    async (req: NextRequest, token: any) => {
      try {
        await connectDB();
        console.log('Connected to database for admin dashboard metrics');

        // Fetch counts for all entity types
        const [
          totalUsers,
          totalPsychologists,
          pendingPsychologists,
          totalAppointments,
          completedAppointments,
          canceledAppointments,
          totalArticles,
          totalBlogs,
          totalPayments,
          activeConversations,
        ] = await Promise.all([
          User.countDocuments(),
          Psychologist.countDocuments(),
          Psychologist.countDocuments({ approvalStatus: 'pending' }),
          Appointment.countDocuments(),
          Appointment.countDocuments({ status: 'completed' }),
          Appointment.countDocuments({ status: 'canceled' }),
          Article.countDocuments(),
          Blog.countDocuments(),
          Payment.countDocuments(),
          Conversation.countDocuments({ status: 'active' }),
        ]);

        // Calculate total revenue
        const paymentsData = await Payment.find().select('amount');
        const totalRevenue = paymentsData.reduce(
          (total, payment) => total + (payment.amount || 0),
          0
        );

        // Get recent activities (last 10)
        // This would combine recent appointments, registrations, payments, etc.
        const recentActivities = await getRecentActivities();

        const dashboardData = {
          metrics: {
            totalUsers,
            totalPsychologists,
            pendingPsychologists,
            totalAppointments,
            completedAppointments,
            canceledAppointments,
            totalArticles,
            totalBlogs,
            totalRevenue,
            activeConversations,
          },
          recentActivities,
        };

        return NextResponse.json(createSuccessResponse(200, dashboardData), {
          status: 200,
        });
      } catch (error: any) {
        console.error('Error fetching dashboard data:', error);
        return NextResponse.json(
          createErrorResponse(500, error.message || 'Internal Server Error'),
          { status: 500 }
        );
      }
    },
    req,
    ['admin']
  );
}

async function getRecentActivities() {
  // Get recent user registrations
  const recentUsers = await User.find()
    .sort({ createdAt: -1 })
    .limit(3)
    .select('firstName lastName email createdAt')
    .lean<
      {
        _id: any;
        firstName: string;
        lastName: string;
        email: string;
        createdAt: Date;
      }[]
    >();

  // Get recent psychologist registrations
  const recentPsychologists = await Psychologist.find()
    .sort({ createdAt: -1 })
    .limit(3)
    .select('firstName lastName approvalStatus createdAt')
    .lean<
      {
        _id: any;
        firstName: string;
        lastName: string;
        approvalStatus: string;
        createdAt: Date;
      }[]
    >();

  // Get recent appointments
  const recentAppointments = await Appointment.find()
    .sort({ createdAt: -1 })
    .limit(3)
    .populate<{
      userId: { firstName: string };
      psychologistId: { firstName: string };
    }>('userId', 'firstName lastName')
    .populate('psychologistId', 'firstName lastName')
    .select('status startTime duration createdAt')
    .lean();

  // Get recent payments
  const recentPayments = await Payment.find()
    .sort({ createdAt: -1 })
    .limit(3)
    .populate('userId', 'firstName lastName')
    .select('amount status createdAt')
    .lean<
      {
        _id: any;
        amount: number;
        status: string;
        createdAt: Date;
        userId: { firstName: string };
      }[]
    >();

  // Format the data into a unified format
  const activities = [
    ...recentUsers.map(user => ({
      id: user._id.toString(),
      type: 'registration',
      title: 'New User Registration',
      description: `${user.firstName} ${user.lastName} registered with email ${user.email}`,
      timestamp: user.createdAt,
    })),
    ...recentPsychologists.map(psych => ({
      id: psych._id.toString(),
      type: 'psychologist',
      title: 'New Psychologist Registration',
      description: `${psych.firstName} ${psych.lastName} registered as a psychologist`,
      timestamp: psych.createdAt,
      status: psych.approvalStatus,
    })),
    ...recentAppointments.map(appointment => ({
      id: appointment._id.toString(),
      type: 'appointment',
      title: 'Appointment Activity',
      description: `Session between ${appointment.userId?.firstName || 'User'} and ${appointment.psychologistId?.firstName || 'Psychologist'}`,
      timestamp: appointment.createdAt,
      status: appointment.status,
    })),
    ...recentPayments.map(payment => ({
      id: payment._id.toString(),
      type: 'payment',
      title: 'New Payment',
      description: `${payment.userId?.firstName || 'User'} made a payment of $${payment.amount}`,
      timestamp: payment.createdAt,
      status: payment.status,
    })),
  ];

  // Sort by timestamp (newest first) and return the top 10
  return activities
    .sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    )
    .slice(0, 10);
}
