'use client';

import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Settings,
  Mail,
  CreditCard,
  Shield,
  Bell,
  FileText,
  Calendar,
  Users,
  Save,
} from 'lucide-react';

// Define form schema for general settings
const generalSettingsSchema = z.object({
  siteName: z.string().min(1, 'Site name is required'),
  siteDescription: z.string(),
  maintenanceMode: z.boolean().default(false),
  userRegistration: z.boolean().default(true),
  adminEmail: z.string().email('Please enter a valid email'),
  timeZone: z.string(),
});

// Define form schema for email settings
const emailSettingsSchema = z.object({
  smtpHost: z.string(),
  smtpPort: z.number().int().positive().or(z.string()),
  smtpUsername: z.string(),
  smtpPassword: z.string(),
  fromEmail: z.string().email('Please enter a valid email'),
  fromName: z.string(),
  enableEmailNotifications: z.boolean().default(true),
});

// Define form schema for security settings
const securitySettingsSchema = z.object({
  sessionTimeout: z.number().int().positive().or(z.string()),
  loginAttempts: z.number().int().positive().or(z.string()),
  twoFactorAuth: z.boolean().default(false),
  passwordExpiry: z.number().int().nonnegative().or(z.string()),
  strongPasswordPolicy: z.boolean().default(true),
});

// Placeholder empty state component
const EmptyState = ({ title, description, icon, action }) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center">
      <div className="rounded-full bg-primary/10 p-3 text-primary">{icon}</div>
      <h3 className="mt-4 text-lg font-semibold">{title}</h3>
      <p className="mt-2 text-sm text-muted-foreground max-w-sm">
        {description}
      </p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
};

