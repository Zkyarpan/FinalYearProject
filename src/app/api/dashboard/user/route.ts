'use server';

import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/db/db';
import User from '@/models/User';
import Profile from '@/models/Profile';
import Blog from '@/models/Blogs';
import Story from '@/models/Stories'; 
import Appointment from '@/models/Appointment';
import Conversation from '@/models/Conversation';
import { createSuccessResponse, createErrorResponse } from '@/lib/response';
import { withAuth } from '@/middleware/authMiddleware';

export async function GET(req: NextRequest) {
  return withAuth(
    async (req: NextRequest, token: any) => {
      try {
        await connectDB();
        console.log('Connected to database for user dashboard metrics');

        const userId = token._id;

        // Fetch counts for user-specific data
        const [
          userProfile,
          totalBlogs,
          publishedBlogs,
          draftBlogs,
          totalStories,
          publishedStories,
          totalAppointments,
          upcomingAppointments,
          completedAppointments,
          activeConversations,
        ] = await Promise.all([
          Profile.findOne({ user: userId }).lean(),
          Blog.countDocuments({ author: userId }),
          Blog.countDocuments({ author: userId, isPublished: true }),
          Blog.countDocuments({ author: userId, isPublished: false }),
          Story.countDocuments({ author: userId }),
          Story.countDocuments({ author: userId, isPublished: true }),
          Appointment.countDocuments({ userId }),
          Appointment.countDocuments({
            userId,
            status: 'scheduled',
            startTime: { $gt: new Date() },
          }),
          Appointment.countDocuments({ userId, status: 'completed' }),
          Conversation.countDocuments({
            $or: [
              { user1: userId, status: 'active' },
              { user2: userId, status: 'active' },
            ],
          }),
        ]);

        // Calculate profile completion percentage
        const profileCompletion = calculateProfileCompletion(userProfile);

        // Get wellness data (could be from a separate model, using mock data for now)
        const wellnessData = await getWellnessData(userId);

        // Get recent activities
        const recentActivities = await getUserRecentActivities(userId);

        // Get upcoming appointments
        const nearestAppointments = await getNearestAppointments(userId);

        // Get recent conversations
        const recentConversations = await getRecentConversations(userId);

        const dashboardData = {
          metrics: {
            profileCompletion,
            totalBlogs,
            publishedBlogs,
            draftBlogs,
            totalStories,
            publishedStories,
            totalAppointments,
            upcomingAppointments,
            completedAppointments,
            activeConversations,
          },
          wellnessData,
          recentActivities,
          nearestAppointments,
          recentConversations,
        };

        return NextResponse.json(createSuccessResponse(200, dashboardData), {
          status: 200,
        });
      } catch (error: any) {
        console.error('Error fetching user dashboard data:', error);
        return NextResponse.json(
          createErrorResponse(500, error.message || 'Internal Server Error'),
          { status: 500 }
        );
      }
    },
    req,
    ['user', 'psychologist', 'admin'] // Allow all authenticated users
  );
}

// Calculate how complete a user's profile is
function calculateProfileCompletion(profile: any): number {
  if (!profile) return 0;

  const requiredFields = [
    'firstName',
    'lastName',
    'phone',
    'age',
    'gender',
    'briefBio',
    'struggles',
  ];

  const optionalFields = [
    'image',
    'address',
    'emergencyContact',
    'emergencyPhone',
  ];

  // Count required fields
  let completedRequired = 0;
  requiredFields.forEach(field => {
    if (
      profile[field] &&
      (typeof profile[field] !== 'string' || profile[field].trim() !== '') &&
      (!Array.isArray(profile[field]) || profile[field].length > 0)
    ) {
      completedRequired++;
    }
  });

  // Count optional fields
  let completedOptional = 0;
  optionalFields.forEach(field => {
    if (
      profile[field] &&
      (typeof profile[field] !== 'string' || profile[field].trim() !== '')
    ) {
      completedOptional++;
    }
  });

  // Calculate percentage with required fields weighted more heavily
  const requiredWeight = 0.7;
  const optionalWeight = 0.3;

  const requiredPercentage =
    (completedRequired / requiredFields.length) * requiredWeight;
  const optionalPercentage =
    (completedOptional / optionalFields.length) * optionalWeight;

  return Math.round((requiredPercentage + optionalPercentage) * 100);
}

