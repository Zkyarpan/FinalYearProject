'use client';

import React from 'react';
import {
  Search,
  BookOpen,
  Clock,
  Calendar,
  ArrowRight,
  Tag,
  TrendingUp,
  Eye,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Progress } from '@/components/ui/progress';

const ArticlesPage = () => {
  const categories = [
    { name: 'All', count: 145 },
    { name: 'Anxiety', count: 42 },
    { name: 'Depression', count: 38 },
    { name: 'Mindfulness', count: 29 },
    { name: 'Relationships', count: 25 },
    { name: 'Self-Care', count: 31 },
  ];

  const featuredArticles = [
    {
      title: 'Understanding Anxiety: A Comprehensive Guide',
      excerpt:
        'Learn about the different types of anxiety disorders, their symptoms, and effective coping strategies.',
      image:
        'https://images.unsplash.com/photo-1544027993-37dbfe43562a?auto=format&fit=crop&w=1200',
      author: {
        name: 'Dr. Sarah Johnson',
        role: 'Clinical Psychologist',
        image:
          'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200',
        bio: 'Clinical Psychologist with 15+ years of experience specializing in anxiety disorders.',
      },
      readTime: '8 min read',
      date: 'Feb 15, 2024',
      category: 'Anxiety',
      likes: 234,
      bookmarks: 56,
      views: 1234,
    },
    {
      title: 'The Science of Mindfulness Meditation',
      excerpt:
        'Discover how mindfulness meditation can rewire your brain and improve mental well-being.',
      image:
        'https://images.unsplash.com/photo-1591228127791-8e2eaef098d3?auto=format&fit=crop&w=1200',
      author: {
        name: 'Dr. Michael Chen',
        role: 'Neuroscientist',
        image:
          'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=200',
        bio: 'Neuroscientist researching the effects of meditation on brain plasticity.',
      },
      readTime: '6 min read',
      date: 'Feb 14, 2024',
      category: 'Mindfulness',
      likes: 189,
      bookmarks: 45,
      views: 987,
    },
  ];

  const latestArticles = [
    {
      title: 'Building Resilience Through Daily Practices',
      excerpt:
        'Simple yet effective strategies to strengthen your mental resilience and cope with lifes challenges.',
      author: {
        name: 'Emma Wilson',
        role: 'Mental Health Coach',
        image:
          'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=200',
        bio: 'Certified Mental Health Coach helping people build resilience and strength.',
      },
      readTime: '5 min read',
      date: 'Feb 13, 2024',
      category: 'Self-Care',
      progress: 75,
    },
    {
      title: 'Depression in the Digital Age',
      excerpt:
        'How social media and technology affect our mental health and ways to maintain balance.',
      author: {
        name: 'Dr. James Miller',
        role: 'Psychiatrist',
        image:
          'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200',
        bio: 'Psychiatrist specializing in technology addiction and digital wellness.',
      },
      readTime: '7 min read',
      date: 'Feb 12, 2024',
      category: 'Depression',
      progress: 30,
    },
  ];

  const trending = [
    {
      title: 'Signs of High-Functioning Anxiety',
      category: 'Anxiety',
      readTime: '4 min',
      trend: 85,
    },
    {
      title: 'Emotional Intelligence in Relationships',
      category: 'Relationships',
      readTime: '6 min',
      trend: 72,
    },
    {
      title: 'Morning Routines for Better Mental Health',
      category: 'Self-Care',
      readTime: '5 min',
      trend: 68,
    },
  ];

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Mental Health Resources
              </h1>
              <p className="mt-1 text-gray-500">
                Expert insights to support your well-being journey
              </p>
            </div>
            <div className="relative w-full md:w-96">
              <Input
                type="text"
                placeholder="Search articles..."
                className="pl-10"
              />
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-8">
            {/* Categories */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Tag className="w-4 h-4" />
                  Categories
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {categories.map(category => (
                  <button
                    key={category.name}
                    className="w-full flex items-center justify-between p-2 rounded-md hover:bg-gray-50 text-left transition-colors"
                  >
                    <span className="text-gray-700">{category.name}</span>
                    <Badge variant="secondary">{category.count}</Badge>
                  </button>
                ))}
              </CardContent>
            </Card>

            {/* Trending */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" />
                  Trending
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {trending.map((article, index) => (
                  <div key={index} className="space-y-2">
                    <h3 className="text-sm font-medium hover:text-blue-600 cursor-pointer transition-colors">
                      {article.title}
                    </h3>
                    <div className="flex items-center gap-3 text-sm text-gray-500">
                      <Badge variant="secondary" className="text-xs">
                        {article.category}
                      </Badge>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {article.readTime}
                      </span>
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500">Trending</span>
                        <span className="font-medium">{article.trend}%</span>
                      </div>
                      <Progress value={article.trend} className="h-1" />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3 space-y-8">
            {/* Featured Articles */}
            <section>
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                <BookOpen className="w-6 h-6 text-blue-600" />
                Featured Articles
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {featuredArticles.map((article, index) => (
                  <Card key={index} className="group overflow-hidden">
                    <div className="relative h-48">
                      <img
                        src={article.image}
                        alt={article.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute top-4 left-4">
                        <Badge className="bg-blue-600 text-white hover:bg-blue-700">
                          {article.category}
                        </Badge>
                      </div>
                    </div>
                    <CardHeader>
                      <CardTitle className="group-hover:text-blue-600 transition-colors">
                        {article.title}
                      </CardTitle>
                      <CardDescription>{article.excerpt}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <HoverCard>
                        <HoverCardTrigger asChild>
                          <div className="flex items-center gap-3 cursor-pointer">
                            <Avatar>
                              <AvatarImage src={article.author.image} />
                              <AvatarFallback>
                                {article.author.name
                                  .split(' ')
                                  .map(n => n[0])
                                  .join('')}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium text-sm">
                                {article.author.name}
                              </p>
                              <p className="text-xs text-gray-500">
                                {article.author.role}
                              </p>
                            </div>
                          </div>
                        </HoverCardTrigger>
                        <HoverCardContent className="w-80">
                          <div className="flex justify-between space-x-4">
                            <Avatar>
                              <AvatarImage src={article.author.image} />
                              <AvatarFallback>
                                {article.author.name
                                  .split(' ')
                                  .map(n => n[0])
                                  .join('')}
                              </AvatarFallback>
                            </Avatar>
                            <div className="space-y-1">
                              <h4 className="text-sm font-semibold">
                                {article.author.name}
                              </h4>
                              <p className="text-sm text-gray-500">
                                {article.author.role}
                              </p>
                              <p className="text-sm text-gray-500">
                                {article.author.bio}
                              </p>
                            </div>
                          </div>
                        </HoverCardContent>
                      </HoverCard>
                    </CardContent>
                    <CardFooter className="justify-between">
                      <div className="flex items-center gap-4 text-xs">
                        <span className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {article.readTime}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {article.date}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <Eye className="w-4 h-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>{article.views} views</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            </section>

            <Separator />

            {/* Latest Articles */}
            <section>
              <h2 className="text-2xl font-bold mb-6">Latest Articles</h2>
              <ScrollArea className="h-[600px] pr-4">
                <div className="space-y-6">
                  {latestArticles.map((article, index) => (
                    <Card key={index}>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <Badge>{article.category}</Badge>
                          <Button variant="ghost" size="icon">
                            <ArrowRight className="w-4 h-4" />
                          </Button>
                        </div>
                        <CardTitle className="hover:text-blue-600 cursor-pointer transition-colors">
                          {article.title}
                        </CardTitle>
                        <CardDescription>{article.excerpt}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center justify-between">
                          <HoverCard>
                            <HoverCardTrigger asChild>
                              <div className="flex items-center gap-3 cursor-pointer">
                                <Avatar>
                                  <AvatarImage src={article.author.image} />
                                  <AvatarFallback>
                                    {article.author.name
                                      .split(' ')
                                      .map(n => n[0])
                                      .join('')}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <p className="font-medium text-sm">
                                    {article.author.name}
                                  </p>
                                  <p className="text-xs text-gray-500">
                                    {article.author.role}
                                  </p>
                                </div>
                              </div>
                            </HoverCardTrigger>
                            <HoverCardContent className="w-80">
                              <div className="flex justify-between space-x-4">
                                <Avatar>
                                  <AvatarImage src={article.author.image} />
                                  <AvatarFallback>
                                    {article.author.name
                                      .split(' ')
                                      .map(n => n[0])
                                      .join('')}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="space-y-1">
                                  <h4 className="text-sm font-semibold">
                                    {article.author.name}
                                  </h4>
                                  <p className="text-sm text-gray-500">
                                    {article.author.role}
                                  </p>
                                  <p className="text-sm text-gray-500">
                                    {article.author.bio}
                                  </p>
                                </div>
                              </div>
                            </HoverCardContent>
                          </HoverCard>
                          <div className="flex items-center gap-4 text-sm text-gray-500">
                            <span className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              {article.readTime}
                            </span>
                            <span className="flex items-center gap-1">
                              <Calendar className="w-4 h-4" />
                              {article.date}
                            </span>
                          </div>
                        </div>
                      </CardContent>
                      <CardFooter>
                        <div className="w-full space-y-2">
                          <div className="flex justify-between text-sm text-gray-500">
                            <span>Reading Progress</span>
                            <span>{article.progress}%</span>
                          </div>
                          <Progress value={article.progress} className="h-1" />
                        </div>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ArticlesPage;
