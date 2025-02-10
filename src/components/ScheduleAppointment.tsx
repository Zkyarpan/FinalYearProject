'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Award,
  Languages,
  Stethoscope,
  Clock3,
  DollarSign,
  Shield,
  MapPin,
  Star,
  Calendar,
} from 'lucide-react';

const BookingDialog = ({
  open,
  onOpenChange,
  selectedSlot,
  renderBookingContent,
}) => {
  if (!selectedSlot) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] p-0">
        <DialogHeader className="px-6 py-4 border-b">
          <DialogTitle className="text-xl">Schedule Appointment</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col">
          <Tabs defaultValue="psychologist" className="w-full">
            <TabsList className="w-full px-6 py-2 bg-background border-b">
              <div className="max-w-md mx-auto w-full grid grid-cols-2 gap-4">
                <TabsTrigger
                  value="psychologist"
                  className="data-[state=active]:bg-primary"
                >
                  Provider Details
                </TabsTrigger>
                <TabsTrigger
                  value="booking"
                  className="data-[state=active]:bg-primary"
                >
                  Book Session
                </TabsTrigger>
              </div>
            </TabsList>

            <TabsContent
              value="psychologist"
              className="p-6 focus:outline-none"
            >
              <ScrollArea className="h-[70vh] pr-4">
                <Card className="border-none shadow-none">
                  <CardContent className="p-0 space-y-6">
                    {/* Header Section */}
                    <div className="flex items-start gap-4 bg-secondary/20 p-4 rounded-lg">
                      <Avatar className="h-20 w-20 border-2 border-primary">
                        <AvatarImage src={selectedSlot.profilePhotoUrl} />
                        <AvatarFallback className="text-lg">
                          {selectedSlot.psychologistName
                            .split(' ')
                            .map(n => n[0])
                            .join('')}
                        </AvatarFallback>
                      </Avatar>
                      <div className="space-y-2">
                        <h3 className="text-xl font-semibold">
                          {selectedSlot.psychologistName}
                        </h3>
                        <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Award className="h-4 w-4 text-primary" />
                            <span>{selectedSlot.licenseType}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4 text-primary" />
                            <span>
                              {selectedSlot.yearsOfExperience} years exp.
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Star className="h-4 w-4 text-primary" />
                            <span>4.9 (120+ reviews)</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* About Section */}
                    <div className="space-y-2">
                      <h4 className="text-lg font-medium">About</h4>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {selectedSlot.about}
                      </p>
                    </div>

                    {/* Languages & Specializations */}
                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <Languages className="h-4 w-4 text-primary" />
                          <h4 className="font-medium">Languages</h4>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {selectedSlot.languages.map(lang => (
                            <Badge
                              key={lang}
                              variant="secondary"
                              className="rounded-full"
                            >
                              {lang}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <Stethoscope className="h-4 w-4 text-primary" />
                          <h4 className="font-medium">Specializations</h4>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {selectedSlot.specializations.map(spec => (
                            <Badge
                              key={spec}
                              variant="secondary"
                              className="rounded-full"
                            >
                              {spec}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Session Details */}
                    <div className="grid md:grid-cols-2 gap-6 bg-secondary/20 p-4 rounded-lg">
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <Clock3 className="h-4 w-4 text-primary" />
                          <h4 className="font-medium">Session Duration</h4>
                        </div>
                        <p className="text-2xl font-semibold">
                          {selectedSlot.sessionDuration} minutes
                        </p>
                      </div>

                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <DollarSign className="h-4 w-4 text-primary" />
                          <h4 className="font-medium">Session Fee</h4>
                        </div>
                        <p className="text-2xl font-semibold">
                          ${selectedSlot.sessionFee}
                        </p>
                      </div>
                    </div>

                    {/* Insurance Section */}
                    {selectedSlot.acceptsInsurance && (
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <Shield className="h-4 w-4 text-primary" />
                          <h4 className="font-medium">Insurance Accepted</h4>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {selectedSlot.insuranceProviders.map(provider => (
                            <Badge
                              key={provider}
                              variant="outline"
                              className="rounded-full"
                            >
                              {provider}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Location Section */}
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-primary" />
                        <h4 className="font-medium">Location</h4>
                      </div>
                      <div className="bg-secondary/20 p-4 rounded-lg">
                        <p className="text-sm">
                          Virtual Session via Secure Video Platform
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="booking" className="focus:outline-none">
              <div className="p-6">
                <ScrollArea className="h-[70vh]">
                  {renderBookingContent()}
                </ScrollArea>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BookingDialog;
