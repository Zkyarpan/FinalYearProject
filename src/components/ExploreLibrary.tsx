'use client';

import React, { useState } from 'react';

import Star from '@/icons/Star';
import Mindfulness from '@/icons/Mindfulness';
import StarIcon from '@/icons/StarIcon';
import MoonIcon from '@/icons/MoonIcon';
import HeartIcon from '@/icons/HeartIcon';

const libraryContent = {
  featured: [
    {
      tag: 'New',
      title: 'Meet Ebb',
      description: 'Get personalized content recommendations with Ebb',
      image:
        'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&q=80&w=800&h=600',
    },
    {
      title: 'Mindful Families Collection',
      description:
        'Bring your attention to all interactions with your children',
      image:
        'https://images.unsplash.com/photo-1516627145497-ae6968895b74?auto=format&fit=crop&q=80&w=800&h=600',
    },
    {
      tag: 'New',
      title: 'Politics Without Panic',
      description: 'Stress-relieving tools for election season',
      image:
        'https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?auto=format&fit=crop&q=80&w=800&h=600',
    },
    {
      tag: 'Trending',
      title: 'Headspace XR',
      description: 'A playground for your mind',
      image:
        'https://images.unsplash.com/photo-1519834785169-98be25ec3f84?auto=format&fit=crop&q=80&w=800&h=600',
    },
  ],
  popular: [
    {
      tag: 'Trending',
      title: 'Daily Calm',
      description: 'Start your day with mindfulness and intention',
      image:
        'https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&q=80&w=800&h=600',
    },
    {
      tag: 'Top Rated',
      title: 'Sleep Stories',
      description: 'Drift off with soothing bedtime tales',
      image:
        'https://images.unsplash.com/photo-1511295742362-92c96b1cf484?auto=format&fit=crop&q=80&w=800&h=600',
    },
    {
      title: 'Anxiety Release',
      description: 'Learn techniques to manage anxiety effectively',
      image:
        'https://images.unsplash.com/photo-1474418397713-7ede21d49118?auto=format&fit=crop&q=80&w=800&h=600',
    },
    {
      tag: 'Featured',
      title: 'Mindful Walking',
      description: 'Transform your daily walks into meditation',
      image:
        'https://images.unsplash.com/photo-1476611338391-6f395a0ebc7b?auto=format&fit=crop&q=80&w=800&h=600',
    },
  ],
  sleep: [
    {
      title: 'Deep Sleep Sounds',
      description: 'Natural soundscapes for better rest',
      image:
        'https://images.unsplash.com/photo-1455642305367-68834a1da7ab?auto=format&fit=crop&q=80&w=800&h=600',
    },
    {
      tag: 'New',
      title: 'Bedtime Wind Down',
      description: 'Gentle exercises for peaceful nights',
      image:
        'https://images.unsplash.com/photo-1489549132488-d00b7eee80f1?auto=format&fit=crop&q=80&w=800&h=600',
    },
    {
      title: 'Sleep Music',
      description: 'Calming melodies for restorative sleep',
      image:
        'https://images.unsplash.com/photo-1468657988500-aca2be09f4c6?auto=format&fit=crop&q=80&w=800&h=600',
    },
    {
      tag: 'Popular',
      title: 'Nighttime Meditation',
      description: 'Guided sessions for peaceful dreams',
      image:
        'https://images.unsplash.com/photo-1483982258113-b72862e6cff6?auto=format&fit=crop&q=80&w=800&h=600',
    },
  ],
  stress: [
    {
      tag: 'Featured',
      title: 'Stress Relief',
      description: 'Quick exercises for immediate calm',
      image:
        'https://images.unsplash.com/photo-1528715471579-d1bcf0ba5e83?auto=format&fit=crop&q=80&w=800&h=600',
    },
    {
      title: 'Breathing Techniques',
      description: 'Master your breath, master your mind',
      image:
        'https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&q=80&w=800&h=600',
    },
    {
      tag: 'New',
      title: 'Work Life Balance',
      description: 'Find harmony in your daily routine',
      image:
        'https://images.unsplash.com/photo-1499750310107-5fef28a66643?auto=format&fit=crop&q=80&w=800&h=600',
    },
    {
      title: 'Nature Moments',
      description: 'Connect with calming natural scenes',
      image:
        'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&q=80&w=800&h=600',
    },
  ],
  meditation: [
    {
      title: "Beginner's Guide",
      description: 'Start your meditation journey here',
      image:
        'https://images.unsplash.com/photo-1593811167562-9cef47bfc4d7?auto=format&fit=crop&q=80&w=800&h=600',
    },
    {
      tag: 'Popular',
      title: 'Body Scan',
      description: 'Deep relaxation for mind and body',
      image:
        'https://images.unsplash.com/photo-1545389336-cf090694435e?auto=format&fit=crop&q=80&w=800&h=600',
    },
    {
      tag: 'New',
      title: 'Loving Kindness',
      description: 'Cultivate compassion and inner peace',
      image:
        'https://images.unsplash.com/photo-1531747118685-ca8fa6e08806?auto=format&fit=crop&q=80&w=800&h=600',
    },
    {
      title: 'Focus Flow',
      description: 'Enhance concentration and clarity',
      image:
        'https://images.unsplash.com/photo-1508672019048-805c876b67e2?auto=format&fit=crop&q=80&w=800&h=600',
    },
  ],
};

