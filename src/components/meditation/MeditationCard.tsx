// components/meditation/meditation-card.tsx
'use client';

import { useState, FC } from 'react';
import {
  Play,
  Clock,
  Bookmark,
  BookmarkCheck,
  ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface MeditationCardProps {
  title: string;
  description: string;
  duration: number;
  category: string;
  level?: string;
  image?: string;
  color?: string;
  onClick: () => void;
}

// MeditationCard component for displaying meditation sessions
export const MeditationCard: FC<MeditationCardProps> = ({
  title,
  description,
  duration,
  category,
  level = 'Beginner',
  image = 'meditation-bg.jpg',
  color = 'from-purple-500 to-indigo-500',
  onClick,
}) => {
  const [saved, setSaved] = useState<boolean>(false);

  const toggleSaved = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSaved(!saved);
  };

  return (
    <Card
      className="overflow-hidden border-0 shadow-md hover:shadow-xl transition-all cursor-pointer h-full flex flex-col"
      onClick={onClick}
    >
      <div className="relative h-40">
        <div
          className={`absolute inset-0 bg-gradient-to-r ${color} opacity-90`}
        ></div>
        <div className="absolute inset-0 bg-[url('/meditation-pattern.svg')] opacity-20 mix-blend-overlay"></div>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center">
            <Play className="h-8 w-8 text-white" />
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-2 right-2 text-white hover:bg-white/20"
          onClick={toggleSaved}
        >
          {saved ? (
            <BookmarkCheck className="h-5 w-5" />
          ) : (
            <Bookmark className="h-5 w-5" />
          )}
        </Button>
      </div>

      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <CardTitle className="text-xl">{title}</CardTitle>
        </div>
        <div className="flex items-center gap-2 mt-1">
          <Badge variant="outline" className="text-xs font-normal">
            {category}
          </Badge>
          <Badge variant="outline" className="text-xs font-normal">
            {level}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="pb-3 flex-grow">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {description}
        </p>
      </CardContent>

      <CardFooter className="pt-0 flex justify-between items-center text-sm text-gray-500">
        <div className="flex items-center">
          <Clock className="h-4 w-4 mr-1" />
          <span>{duration} min</span>
        </div>
        <Button variant="ghost" size="sm" className="p-0 h-auto">
          <span className="mr-1">Start</span>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </CardFooter>
    </Card>
  );
};

interface Meditation {
  id: string;
  title: string;
  description: string;
  duration: number;
  category: string;
  level: string;
  color: string;
}

interface MindfulnessGridProps {
  onSelectMeditation: (meditation: Meditation) => void;
}

// MindfulnessGrid component to display a grid of meditation cards
export const MindfulnessGrid: FC<MindfulnessGridProps> = ({
  onSelectMeditation,
}) => {
  const meditations: Meditation[] = [
    {
      id: 'breath-awareness',
      title: 'Breath Awareness',
      description:
        'A simple meditation focusing on the breath to calm the mind and reduce stress.',
      duration: 10,
      category: 'Focus',
      level: 'Beginner',
      color: 'from-blue-500 to-indigo-500',
    },
    {
      id: 'body-scan',
      title: 'Body Scan',
      description:
        'Progressive relaxation through focused attention on different parts of the body.',
      duration: 15,
      category: 'Relaxation',
      level: 'Beginner',
      color: 'from-purple-500 to-pink-500',
    },
    {
      id: 'loving-kindness',
      title: 'Loving Kindness',
      description:
        'Cultivate compassion for yourself and others through guided visualization.',
      duration: 12,
      category: 'Compassion',
      level: 'Intermediate',
      color: 'from-rose-500 to-red-500',
    },
    {
      id: 'mindful-walking',
      title: 'Mindful Walking',
      description:
        'Practice mindfulness while walking to bring awareness to everyday movements.',
      duration: 8,
      category: 'Movement',
      level: 'Beginner',
      color: 'from-green-500 to-emerald-500',
    },
    {
      id: 'gratitude',
      title: 'Gratitude Practice',
      description:
        'Develop appreciation for the positive aspects of your life with this guided meditation.',
      duration: 10,
      category: 'Positivity',
      level: 'All Levels',
      color: 'from-amber-500 to-yellow-500',
    },
    {
      id: 'sleep-meditation',
      title: 'Sleep Meditation',
      description:
        'Gentle guidance to help you relax deeply and prepare for restful sleep.',
      duration: 20,
      category: 'Sleep',
      level: 'All Levels',
      color: 'from-indigo-500 to-purple-500',
    },
    {
      id: 'anxiety-relief',
      title: 'Anxiety Relief',
      description:
        'Techniques to help manage anxiety and find calm during stressful moments.',
      duration: 15,
      category: 'Stress Relief',
      level: 'All Levels',
      color: 'from-cyan-500 to-blue-500',
    },
    {
      id: 'morning-clarity',
      title: 'Morning Clarity',
      description:
        'Start your day with intention and focus with this energizing morning practice.',
      duration: 8,
      category: 'Energy',
      level: 'Beginner',
      color: 'from-orange-500 to-amber-500',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {meditations.map(meditation => (
        <MeditationCard
          key={meditation.id}
          title={meditation.title}
          description={meditation.description}
          duration={meditation.duration}
          category={meditation.category}
          level={meditation.level}
          color={meditation.color}
          onClick={() => onSelectMeditation(meditation)}
        />
      ))}
    </div>
  );
};
