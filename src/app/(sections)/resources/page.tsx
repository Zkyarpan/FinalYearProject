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
  Star,
  Play,
  ChevronRight,
  Bookmark,
  ArrowRight,
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
      color: 'from-blue-500 to-blue-600',
      count: '51',
    },
    {
      name: 'Focus',
      icon: '🎯',
      color: 'from-purple-500 to-purple-600',
      count: '32',
    },
    {
      name: 'Sleep',
      icon: '🌙',
      color: 'from-indigo-500 to-indigo-600',
      count: '28',
    },
    {
      name: 'Stress',
      icon: '🌿',
      color: 'from-green-500 to-green-600',
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
      progress: 65,
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
      progress: 30,
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
      progress: 80,
    },
  ];

  const resourceCategories = [
    {
      title: 'Ready, Set, Reset',
      description:
        'Decrease your stress and increase your happiness in just 10 days.',
      icon: <Sparkles className="w-6 h-6" />,
      color: 'from-orange-400 to-pink-600',
      count: '10 activities',
      tag: 'Popular',
    },
    {
      title: 'New and Popular',
      description:
        'The latest mental health resources and top picks from our team.',
      icon: <Brain className="w-6 h-6" />,
      color: 'from-blue-400 to-indigo-600',
      count: '8 new items',
      tag: 'New',
    },
    {
      title: 'Beginning Mental Health',
      description:
        'Learn the fundamental techniques of maintaining good mental health.',
      icon: <Heart className="w-6 h-6" />,
      color: 'from-yellow-400 to-orange-600',
      count: '12 lessons',
      tag: 'Beginner',
    },
    {
      title: 'Quick Relief',
      description: 'Give yourself a moment to breathe and reset.',
      icon: <Moon className="w-6 h-6" />,
      color: 'from-purple-400 to-pink-600',
      count: '5 min exercises',
      tag: 'Quick',
    },
    {
      title: 'Support Groups',
      description:
        'Connect with others in moderated group sessions for mutual support.',
      icon: <Users className="w-6 h-6" />,
      color: 'from-green-400 to-teal-600',
      count: '6 active groups',
      tag: 'Community',
    },
    {
      title: 'Life Skills',
      description:
        'Essential tools and techniques for managing daily challenges.',
      icon: <BookOpen className="w-6 h-6" />,
      color: 'from-pink-400 to-rose-600',
      count: '15 skills',
      tag: 'Essential',
    },
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-600 opacity-90 rounded-2xl" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
          <div className="text-center">
            <div className="flex flex-wrap justify-center gap-4 mb-10">
              {categories.map((cat, index) => (
                <button
                  key={index}
                  className={`category-pill flex items-center px-6 py-3 rounded-full bg-gradient-to-r ${cat.color} text-white shadow-lg hover:shadow-xl transition-all`}
                >
                  <span className="text-xl mr-2">{cat.icon}</span>
                  <span className="font-medium mr-2">{cat.name}</span>
                  <Badge variant="secondary" className="bg-white/20">
                    {cat.count}
                  </Badge>
                </button>
              ))}
            </div>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-8 text-white tracking-tight">
              Discover Mental Wellness
              <br className="hidden sm:block" /> Resources
            </h1>
            <div className="max-w-2xl mx-auto">
              <div className="relative">
                <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
                <Input
                  placeholder="Search for resources, topics, or experts..."
                  className="pl-12 h-14 text-lg rounded-full bg-white/10 border-white/20 text-white placeholder:text-white/60 focus:ring-2 focus:ring-white/30"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Featured Content */}
        <Tabs defaultValue="featured" className="mb-20">
          <div className="flex items-center justify-between mb-8">
            <TabsList className="p-1 bg-gray-100/80 backdrop-blur-sm">
              <TabsTrigger value="featured" className="text-sm">
                Featured
              </TabsTrigger>
              <TabsTrigger value="recent" className="text-sm">
                Recent
              </TabsTrigger>
              <TabsTrigger value="popular" className="text-sm">
                Popular
              </TabsTrigger>
              <TabsTrigger value="collections" className="text-sm">
                Collections
              </TabsTrigger>
            </TabsList>
            <Button variant="outline" className="gap-2">
              View Library <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          <TabsContent value="featured">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {featuredContent.map((content, index) => (
                <Card
                  key={index}
                  className="featured-card border-0 shadow-lg overflow-hidden"
                >
                  <div className="relative overflow-hidden">
                    <img
                      src={content.image}
                      alt={content.title}
                      className="featured-image w-full h-48 object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    <Badge className="absolute top-4 left-4 bg-white/90 text-blue-600 font-medium">
                      {content.type}
                    </Badge>
                    <Button
                      size="icon"
                      className="absolute bottom-4 right-4 rounded-full bg-white/90 hover:bg-white text-blue-600"
                    >
                      <Play className="h-4 w-4" />
                    </Button>
                  </div>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-3">
                      <Badge
                        variant="secondary"
                        className="bg-blue-50 text-blue-600 font-medium"
                      >
                        {content.category}
                      </Badge>
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 text-yellow-400 fill-current" />
                        <span className="font-medium">{content.rating}</span>
                      </div>
                    </div>
                    <CardTitle className="mb-2 line-clamp-2">
                      {content.title}
                    </CardTitle>
                    <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                      <span className="font-medium">{content.author}</span>
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {content.duration}
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div className="flex gap-2">
                        {content.tags.map((tag, i) => (
                          <Badge
                            key={i}
                            variant="outline"
                            className="bg-gray-50 border-gray-200"
                          >
                            {tag}
                          </Badge>
                        ))}
                      </div>
                      <div className="relative h-1 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="absolute inset-y-0 left-0 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full"
                          style={{ width: `${content.progress}%` }}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>

        {/* Resource Categories */}
        <section className="mb-20">
          <div className="flex items-center justify-between mb-10">
            <div>
              <Badge className="mb-4 px-4 py-1 text-sm bg-blue-100 text-blue-700">
                Resources
              </Badge>
              <h2 className="text-3xl font-bold gradient-text">
                Explore by Category
              </h2>
            </div>
            <Button variant="outline" className="gap-2">
              View All <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {resourceCategories.map((category, index) => (
              <Card
                key={index}
                className="resource-card border-0 shadow-lg hover:shadow-xl overflow-hidden group cursor-pointer"
              >
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between mb-4">
                    <div
                      className={`p-3 rounded-2xl bg-gradient-to-br ${category.color} text-white`}
                    >
                      {category.icon}
                    </div>
                    <Badge
                      variant="secondary"
                      className="bg-gray-100 text-gray-600 font-medium"
                    >
                      {category.tag}
                    </Badge>
                  </div>
                  <CardTitle className="text-xl mb-2 group-hover:text-blue-600 transition-colors">
                    {category.title}
                  </CardTitle>
                  <CardDescription className="text-gray-600">
                    {category.description}
                  </CardDescription>
                </CardHeader>
                <CardFooter className="pt-4 border-t">
                  <div className="flex items-center justify-between w-full">
                    <Badge
                      variant="outline"
                      className="bg-gray-50 border-gray-200"
                    >
                      {category.count}
                    </Badge>
                    <Button
                      variant="ghost"
                      className="text-blue-600 group-hover:translate-x-1 transition-transform"
                    >
                      Explore <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                </CardFooter>
              </Card>
            ))}
          </div>
        </section>

        {/* Special Collections */}
        <section>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card className="border-0 overflow-hidden relative group cursor-pointer">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500 to-indigo-600 opacity-90 transition-opacity group-hover:opacity-100" />
              <CardHeader className="relative z-10 text-white">
                <div className="flex items-center justify-between mb-4">
                  <Badge className="bg-white/20 text-white border-0">
                    Featured Collection
                  </Badge>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="text-white hover:text-white hover:bg-white/20"
                  >
                    <Bookmark className="h-5 w-5" />
                  </Button>
                </div>
                <CardTitle className="text-2xl mb-2">
                  LGBTQIA+ Support
                </CardTitle>
                <CardDescription className="text-white/90">
                  Specialized resources and support for the LGBTQIA+ community.
                </CardDescription>
              </CardHeader>
              <CardFooter className="relative z-10 pt-4">
                <Button className="bg-white/20 text-white hover:bg-white/30 group-hover:translate-x-1 transition-all">
                  Explore Resources
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </CardFooter>
            </Card>

            <Card className="border-0 overflow-hidden relative group cursor-pointer">
              <div className="absolute inset-0 bg-gradient-to-br from-pink-500 to-rose-600 opacity-90 transition-opacity group-hover:opacity-100" />
              <CardHeader className="relative z-10 text-white">
                <div className="flex items-center justify-between mb-4">
                  <Badge className="bg-white/20 text-white border-0">
                    Featured Collection
                  </Badge>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="text-white hover:text-white hover:bg-white/20"
                  >
                    <Bookmark className="h-5 w-5" />
                  </Button>
                </div>
                <CardTitle className="text-2xl mb-2">
                  Women's Collection
                </CardTitle>
                <CardDescription className="text-white/90">
                  Curated resources celebrating and supporting women's mental
                  health.
                </CardDescription>
              </CardHeader>
              <CardFooter className="relative z-10 pt-4">
                <Button className="bg-white/20 text-white hover:bg-white/30 group-hover:translate-x-1 transition-all">
                  Explore Resources
                  <ArrowRight className="ml-2 h-4 w-4" />
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