const ExploreLibrary = () => {
  const [activeCategory, setActiveCategory] = useState('featured');

  const categories = [
    {
      id: 'featured',
      icon: Star,
      label: 'Featured',
      defaultBg: 'bg-gray-100',
      activeBg: 'bg-blue-600',
      defaultText: 'text-gray-700',
      activeText: 'text-white',
    },
    {
      id: 'popular',
      icon: HeartIcon,
      label: 'Popular',
      defaultBg: 'bg-gray-100',
      activeBg: 'bg-blue-600',
      defaultText: 'text-gray-700',
      activeText: 'text-white',
    },
    {
      id: 'sleep',
      icon: MoonIcon,
      label: 'Sleep',
      defaultBg: 'bg-gray-100',
      activeBg: 'bg-blue-600',
      defaultText: 'text-gray-700',
      activeText: 'text-white',
    },
    {
      id: 'stress',
      icon: StarIcon,
      label: 'Stress',
      defaultBg: 'bg-gray-100',
      activeBg: 'bg-blue-600',
      defaultText: 'text-gray-700',
      activeText: 'text-white',
    },
    {
      id: 'meditation',
      icon: Mindfulness,
      label: 'Meditation',
      defaultBg: 'bg-gray-100',
      activeBg: 'bg-blue-600',
      defaultText: 'text-gray-700',
      activeText: 'text-white',
    },
  ];

  return (
    <div className="w-full px-4 py-8">
      <h2 className="text-4xl font-bold mb-10 text-center">
        Explore our library
      </h2>

      <div className="flex space-x-4 mb-8 overflow-x-auto pb-4 justify-center font-medium">
        {categories.map(
          ({
            id,
            icon: Icon,
            label,
            defaultBg,
            activeBg,
            defaultText,
            activeText,
          }) => (
            <button
              key={id}
              onClick={() => setActiveCategory(id)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-full transition-all duration-200 ${
                activeCategory === id
                  ? `${activeBg} ${activeText}`
                  : `${defaultBg} ${defaultText} hover:bg-gray-200`
              }`}
            >
              <Icon />
              <span>{label}</span>
            </button>
          )
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-2 gap-8 mb-10">
        {libraryContent[activeCategory].map((card, index) => (
          <div
            key={index}
            className="relative rounded-xl overflow-hidden  group cursor-pointer transform transition-transform duration-200 h-96"
          >
            <img
              src={card.image}
              alt={card.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent">
              <div className="absolute inset-x-0 bottom-0 p-8 flex flex-col justify-end h-full">
                {card.tag && (
                  <span className="inline-block px-4 py-1.5 bg-primary text-white text-sm font-semibold rounded-full mb-4 w-fit">
                    {card.tag}
                  </span>
                )}
                <h3 className="text-2xl font-bold text-white mb-3">
                  {card.title}
                </h3>
                <p className="text-white/90 text-lg font-medium leading-snug">
                  {card.description}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ExploreLibrary;
