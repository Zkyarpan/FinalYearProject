'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Skeleton } from '@/components/ui/skeleton';
import {
  ArrowLeft,
  CalendarDays,
  Clock,
  GraduationCap,
  Loader2,
  Mail,
  MapPin,
  Phone,
  Video,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { generatePsychologistSlug } from '@/helpers/generateSlug';

interface PsychologistProfile {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  country: string;
  streetAddress: string;
  city: string;
  about: string;
  profilePhoto: string;
  certificateOrLicense: string;
  licenseType: string;
  licenseNumber: string;
  yearsOfExperience: number;
  education: Array<{
    degree: string;
    university: string;
    graduationYear: string;
  }>;
  languages: string[];
  specializations: string[];
  sessionDuration: number;
  sessionFee: number;
  sessionFormats: string[];
  acceptsInsurance: boolean;
  insuranceProviders: string[];
  acceptingNewClients: boolean;
  ageGroups: string[];
  availability: {
    [key: string]: {
      available: boolean;
      startTime: string;
      endTime: string;
    };
  };
  fullName: string;
}

interface ErrorMessage {
  message: string;
}

interface ApiResponse {
  StatusCode: number;
  IsSuccess: boolean;
  ErrorMessage: ErrorMessage[];
  Result: {
    message: string;
    psychologist: PsychologistProfile;
  } | null;
}

export default function PsychologistProfile() {
  const params = useParams();
  const [psychologist, setPsychologist] = useState<PsychologistProfile | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPsychologist = async () => {
      setLoading(true);
      setError(null);

      try {
        if (!params?.slug) {
          throw new Error('Psychologist not found');
        }

        const slug = params.slug;

        const response = await fetch(`/api/psychologist/${slug}`);

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(
            errorData.ErrorMessage?.[0]?.message ||
              'Failed to load psychologist data'
          );
        }

        const data = await response.json();

        if (!data.IsSuccess || !data.Result?.psychologist) {
          throw new Error(
            data.ErrorMessage?.[0]?.message || 'Psychologist not found'
          );
        }

        setPsychologist(data.Result.psychologist);
      } catch (error) {
        const errorMessage =
          error instanceof Error
            ? error.message
            : 'Failed to load psychologist data';
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    if (params?.slug) {
      fetchPsychologist();
    }
  }, [params?.slug, setPsychologist]);

  if (loading) {
    return (
      <div className="min-h-screen">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-5xl mx-auto">
            <div className="grid md:grid-cols-3 gap-8">
              <div className="md:col-span-1">
                <Skeleton className="aspect-square rounded-2xl w-full mb-4 dark:bg-input" />
                <Skeleton className="h-8 w-3/4 mb-2 dark:bg-input" />
                <Skeleton className="h-4 w-1/2 mb-4 dark:bg-input" />
                <div className="space-y-4">
                  <Skeleton className="h-6 w-full dark:bg-input" />
                  <Skeleton className="h-6 w-full dark:bg-input" />
                  <Skeleton className="h-6 w-full dark:bg-input" />
                </div>
              </div>
              <div className="md:col-span-2">
                <div className="space-y-6">
                  <Skeleton className="h-10 w-full dark:bg-input" />
                  <div className="space-y-4">
                    <Skeleton className="h-4 w-full dark:bg-input" />
                    <Skeleton className="h-4 w-5/6 dark:bg-input" />
                    <Skeleton className="h-4 w-4/5 dark:bg-input" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !psychologist) {
    return (
      <div className="min-h-screen">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
              {error || 'Psychologist not found'}
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mb-8">
              The psychologist profile you're looking for might have been
              removed or is temporarily unavailable.
            </p>
            <Link
              href="/psychologists"
              className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-semibold"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Directory
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const getAvailableTimeSlots = (
    availability: PsychologistProfile['availability']
  ) => {
    const slots: { day: string; startTime: string; endTime: string }[] = [];
    Object.entries(availability).forEach(([day, time]) => {
      if (time.available && time.startTime && time.endTime) {
        slots.push({
          day,
          startTime: time.startTime,
          endTime: time.endTime,
        });
      }
    });
    return slots;
  };

  return (
    <div className="min-h-screen max-w-5xl mx-auto px-4 py-8">
      <div className="grid md:grid-cols-3 gap-8">
        <div className="md:col-span-1">
          <div className="sticky top-24">
            <div className="aspect-square rounded-2xl overflow-hidden mb-4">
              <img
                src={psychologist.profilePhoto}
                alt={psychologist.fullName}
                className="w-full h-full object-cover"
              />
            </div>
            <h1 className="text-2xl font-bold mb-2">{psychologist.fullName}</h1>
            <p className="text-muted-foreground mb-4">
              {psychologist.licenseType.replace(/_/g, ' ').toUpperCase()}
            </p>
            <div className="flex items-center mb-4">
              <MapPin className="w-4 h-4 mr-2" />
              <span>
                {psychologist.city}, {psychologist.country}
              </span>
            </div>
            <div className="space-y-2 mb-6">
              <div className="flex items-center">
                <Clock className="w-4 h-4 mr-2" />
                <span>
                  {psychologist.yearsOfExperience} years of experience
                </span>
              </div>
              <div className="flex items-center">
                <Mail className="w-4 h-4 mr-2" />
                <span>{psychologist.email}</span>
              </div>
            </div>
            <Dialog>
              <DialogTrigger asChild>
                <Button className="w-full mb-3">
                  <CalendarDays className="mr-2 h-4 w-4" />
                  Book Consultation
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Schedule a Consultation</DialogTitle>
                  <DialogDescription>
                    Choose an available time slot with {psychologist.fullName}
                  </DialogDescription>
                </DialogHeader>
                <div className="py-4">
                  {getAvailableTimeSlots(psychologist.availability).length >
                  0 ? (
                    <div className="grid grid-cols-2 gap-4">
                      {getAvailableTimeSlots(psychologist.availability).map(
                        (slot, index) => (
                          <Button
                            key={index}
                            variant="outline"
                            className="w-full justify-start"
                          >
                            <div className="text-left">
                              <div className="font-medium capitalize">
                                {slot.day}
                              </div>
                              <div className="text-xs">
                                {slot.startTime} - {slot.endTime}
                              </div>
                            </div>
                          </Button>
                        )
                      )}
                    </div>
                  ) : (
                    <p className="text-center text-muted-foreground">
                      No available time slots. Please contact for custom
                      scheduling.
                    </p>
                  )}
                </div>
                <DialogFooter>
                  <Button variant="outline" className="w-full">
                    <Mail className="mr-2 h-4 w-4" />
                    Request Custom Time
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            <Button variant="outline" className="w-full">
              <Phone className="mr-2 h-4 w-4" />
              Contact
            </Button>
          </div>
        </div>

        <div className="md:col-span-2">
          <Tabs defaultValue="about" className="w-full">
            <TabsList className="w-full">
              <TabsTrigger value="about" className="flex-1">
                About
              </TabsTrigger>
              <TabsTrigger value="experience" className="flex-1">
                Experience
              </TabsTrigger>
              <TabsTrigger value="services" className="flex-1">
                Services
              </TabsTrigger>
            </TabsList>

            <TabsContent value="about" className="space-y-6">
              <div className="prose dark:prose-invert max-w-none">
                <p className="text-sm text-justify leading-relaxed my-2 mx-0">
                  {psychologist.about}
                </p>
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-3">Specializations</h3>
                <div className="flex flex-wrap gap-2">
                  {psychologist.specializations.map(spec => (
                    <Badge key={spec} variant="default">
                      {spec}
                    </Badge>
                  ))}
                </div>
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-3">Age Groups</h3>
                <div className="flex flex-wrap gap-2">
                  {psychologist.ageGroups.map(age => (
                    <Badge key={age} variant="default">
                      {age}
                    </Badge>
                  ))}
                </div>
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-3">Languages</h3>
                <div className="flex flex-wrap gap-2">
                  {psychologist.languages.map(lang => (
                    <Badge key={lang} variant="default">
                      {lang}
                    </Badge>
                  ))}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="experience" className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-3">Education</h3>
                <div className="space-y-4">
                  {psychologist.education.map((edu, index) => (
                    <div key={index} className="flex items-start">
                      <GraduationCap className="w-5 h-5 mr-3 mt-1" />
                      <div>
                        <p className="font-medium">{edu.degree}</p>
                        <p className="text-sm text-muted-foreground">
                          {edu.university}, {edu.graduationYear}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="services" className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-3">
                  Session Information
                </h3>
                <div className="grid gap-4">
                  <div className="flex justify-between items-center p-4 rounded-lg border">
                    <span>Session Duration</span>
                    <span className="font-medium">
                      {psychologist.sessionDuration} minutes
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-4 rounded-lg border">
                    <span>Session Fee</span>
                    <span className="font-medium">
                      ${psychologist.sessionFee}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-4 rounded-lg border">
                    <span>Session Formats</span>
                    <div className="flex gap-2">
                      {psychologist.sessionFormats.map(format => (
                        <Badge key={format} variant="default">
                          {format === 'video' && (
                            <Video className="w-3 h-3 mr-1" />
                          )}
                          {format === 'phone' && (
                            <Phone className="w-3 h-3 mr-1" />
                          )}
                          {format}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              {psychologist.acceptsInsurance && (
                <div>
                  <h3 className="text-lg font-semibold mb-3">
                    Insurance Providers
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {psychologist.insuranceProviders.map(provider => (
                      <Badge key={provider} variant="outline">
                        {provider}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
