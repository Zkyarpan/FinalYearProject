'use client';

import {
  Moon,
  Brain,
  Heart,
  Users,
  BookOpen,
  Sparkles,
  Search,
  BookMarked,
  Clock,
  TrendingUp,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

import { Badge } from '@/components/ui/badge';

const ResourcesPage = () => {
  const categories = [
    {
      name: 'Mental Health',
      icon: '🧠',
      color: 'bg-blue-100 text-blue-600',
      count: '51',
    },
    {
      name: 'Focus',
      icon: '🎯',
      color: 'bg-purple-100 text-purple-600',
      count: '32',
    },
    {
      name: 'Sleep',
      icon: '🌙',
      color: 'bg-indigo-100 text-indigo-600',
      count: '28',
    },
    {
      name: 'Stress',
      icon: '🌿',
      color: 'bg-green-100 text-green-600',
      count: '45',
    },
  ];

  const featuredContent = [
    {
      title: 'Anxiety Management',
      category: 'Mental Health',
      type: 'Course',
      duration: '10 min',
      image:
        'https://images.unsplash.com/photo-1499209974431-9dddcece7f88?auto=format&fit=crop&w=800',
      author: 'Dr. Sarah Johnson',
      rating: 4.8,
      tags: ['Beginner', 'Self-paced'],
    },
    {
      title: 'Mindfulness Basics',
      category: 'Focus',
      type: 'Guided Practice',
      duration: '15 min',
      image:
        'https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=800',
      author: 'Mark Williams',
      rating: 4.9,
      tags: ['Popular', 'Audio'],
    },
    {
      title: 'Sleep Meditation',
      category: 'Sleep',
      type: 'Audio Guide',
      duration: '20 min',
      image:
        'https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=800',
      author: 'Emma Thompson',
      rating: 4.7,
      tags: ['Nighttime', 'Relaxation'],
    },
  ];

  const resourceCategories = [
    {
      title: 'Ready, Set, Reset',
      description:
        'Decrease your stress and increase your happiness in just 10 days.',
      icon: <Sparkles className="w-6 h-6" />,
      color: 'bg-gradient-to-br from-orange-500 to-pink-500',
      count: '10 activities',
    },
    {
      title: 'New and Popular',
      description:
        'The latest mental health resources and top picks from our team.',
      icon: <Brain className="w-6 h-6" />,
      color: 'bg-gradient-to-br from-blue-500 to-indigo-500',
      count: '8 new items',
    },
    {
      title: 'Beginning Mental Health',
      description:
        'Learn the fundamental techniques of maintaining good mental health.',
      icon: <Heart className="w-6 h-6" />,
      color: 'bg-gradient-to-br from-yellow-500 to-orange-500',
      count: '12 lessons',
    },
    {
      title: 'Quick Relief',
      description: 'Give yourself a moment to breathe and reset.',
      icon: <Moon className="w-6 h-6" />,
      color: 'bg-gradient-to-br from-purple-500 to-pink-500',
      count: '5 min exercises',
    },
    {
      title: 'Support Groups',
      description:
        'Connect with others in moderated group sessions for mutual support.',
      icon: <Users className="w-6 h-6" />,
      color: 'bg-gradient-to-br from-green-500 to-teal-500',
      count: '6 active groups',
    },
    {
      title: 'Life Skills',
      description:
        'Essential tools and techniques for managing daily challenges.',
      icon: <BookOpen className="w-6 h-6" />,
      color: 'bg-gradient-to-br from-pink-500 to-rose-500',
      count: '15 skills',
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
          <div className="text-center">
            <div className="flex flex-wrap justify-center gap-3 mb-8">
              {categories.map((cat, index) => (
                <Button
                  key={index}
                  variant="ghost"
                  className="inline-flex items-center bg-white/10 hover:bg-white/20 text-white"
                >
                  <span className="mr-2">{cat.icon}</span>
                  <span className="mr-2">{cat.name}</span>
                  <Badge variant="secondary" className="bg-white/20">
                    {cat.count}
                  </Badge>
                </Button>
              ))}
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-6 leading-tight">
              Support your mental health with
              <br className="hidden sm:block" /> expert resources
            </h1>
            <div className="max-w-2xl mx-auto">
              <div className="flex gap-2 justify-center">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search resources..."
                    className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-white/60"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Tabs defaultValue="featured" className="mb-16">
          <TabsList className="mb-8">
            <TabsTrigger value="featured">Featured</TabsTrigger>
            <TabsTrigger value="recent">Recent</TabsTrigger>
            <TabsTrigger value="popular">Popular</TabsTrigger>
            <TabsTrigger value="collections">Collections</TabsTrigger>
          </TabsList>

          <TabsContent value="featured">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredContent.map((content, index) => (
                <Card
                  key={index}
                  className="group hover:shadow-lg transition-shadow"
                >
                  <CardHeader className="p-0">
                    <div className="relative">
                      <img
                        src={content.image}
                        alt={content.title}
                        className="w-full h-48 object-cover rounded-t-lg  transition-transform duration-300"
                      />
                      <Badge className="absolute top-4 left-4 bg-blue-600">
                        {content.type}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-2">
                      <Badge variant="secondary">{content.category}</Badge>
                      <div className="flex items-center">
                        <span className="text-yellow-400 mr-1">★</span>
                        <span className="text-sm text-muted-foreground">
                          {content.rating}
                        </span>
                      </div>
                    </div>
                    <CardTitle className="mb-2">{content.title}</CardTitle>
                    <CardDescription>
                      <div className="flex items-center justify-between text-sm">
                        <span>{content.author}</span>
                        <span className="flex items-center">
                          <Clock className="h-4 w-4 mr-1" />
                          {content.duration}
                        </span>
                      </div>
                    </CardDescription>
                  </CardContent>
                  <CardFooter className="px-6 pb-6 pt-0">
                    <div className="flex gap-2">
                      {content.tags.map((tag, i) => (
                        <Badge key={i} variant="outline">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </CardFooter>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>

        <section className="mb-16">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold text-foreground">
              Explore Resources
            </h2>
            <Button variant="outline">
              View All
              <TrendingUp className="ml-2 h-4 w-4" />
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {resourceCategories.map((category, index) => (
              <Card
                key={index}
                className="group hover:shadow-lg transition-all cursor-pointer"
              >
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="group-hover:text-primary transition-colors">
                      {category.title}
                    </CardTitle>
                    <div
                      className={`p-3 rounded-xl ${category.color} text-white`}
                    >
                      {category.icon}
                    </div>
                  </div>
                  <CardDescription>{category.description}</CardDescription>
                </CardHeader>
                <CardFooter className="flex justify-between items-center pt-6 border-t">
                  <Badge variant="secondary">{category.count}</Badge>
                  <Button
                    variant="ghost"
                    className="group-hover:translate-x-1 transition-transform"
                  >
                    Explore
                    <BookMarked className="ml-2 h-4 w-4" />
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </section>

        <section>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="bg-gradient-to-br from-purple-500 to-indigo-600 text-white border-0">
              <CardHeader>
                <CardTitle className="text-2xl">LGBTQIA+ Support</CardTitle>
                <CardDescription className="text-white/90">
                  Specialized resources and support for the LGBTQIA+ community.
                </CardDescription>
              </CardHeader>
              <CardFooter>
                <Button variant="secondary" className="">
                  View Resources
                  <BookMarked className="ml-2 h-4 w-4" />
                </Button>
              </CardFooter>
            </Card>
            <Card className="bg-gradient-to-br from-pink-500 to-rose-600 text-white border-0">
              <CardHeader>
                <CardTitle className="text-2xl">Women's Collection</CardTitle>
                <CardDescription className="text-white/90">
                  Curated resources celebrating and supporting women's mental
                  health.
                </CardDescription>
              </CardHeader>
              <CardFooter>
                <Button variant="secondary" className="">
                  View Resources
                  <BookMarked className="ml-2 h-4 w-4" />
                </Button>
              </CardFooter>
            </Card>
          </div>
        </section>
      </div>
    </div>
  );
};

export default ResourcesPage;