// Generate wellness data - replace with actual wellness metrics model if available
async function getWellnessData(userId: string) {
  // This would ideally come from a wellness tracking model
  // Using mock data for demonstration

  // Get day of week (0-6, 0 is Sunday)
  const today = new Date();
  const dayOfWeek = today.getDay();

  // Create past 7 days data (realistic random values that trend slightly upward)
  interface DataPoint {
    date: string;
    value: number;
  }
  
  const moodData: DataPoint[] = [];
  const sleepData: DataPoint[] = [];
  const mindfulnessData: DataPoint[] = [];

  // Base values with small random fluctuations
  let moodBase = 65 + Math.floor(Math.random() * 10);
  let sleepBase = 6 + Math.random() * 2;
  let mindfulnessBase = 30 + Math.floor(Math.random() * 20);

  // Create data for the last 7 days
  for (let i = 0; i < 7; i++) {
    const date = new Date();
    date.setDate(date.getDate() - (6 - i));
    const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });

    // Add slight upward trend with random variations
    moodBase += Math.floor(Math.random() * 5) - 2;
    moodBase = Math.min(Math.max(moodBase, 50), 95); // Keep between 50-95

    sleepBase += Math.random() * 0.4 - 0.2;
    sleepBase = Math.min(Math.max(sleepBase, 5), 9); // Keep between 5-9 hours

    mindfulnessBase += Math.floor(Math.random() * 6) - 2;
    mindfulnessBase = Math.min(Math.max(mindfulnessBase, 20), 60); // Keep between 20-60 min

    moodData.push({
      date: dayName,
      value: moodBase,
    });

    sleepData.push({
      date: dayName,
      value: Math.round(sleepBase * 10) / 10,
    });

    mindfulnessData.push({
      date: dayName,
      value: Math.round(mindfulnessBase),
    });
  }

  // Calculate overall wellness score (weighted average of the latest values)
  const latestMood = moodData[6].value;
  const latestSleep = sleepData[6].value;
  const latestMindfulness = mindfulnessData[6].value;

  // Normalize each component
  const normalizedMood = latestMood / 100;
  const normalizedSleep = Math.min(latestSleep / 8, 1); // 8 hours is optimal
  const normalizedMindfulness = Math.min(latestMindfulness / 40, 1); // 40 min is optimal

  // Weighted score
  const wellnessScore =
    (normalizedMood * 0.5 +
      normalizedSleep * 0.3 +
      normalizedMindfulness * 0.2) *
    100;

  return {
    wellnessScore: Math.round(wellnessScore * 100) / 100,
    moodData,
    sleepData,
    mindfulnessData,
    stressLevel: Math.round(100 - wellnessScore),
    insights: [
      {
        title: 'Sleep Quality',
        value: latestSleep.toFixed(1) + 'h',
        change: '+0.3h',
        status: 'improved',
      },
      {
        title: 'Mindfulness',
        value: latestMindfulness + 'min',
        change: '+5min',
        status: 'improved',
      },
      {
        title: 'Mood',
        value: latestMood + '%',
        change: '+2%',
        status: 'stable',
      },
    ],
  };
}

// Get user's recent activities
async function getUserRecentActivities(userId: string) {
  try {
    // Get recent blog posts
    const recentBlogs = await Blog.find({ author: userId })
      .sort({ createdAt: -1 })
      .limit(3)
      .select('title isPublished createdAt')
      .lean();

    // Get recent story posts
    const recentStories = await Story.find({ author: userId })
      .sort({ createdAt: -1 })
      .limit(3)
      .select('title isPublished createdAt')
      .lean();

    // Get recent appointments
    const recentAppointments = await Appointment.find({ userId })
      .sort({ startTime: -1 })
      .limit(3)
      .populate('psychologistId', 'firstName lastName')
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
      ...recentStories.map((story: any) => ({
        id: story._id.toString(),
        type: 'story',
        title: story.isPublished ? 'Shared Story' : 'Created Story Draft',
        description: story.title,
        timestamp: story.createdAt,
        status: story.isPublished ? 'published' : 'draft',
      })),
      ...recentAppointments.map((appointment: any) => {
        const psychName = appointment.psychologistId
          ? `Dr. ${appointment.psychologistId.firstName} ${appointment.psychologistId.lastName}`
          : 'a therapist';

        return {
          id: appointment._id.toString(),
          type: 'appointment',
          title: `${appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)} Appointment`,
          description: `Session with ${psychName}`,
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
    console.error('Error getting user activities:', error);
    return [];
  }
}

// Get user's nearest upcoming appointments
async function getNearestAppointments(userId: string) {
  try {
    const appointments = await Appointment.find({
      userId,
      status: 'scheduled',
      startTime: { $gt: new Date() },
    })
      .sort({ startTime: 1 })
      .limit(3)
      .populate('psychologistId', 'firstName lastName profilePhoto')
      .lean();

    return appointments.map((appointment: any) => {
      const psychName = appointment.psychologistId
        ? `Dr. ${appointment.psychologistId.firstName} ${appointment.psychologistId.lastName}`
        : 'Unknown Provider';

      return {
        id: appointment._id.toString(),
        providerName: psychName,
        providerPhoto: appointment.psychologistId?.profilePhoto || null,
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

// Get user's recent conversations
async function getRecentConversations(userId: string) {
  try {
    // Find conversations where user is either user1 or user2
    const conversations = await Conversation.find({
      $or: [{ user1: userId }, { user2: userId }],
    })
      .sort({ updatedAt: -1 })
      .limit(3)
      .populate('user1', 'firstName lastName image')
      .populate('user2', 'firstName lastName image')
      .select('lastMessage lastMessageTimestamp')
      .lean();

    return conversations.map((convo: any) => {
      // Determine the other user in the conversation
      const otherUser =
        convo.user1._id.toString() === userId ? convo.user2 : convo.user1;

      return {
        id: convo._id.toString(),
        otherUserName: `${otherUser.firstName} ${otherUser.lastName}`,
        otherUserPhoto: otherUser.image || '/default-avatar.jpg',
        lastMessage: convo.lastMessage || 'No messages yet',
        timestamp: convo.lastMessageTimestamp || convo.updatedAt,
      };
    });
  } catch (error) {
    console.error('Error getting recent conversations:', error);
    return [];
  }
}
