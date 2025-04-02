import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import connectDB from '@/db/db';
import { createSuccessResponse, createErrorResponse } from '@/lib/response';
import { withAuth } from '@/middleware/authMiddleware';
import Setting from '@/models/Setting';
import EmailTemplate from '@/models/EmailTemplate';

export async function GET(req: NextRequest) {
  return withAuth(
    async (req: NextRequest, token: any) => {
      try {
        await connectDB();

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

        // Get all settings
        interface SettingDocument {
          settings: any;
          category: string;
        }

        const [
          systemSettings,
          emailSettings,
          paymentSettings,
          notificationSettings,
          securitySettings,
          contentSettings,
          appointmentSettings,
          emailTemplates,
        ] = await Promise.all([
          Setting.findOne({
            category: 'system',
          }).lean() as unknown as Promise<SettingDocument>,
          Setting.findOne({
            category: 'email',
          }).lean() as unknown as Promise<SettingDocument>,
          Setting.findOne({
            category: 'payment',
          }).lean() as unknown as Promise<SettingDocument>,
          Setting.findOne({
            category: 'notification',
          }).lean() as unknown as Promise<SettingDocument>,
          Setting.findOne({
            category: 'security',
          }).lean() as unknown as Promise<SettingDocument>,
          Setting.findOne({
            category: 'content',
          }).lean() as unknown as Promise<SettingDocument>,
          Setting.findOne({
            category: 'appointment',
          }).lean() as unknown as Promise<SettingDocument>,
          EmailTemplate.find({}).lean(),
        ]);

        // Create the settings data object
        const settingsData = {
          system: systemSettings?.settings || {
            siteName: 'Mentality Platform',
            siteDescription:
              'Mental Health Platform for Psychologists and Users',
            maintenanceMode: false,
            allowRegistration: true,
            allowPsychologistRegistration: true,
            requireEmailVerification: true,
            defaultUserRole: 'user',
            maxFileUploadSize: 5,
            contactEmail: 'contact@mentalityplatform.com',
            supportEmail: 'support@mentalityplatform.com',
            timezone: 'UTC',
            dateFormat: 'MM/DD/YYYY',
            timeFormat: '12h',
            analyticsEnabled: false,
            analyticsCode: '',
          },
          email: emailSettings?.settings || {
            smtpHost: '',
            smtpPort: 587,
            smtpUser: '',
            smtpPassword: '',
            fromEmail: 'no-reply@mentalityplatform.com',
            fromName: 'Mentality Platform',
            useSMTP: false,
          },
          payment: paymentSettings?.settings || {
            currency: 'USD',
            enablePayments: true,
            paymentProvider: 'stripe',
            stripePublicKey: '',
            stripeSecretKey: '',
            paypalClientId: '',
            paypalClientSecret: '',
            defaultSessionCost: 75,
          },
          notification: notificationSettings?.settings || {
            enableEmailNotifications: true,
            enableInAppNotifications: true,
            enableSmsNotifications: false,
            adminEmailNotifications: true,
            reminderNotifications: true,
            appointmentNotifications: true,
            marketingNotifications: false,
            reminderTimeHours: 24,
          },
          security: securitySettings?.settings || {
            maxLoginAttempts: 5,
            passwordExpireDays: 90,
            requireStrongPasswords: true,
            sessionTimeoutMinutes: 60,
            enableTwoFactorAuth: false,
            enforcePasswordReset: false,
          },
          content: contentSettings?.settings || {
            defaultArticleStatus: 'draft',
            allowComments: true,
            moderateComments: true,
            enableContentRating: true,
            showAuthorInfo: true,
            enableRecommendations: true,
          },
          appointment: appointmentSettings?.settings || {
            defaultSessionDuration: 50,
            minAdvanceBookingHours: 24,
            cancellationPolicy: 'moderate',
            cancellationTimeHours: 24,
            enableRescheduling: true,
            enableAutoConfirm: false,
            bufferMinutes: 10,
            reminderEnabled: true,
          },
          emailTemplates: emailTemplates || [
            {
              id: 'welcome',
              name: 'Welcome Email',
              subject: 'Welcome to Mentality Platform',
              body: "Hello {{name}},\n\nWelcome to Mentality Platform! We're glad to have you join us.\n\nBest regards,\nThe Mentality Team",
              variables: ['name', 'email'],
              isActive: true,
            },
            {
              id: 'appointment-confirmation',
              name: 'Appointment Confirmation',
              subject: 'Your appointment has been confirmed',
              body: 'Hello {{name}},\n\nYour appointment with {{psychologist}} on {{date}} at {{time}} has been confirmed.\n\nBest regards,\nThe Mentality Team',
              variables: ['name', 'psychologist', 'date', 'time'],
              isActive: true,
            },
            {
              id: 'password-reset',
              name: 'Password Reset',
              subject: 'Password Reset Request',
              body: 'Hello {{name}},\n\nYou have requested to reset your password. Please click the following link to reset your password: {{resetLink}}\n\nIf you did not request a password reset, please ignore this email.\n\nBest regards,\nThe Mentality Team',
              variables: ['name', 'resetLink'],
              isActive: true,
            },
          ],
        };

        return NextResponse.json(createSuccessResponse(200, settingsData), {
          status: 200,
        });
      } catch (error: any) {
        console.error('Error fetching admin settings:', error);
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
