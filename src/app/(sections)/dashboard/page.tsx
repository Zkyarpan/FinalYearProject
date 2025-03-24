'use client';

import { useEffect, useState } from 'react';
import {
  Bell,
  Calendar,
  ChevronRight,
  Clock,
  HelpCircle,
  Menu,
  Search,
  Settings,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useUserStore } from '@/store/userStore';
import { useRouter } from 'next/navigation';

function App() {
  const router = useRouter();
  const [selectedTimeRange, setSelectedTimeRange] = useState('week');



  const moodData = [
    { date: 'Mon', value: 85 },
    { date: 'Tue', value: 72 },
    { date: 'Wed', value: 90 },
    { date: 'Thu', value: 65 },
    { date: 'Fri', value: 88 },
    { date: 'Sat', value: 95 },
    { date: 'Sun', value: 82 },
  ];

  const quickAccessItems = [
    { title: 'Sleep Tracking', value: '8.2h', color: 'bg-[#A7BE7C]' },
    { title: 'Health Journal', value: '16d', color: 'bg-[#F4A460]' },
    { title: 'AI Chatbot', value: '187+', color: 'bg-[#A388EE]' },
    { title: "Today's Plan", value: '4 tasks', color: 'bg-[#5C4033]' },
  ];

  return (
    <div className="min-h-screen p-6">
      {/* Main Content Area */}
      <div className="mx-auto max-w-[1200px]">
        {/* Header */}
        <div className="mb-8 flex items-start justify-start">
          <div className="flex items-start">
            <Button variant="ghost" size="icon"></Button>
            <h1 className="text-2xl font-bold -ml-9 main-font">
              Hello, Arpan! 👋
            </h1>
          </div>
        </div>

        {/* Time Range and Actions */}
        <div className="mb-8 flex items-center justify-between">
          <Select
            value={selectedTimeRange}
            onValueChange={setSelectedTimeRange}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select time range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="day">Today</SelectItem>
              <SelectItem value="week">This Week</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
              <SelectItem value="year">This Year</SelectItem>
            </SelectContent>
          </Select>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <Clock className="mr-2 h-4 w-4" />
              Set Goals
            </Button>
            <Button variant="outline" size="sm">
              <Calendar className="mr-2 h-4 w-4" />
              Schedule
            </Button>
          </div>
        </div>

        {/* Main Stats Grid */}
        <div className="mb-8 grid gap-6 lg:grid-cols-2">
          {/* Mental Wellness Score */}
          <Card className="p-6">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="text-4xl font-bold">97.245%</h2>
                <p className="text-sm text-gray-500">Mental Wellness Score</p>
              </div>
              <Button variant="secondary" className="gap-2">
                View Details <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            <div className="relative h-[200px] w-full">
              <svg className="h-full w-full">
                <path
                  d="M 0 150 C 50 100, 100 180, 150 80 C 200 150, 250 50, 300 120 C 350 90, 400 160, 450 100"
                  fill="none"
                  stroke="#5C4033"
                  strokeWidth="2"
                />
                {moodData.map((point, index) => (
                  <circle
                    key={index}
                    cx={index * 75}
                    cy={200 - point.value * 1.5}
                    r="4"
                    fill="#5C4033"
                  />
                ))}
              </svg>
              <div className="absolute bottom-0 flex w-full justify-between text-sm text-gray-500">
                {moodData.map(point => (
                  <span key={point.date}>{point.date}</span>
                ))}
              </div>
            </div>
          </Card>

          {/* Stress Level */}
          <Card className="p-6">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="text-4xl font-bold">8.2x</h2>
                <p className="text-sm text-gray-500">Stress Level</p>
              </div>
              <Button variant="secondary" className="gap-2">
                View Details <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            <div className="relative flex h-[200px] items-center justify-center">
              <div className="relative h-48 w-48">
                <svg className="h-full w-full -rotate-90 transform">
                  <circle
                    cx="96"
                    cy="96"
                    r="88"
                    fill="none"
                    stroke="#e5e7eb"
                    strokeWidth="16"
                  />
                  <circle
                    cx="96"
                    cy="96"
                    r="88"
                    fill="none"
                    stroke="#84cc16"
                    strokeWidth="16"
                    strokeDasharray="553"
                    strokeDashoffset="166"
                  />
                </svg>
                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 transform">
                  <Button
                    size="icon"
                    variant="outline"
                    className="h-12 w-12 rounded-full"
                  >
                    <HelpCircle className="h-6 w-6" />
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Quick Access Grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {quickAccessItems.map((item, index) => (
            <Card key={index} className={`${item.color} p-6 text-white`}>
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-lg font-semibold">{item.title}</h3>
                <Button
                  size="icon"
                  variant="ghost"
                  className="text-white hover:text-white/80"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
              <div className="space-y-4">
                <span className="text-4xl font-bold">{item.value}</span>
                <div className="space-y-2">
                  <Progress value={75} className="h-1 bg-white/20" />
                  <Progress value={45} className="h-1 bg-white/20" />
                  <Progress value={60} className="h-1 bg-white/20" />
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}

export default App;
