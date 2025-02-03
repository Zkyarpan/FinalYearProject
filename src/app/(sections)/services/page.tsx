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
      description:
        'One-on-one sessions with licensed therapists tailored to your needs',
      icon: <Users className="w-6 h-6" />,
      features: [
        'Personalized treatment plans',
        'Flexible scheduling options',
        'Both in-person and virtual sessions',
        'Progress tracking and goal setting',
      ],
      duration: '50 minutes',
      price: '$120',
      availability: 'Same-week appointments available',
    },
    {
      title: 'Group Therapy',
      description: 'Supportive group sessions led by experienced facilitators',
      icon: <MessageSquare className="w-6 h-6" />,
      features: [
        'Small group sizes (6-8 people)',
        'Topic-focused sessions',
        'Peer support and shared experiences',
        'Weekly meetings',
      ],
      duration: '90 minutes',
      price: '$60',
      availability: 'Multiple groups throughout the week',
    },
    {
      title: 'Virtual Counseling',
      description:
        'Secure online therapy sessions from the comfort of your home',
      icon: <Video className="w-6 h-6" />,
      features: [
        'End-to-end encryption',
        'Mobile app access',
        'Chat support between sessions',
        'Easy scheduling system',
      ],
      duration: '45 minutes',
      price: '$90',
      availability: 'Extended hours including evenings',
    },
    {
      title: 'Crisis Support',
      description: '24/7 emergency mental health support and intervention',
      icon: <Phone className="w-6 h-6" />,
      features: [
        'Immediate assistance',
        'Licensed crisis counselors',
        'Referral services',
        'Follow-up care',
      ],
      duration: 'As needed',
      price: 'Covered by insurance',
      availability: '24/7 support line',
    },
  ];

  const therapists = [
    {
      name: 'Dr. Sarah Johnson',
      title: 'Clinical Psychologist',
      image:
        'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200',
      specialties: ['Anxiety', 'Depression', 'Trauma'],
      experience: '15+ years',
      education: 'Ph.D. in Clinical Psychology',
      rating: 4.9,
      reviewCount: 127,
      nextAvailable: 'Tomorrow',
      bio: 'Specializing in anxiety and depression treatment using evidence-based approaches including CBT and mindfulness techniques.',
    },
    {
      name: 'Dr. Michael Chen',
      title: 'Licensed Therapist',
      image:
        'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=200',
      specialties: ['Relationships', 'Stress', 'Life Transitions'],
      experience: '12+ years',
      education: 'Ph.D. in Counseling Psychology',
      rating: 4.8,
      reviewCount: 98,
      nextAvailable: 'This week',
      bio: 'Helping individuals navigate life transitions and relationship challenges with compassion and practical strategies.',
    },
    {
      name: 'Dr. Emily Martinez',
      title: 'Mental Health Counselor',
      image:
        'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=200',
      specialties: ['Youth Counseling', 'Family Therapy', 'ADHD'],
      experience: '10+ years',
      education: 'Ph.D. in Child Psychology',
      rating: 4.9,
      reviewCount: 84,
      nextAvailable: 'Next week',
      bio: 'Dedicated to supporting young people and families through challenges with evidence-based interventions.',
    },
  ];

  const insuranceProviders = [
    'Blue Cross Blue Shield',
    'Aetna',
    'UnitedHealthcare',
    'Cigna',
    'Medicare',
    'Medicaid',
  ];

  return (
    <div className="min-h-screen">
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl">
        <div className="max-w-6xl mx-auto px-4 py-16">
          <div className="text-center">
            <h1 className="text-4xl font-bold mb-4">
              Professional Mental Health Services
            </h1>
            <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
              Expert care tailored to your needs with licensed professionals
              committed to your well-being
            </p>
            <div className="flex justify-center gap-4">
              <Button size="lg" variant="secondary">
                Book Consultation
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="bg-transparent text-white hover:bg-white/10"
              >
                View Therapists
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-12">
        {/* Why Choose Us */}
        <section className="mb-16">
          <div className="text-center mb-12">
            <Badge className="mb-4">Why Choose Us</Badge>
            <h2 className="text-3xl font-bold mb-4">
              Comprehensive Mental Health Care
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              We provide evidence-based treatment with a personalized approach
              to mental health care
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="text-center">
              <CardHeader>
                <Shield className="w-12 h-12 mx-auto text-blue-600 mb-4" />
                <CardTitle>Licensed Experts</CardTitle>
                <CardDescription>
                  All our therapists are licensed professionals with extensive
                  experience
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <Sparkles className="w-12 h-12 mx-auto text-blue-600 mb-4" />
                <CardTitle>Personalized Care</CardTitle>
                <CardDescription>
                  Treatment plans tailored to your unique needs and goals
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <BadgeCheck className="w-12 h-12 mx-auto text-blue-600 mb-4" />
                <CardTitle>Insurance Accepted</CardTitle>
                <CardDescription>
                  We work with major insurance providers to make care accessible
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </section>

        {/* Services */}
        <section className="mb-16">
          <div className="text-center mb-12">
            <Badge className="mb-4">Our Services</Badge>
            <h2 className="text-3xl font-bold mb-4">Treatment Options</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Choose from a variety of services designed to support your mental
              health journey
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {services.map((service, index) => (
              <Card
                key={index}
                className="group hover:shadow-lg transition-all"
              >
                <CardHeader>
                  <div className="flex items-center gap-4 mb-2">
                    <div className="p-2 rounded-lg bg-blue-100 text-blue-600">
                      {service.icon}
                    </div>
                    <div>
                      <CardTitle>{service.title}</CardTitle>
                      <CardDescription>{service.description}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {service.features.map((feature, i) => (
                      <li
                        key={i}
                        className="flex items-center gap-2 text-gray-600"
                      >
                        <CheckCircle className="w-5 h-5 text-green-500" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </CardContent>
                <CardFooter className="flex justify-between items-center">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <Clock className="w-4 h-4" />
                      {service.duration}
                    </div>
                    <div className="font-semibold">{service.price}</div>
                  </div>
                  <Button>
                    Book Now
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </section>

        {/* Meet Our Therapists */}
        <section className="mb-16">
          <div className="text-center mb-12">
            <Badge className="mb-4">Our Team</Badge>
            <h2 className="text-3xl font-bold mb-4">Meet Our Therapists</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Experienced professionals dedicated to supporting your mental
              health journey
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {therapists.map((therapist, index) => (
              <Card key={index} className="group">
                <CardHeader className="text-center">
                  <Avatar className="w-24 h-24 mx-auto mb-4">
                    <AvatarImage src={therapist.image} />
                    <AvatarFallback>
                      {therapist.name
                        .split(' ')
                        .map(n => n[0])
                        .join('')}
                    </AvatarFallback>
                  </Avatar>
                  <CardTitle className="group-hover:text-blue-600 transition-colors">
                    {therapist.name}
                  </CardTitle>
                  <CardDescription>{therapist.title}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-center gap-1">
                      <Star className="w-4 h-4 text-yellow-400 fill-current" />
                      <span className="font-medium">{therapist.rating}</span>
                      <span className="text-gray-500">
                        ({therapist.reviewCount} reviews)
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2 justify-center">
                      {therapist.specialties.map((specialty, i) => (
                        <Badge key={i} variant="secondary">
                          {specialty}
                        </Badge>
                      ))}
                    </div>
                    <Separator />
                    <div className="text-sm text-gray-500 space-y-2">
                      <div className="flex items-center gap-2">
                        <Award className="w-4 h-4" />
                        {therapist.experience} experience
                      </div>
                      <div className="flex items-center gap-2">
                        <Brain className="w-4 h-4" />
                        {therapist.education}
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        Next available: {therapist.nextAvailable}
                      </div>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="justify-center">
                  <HoverCard>
                    <HoverCardTrigger asChild>
                      <Button variant="outline">View Profile</Button>
                    </HoverCardTrigger>
                    <HoverCardContent className="w-80">
                      <div className="space-y-2">
                        <h4 className="font-semibold">{therapist.name}</h4>
                        <p className="text-sm text-gray-500">{therapist.bio}</p>
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
          <div className="text-center mb-12">
            <Badge className="mb-4">Insurance</Badge>
            <h2 className="text-3xl font-bold mb-4">
              Accepted Insurance Providers
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              We work with major insurance providers to make mental health care
              accessible
            </p>
          </div>

          <Card>
            <CardContent className="py-6">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {insuranceProviders.map((provider, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-2 p-4 rounded-lg border bg-gray-50"
                  >
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <span className="font-medium">{provider}</span>
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
