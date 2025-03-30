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
import Profile from '@/models/Profile';

export async function GET(req: NextRequest) {
  return withAuth(
    async (req: NextRequest, token: any) => {
      try {
        await connectDB();
        console.log('Connected to database for psychologist dashboard metrics');

        // Extract psychologist ID from token - use both id and _id for safety
        const psychologistId = token.id || token._id;

        console.log('Attempting to find psychologist with ID:', psychologistId);

        if (!psychologistId) {
          console.error('Invalid token: Missing user ID');
          return NextResponse.json(
            createErrorResponse(401, 'Authentication failed - missing user ID'),
            { status: 401 }
          );
        }

        // Find the psychologist directly using the ID from the token
        const psychologist = (await Psychologist.findById(
          psychologistId
        ).lean()) as any;

        if (!psychologist) {
          console.error(`Psychologist not found with ID: ${psychologistId}`);

          // Try to find a user record for basic information
          const user = (await User.findById(psychologistId).lean()) as any;

          // Create placeholder data using any available user info
          const placeholderData = {
            psychologistInfo: {
              firstName: user?.firstName || 'Doctor',
              lastName: user?.lastName || '',
              fullName: user ? `Dr. ${user.firstName} ${user.lastName}` : 'Dr.',
              approvalStatus: 'pending',
              profilePhotoUrl: user?.profileImage || user?.image || null,
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

          return NextResponse.json(
            createSuccessResponse(200, placeholderData),
            { status: 200 }
          );
        }

        // Fetch metrics data in parallel for better performance
        const [
          totalAppointments,
          upcomingAppointments,
          completedAppointments,
          canceledAppointments,
          totalPatients,
          totalArticles,
          totalBlogs,
          totalRevenue,
          activeConversations,
        ] = await Promise.all([
          Appointment.countDocuments({ psychologistId }),
          Appointment.countDocuments({
            psychologistId,
            status: 'scheduled',
            startTime: { $gt: new Date() },
          }),
          Appointment.countDocuments({ psychologistId, status: 'completed' }),
          Appointment.countDocuments({ psychologistId, status: 'canceled' }),
          Appointment.distinct('userId', { psychologistId }).then(
            ids => ids.length
          ),
          Article.countDocuments({ author: psychologistId }),
          Blog.countDocuments({ author: psychologistId }),
          Payment.find({ psychologistId }).then(payments =>
            payments.reduce(
              (total, payment) => total + (payment.amount || 0),
              0
            )
          ),
          Conversation.countDocuments({
            $or: [
              { user1: psychologistId, status: 'active' },
              { user2: psychologistId, status: 'active' },
            ],
          }),
        ]);

        // Get supplementary data
        const recentAppointments = await getRecentAppointments(psychologistId);
        const upcomingAppointmentsList =
          await getUpcomingAppointments(psychologistId);
        const patientStats = await getPatientStatistics(psychologistId);
        const recentActivities =
          await getPsychologistRecentActivities(psychologistId);
        const monthlyEarnings = await getMonthlyEarnings(psychologistId);

        const dashboardData = {
          psychologistInfo: {
            firstName: psychologist.firstName,
            lastName: psychologist.lastName,
            fullName: psychologist.fullName,
            approvalStatus: psychologist.approvalStatus || 'pending',
            profilePhotoUrl: psychologist.profilePhotoUrl,
            specializations: psychologist.specializations || [],
            experience: psychologist.yearsOfExperience || 0,
            rating: 0, // Default value as it's not in the schema
          },
          metrics: {
            totalAppointments,
            upcomingAppointments,
            completedAppointments,
            canceledAppointments,
            totalPatients,
            totalArticles,
            totalBlogs,
            totalRevenue,
            activeConversations,
          },
          recentAppointments,
          upcomingAppointmentsList,
          patientStats,
          recentActivities,
          monthlyEarnings,
        };

        return NextResponse.json(createSuccessResponse(200, dashboardData), {
          status: 200,
        });
      } catch (error: any) {
        console.error('Error fetching psychologist dashboard data:', error);
        return NextResponse.json(
          createErrorResponse(500, error.message || 'Internal Server Error'),
          { status: 500 }
        );
      }
    },
    req,
    ['psychologist', 'admin'] // Allow both psychologists and admins
  );
}

// Get recent appointments for the psychologist
async function getRecentAppointments(psychologistId: string) {
  try {
    const appointments = await Appointment.find({ psychologistId })
      .sort({ startTime: -1 })
      .limit(5)
      .populate('userId', 'firstName lastName image')
      .select('status startTime duration sessionFormat notes')
      .lean();

    return appointments.map((appointment: any) => {
      const patientName = appointment.userId
        ? `${appointment.userId.firstName} ${appointment.userId.lastName}`
        : 'Unknown Patient';

      return {
        id: appointment._id.toString(),
        patientName,
        patientPhoto: appointment.userId?.image || null,
        date: appointment.startTime,
        duration: appointment.duration,
        format: appointment.sessionFormat || 'video',
        status: appointment.status,
        notes: appointment.notes || '',
      };
    });
  } catch (error) {
    console.error('Error getting recent appointments:', error);
    return [];
  }
}

// Get upcoming appointments for the psychologist
async function getUpcomingAppointments(psychologistId: string) {
  try {
    const appointments = await Appointment.find({
      psychologistId,
      status: 'scheduled',
      startTime: { $gt: new Date() },
    })
      .sort({ startTime: 1 })
      .limit(5)
      .populate('userId', 'firstName lastName image')
      .select('status startTime duration sessionFormat')
      .lean();

    return appointments.map((appointment: any) => {
      const patientName = appointment.userId
        ? `${appointment.userId.firstName} ${appointment.userId.lastName}`
        : 'Unknown Patient';

      return {
        id: appointment._id.toString(),
        patientName,
        patientPhoto: appointment.userId?.image || null,
        date: appointment.startTime,
        duration: appointment.duration,
        format: appointment.sessionFormat || 'video',
        status: appointment.status,
      };
    });
  } catch (error) {
    console.error('Error getting upcoming appointments:', error);
    return [];
  }
}

// Get patient statistics for the psychologist
// Fixed getPatientStatistics function that works with your model structure
async function getPatientStatistics(psychologistId: string) {
  try {
    // Get all unique patients
    const patientIds = await Appointment.distinct('userId', { psychologistId });

    if (!patientIds.length) {
      return {
        totalPatients: 0,
        newPatients: 0,
        returningPatients: 0,
        genderDistribution: { male: 0, female: 0, other: 0, notSpecified: 0 },
        ageGroups: {
          under18: 0,
          '18to24': 0,
          '25to34': 0,
          '35to44': 0,
          '45to54': 0,
          '55plus': 0,
          notSpecified: 0,
        },
      };
    }

    // First get all users without trying to populate
    interface UserDocument {
      _id: Types.ObjectId;
      firstName?: string;
      lastName?: string;
      __v?: number;
    }
    const users = (await User.find({
      _id: { $in: patientIds },
    }).lean()) as UserDocument[];

    // Then separately get all profiles for these users
    const profiles = await Profile.find({
      user: { $in: patientIds },
    }).lean();

    // Create a map of profiles by user ID for easy lookup
    const profileMap = new Map();
    profiles.forEach(profile => {
      profileMap.set(profile.user.toString(), profile);
    });

    const genderDistribution = {
      male: 0,
      female: 0,
      other: 0,
      notSpecified: 0,
    };

    const ageGroups = {
      under18: 0,
      '18to24': 0,
      '25to34': 0,
      '35to44': 0,
      '45to54': 0,
      '55plus': 0,
      notSpecified: 0,
    };

    // Process each user with their corresponding profile
    users.forEach(user => {
      const userId = user._id.toString();
      const profile = profileMap.get(userId);

      // Gender distribution
      if (profile?.gender) {
        const gender = profile.gender.toLowerCase();
        if (gender === 'male') genderDistribution.male++;
        else if (gender === 'female') genderDistribution.female++;
        else genderDistribution.other++;
      } else {
        genderDistribution.notSpecified++;
      }

      // Age groups
      if (profile?.age) {
        const age = profile.age;
        if (age < 18) ageGroups.under18++;
        else if (age >= 18 && age <= 24) ageGroups['18to24']++;
        else if (age >= 25 && age <= 34) ageGroups['25to34']++;
        else if (age >= 35 && age <= 44) ageGroups['35to44']++;
        else if (age >= 45 && age <= 54) ageGroups['45to54']++;
        else ageGroups['55plus']++;
      } else {
        ageGroups.notSpecified++;
      }
    });

    // Get returning patients (more than 1 appointment)
    const patientAppointmentCounts = await Appointment.aggregate([
      { $match: { psychologistId: new Types.ObjectId(psychologistId) } },
      { $group: { _id: '$userId', count: { $sum: 1 } } },
    ]);

    const returningPatients = patientAppointmentCounts.filter(
      p => p.count > 1
    ).length;
    const newPatients = patientAppointmentCounts.filter(
      p => p.count === 1
    ).length;

    return {
      totalPatients: patientIds.length,
      newPatients,
      returningPatients,
      genderDistribution,
      ageGroups,
    };
  } catch (error) {
    console.error('Error getting patient statistics:', error);
    return {
      totalPatients: 0,
      newPatients: 0,
      returningPatients: 0,
      genderDistribution: { male: 0, female: 0, other: 0, notSpecified: 0 },
      ageGroups: {
        under18: 0,
        '18to24': 0,
        '25to34': 0,
        '35to44': 0,
        '45to54': 0,
        '55plus': 0,
        notSpecified: 0,
      },
    };
  }
}

// Get psychologist's recent activities
async function getPsychologistRecentActivities(psychologistId: string) {
  try {
    // Get recent blog posts
    const recentBlogs = await Blog.find({ author: psychologistId })
      .sort({ createdAt: -1 })
      .limit(3)
      .select('title isPublished createdAt')
      .lean();

    // Get recent articles
    const recentArticles = await Article.find({ author: psychologistId })
      .sort({ createdAt: -1 })
      .limit(3)
      .select('title isPublished createdAt')
      .lean();

    // Get recent appointments
    const recentAppointments = await Appointment.find({ psychologistId })
      .sort({ startTime: -1 })
      .limit(3)
      .populate('userId', 'firstName lastName')
      .select('status startTime duration')
      .lean();

    // Format all activities in a unified way
    const activities = [
      ...recentBlogs.map((blog: any) => ({
        id: blog._id.toString(),
        type: 'blog',
        title: blog.isPublished ? 'Published Blog' : 'Created Blog Draft',
        description: blog.title,
        timestamp: blog.createdAt,
        status: blog.isPublished ? 'published' : 'draft',
      })),
      ...recentArticles.map((article: any) => ({
        id: article._id.toString(),
        type: 'article',
        title: article.isPublished
          ? 'Published Article'
          : 'Created Article Draft',
        description: article.title,
        timestamp: article.createdAt,
        status: article.isPublished ? 'published' : 'draft',
      })),
      ...recentAppointments.map((appointment: any) => {
        const patientName = appointment.userId
          ? `${appointment.userId.firstName} ${appointment.userId.lastName}`
          : 'a patient';

        return {
          id: appointment._id.toString(),
          type: 'appointment',
          title: `${appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)} Appointment`,
          description: `Session with ${patientName}`,
          timestamp: appointment.startTime,
          status: appointment.status,
        };
      }),
    ];

    // Sort by timestamp (newest first) and return the top 6
    return activities
      .sort(
        (a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      )
      .slice(0, 6);
  } catch (error) {
    console.error('Error getting psychologist activities:', error);
    return [];
  }
}

// Get monthly earnings for the psychologist
async function getMonthlyEarnings(psychologistId: string) {
  try {
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    sixMonthsAgo.setDate(1);
    sixMonthsAgo.setHours(0, 0, 0, 0);

    const payments = await Payment.find({
      psychologistId,
      createdAt: { $gte: sixMonthsAgo },
      status: 'completed',
    }).lean();

    // Initialize monthly data
    type MonthlyDataEntry = {
      month: string;
      earnings: number;
      appointments: number;
    };
    const monthlyData: MonthlyDataEntry[] = [];
    for (let i = 0; i < 6; i++) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const year = date.getFullYear();
      const month = date.getMonth();

      const monthName = new Date(year, month, 1).toLocaleString('default', {
        month: 'short',
      });

      monthlyData.unshift({
        month: monthName,
        earnings: 0,
        appointments: 0,
      });
    }

    // Calculate earnings by month
    payments.forEach(payment => {
      const paymentDate = new Date(payment.createdAt);
      const paymentMonth = paymentDate.toLocaleString('default', {
        month: 'short',
      });

      const monthData = monthlyData.find(m => m.month === paymentMonth);
      if (monthData) {
        monthData.earnings += payment.amount;
        monthData.appointments += 1;
      }
    });

    return monthlyData;
  } catch (error) {
    console.error('Error getting monthly earnings:', error);
    return [];
  }
}
