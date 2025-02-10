'use client';

import { useState, useEffect } from 'react';
import {
  Search,
  MapPin,
  GraduationCap,
  Phone,
  Video,
  Star,
  Calendar,
  Users,
  Languages,
  Filter,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import Link from 'next/link';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BookingDialog } from '@/components/BookingDialog';
import { useUserStore } from '@/store/userStore';
import LoginModal from '@/components/LoginModel';

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
  const [selectedFormat, setSelectedFormat] = useState('All');
  const [priceRange, setPriceRange] = useState('All');
  const [psychologists, setPsychologists] = useState<PsychologistProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const { user } = useUserStore();

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

  const specializations = [
    'All',
    ...new Set(psychologists.flatMap(p => p.specializations)),
  ];
  const sessionFormats = ['All', 'Video', 'Phone', 'In-person'];
  const priceRanges = ['All', '$50-100', '$100-150', '$150-200', '$200+'];

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

    const matchesFormat =
      selectedFormat === 'All' || psych.sessionFormats.includes(selectedFormat);

    const matchesPriceRange =
      priceRange === 'All' ||
      (priceRange === '$50-100' &&
        psych.sessionFee >= 50 &&
        psych.sessionFee <= 100) ||
      (priceRange === '$100-150' &&
        psych.sessionFee > 100 &&
        psych.sessionFee <= 150) ||
      (priceRange === '$150-200' &&
        psych.sessionFee > 150 &&
        psych.sessionFee <= 200) ||
      (priceRange === '$200+' && psych.sessionFee > 200);

    return (
      matchesSearch &&
      matchesSpecialization &&
      matchesLocation &&
      matchesFormat &&
      matchesPriceRange
    );
  });

  const handleNavigation = async (path, requireAuth = false) => {
    if (requireAuth && !user) {
      localStorage.setItem('redirectAfterLogin', path);
      setShowLoginModal(true);
      return false;
    }
    return true;
  };

  return (
    <div className="min-h-screen bg-gray-50/50 dark:bg-gray-900/50">
      <div className="text-white py-20 px-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e')]  bg-cover bg-center" />
        <div className="relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-5xl font-bold mb-6 leading-tight">
              Find Your Path to Mental Wellness
            </h1>
            <p className="text-xl opacity-90 mb-8 leading-relaxed">
              Connect with experienced, licensed psychologists who specialize in
              your needs. Take the first step towards a healthier mind with
              personalized care and support.
            </p>
            <div className="flex items-center justify-center gap-4">
              <Badge variant="secondary" className="px-4 py-2 text-lg">
                <Users className="w-4 h-4 mr-2" />
                {psychologists.length}+ Professionals
              </Badge>
              <Badge variant="secondary" className="px-4 py-2 text-lg">
                <Star className="w-4 h-4 mr-2" />
                Verified Experts
              </Badge>
              <Badge variant="secondary" className="px-4 py-2 text-lg">
                <Calendar className="w-4 h-4 mr-2" />
                Easy Scheduling
              </Badge>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto px-4 -mt-10 mb-12">
        <Card className="shadow-xl backdrop-blur-sm bg-white/90 dark:bg-gray-800/90">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <div className="relative col-span-2">
                <Input
                  type="text"
                  placeholder="Search by name, specialization, or license..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
                <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
              </div>

              <Select
                value={selectedSpecialization}
                onValueChange={setSelectedSpecialization}
              >
                <SelectTrigger>
                  <Filter className="w-4 h-4 mr-2" />
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

              <Select value={selectedFormat} onValueChange={setSelectedFormat}>
                <SelectTrigger>
                  <Video className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Session Format" />
                </SelectTrigger>
                <SelectContent>
                  {sessionFormats.map(format => (
                    <SelectItem key={format} value={format}>
                      {format}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={priceRange} onValueChange={setPriceRange}>
                <SelectTrigger>
                  <SelectValue placeholder="Price Range" />
                </SelectTrigger>
                <SelectContent>
                  {priceRanges.map(range => (
                    <SelectItem key={range} value={range}>
                      {range}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 gap-6 my-8">
          {filteredPsychologists.map(psych => (
            <Card
              key={psych.id}
              className="hover:shadow-lg transition-shadow duration-300"
            >
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row gap-6">
                  <div className="md:w-1/4">
                    <Link
                      href={`/psychologist/${psych.firstName}-${psych.lastName}`}
                    >
                      <div className="relative group">
                        <Avatar className="w-full h-64 rounded-lg border-2 border-white shadow-lg">
                          <AvatarImage
                            src={psych.profilePhoto}
                            alt={`${psych.firstName} ${psych.lastName}`}
                            className="object-cover"
                          />
                          <AvatarFallback className="text-4xl">
                            {psych.firstName[0]}
                            {psych.lastName[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-lg flex items-center justify-center">
                          <span className="text-white font-medium">
                            View Profile
                          </span>
                        </div>
                      </div>
                    </Link>
                    <div className="mt-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Session Fee</span>
                        <span className="font-semibold">
                          ${psych.sessionFee}
                        </span>
                      </div>
                      <Separator />
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Duration</span>
                        <span>{psych.sessionDuration} min</span>
                      </div>
                      <Separator />
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Experience</span>
                        <span>{psych.yearsOfExperience} years</span>
                      </div>
                    </div>
                  </div>

                  <div className="md:w-3/4">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <Link href={`/psychologist/${psych.id}`}>
                          <h2 className="text-2xl font-bold hover:text-blue-600 transition-colors">
                            Dr. {psych.firstName} {psych.lastName}
                          </h2>
                        </Link>
                        <p className="text-muted-foreground">
                          {psych.licenseType.replace(/_/g, ' ')}
                        </p>
                        <div className="flex items-center mt-2 text-muted-foreground">
                          <MapPin className="w-4 h-4 mr-1" />
                          <span>
                            {psych.city}, {psych.country}
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {psych.sessionFormats.map(format => (
                          <Badge
                            key={format}
                            variant="outline"
                            className="capitalize"
                          >
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

                    <Tabs defaultValue="about" className="mt-6">
                      <TabsList className="grid w-full grid-cols-3 mb-4">
                        <TabsTrigger value="about">About</TabsTrigger>
                        <TabsTrigger value="expertise">Expertise</TabsTrigger>
                        <TabsTrigger value="education">Education</TabsTrigger>
                      </TabsList>

                      <TabsContent value="about">
                        <p className="text-sm leading-relaxed">
                          {truncateText(psych.about, 300)}
                        </p>
                      </TabsContent>

                      <TabsContent value="expertise">
                        <div className="space-y-4">
                          <div>
                            <h3 className="font-medium mb-2">
                              Specializations
                            </h3>
                            <div className="flex flex-wrap gap-2">
                              {psych.specializations.map(spec => (
                                <Badge key={spec} variant="secondary">
                                  {spec}
                                </Badge>
                              ))}
                            </div>
                          </div>
                          <div>
                            <h3 className="font-medium mb-2">Age Groups</h3>
                            <div className="flex flex-wrap gap-2">
                              {psych.ageGroups.map(age => (
                                <Badge key={age} variant="outline">
                                  {age}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        </div>
                      </TabsContent>

                      <TabsContent value="education">
                        <div className="space-y-3">
                          {psych.education.map((edu, index) => (
                            <div key={index} className="flex items-center">
                              <GraduationCap className="w-5 h-5 mr-2 text-blue-600" />
                              <span>
                                {edu.degree} from {edu.university} (
                                {edu.graduationYear})
                              </span>
                            </div>
                          ))}
                        </div>
                      </TabsContent>
                    </Tabs>

                    <div className="mt-6 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center">
                          <Languages className="w-4 h-4 mr-2 text-muted-foreground" />
                          <span className="text-sm">
                            {psych.languages.join(' • ')}
                          </span>
                        </div>
                        <div
                          className={`flex items-center ${
                            psych.acceptingNewClients
                              ? 'text-green-600'
                              : 'text-red-600'
                          }`}
                        >
                          <div
                            className={`w-2 h-2 rounded-full mr-2 ${
                              psych.acceptingNewClients
                                ? 'bg-green-600'
                                : 'bg-red-600'
                            }`}
                          />
                          <span className="text-sm font-medium">
                            {psych.acceptingNewClients
                              ? 'Accepting new clients'
                              : 'Not accepting new clients'}
                          </span>
                        </div>
                      </div>
                      <BookingDialog handleNavigation={handleNavigation} />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <LoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
      />
    </div>
  );
};

export default PsychologistDirectory;
