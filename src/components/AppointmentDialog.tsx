'use client';

import React, { useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';

import {
  Video,
  Mail,
  Calendar,
  Clock,
  User,
  DollarSign,
  Phone,
  FileText,
  AlertTriangle,
  CalendarDays,
  X,
  ClipboardList,
  Stethoscope,
  Activity,
} from 'lucide-react';
import { format } from 'date-fns';
import Patient from '@/icons/Patient';

const AppointmentDialog = ({ appointment, isOpen, onClose, onJoinSession }) => {
  if (!appointment) return null;

  const getProfilePhotoUrl = () => {
    if (!appointment.profile || !appointment.profile.profilePhotoUrl) return '';

    const url = appointment.profile.profilePhotoUrl;

    // Ensure it's a valid string and not an object
    if (typeof url !== 'string') {
      console.error('Invalid profile photo URL:', url);
      return '';
    }

    // Fix potential encoding issues
    return decodeURIComponent(url).replace(/\[object Object\]/g, '');
  };

  const profilePhotoUrl = getProfilePhotoUrl();
  console.log('Clean profile photo URL:', profilePhotoUrl);

  console.log('Appointment Profile Data:', appointment.profile);

  const handleJoinSession = () => {
    if (appointment.videoCallLink) {
      onJoinSession(appointment.videoCallLink);
    } else {
      toast.info('Video call feature will be available soon.', {
        duration: 3000,
      });
    }
  };

  const formatDateTime = (
    dateTimeStr,
    formatPattern,
    fallbackText = 'Not scheduled'
  ) => {
    try {
      if (!dateTimeStr) return fallbackText;

      // Try to parse the date
      const date = new Date(dateTimeStr);

      // Check if date is valid (will return NaN if invalid)
      if (isNaN(date.getTime())) {
        return fallbackText;
      }

      return format(date, formatPattern);
    } catch (error) {
      console.error('Error formatting date:', error);
      return fallbackText;
    }
  };

  const getPaymentStatusVariant = (
    status
  ): 'default' | 'destructive' | 'outline' | 'secondary' | null | undefined => {
    switch (status?.toLowerCase()) {
      case 'completed':
        return 'default';
      case 'refunded':
        return 'secondary';
      case 'failed':
        return 'destructive';
      case 'pending':
      default:
        return 'outline';
    }
  };

  const patientName =
    appointment.patientName ||
    `${appointment.userId.firstName} ${appointment.userId.lastName}`;

  const getInitials = name => {
    return (
      name
        ?.split(' ')
        .map(part => part?.[0])
        .join('')
        .toUpperCase() || 'UK'
    );
  };

  console.log(appointment.profile?.profilePhotoUrl);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl p-0 gap-0 overflow-hidden">
        <DialogHeader className="px-4 pt-4 pb-3 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-10 border-b flex-row items-center justify-between">
          <div>
            <DialogTitle className="text-lg flex items-center gap-2">
              <Patient />
              Patient Details
            </DialogTitle>
            <DialogDescription className="text-xs mt-1">
              Session and appointment information
            </DialogDescription>
          </div>
          <DialogClose className="w-6 h-6 rounded-full hover:bg-muted flex items-center justify-center">
            <X className="h-4 w-4" />
          </DialogClose>
        </DialogHeader>

        <ScrollArea className="max-h-[75vh]">
          <div className="p-4 space-y-4">
            <Card className="bg-muted/30 dark:bg-input overflow-hidden">
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  <Avatar className="h-10 w-10">
                    {profilePhotoUrl && (
                      <AvatarImage
                        src={profilePhotoUrl}
                        alt={appointment.patientName || 'Patient'}
                        className="object-cover"
                      />
                    )}
                    <AvatarFallback className="bg-primary/10">
                      {getInitials(appointment.patientName)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h2 className="text-lg font-semibold truncate">
                          {patientName}
                        </h2>
                        <div className="flex items-center gap-2 mt-0.5 text-sm text-muted-foreground">
                          <Mail className="h-3.5 w-3.5" />
                          <span>{appointment.userId.email}</span>
                        </div>
                      </div>
                      <Badge
                        variant={
                          appointment.status === 'confirmed'
                            ? 'default'
                            : 'secondary'
                        }
                        className="shrink-0 uppercase"
                      >
                        {appointment.status}
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Tabs defaultValue="session" className="w-full">
              <div className="flex items-center justify-between">
                <TabsList className="w-[57%] justify-start h-9">
                  <TabsTrigger value="session" className="gap-1.5 text-xs">
                    <Calendar className="h-3.5 w-3.5" />
                    Session
                  </TabsTrigger>
                  <TabsTrigger value="profile" className="gap-1.5 text-xs">
                    <User className="h-3.5 w-3.5" />
                    Profile
                  </TabsTrigger>
                  <TabsTrigger value="medical" className="gap-1.5 text-xs">
                    <Stethoscope className="h-3.5 w-3.5" />
                    Medical
                  </TabsTrigger>
                  <TabsTrigger value="booking" className="gap-1.5 text-xs">
                    <ClipboardList className="h-3.5 w-3.5" />
                    Booking
                  </TabsTrigger>
                </TabsList>
                {appointment.sessionFormat === 'video' && (
                  <Button
                    size="sm"
                    onClick={handleJoinSession}
                    disabled={!appointment.canJoin}
                  >
                    <Video className="h-4 w-4 mr-2" />
                    Join Video Session
                  </Button>
                )}
              </div>

              <TabsContent value="session" className="mt-3">
                <div className="grid grid-cols-2 gap-4">
                  <Card className="dark:bg-input">
                    <CardContent className="p-3 space-y-2.5">
                      <h3 className="text-sm font-medium flex items-center gap-2">
                        <CalendarDays className="h-4 w-4" />
                        Appointment Details
                      </h3>
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2 text-xs">
                          <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                          <span>
                            {formatDateTime(
                              new Date(appointment.dateTime),
                              'EEEE, MMMM d, yyyy'
                            )}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-xs">
                          <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                          <span>
                            {formatDateTime(
                              new Date(appointment.dateTime),
                              'h:mm a'
                            )}{' '}
                            -{' '}
                            {formatDateTime(
                              new Date(appointment.endTime),
                              'h:mm a'
                            )}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-xs">
                          <Video className="h-3.5 w-3.5 text-muted-foreground" />
                          <span className="capitalize">
                            {appointment.sessionFormat} Session
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="dark:bg-input">
                    <CardContent className="p-3 space-y-2.5">
                      <h3 className="text-sm font-medium flex items-center gap-2">
                        <Phone className="h-4 w-4" />
                        Contact Information
                      </h3>
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2 text-xs">
                          <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                          <span>{appointment.email}</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs">
                          <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                          <span>{appointment.phone}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="profile" className="mt-3">
                <div className="grid grid-cols-2 gap-4">
                  <Card className="dark:bg-input">
                    <CardContent className="p-3 space-y-2.5">
                      <h3 className="text-sm font-medium flex items-center gap-2">
                        <User className="h-4 w-4" />
                        Personal Information
                      </h3>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-xs">
                          <span className="text-muted-foreground">Age:</span>
                          <span>{appointment.profile?.age} years</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs">
                          <span className="text-muted-foreground">Gender:</span>
                          <span className="capitalize">
                            {appointment.profile?.gender}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-xs">
                          <span className="text-muted-foreground">
                            Address:
                          </span>
                          <span>{appointment.profile?.address}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="dark:bg-input">
                    <CardContent className="p-3 space-y-2.5">
                      <h3 className="text-sm font-medium flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4" />
                        Emergency Contact
                      </h3>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-xs">
                          <span className="text-muted-foreground">Name:</span>
                          <span>{appointment.profile?.emergencyContact}</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs">
                          <span className="text-muted-foreground">Phone:</span>
                          <span>{appointment.profile?.emergencyPhone}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="medical" className="mt-3">
                <div className="grid grid-cols-2 gap-4">
                  <Card className="dark:bg-input">
                    <CardContent className="p-3 space-y-2.5">
                      <h3 className="text-sm font-medium flex items-center gap-2">
                        <Activity className="h-4 w-4" />
                        Therapy Information
                      </h3>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-xs">
                          <span className="text-muted-foreground">
                            Previous Therapy:
                          </span>
                          <span className="capitalize">
                            {appointment.profile?.therapyHistory}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-xs">
                          <span className="text-muted-foreground">
                            Preferred Communication:
                          </span>
                          <span className="capitalize">
                            {appointment.profile?.preferredCommunication}
                          </span>
                        </div>
                      </div>
                      <div className="space-y-1">
                        <h4 className="text-xs font-medium">Areas of Focus:</h4>
                        <div className="flex flex-wrap gap-1">
                          {appointment.profile?.struggles.map(
                            (struggle, index) => (
                              <Badge
                                key={index}
                                variant="secondary"
                                className="text-xs"
                              >
                                {struggle}
                              </Badge>
                            )
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="dark:bg-input">
                    <CardContent className="p-3 space-y-2.5">
                      <h3 className="text-sm font-medium flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        Brief Bio
                      </h3>
                      <p className="text-xs leading-relaxed">
                        {appointment.profile?.briefBio}
                      </p>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="booking" className="mt-3">
                <div className="grid grid-cols-2 gap-4">
                  <Card className="dark:bg-input">
                    <CardContent className="p-3 space-y-2.5">
                      <h3 className="text-sm font-medium flex items-center gap-2">
                        <ClipboardList className="h-4 w-4" />
                        Booking Information
                      </h3>
                      <div className="space-y-2">
                        <div>
                          <h4 className="text-xs font-medium mb-1">
                            Reason for Visit
                          </h4>
                          <p className="text-xs">
                            {appointment.reasonForVisit}
                          </p>
                        </div>
                        {appointment.notes && (
                          <div>
                            <h4 className="text-xs font-medium mb-1">
                              Additional Notes
                            </h4>
                            <p className="text-xs">{appointment.notes}</p>
                          </div>
                        )}
                        {appointment.insuranceProvider && (
                          <div>
                            <h4 className="text-xs font-medium mb-1">
                              Insurance Provider
                            </h4>
                            <p className="text-xs">
                              {appointment.insuranceProvider}
                            </p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="dark:bg-input">
                    <CardContent className="p-3 space-y-2.5">
                      <h3 className="text-sm font-medium flex items-center gap-2">
                        <DollarSign className="h-4 w-4" />
                        Payment Information
                      </h3>
                      <div className="space-y-3">
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between text-xs">
                            <span>Duration:</span>
                            <span>{appointment.duration} minutes</span>
                          </div>
                          <div className="flex items-center justify-between text-xs">
                            <span>Session Fee:</span>
                            <span className="font-medium">
                              $
                              {appointment.payment?.amount ||
                                appointment.psychologistId?.sessionFee}{' '}
                              {appointment.payment?.currency?.toUpperCase()}
                            </span>
                          </div>
                        </div>

                        <div className="pt-2 border-t space-y-1.5">
                          <div className="flex items-center justify-between text-xs">
                            <span>Payment Status:</span>
                            <Badge
                              variant={getPaymentStatusVariant(
                                appointment.payment?.status
                              )}
                              className="capitalize"
                            >
                              {appointment.payment?.status || 'pending'}
                            </Badge>
                          </div>
                          {appointment.payment?.refundReason && (
                            <div className="flex items-center justify-between text-xs">
                              <span>Refund Reason:</span>
                              <span className="text-red-500">
                                {appointment.payment.refundReason}
                              </span>
                            </div>
                          )}
                          <div className="flex items-center justify-between text-xs">
                            <span>Payment ID:</span>
                            <span className="font-mono text-[10px]">
                              {appointment.payment?.stripePaymentId ||
                                appointment.stripePaymentIntentId}
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-xs">
                            <span>Payment Date:</span>
                            <span>
                              {appointment.payment?.createdAt
                                ? format(
                                    new Date(appointment.payment.createdAt),
                                    'MMM d, yyyy h:mm a'
                                  )
                                : 'Pending'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default AppointmentDialog;
