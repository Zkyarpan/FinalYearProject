'use client';

import React from 'react';
import {
  Search,
  BookOpen,
  Clock,
  Calendar,
  Tag,
  TrendingUp,
  Heart,
  Share2,
  Bookmark,
  Filter,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const ArticlesPage = () => {
  const categories = [
    {
      name: 'Depression & Anxiety',
      count: 42,
      color: 'bg-blue-100 text-blue-800',
    },
    {
      name: 'Trauma & PTSD',
      count: 38,
      color: 'bg-purple-100 text-purple-800',
    },
    { name: 'Relationships', count: 35, color: 'bg-pink-100 text-pink-800' },
    {
      name: 'Self-Development',
      count: 31,
      color: 'bg-green-100 text-green-800',
    },
    { name: 'Mindfulness', count: 29, color: 'bg-yellow-100 text-yellow-800' },
    {
      name: 'Work & Stress',
      count: 25,
      color: 'bg-orange-100 text-orange-800',
    },
  ];

  const featuredArticles = [
    {
      title: 'Understanding and Managing Depression in the Modern World',
      excerpt:
        'A comprehensive guide to recognizing depression symptoms, understanding their impact, and developing effective coping strategies.',
      image:
        'https://images.unsplash.com/photo-1536148935331-408321065b18?auto=format&fit=crop&w=1200',
      author: {
        name: 'Dr. Sarah Johnson',
        credentials: 'Ph.D. Clinical Psychology',
        image:
          'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200',
      },
      readTime: '12 min read',
      date: 'Feb 15, 2024',
      category: 'Depression & Anxiety',
      engagement: {
        likes: 1.2,
        shares: 342,
        saves: 567,
      },
    },
    {
      title: 'The Science of Trauma Recovery: Latest Research and Approaches',
      excerpt:
        'Explore evidence-based approaches to trauma healing and discover how the brain can recover from traumatic experiences.',
      image:
        'https://images.unsplash.com/photo-1517486808906-6ca8b3f04846?auto=format&fit=crop&w=1200',
      author: {
        name: 'Dr. Michael Chen',
        credentials: 'M.D., Psychiatrist',
        image:
          'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=200',
      },
      readTime: '15 min read',
      date: 'Feb 14, 2024',
      category: 'Trauma & PTSD',
      engagement: {
        likes: 956,
        shares: 289,
        saves: 432,
      },
    },
  ];

  const latestArticles = [
    {
      title: 'Building Emotional Resilience in Challenging Times',
      excerpt:
        'Learn practical strategies to strengthen your emotional resilience and navigate lifes uncertainties with confidence.',
      author: {
        name: 'Dr. Emma Wilson',
        credentials: 'Psy.D., Clinical Psychologist',
        image:
          'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=200',
      },
      readTime: '10 min read',
      date: 'Feb 13, 2024',
      category: 'Self-Development',
    },
    {
      title: 'Mindfulness-Based Approaches to Anxiety Management',
      excerpt:
        'Discover how mindfulness practices can help reduce anxiety and promote mental well-being in daily life.',
      author: {
        name: 'Dr. James Miller',
        credentials: 'Ph.D., Clinical Psychology',
        image:
          'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200',
      },
      readTime: '8 min read',
      date: 'Feb 12, 2024',
      category: 'Mindfulness',
    },
  ];

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                Mental Health Resources
              </h1>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Evidence-based articles by mental health professionals
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative w-full md:w-64">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  type="text"
                  placeholder="Search articles..."
                  className="pl-10"
                />
              </div>
              <Select>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="recent">Most Recent</SelectItem>
                  <SelectItem value="popular">Most Popular</SelectItem>
                  <SelectItem value="trending">Trending</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 gap-2 w-full">
          {categories.map(category => (
            <Button
              key={category.name}
              variant="outline"
              className={`${category.color} border-none whitespace-nowrap text-sm w-full`}
            >
              {category.name}
              <Badge variant="secondary" className="ml-2">
                {category.count}
              </Badge>
            </Button>
          ))}
        </div>

        <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Featured Articles */}
          <div className="lg:col-span-2 space-y-6">
            <section>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-blue-600" />
                  Featured Articles
                </h2>
                <Button variant="ghost" size="sm">
                  View all
                </Button>
              </div>
              <div className="space-y-4">
                {featuredArticles.map((article, index) => (
                  <Card
                    key={index}
                    className="overflow-hidden hover:shadow-lg transition-shadow"
                  >
                    <div className="md:flex">
                      <div className="md:w-1/3">
                        <img
                          src={article.image}
                          alt={article.title}
                          className="h-48 md:h-full w-full object-cover"
                        />
                      </div>
                      <div className="md:w-2/3 p-4">
                        <Badge
                          className={`mb-2 ${
                            article.category === 'Depression & Anxiety'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-purple-100 text-purple-800'
                          }`}
                        >
                          {article.category}
                        </Badge>
                        <h3 className="text-lg font-semibold mb-2 hover:text-blue-600 cursor-pointer">
                          {article.title}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                          {article.excerpt}
                        </p>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={article.author.image} />
                              <AvatarFallback>
                                {article.author.name
                                  .split(' ')
                                  .map(n => n[0])
                                  .join('')}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="text-sm font-medium">
                                {article.author.name}
                              </p>
                              <p className="text-xs text-gray-500">
                                {article.author.credentials}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                            >
                              <Heart className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                            >
                              <Share2 className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                            >
                              <Bookmark className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </section>

            {/* Latest Articles */}
            <section>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">Latest Articles</h2>
                <Button variant="ghost" size="sm">
                  View all
                </Button>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                {latestArticles.map((article, index) => (
                  <Card
                    key={index}
                    className="hover:shadow-lg transition-shadow"
                  >
                    <CardHeader className="space-y-2 p-4">
                      <Badge
                        className={
                          article.category === 'Self-Development'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }
                      >
                        {article.category}
                      </Badge>
                      <CardTitle className="text-base hover:text-blue-600 cursor-pointer">
                        {article.title}
                      </CardTitle>
                      <CardDescription className="text-sm">
                        {article.excerpt}
                      </CardDescription>
                    </CardHeader>
                    <CardFooter className="flex items-center justify-between p-4">
                      <div className="flex items-center gap-2">
                        <Avatar className="h-7 w-7">
                          <AvatarImage src={article.author.image} />
                          <AvatarFallback>
                            {article.author.name
                              .split(' ')
                              .map(n => n[0])
                              .join('')}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-medium">
                            {article.author.name}
                          </p>
                          <p className="text-xs text-gray-500">
                            {article.author.credentials}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        <Clock className="w-3 h-3" />
                        {article.readTime}
                      </div>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            </section>
          </div>

          {/* Sidebar */}
          <aside className="space-y-4">
            <Card>
              <CardHeader className="p-4">
                <CardTitle className="text-base flex items-center gap-2">
                  <Filter className="w-4 h-4" />
                  Filter Articles
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 p-4">
                <div>
                  <label className="text-sm font-medium mb-1.5 block">
                    Reading Time
                  </label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select duration" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="short">Under 5 minutes</SelectItem>
                      <SelectItem value="medium">5-15 minutes</SelectItem>
                      <SelectItem value="long">Over 15 minutes</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium mb-1.5 block">
                    Author Type
                  </label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select author type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="psychologist">
                        Psychologists
                      </SelectItem>
                      <SelectItem value="psychiatrist">
                        Psychiatrists
                      </SelectItem>
                      <SelectItem value="counselor">Counselors</SelectItem>
                      <SelectItem value="researcher">Researchers</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium mb-1.5 block">
                    Publication Date
                  </label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select time period" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="week">Last week</SelectItem>
                      <SelectItem value="month">Last month</SelectItem>
                      <SelectItem value="year">Last year</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="p-4">
                <CardTitle className="text-base flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" />
                  Popular Topics
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <div className="flex flex-wrap gap-1.5">
                  {[
                    'Anxiety',
                    'Depression',
                    'Stress',
                    'Self-Care',
                    'Therapy',
                    'Mental Health',
                    'Wellness',
                    'Meditation',
                    'Relationships',
                    'Work-Life Balance',
                  ].map((topic, index) => (
                    <Badge
                      key={index}
                      variant="secondary"
                      className="cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 text-xs"
                    >
                      {topic}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          </aside>
        </div>
      </main>
    </div>
  );
};

export default ArticlesPage;
