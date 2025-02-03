'use client';

import { useState } from 'react';

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
import { Separator } from '@/components/ui/separator';
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

const PsychologistDirectory = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSpecialization, setSelectedSpecialization] = useState('All');
  const [selectedLocation, setSelectedLocation] = useState('All');

  const psychologists = [
    {
      id: 1,
      firstName: 'Sarah',
      lastName: 'Smith',
      role: 'Clinical Psychologist',
      specializations: ['Anxiety', 'Depression', 'CBT'],
      rating: 4.9,
      reviewCount: 128,
      city: 'Boston',
      state: 'MA',
      experience: '15+ years',
      nextAvailable: 'Tomorrow',
      photoUrl:
        'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&h=400&fit=crop',
      featured: true,
      bio: 'Specialized in treating anxiety and depression using evidence-based approaches with over 15 years of experience helping individuals overcome life challenges.',
      education: 'Ph.D. in Clinical Psychology, Harvard University',
      certifications: [
        'Licensed Clinical Psychologist',
        'CBT Certified',
        'EMDR Certified',
      ],
      languages: ['English', 'Spanish'],
      insurances: ['Blue Cross', 'Aetna', 'United Healthcare'],
      sessionTypes: ['In-person', 'Video', 'Phone'],
      sessionFee: '$150-200',
      availableSlots: [
        { time: '9:00 AM', date: 'Mon, May 1' },
        { time: '2:00 PM', date: 'Mon, May 1' },
        { time: '4:30 PM', date: 'Tue, May 2' },
        { time: '10:00 AM', date: 'Wed, May 3' },
      ],
    },
    {
      id: 3,
      firstName: 'Sarah',
      lastName: 'Smith',
      role: 'Clinical Psychologist',
      specializations: ['Anxiety', 'Depression', 'CBT'],
      rating: 4.9,
      reviewCount: 128,
      city: 'Boston',
      state: 'MA',
      experience: '15+ years',
      nextAvailable: 'Tomorrow',
      photoUrl:
        'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&h=400&fit=crop',
      featured: true,
      bio: 'Specialized in treating anxiety and depression using evidence-based approaches with over 15 years of experience helping individuals overcome life challenges.',
      education: 'Ph.D. in Clinical Psychology, Harvard University',
      certifications: [
        'Licensed Clinical Psychologist',
        'CBT Certified',
        'EMDR Certified',
      ],
      languages: ['English', 'Spanish'],
      insurances: ['Blue Cross', 'Aetna', 'United Healthcare'],
      sessionTypes: ['In-person', 'Video', 'Phone'],
      sessionFee: '$150-200',
      availableSlots: [
        { time: '9:00 AM', date: 'Mon, May 1' },
        { time: '2:00 PM', date: 'Mon, May 1' },
        { time: '4:30 PM', date: 'Tue, May 2' },
        { time: '10:00 AM', date: 'Wed, May 3' },
      ],
    },
    {
      id: 4,
      firstName: 'Sarah',
      lastName: 'Smith',
      role: 'Clinical Psychologist',
      specializations: ['Anxiety', 'Depression', 'CBT'],
      rating: 4.9,
      reviewCount: 128,
      city: 'Boston',
      state: 'MA',
      experience: '15+ years',
      nextAvailable: 'Tomorrow',
      photoUrl:
        'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&h=400&fit=crop',
      featured: true,
      bio: 'Specialized in treating anxiety and depression using evidence-based approaches with over 15 years of experience helping individuals overcome life challenges.',
      education: 'Ph.D. in Clinical Psychology, Harvard University',
      certifications: [
        'Licensed Clinical Psychologist',
        'CBT Certified',
        'EMDR Certified',
      ],
      languages: ['English', 'Spanish'],
      insurances: ['Blue Cross', 'Aetna', 'United Healthcare'],
      sessionTypes: ['In-person', 'Video', 'Phone'],
      sessionFee: '$150-200',
      availableSlots: [
        { time: '9:00 AM', date: 'Mon, May 1' },
        { time: '2:00 PM', date: 'Mon, May 1' },
        { time: '4:30 PM', date: 'Tue, May 2' },
        { time: '10:00 AM', date: 'Wed, May 3' },
      ],
    },
    {
      id: 5,
      firstName: 'Sarah',
      lastName: 'Smith',
      role: 'Clinical Psychologist',
      specializations: ['Anxiety', 'Depression', 'CBT'],
      rating: 4.9,
      reviewCount: 128,
      city: 'Boston',
      state: 'MA',
      experience: '15+ years',
      nextAvailable: 'Tomorrow',
      photoUrl:
        'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&h=400&fit=crop',
      featured: true,
      bio: 'Specialized in treating anxiety and depression using evidence-based approaches with over 15 years of experience helping individuals overcome life challenges.',
      education: 'Ph.D. in Clinical Psychology, Harvard University',
      certifications: [
        'Licensed Clinical Psychologist',
        'CBT Certified',
        'EMDR Certified',
      ],
      languages: ['English', 'Spanish'],
      insurances: ['Blue Cross', 'Aetna', 'United Healthcare'],
      sessionTypes: ['In-person', 'Video', 'Phone'],
      sessionFee: '$150-200',
      availableSlots: [
        { time: '9:00 AM', date: 'Mon, May 1' },
        { time: '2:00 PM', date: 'Mon, May 1' },
        { time: '4:30 PM', date: 'Tue, May 2' },
        { time: '10:00 AM', date: 'Wed, May 3' },
      ],
    },
    {
      id: 6,
      firstName: 'Sarah',
      lastName: 'Smith',
      role: 'Clinical Psychologist',
      specializations: ['Anxiety', 'Depression', 'CBT'],
      rating: 4.9,
      reviewCount: 128,
      city: 'Boston',
      state: 'MA',
      experience: '15+ years',
      nextAvailable: 'Tomorrow',
      photoUrl:
        'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&h=400&fit=crop',
      featured: true,
      bio: 'Specialized in treating anxiety and depression using evidence-based approaches with over 15 years of experience helping individuals overcome life challenges.',
      education: 'Ph.D. in Clinical Psychology, Harvard University',
      certifications: [
        'Licensed Clinical Psychologist',
        'CBT Certified',
        'EMDR Certified',
      ],
      languages: ['English', 'Spanish'],
      insurances: ['Blue Cross', 'Aetna', 'United Healthcare'],
      sessionTypes: ['In-person', 'Video', 'Phone'],
      sessionFee: '$150-200',
      availableSlots: [
        { time: '9:00 AM', date: 'Mon, May 1' },
        { time: '2:00 PM', date: 'Mon, May 1' },
        { time: '4:30 PM', date: 'Tue, May 2' },
        { time: '10:00 AM', date: 'Wed, May 3' },
      ],
    },
  ];

  const specializations = [
    'All',
    'Anxiety',
    'Depression',
    'CBT',
    'Trauma',
    'Family Therapy',
    'Child Therapy',
    'Addiction',
  ];

  const locations = [
    'All',
    'Boston, MA',
    'New York, NY',
    'Los Angeles, CA',
    'Chicago, IL',
    'Houston, TX',
  ];

  const filteredPsychologists = psychologists.filter(psych => {
    const matchesSearch =
      psych.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      psych.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      psych.role.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesSpecialization =
      selectedSpecialization === 'All' ||
      psych.specializations.includes(selectedSpecialization);

    const matchesLocation =
      selectedLocation === 'All' ||
      `${psych.city}, ${psych.state}` === selectedLocation;

    return matchesSearch && matchesSpecialization && matchesLocation;
  });

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white  py-16 rounded-2xl">
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

      {/* Search and Filter Section */}
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
                <Search className="absolute left-3 top-3  w-4 h-4" />
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
                  <Button variant="outline" className="w-full">
                    <ArrowUpDown className="mr-2 h-4 w-4" />
                    Sort by
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem>Highest Rated</DropdownMenuItem>
                  <DropdownMenuItem>Most Reviews</DropdownMenuItem>
                  <DropdownMenuItem>Years of Experience</DropdownMenuItem>
                  <DropdownMenuItem>Earliest Available</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </CardContent>
        </Card>

        {/* Results Summary */}
        <div className="flex justify-between items-center my-6">
          <p className="">
            Showing {filteredPsychologists.length} psychologists
          </p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <Filter className="w-4 h-4 mr-2" />
              More Filters
            </Button>
          </div>
        </div>

        {/* Psychologists Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredPsychologists.map(psych => (
            <Card key={psych.id} className="relative cursor-pointer">
              {psych.featured && (
                <div className="absolute -top-3 -right-3 z-10">
                  <Badge className="bg-blue-600 text-white">
                    <Award className="w-4 h-4 mr-1" />
                    Featured Expert
                  </Badge>
                </div>
              )}

              <CardHeader className="pb-4">
                <div className="flex items-start space-x-4">
                  <Avatar className="w-24 h-24 rounded-lg border-4 border-white shadow-lg">
                    <AvatarImage
                      src={psych.photoUrl}
                      alt={`${psych.firstName} ${psych.lastName}`}
                    />
                    <AvatarFallback className="text-lg">
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
                          {psych.role}
                        </CardDescription>
                      </div>
                      <Button variant="ghost" size="icon">
                        <Heart className="w-5 h-5" />
                      </Button>
                    </div>
                    <div className="flex items-center mt-2">
                      <Star className="w-5 h-5 text-yellow-400 fill-current" />
                      <span className="ml-2 font-medium">{psych.rating}</span>
                      <span className="mx-1">•</span>
                      <span>{psych.reviewCount} reviews</span>
                    </div>
                  </div>
                </div>
              </CardHeader>

              <CardContent>
                <Tabs defaultValue="about">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="about">About</TabsTrigger>
                    <TabsTrigger value="experience">Experience</TabsTrigger>
                    <TabsTrigger value="booking">Booking</TabsTrigger>
                  </TabsList>
                  <TabsContent value="about" className="space-y-4 mt-4">
                    <p className="text-sm">{psych.bio}</p>
                    <div className="flex flex-wrap gap-2">
                      {psych.specializations.map(spec => (
                        <Badge key={spec} variant="secondary">
                          {spec}
                        </Badge>
                      ))}
                    </div>
                  </TabsContent>
                  <TabsContent value="experience" className="space-y-4 mt-4">
                    <div className="space-y-3">
                      <div className="flex items-center">
                        <GraduationCap className="w-5 h-5 mr-2" />
                        <span className="text-sm">{psych.education}</span>
                      </div>
                      <div className="flex items-center">
                        <Clock className="w-5 h-5 mr-2" />
                        <span className="text-sm">
                          {psych.experience} experience
                        </span>
                      </div>
                      <div className="flex items-center">
                        <MapPin className="w-5 h-5 mr-2" />
                        <span className="text-sm">
                          {psych.city}, {psych.state}
                        </span>
                      </div>
                    </div>
                  </TabsContent>
                  <TabsContent value="booking" className="space-y-4 mt-4">
                    <div className="flex items-center justify-between">
                      <div className="flex gap-2">
                        {psych.sessionTypes.map((type, index) => (
                          <Badge key={index} variant="outline">
                            {type === 'Video' && (
                              <Video className="w-3 h-3 mr-1" />
                            )}
                            {type === 'Phone' && (
                              <Phone className="w-3 h-3 mr-1" />
                            )}
                            {type}
                          </Badge>
                        ))}
                      </div>
                      <span className="text-sm">From {psych.sessionFee}</span>
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
                        <div className="grid grid-cols-2 gap-4 py-4">
                          {psych.availableSlots.map((slot, index) => (
                            <Button
                              key={index}
                              variant="outline"
                              className="w-full justify-start"
                            >
                              <div className="text-left">
                                <div className="font-medium">{slot.time}</div>
                                <div className="text-xs">{slot.date}</div>
                              </div>
                            </Button>
                          ))}
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
                  <span>Next available: {psych.nextAvailable}</span>
                  <span>{psych.languages.join(' • ')}</span>
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
