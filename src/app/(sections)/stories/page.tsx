'use client';
import React from 'react';
import {
  Heart,
  MessageCircle,
  Share2,
  Bookmark,
  TrendingUp,
  Search,
  Filter,
  PenSquare,
  ThumbsUp,
  Clock,
  Tag,
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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const StoriesPage = () => {
  const categories = [
    { name: 'Recovery', count: 128 },
    { name: 'Anxiety', count: 85 },
    { name: 'Depression', count: 92 },
    { name: 'Self-Care', count: 156 },
    { name: 'Mindfulness', count: 73 },
  ];

  const stories = [
    {
      id: 1,
      title: 'Finding Light in the Darkness: My Journey Through Depression',
      excerpt:
        'After years of struggling with depression, I finally found the courage to seek help. This is my story of recovery and hope...',
      author: {
        name: 'Sarah Mitchell',
        image:
          'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150',
        badge: 'Verified Story',
      },
      coverImage:
        'https://images.unsplash.com/photo-1520333789090-1afc82db536a?auto=format&fit=crop&w=800',
      category: 'Recovery',
      readTime: '8 min read',
      likes: 342,
      comments: 56,
      tags: ['Depression', 'Recovery', 'Hope'],
      publishedAt: '2 days ago',
    },
    {
      id: 2,
      title: 'Breaking the Anxiety Cycle: A Path to Peace',
      excerpt:
        "Living with anxiety felt like being trapped in a never-ending cycle. Here's how I learned to break free and find peace...",
      author: {
        name: 'Michael Chen',
        image:
          'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150',
        badge: 'Community Leader',
      },
      coverImage:
        'https://images.unsplash.com/photo-1499209974431-9dddcece7f88?auto=format&fit=crop&w=800',
      category: 'Anxiety',
      readTime: '6 min read',
      likes: 289,
      comments: 43,
      tags: ['Anxiety', 'Mental Health', 'Self-Help'],
      publishedAt: '1 week ago',
    },
    {
      id: 3,
      title: 'The Power of Self-Care in Mental Health Recovery',
      excerpt:
        "I discovered that self-care isn't selfish—it's essential. This is my journey of learning to prioritize mental wellness...",
      author: {
        name: 'Emma Thompson',
        image:
          'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=150',
        badge: 'Featured Writer',
      },
      coverImage:
        'https://images.unsplash.com/photo-1545205597-3d9d02c29597?auto=format&fit=crop&w=800',
      category: 'Self-Care',
      readTime: '5 min read',
      likes: 421,
      comments: 67,
      tags: ['Self-Care', 'Wellness', 'Growth'],
      publishedAt: '2 weeks ago',
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-purple-500 to-indigo-600 text-white border-0 rounded-2xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
          <div className="text-center">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-6 leading-tight">
              Share Your Story
            </h1>
            <p className="text-lg md:text-xl text-white/90 mb-8 max-w-2xl mx-auto">
              Every story matters. Share your mental health journey and connect
              with others who understand.
            </p>
            <div className="flex flex-wrap justify-center gap-3 mb-8">
              {categories.map((cat, index) => (
                <Button
                  key={index}
                  variant="ghost"
                  className="bg-white/10 hover:bg-white/20 text-white"
                >
                  {cat.name}
                  <Badge variant="secondary" className="ml-2 bg-white/20">
                    {cat.count}
                  </Badge>
                </Button>
              ))}
            </div>
            <div className="flex gap-4 justify-center">
              <Button
                size="lg"
                className="bg-white text-indigo-600 hover:bg-white/90"
              >
                <PenSquare className="mr-2 h-5 w-5" />
                Share Your Story
              </Button>
              <Button
                size="lg"
                variant="ghost"
                className="bg-white/10 hover:bg-white/20"
              >
                Read Stories
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Search and Filter */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input placeholder="Search stories..." className="pl-10" />
          </div>
          <div className="flex gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">
                  <Filter className="mr-2 h-4 w-4" />
                  Filter
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem>Most Recent</DropdownMenuItem>
                <DropdownMenuItem>Most Popular</DropdownMenuItem>
                <DropdownMenuItem>Most Discussed</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button variant="outline">
              <TrendingUp className="mr-2 h-4 w-4" />
              Trending
            </Button>
          </div>
        </div>

        {/* Stories Grid */}
        <Tabs defaultValue="featured" className="mb-16">
          <TabsList className="mb-8">
            <TabsTrigger value="featured">Featured</TabsTrigger>
            <TabsTrigger value="recent">Recent</TabsTrigger>
            <TabsTrigger value="trending">Trending</TabsTrigger>
            <TabsTrigger value="following">Following</TabsTrigger>
          </TabsList>

          <TabsContent value="featured">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 gap-6">
              {stories.map(story => (
                <Card
                  key={story.id}
                  className="group hover:shadow-lg transition-shadow"
                >
                  <CardHeader className="p-0">
                    <div className="relative">
                      <img
                        src={story.coverImage}
                        alt={story.title}
                        className="w-full h-48 object-cover rounded-t-lg"
                      />
                      <Badge className="absolute top-4 left-4 bg-blue-600">
                        {story.category}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <Avatar>
                        <AvatarImage src={story.author.image} />
                        <AvatarFallback>{story.author.name[0]}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-sm">
                          {story.author.name}
                        </p>
                        <Badge variant="secondary" className="text-xs">
                          {story.author.badge}
                        </Badge>
                      </div>
                    </div>
                    <CardTitle className="mb-2 group-hover:text-primary transition-colors">
                      {story.title}
                    </CardTitle>
                    <CardDescription className="line-clamp-2 mb-4">
                      {story.excerpt}
                    </CardDescription>
                    <div className="flex gap-2 mb-4">
                      {story.tags.map((tag, i) => (
                        <Badge key={i} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                  <CardFooter className="px-6 py-4  flex items-center justify-between ">
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {story.readTime}
                      </span>
                      <span className="flex items-center gap-1">
                        <ThumbsUp className="h-4 w-4" />
                        {story.likes}
                      </span>
                      <span className="flex items-center gap-1">
                        <MessageCircle className="h-4 w-4" />
                        {story.comments}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="icon">
                        <Share2 className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon">
                        <Bookmark className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardFooter>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>

        {/* Featured Categories */}
        <section>
          <div className="grid grid-cols-1 md:grid-cols-1 gap-6">
            <Card className="bg-gradient-to-br from-green-500 to-emerald-600 text-white border-0">
              <CardHeader>
                <CardTitle className="text-2xl">Recovery Stories</CardTitle>
                <CardDescription className="text-white/90">
                  Stories of hope, healing, and transformation from our
                  community.
                </CardDescription>
              </CardHeader>
              <CardFooter>
                <Button variant="secondary" className="">
                  Read Stories
                  <Heart className="ml-2 h-4 w-4" />
                </Button>
              </CardFooter>
            </Card>
            <Card className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white border-0">
              <CardHeader>
                <CardTitle className="text-2xl">Community Voices</CardTitle>
                <CardDescription className="text-white/90">
                  Authentic experiences shared by people just like you.
                </CardDescription>
              </CardHeader>
              <CardFooter>
                <Button variant="secondary" className="">
                  Join the Conversation
                  <MessageCircle className="ml-2 h-4 w-4" />
                </Button>
              </CardFooter>
            </Card>
          </div>
        </section>
      </div>
    </div>
  );
};

export default StoriesPage;
