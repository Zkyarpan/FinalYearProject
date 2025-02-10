'use client';

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
import { Separator } from '@/components/ui/separator';
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
  MapPin,
  Brain,
  FileText,
  HeartPulse,
  AlertTriangle,
  MessageCircle,
  CalendarDays,
  History,
  X,
  ClipboardList,
} from 'lucide-react';
import { format } from 'date-fns';
import Users from '@/icons/User';

const AppointmentDialog = ({ appointment, isOpen, onClose, onJoinSession }) => {
  if (!appointment) return null;

  const { profile } = appointment.userId;

  const handleJoinSession = () => {
    if (appointment.videoCallLink) {
      onJoinSession(appointment.videoCallLink);
    } else {
      toast.info('Video call feature will be available soon.', {
        duration: 3000,
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl p-0 gap-0 overflow-hidden">
        <DialogHeader className="px-4 pt-4 pb-3 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-10 border-b flex-row items-center justify-between">
          <div>
            <DialogTitle className="text-lg flex items-center gap-2">
              <Users />
              Patient Details
            </DialogTitle>
            <DialogDescription className="text-xs mt-1">
              Session and profile information
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
                  <Avatar className="h-16 w-16">
                    <AvatarImage src={profile?.image} />
                    <AvatarFallback className="bg-primary/10 text-xl">
                      {appointment.patientName
                        ?.split(' ')
                        .map(n => n[0])
                        .join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h2 className="text-lg font-semibold truncate">
                          {appointment.patientName}
                        </h2>
                        <div className="flex items-center gap-2 mt-0.5 text-sm text-muted-foreground">
                          <span>{profile?.age} years</span>
                          <span>•</span>
                          <span>{profile?.gender}</span>
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

                    <div className="mt-3">
                      <h3 className="text-xs font-medium text-muted-foreground mb-1.5">
                        Primary Concerns
                      </h3>
                      <div className="flex flex-wrap gap-1.5">
                        {profile?.struggles?.map((struggle, index) => (
                          <Badge
                            key={index}
                            variant="outline"
                            className="px-2 py-0.5 text-xs"
                          >
                            <Brain className="w-3 h-3 mr-1" />
                            {struggle}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Tabs defaultValue="session" className="w-full">
              <div className="flex items-center justify-between">
                <TabsList className="w-[56%] justify-start h-9 bg-muted/50">
                  <TabsTrigger value="session" className="gap-1.5 text-xs">
                    <Calendar className="h-3.5 w-3.5" />
                    Session
                  </TabsTrigger>
                  <TabsTrigger value="profile" className="gap-1.5 text-xs">
                    <User className="h-3.5 w-3.5" />
                    Profile
                  </TabsTrigger>
                  <TabsTrigger value="booking" className="gap-1.5 text-xs">
                    <ClipboardList className="h-3.5 w-3.5" />
                    Booking
                  </TabsTrigger>
                  <TabsTrigger value="history" className="gap-1.5 text-xs">
                    <History className="h-3.5 w-3.5" />
                    History
                  </TabsTrigger>
                </TabsList>
                {appointment.sessionFormat === 'video' && (
                  <Button size="sm" onClick={handleJoinSession}>
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
                            {format(
                              new Date(appointment.dateTime),
                              'EEEE, MMMM d, yyyy'
                            )}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-xs">
                          <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                          <span>
                            {format(new Date(appointment.dateTime), 'h:mm a')} -{' '}
                            {format(new Date(appointment.endTime), 'h:mm a')}
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
                        <div className="flex items-center gap-2 text-xs">
                          <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                          <span>{profile?.address}</span>
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
                        <FileText className="h-4 w-4" />
                        Patient Notes
                      </h3>
                      <p className="text-xs leading-relaxed">
                        {profile?.briefBio}
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="dark:bg-input">
                    <CardContent className="p-3 space-y-2.5">
                      <h3 className="text-sm font-medium flex items-center gap-2 text-destructive">
                        <AlertTriangle className="h-4 w-4" />
                        Emergency Contact
                      </h3>
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2 text-xs">
                          <User className="h-3.5 w-3.5 " />
                          <span>{profile?.emergencyContact}</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs">
                          <Phone className="h-3.5 w-3.5" />
                          <span>{profile?.emergencyPhone}</span>
                        </div>
                      </div>
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
                          <h4 className="text-xs font-medium  mb-1">
                            Reason for Visit
                          </h4>
                          <p className="text-xs ">
                            {appointment.reasonForVisit}
                          </p>
                        </div>
                        <div>
                          <h4 className="text-xs font-medium  mb-1">
                            Additional Notes
                          </h4>
                          <p className="text-xs">{appointment.notes}</p>
                        </div>
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
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <span>Duration:</span>
                          <span>{appointment.duration} minutes</span>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span>Payment ID:</span>
                          <span className="font-mono">
                            {appointment.stripePaymentIntentId}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
              <TabsContent value="history" className="mt-3">
                <div className="grid grid-cols-2 gap-4">
                  <Card className="dark:bg-input">
                    <CardContent className="p-3 space-y-2.5">
                      <h3 className="text-sm font-medium flex items-center gap-2">
                        <HeartPulse className="h-4 w-4" />
                        Therapy Background
                      </h3>
                      <p className="text-xs leading-relaxed">
                        {profile?.therapyHistory}
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="dark:bg-input">
                    <CardContent className="p-3 space-y-2.5">
                      <h3 className="text-sm font-medium flex items-center gap-2">
                        <MessageCircle className="h-4 w-4" />
                        Communication Preference
                      </h3>
                      <Badge variant="outline" className="text-xs">
                        {profile?.preferredCommunication}
                      </Badge>
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