export default function AdminSettingsPage() {
  const [activeTab, setActiveTab] = useState('general');
  const [loading, setLoading] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Initialize general settings form
  const generalForm = useForm({
    resolver: zodResolver(generalSettingsSchema),
    defaultValues: {
      siteName: 'Mentality Platform',
      siteDescription: 'Mental health support platform',
      maintenanceMode: false,
      userRegistration: true,
      adminEmail: 'admin@mentalityplatform.com',
      timeZone: 'UTC',
    },
  });

  // Initialize email settings form
  const emailForm = useForm({
    resolver: zodResolver(emailSettingsSchema),
    defaultValues: {
      smtpHost: '',
      smtpPort: 587,
      smtpUsername: '',
      smtpPassword: '',
      fromEmail: 'noreply@mentalityplatform.com',
      fromName: 'Mentality Platform',
      enableEmailNotifications: true,
    },
  });

  // Initialize security settings form
  const securityForm = useForm({
    resolver: zodResolver(securitySettingsSchema),
    defaultValues: {
      sessionTimeout: 60,
      loginAttempts: 5,
      twoFactorAuth: false,
      passwordExpiry: 90,
      strongPasswordPolicy: true,
    },
  });

  // Handlers for each form submission
  const onSubmitGeneral = async data => {
    setLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      console.log('General settings data:', data);

      // Show success toast
      toast.success('General settings saved successfully');
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (error) {
      console.error('Error saving general settings:', error);
      toast.error('Failed to save settings. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const onSubmitEmail = async data => {
    setLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      console.log('Email settings data:', data);

      // Show success toast
      toast.success('Email settings saved successfully');
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (error) {
      console.error('Error saving email settings:', error);
      toast.error('Failed to save settings. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const onSubmitSecurity = async data => {
    setLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      console.log('Security settings data:', data);

      // Show success toast
      toast.success('Security settings saved successfully');
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (error) {
      console.error('Error saving security settings:', error);
      toast.error('Failed to save settings. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Test connection for email settings
  const testEmailConnection = async () => {
    try {
      // Validate form first
      await emailForm.trigger();
      if (!emailForm.formState.isValid) {
        toast.error('Please fill in all required fields correctly');
        return;
      }

      setLoading(true);
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      toast.success('Email connection test successful');
    } catch (error) {
      console.error('Error testing email connection:', error);
      toast.error('Email connection test failed. Please check your settings.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="py-6 space-y-6 max-w-5xl -mt-5">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Manage your platform settings and configurations.
        </p>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-4"
      >
        <TabsList className="bg-muted/50">
          <TabsTrigger value="general" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            <span>General</span>
          </TabsTrigger>
          <TabsTrigger value="email" className="flex items-center gap-2">
            <Mail className="h-4 w-4" />
            <span>Email</span>
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            <span>Security</span>
          </TabsTrigger>
          <TabsTrigger value="notification" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            <span>Notifications</span>
          </TabsTrigger>
          <TabsTrigger value="payment" className="flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            <span>Payments</span>
          </TabsTrigger>
          <TabsTrigger value="content" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            <span>Content</span>
          </TabsTrigger>
        </TabsList>

        {/* General Settings Tab */}
        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle>General Settings</CardTitle>
              <CardDescription>
                Configure basic platform settings and preferences.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...generalForm}>
                <form
                  onSubmit={generalForm.handleSubmit(onSubmitGeneral)}
                  className="space-y-4"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={generalForm.control}
                      name="siteName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Site Name</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Mentality Platform"
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>
                            The name of your platform as shown to users
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={generalForm.control}
                      name="adminEmail"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Admin Email</FormLabel>
                          <FormControl>
                            <Input placeholder="admin@example.com" {...field} />
                          </FormControl>
                          <FormDescription>
                            Primary contact email for administration
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={generalForm.control}
                    name="siteDescription"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Site Description</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Mental health support platform"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Brief description of your platform
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Separator className="my-4" />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={generalForm.control}
                      name="maintenanceMode"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">
                              Maintenance Mode
                            </FormLabel>
                            <FormDescription>
                              Put the site in maintenance mode to prevent access
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={generalForm.control}
                      name="userRegistration"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">
                              User Registration
                            </FormLabel>
                            <FormDescription>
                              Allow new users to register on the platform
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>

                  <Separator className="my-4" />

                  <FormField
                    control={generalForm.control}
                    name="timeZone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Default Time Zone</FormLabel>
                        <FormControl>
                          <select
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            {...field}
                          >
                            <option value="UTC">UTC</option>
                            <option value="America/New_York">
                              America/New York (EST/EDT)
                            </option>
                            <option value="America/Chicago">
                              America/Chicago (CST/CDT)
                            </option>
                            <option value="America/Denver">
                              America/Denver (MST/MDT)
                            </option>
                            <option value="America/Los_Angeles">
                              America/Los Angeles (PST/PDT)
                            </option>
                            <option value="Europe/London">
                              Europe/London (GMT/BST)
                            </option>
                            <option value="Europe/Paris">
                              Europe/Paris (CET/CEST)
                            </option>
                            <option value="Asia/Tokyo">Asia/Tokyo (JST)</option>
                            <option value="Australia/Sydney">
                              Australia/Sydney (AEST/AEDT)
                            </option>
                          </select>
                        </FormControl>
                        <FormDescription>
                          System default time zone
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex justify-end">
                    <Button type="submit" disabled={loading}>
                      {loading ? (
                        <>
                          <svg
                            className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                          >
                            <circle
                              className="opacity-25"
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="currentColor"
                              strokeWidth="4"
                            ></circle>
                            <path
                              className="opacity-75"
                              fill="currentColor"
                              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                            ></path>
                          </svg>
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="mr-2 h-4 w-4" />
                          Save Settings
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Email Settings Tab */}
        <TabsContent value="email">
          <Card>
            <CardHeader>
              <CardTitle>Email Settings</CardTitle>
              <CardDescription>
                Configure email server settings and notification preferences.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...emailForm}>
                <form
                  onSubmit={emailForm.handleSubmit(onSubmitEmail)}
                  className="space-y-4"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={emailForm.control}
                      name="smtpHost"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>SMTP Host</FormLabel>
                          <FormControl>
                            <Input placeholder="smtp.example.com" {...field} />
                          </FormControl>
                          <FormDescription>
                            SMTP server hostname
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={emailForm.control}
                      name="smtpPort"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>SMTP Port</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              placeholder="587"
                              {...field}
                              onChange={e =>
                                field.onChange(parseInt(e.target.value) || '')
                              }
                            />
                          </FormControl>
                          <FormDescription>
                            SMTP server port (usually 587, 465, or 25)
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={emailForm.control}
                      name="smtpUsername"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>SMTP Username</FormLabel>
                          <FormControl>
                            <Input placeholder="username" {...field} />
                          </FormControl>
                          <FormDescription>
                            Username for SMTP authentication
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={emailForm.control}
                      name="smtpPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>SMTP Password</FormLabel>
                          <FormControl>
                            <Input
                              type="password"
                              placeholder="••••••••"
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>
                            Password for SMTP authentication
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <Separator className="my-4" />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={emailForm.control}
                      name="fromEmail"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>From Email</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="noreply@example.com"
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>
                            Email address for outgoing emails
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={emailForm.control}
                      name="fromName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>From Name</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Mentality Platform"
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>
                            Display name for outgoing emails
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={emailForm.control}
                    name="enableEmailNotifications"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">
                            Email Notifications
                          </FormLabel>
                          <FormDescription>
                            Enable sending system email notifications
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <div className="flex justify-between">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={testEmailConnection}
                      disabled={loading}
                    >
                      {loading ? 'Testing...' : 'Test Connection'}
                    </Button>
                    <Button type="submit" disabled={loading}>
                      {loading ? (
                        <>
                          <svg
                            className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                          >
                            <circle
                              className="opacity-25"
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="currentColor"
                              strokeWidth="4"
                            ></circle>
                            <path
                              className="opacity-75"
                              fill="currentColor"
                              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                            ></path>
                          </svg>
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="mr-2 h-4 w-4" />
                          Save Settings
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Settings Tab */}
        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle>Security Settings</CardTitle>
              <CardDescription>
                Configure security options and access controls.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...securityForm}>
                <form
                  onSubmit={securityForm.handleSubmit(onSubmitSecurity)}
                  className="space-y-4"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={securityForm.control}
                      name="sessionTimeout"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Session Timeout (minutes)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              placeholder="60"
                              {...field}
                              onChange={e =>
                                field.onChange(parseInt(e.target.value) || '')
                              }
                            />
                          </FormControl>
                          <FormDescription>
                            Time before inactive sessions expire
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={securityForm.control}
                      name="loginAttempts"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Max Login Attempts</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              placeholder="5"
                              {...field}
                              onChange={e =>
                                field.onChange(parseInt(e.target.value) || '')
                              }
                            />
                          </FormControl>
                          <FormDescription>
                            Maximum failed login attempts before temporary lock
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={securityForm.control}
                    name="passwordExpiry"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Password Expiry (days)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="90"
                            {...field}
                            onChange={e =>
                              field.onChange(parseInt(e.target.value) || '')
                            }
                          />
                        </FormControl>
                        <FormDescription>
                          Days before passwords expire (0 for never)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Separator className="my-4" />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={securityForm.control}
                      name="twoFactorAuth"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">
                              Two-Factor Authentication
                            </FormLabel>
                            <FormDescription>
                              Require two-factor authentication for all users
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={securityForm.control}
                      name="strongPasswordPolicy"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">
                              Strong Password Policy
                            </FormLabel>
                            <FormDescription>
                              Enforce strong password requirements
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="flex justify-end">
                    <Button type="submit" disabled={loading}>
                      {loading ? (
                        <>
                          <svg
                            className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                          >
                            <circle
                              className="opacity-25"
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="currentColor"
                              strokeWidth="4"
                            ></circle>
                            <path
                              className="opacity-75"
                              fill="currentColor"
                              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                            ></path>
                          </svg>
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="mr-2 h-4 w-4" />
                          Save Settings
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notification Settings Tab (Placeholder) */}
        <TabsContent value="notification">
          <Card className="min-h-[400px] flex items-center justify-center">
            <EmptyState
              title="Notification Settings"
              description="Configure notification preferences including email, in-app, and SMS notifications."
              icon={<Bell className="h-6 w-6" />}
              action={
                <Button
                  variant="outline"
                  onClick={() =>
                    toast.info('Notification settings will be implemented soon')
                  }
                >
                  Coming Soon
                </Button>
              }
            />
          </Card>
        </TabsContent>

        {/* Payment Settings Tab (Placeholder) */}
        <TabsContent value="payment">
          <Card className="min-h-[400px] flex items-center justify-center">
            <EmptyState
              title="Payment Settings"
              description="Configure payment gateways, transaction fees, and currency options."
              icon={<CreditCard className="h-6 w-6" />}
              action={
                <Button
                  variant="outline"
                  onClick={() =>
                    toast.info('Payment settings will be implemented soon')
                  }
                >
                  Coming Soon
                </Button>
              }
            />
          </Card>
        </TabsContent>

        {/* Content Settings Tab (Placeholder) */}
        <TabsContent value="content">
          <Card className="min-h-[400px] flex items-center justify-center">
            <EmptyState
              title="Content Settings"
              description="Manage content policies, moderation settings, and default content configurations."
              icon={<FileText className="h-6 w-6" />}
              action={
                <Button
                  variant="outline"
                  onClick={() =>
                    toast.info('Content settings will be implemented soon')
                  }
                >
                  Coming Soon
                </Button>
              }
            />
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
