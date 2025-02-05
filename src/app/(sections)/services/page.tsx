'use client';

import {
  Brain,
  Users,
  Calendar,
  Clock,
  Star,
  CheckCircle,
  ArrowRight,
  MessageSquare,
  Video,
  Phone,
  Shield,
  Award,
  Sparkles,
  BadgeCheck,
  Heart,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from '@/components/ui/hover-card';

const ServicesPage = () => {
  const services = [
    {
      title: 'Individual Therapy',
      description: 'One-on-one counseling sessions tailored to your needs',
      icon: <MessageSquare className="w-6 h-6 text-blue-600" />,
      features: [
        'Personalized treatment plans',
        'Flexible scheduling options',
        'Progress tracking',
        'Confidential sessions',
      ],
      duration: '50 minutes',
      price: '$120/session',
    },
    {
      title: 'Group Therapy',
      description: 'Supportive group sessions led by experienced therapists',
      icon: <Users className="w-6 h-6 text-blue-600" />,
      features: [
        'Peer support network',
        'Shared experiences',
        'Skill-building exercises',
        'Weekly meetings',
      ],
      duration: '90 minutes',
      price: '$60/session',
    },
  ];

  const therapists = [
    {
      name: 'Dr. Sarah Johnson',
      title: 'Clinical Psychologist',
      image: '/therapists/sarah.jpg',
      rating: 4.9,
      reviewCount: 124,
      specialties: ['Anxiety', 'Depression', 'Trauma'],
      experience: '15+ years',
      education: 'Ph.D. in Clinical Psychology',
      nextAvailable: 'Tomorrow',
      bio: 'Dr. Johnson specializes in cognitive behavioral therapy with extensive experience in treating anxiety and depression.',
    },
    {
      name: 'Dr. Michael Chen',
      title: 'Licensed Therapist',
      image: '/therapists/michael.jpg',
      rating: 4.8,
      reviewCount: 98,
      specialties: ['Relationships', 'Stress', 'LGBTQ+'],
      experience: '10+ years',
      education: 'Psy.D. in Psychology',
      nextAvailable: 'This week',
      bio: 'Dr. Chen focuses on relationship counseling and stress management using an integrative therapeutic approach.',
    },
    {
      name: 'Dr. Emily Martinez',
      title: 'Family Therapist',
      image: '/therapists/emily.jpg',
      rating: 4.9,
      reviewCount: 156,
      specialties: ['Family', 'Couples', 'Children'],
      experience: '12+ years',
      education: 'Ph.D. in Family Therapy',
      nextAvailable: 'Next week',
      bio: 'Dr. Martinez specializes in family dynamics and couples counseling with a focus on building healthy relationships.',
    },
  ];

  const insuranceProviders = [
    'Blue Cross Blue Shield',
    'Aetna',
    'UnitedHealthcare',
    'Cigna',
    'Kaiser Permanente',
    'Humana',
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl">
        <div className="absolute inset-0 " />
        <div className="relative max-w-6xl mx-auto px-4 py-24">
          <div className="text-center">
            <h1 className="text-5xl font-bold mb-6 tracking-tight">
              Professional Mental Health Services
            </h1>
            <p className="text-xl dark:text-white/90 mb-10 max-w-2xl mx-auto leading-relaxed">
              Expert care tailored to your needs with licensed professionals
              committed to your well-being
            </p>
            <div className="flex justify-center gap-4">
              <Button
                size="lg"
                variant="secondary"
                className="text-blue-600 hover:text-blue-700 font-semibold dark:text-white"
              >
                Book Consultation
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>

              <Button
                size="lg"
                variant="secondary"
                className="text-blue-600 hover:text-blue-700 font-semibold dark:text-white"
              >
                View Therapists
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-20" />
      </div>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-16">
        {/* Why Choose Us */}
        <section className="mb-24">
          <div className="text-center mb-16">
            <Badge className="mb-4 px-4 py-1 text-sm bg-blue-100 text-blue-700 hover:bg-blue-200">
              Why Choose Us
            </Badge>
            <h2 className="text-4xl font-bold mb-6 gradient-text">
              Comprehensive Mental Health Care
            </h2>
            <p className="max-w-2xl mx-auto text-lg dark:text-white/90">
              We provide evidence-based treatment with a personalized approach
              to mental health care
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="text-center service-card border shadow-lg">
              <CardHeader>
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-blue-100 flex items-center justify-center">
                  <Shield className="w-8 h-8 text-blue-600" />
                </div>
                <CardTitle className="text-xl mb-2">Licensed Experts</CardTitle>
                <CardDescription>
                  All our therapists are licensed professionals with extensive
                  experience
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="text-center service-card border shadow-lg">
              <CardHeader>
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-indigo-100 flex items-center justify-center">
                  <Sparkles className="w-8 h-8 text-indigo-600" />
                </div>
                <CardTitle className="text-xl mb-2">
                  Personalized Care
                </CardTitle>
                <CardDescription>
                  Treatment plans tailored to your unique needs and goals
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="text-center service-card border shadow-lg">
              <CardHeader>
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-purple-100 flex items-center justify-center">
                  <BadgeCheck className="w-8 h-8 text-purple-600" />
                </div>
                <CardTitle className="text-xl mb-2">
                  Insurance Accepted
                </CardTitle>
                <CardDescription>
                  We work with major insurance providers to make care accessible
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </section>

        {/* Services */}
        <section className="mb-24">
          <div className="text-center mb-16">
            <Badge className="mb-4 px-4 py-1 text-sm bg-blue-100 text-blue-700 hover:bg-blue-200">
              Our Services
            </Badge>
            <h2 className="text-4xl font-bold mb-6 gradient-text">
              Treatment Options
            </h2>
            <p className=" max-w-2xl mx-auto text-lg">
              Choose from a variety of services designed to support your mental
              health journey
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {services.map((service, index) => (
              <Card
                key={index}
                className="service-card border shadow-lg hover:shadow-xl"
              >
                <CardHeader>
                  <div className="flex items-center gap-6 mb-4">
                    <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-100 to-indigo-100">
                      {service.icon}
                    </div>
                    <div>
                      <CardTitle className="text-xl mb-2">
                        {service.title}
                      </CardTitle>
                      <CardDescription>{service.description}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {service.features.map((feature, i) => (
                      <li key={i} className="flex items-center gap-3">
                        <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
                <CardFooter className="flex justify-between items-center pt-6">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="w-4 h-4" />
                      {service.duration}
                    </div>
                    <div className="text-xl font-semibold">{service.price}</div>
                  </div>
                  <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700">
                    Book Now
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </section>

        {/* Meet Our Therapists */}
        <section className="mb-24">
          <div className="text-center mb-16">
            <Badge className="mb-4 px-4 py-1 text-sm bg-blue-100 text-blue-700 hover:bg-blue-200">
              Our Team
            </Badge>
            <h2 className="text-4xl font-bold mb-6 gradient-text">
              Meet Our Therapists
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto text-lg">
              Experienced professionals dedicated to supporting your mental
              health journey
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {therapists.map((therapist, index) => (
              <Card
                key={index}
                className="therapist-card border shadow-lg hover:shadow-xl"
              >
                <CardHeader className="text-center">
                  <Avatar className="w-32 h-32 mx-auto mb-6 ring-4 ring-blue-100">
                    <AvatarImage src={therapist.image} />
                    <AvatarFallback className="bg-blue-600 text-white text-2xl">
                      {therapist.name
                        .split(' ')
                        .map(n => n[0])
                        .join('')}
                    </AvatarFallback>
                  </Avatar>
                  <CardTitle className="text-xl mb-2">
                    {therapist.name}
                  </CardTitle>
                  <CardDescription className="text-gray-600">
                    {therapist.title}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div className="flex items-center justify-center gap-2">
                      <Star className="w-5 h-5 text-yellow-400 fill-current" />
                      <span className="font-semibold text-lg">
                        {therapist.rating}
                      </span>
                      <span className="text-gray-500">
                        ({therapist.reviewCount} reviews)
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2 justify-center">
                      {therapist.specialties.map((specialty, i) => (
                        <Badge
                          key={i}
                          variant="secondary"
                          className="bg-blue-50 text-blue-700 hover:bg-blue-100"
                        >
                          {specialty}
                        </Badge>
                      ))}
                    </div>
                    <Separator />
                    <div className="text-sm space-y-3">
                      <div className="flex items-center gap-3 text-gray-600">
                        <Award className="w-4 h-4 text-blue-600" />
                        {therapist.experience} experience
                      </div>
                      <div className="flex items-center gap-3 text-gray-600">
                        <Brain className="w-4 h-4 text-blue-600" />
                        {therapist.education}
                      </div>
                      <div className="flex items-center gap-3 text-gray-600">
                        <Calendar className="w-4 h-4 text-blue-600" />
                        Next available: {therapist.nextAvailable}
                      </div>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="justify-center pt-4">
                  <HoverCard>
                    <HoverCardTrigger asChild>
                      <Button
                        variant="outline"
                        className="border-blue-200 hover:border-blue-300"
                      >
                        View Profile
                      </Button>
                    </HoverCardTrigger>
                    <HoverCardContent className="w-80">
                      <div className="space-y-3">
                        <h4 className="font-semibold text-lg text-blue-600">
                          {therapist.name}
                        </h4>
                        <p className="text-gray-600">{therapist.bio}</p>
                      </div>
                    </HoverCardContent>
                  </HoverCard>
                </CardFooter>
              </Card>
            ))}
          </div>
        </section>

        {/* Insurance */}
        <section>
          <div className="text-center mb-16">
            <Badge className="mb-4 px-4 py-1 text-sm bg-blue-100 text-blue-700 hover:bg-blue-200">
              Insurance
            </Badge>
            <h2 className="text-4xl font-bold mb-6 gradient-text">
              Accepted Insurance Providers
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto text-lg">
              We work with major insurance providers to make mental health care
              accessible
            </p>
          </div>

          <Card className="border-0 shadow-lg">
            <CardContent className="py-8">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                {insuranceProviders.map((provider, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-3 p-6 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100"
                  >
                    <CheckCircle className="w-6 h-6 text-green-500" />
                    <span className="font-medium text-gray-700">
                      {provider}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </section>
      </main>
    </div>
  );
};

export default ServicesPage;
