'use client';

import { useState, useEffect } from 'react';
import {
  Star,
  Search,
  MapPin,
  Filter,
  ArrowUpDown,
  CalendarDays,
  Clock,
  GraduationCap,
  Award,
  Heart,
  Mail,
  Phone,
  Video,
  Loader2,
  ArrowRight,
} from 'lucide-react';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Link from 'next/link';

interface Education {
  degree: string;
  university: string;
  graduationYear: number;
}

interface Availability {
  available: boolean;
  startTime: string;
  endTime: string;
}

interface PsychologistProfile {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  country: string;
  city: string;
  about: string;
  profilePhoto: string;
  licenseType: string;
  yearsOfExperience: number;
  education: Education[];
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
    monday: Availability;
    tuesday: Availability;
    wednesday: Availability;
    thursday: Availability;
    friday: Availability;
    saturday: Availability;
    sunday: Availability;
  };
}

interface ApiResponse {
  StatusCode: number;
  IsSuccess: boolean;
  ErrorMessage: string[];
  Result: {
    message: string;
    psychologists: PsychologistProfile[];
  };
}

const truncateText = (text: string, maxLength: number) => {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
};

const PsychologistDirectory = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSpecialization, setSelectedSpecialization] = useState('All');
  const [selectedLocation, setSelectedLocation] = useState('All');
  const [psychologists, setPsychologists] = useState<PsychologistProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPsychologists = async () => {
      try {
        const response = await fetch('/api/psychologist/profile');
        const data: ApiResponse = await response.json();

        if (data.IsSuccess && data.Result.psychologists) {
          setPsychologists(data.Result.psychologists);
        } else {
          setError(
            Array.isArray(data.ErrorMessage)
              ? data.ErrorMessage[0]
              : 'Failed to fetch psychologist data'
          );
        }
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : 'Failed to fetch psychologist data'
        );
      } finally {
        setLoading(false);
      }
    };

    fetchPsychologists();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-2">Error</h2>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  if (!psychologists || psychologists.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">No Data Available</h2>
          <p className="text-gray-600">No psychologists found.</p>
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

  const filteredPsychologists = psychologists.filter(psych => {
    const matchesSearch =
      psych.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      psych.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      psych.licenseType.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesSpecialization =
      selectedSpecialization === 'All' ||
      psych.specializations.includes(selectedSpecialization);

    const matchesLocation =
      selectedLocation === 'All' ||
      `${psych.city}, ${psych.country}` === selectedLocation;

    return matchesSearch && matchesSpecialization && matchesLocation;
  });

  const specializations = [
    'All',
    ...new Set(psychologists.flatMap(p => p.specializations)),
  ];
  const locations = [
    'All',
    ...new Set(psychologists.map(p => `${p.city}, ${p.country}`)),
  ];

  return (
    <div className="min-h-screen">
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white py-16 rounded-2xl">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl font-bold mb-4">
            Find Your Perfect Mental Health Match
          </h1>
          <p className="text-xl opacity-90 max-w-2xl mx-auto">
            Connect with licensed psychologists who understand your needs and
            can help you thrive. Book online consultations with experts from
            around the country.
          </p>
        </div>
      </div>

      <div className="mx-auto px-4 -mt-8 mb-12">
        <Card className="shadow-lg">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="relative">
                <Input
                  type="text"
                  placeholder="Search..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
                <Search className="absolute left-3 top-3 w-4 h-4" />
              </div>

              <Select
                value={selectedSpecialization}
                onValueChange={setSelectedSpecialization}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Specialization" />
                </SelectTrigger>
                <SelectContent>
                  {specializations.map(spec => (
                    <SelectItem key={spec} value={spec}>
                      {spec}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={selectedLocation}
                onValueChange={setSelectedLocation}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Location" />
                </SelectTrigger>
                <SelectContent>
                  {locations.map(loc => (
                    <SelectItem key={loc} value={loc}>
                      {loc}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="default" className="w-full">
                    <ArrowUpDown className="mr-2 h-4 w-4" />
                    Sort by
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem>Years of Experience</DropdownMenuItem>
                  <DropdownMenuItem>Session Fee</DropdownMenuItem>
                  <DropdownMenuItem>Availability</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 my-6">
          {filteredPsychologists.map(psych => (
            <Card key={psych.id} className="relative">
              <Link
                href={`/psychologists/${psych.firstName}-${psych.lastName}`}
              >
                <CardHeader className="pb-4">
                  <div className="flex items-start space-x-4">
                    <Avatar className="w-24 h-24 rounded-lg border-2 border-white shadow-lg">
                      <AvatarImage
                        src={psych.profilePhoto}
                        alt={`${psych.firstName} ${psych.lastName}`}
                      />
                      <AvatarFallback>
                        {psych.firstName[0]}
                        {psych.lastName[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-xl">
                            Dr. {psych.firstName} {psych.lastName}
                          </CardTitle>
                          <CardDescription className="text-base">
                            {psych.licenseType.replace(/_/g, ' ').toUpperCase()}
                          </CardDescription>
                        </div>
                      </div>
                      <div className="flex items-center mt-2">
                        <MapPin className="w-4 h-4 mr-1" />
                        <span>
                          {psych.city}, {psych.country}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardHeader>
              </Link>

              <CardContent>
                <Tabs defaultValue="about">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="about">About</TabsTrigger>
                    <TabsTrigger value="experience">Experience</TabsTrigger>
                    <TabsTrigger value="booking">Booking</TabsTrigger>
                  </TabsList>
                  <TabsContent value="about" className="space-y-4 mt-4">
                    <p className="text-sm text-justify leading-relaxed my-2 mx-0">
                      {truncateText(psych.about, 200)}
                    </p>
                    <div>
                      <h3 className="text-lg font-semibold mb-3">
                        Specializations
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {psych.specializations.map(spec => (
                          <Badge key={spec} variant="default">
                            {spec}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div className="mt-4">
                      <h4 className="font-semibold mb-2">Age Groups</h4>
                      <div className="flex flex-wrap gap-2">
                        {psych.ageGroups.map(age => (
                          <Badge key={age} variant="default">
                            {age}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </TabsContent>
                  <TabsContent value="experience" className="space-y-4 mt-4">
                    <div className="space-y-3">
                      {psych.education.map((edu, index) => (
                        <div key={index} className="flex items-center">
                          <GraduationCap className="w-5 h-5 mr-2" />
                          <span className="text-sm">
                            {edu.degree} from {edu.university} (
                            {edu.graduationYear})
                          </span>
                        </div>
                      ))}
                      <div className="flex items-center">
                        <Clock className="w-5 h-5 mr-2" />
                        <span className="text-sm">
                          {psych.yearsOfExperience} years of experience
                        </span>
                      </div>
                    </div>
                  </TabsContent>
                  <TabsContent value="booking" className="space-y-4 mt-4">
                    <div className="flex items-center justify-between">
                      <div className="flex gap-2">
                        {psych.sessionFormats.map(format => (
                          <Badge key={format} variant="outline">
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
                      <span className="text-sm">
                        ${psych.sessionFee}/session
                      </span>
                    </div>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button className="w-full">
                          <CalendarDays className="mr-2 h-4 w-4" />
                          Book Consultation
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                          <DialogTitle>Schedule a Consultation</DialogTitle>
                          <DialogDescription>
                            Choose an available time slot with Dr.{' '}
                            {psych.firstName} {psych.lastName}
                          </DialogDescription>
                        </DialogHeader>
                        <div className="py-4">
                          {getAvailableTimeSlots(psych.availability).length >
                          0 ? (
                            <div className="grid grid-cols-2 gap-4">
                              {getAvailableTimeSlots(psych.availability).map(
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
                  </TabsContent>
                </Tabs>
              </CardContent>

              <CardFooter className="border-t p-5">
                <div className="flex items-center justify-between w-full text-xs">
                  <div className="flex items-center space-x-2">
                    <div
                      className={`w-2 h-2 rounded-full ${psych.acceptingNewClients ? 'bg-green-500' : 'bg-red-500'}`}
                    />
                    <span className="font-medium">
                      {psych.acceptingNewClients
                        ? 'Accepting new clients'
                        : 'Not accepting new clients'}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-medium">Language:</span>
                    <span>{psych.languages.join(' • ')}</span>
                  </div>
                </div>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PsychologistDirectory;
