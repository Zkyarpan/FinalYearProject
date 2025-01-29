'use client';

import { useState, useRef } from 'react';
import { ChevronLeft, ChevronRight, Play, Pause } from 'lucide-react';

const slides = [
  {
    id: 1,
    title: 'Feel-good library',
    description:
      'Explore 1,000+ guided meditations for feeling more relaxed — ad-free and always there. Try one for yourself.',
    bgColor: 'bg-blue-600',
    image:
      'https://images.unsplash.com/photo-1600618528240-fb9fc964b853?q=80&w=2070&auto=format&fit=crop',
    audioTitle: 'Breathe',
    audioSrc: '/meditations/breathe.mp3',
    duration: '2:23',
    buttonText: 'Learn more',
    buttonLink: '/content',
  },
  {
    id: 2,
    title: 'Always-there support',
    description:
      "Unpack what's on your mind with Ebb, our empathetic AI companion, and get personalized recommendations based on how you're feeling.",
    bgColor: 'bg-orange-400',
    image:
      'https://img.freepik.com/free-vector/meditation-illustration-concept_23-2148531006.jpg?t=st=1738137794~exp=1738141394~hmac=b2a72647e0916a8d06724c6130f275cad279441a4de09625688cb4327b216a55&w=740',
    buttonText: 'Learn more',

    buttonLink: '/ai-mental-health-companion',
  },
  {
    id: 3,
    title: 'Bedtime essentials',
    description:
      'Sleep more soundly every night with bedtime meditations, proven exercises, and relaxing sounds. Give it a listen.',
    bgColor: 'bg-purple-700',
    image: '/images/sleep.png',
    audioTitle: 'Gentle Rest',
    audioSrc: '/meditations/RelaxingSleep.mp3',
    duration: '59:06',
    buttonText: 'Explore sleep resources',
    buttonLink: '/sleep',
  },
  {
    id: 4,
    title: 'Do-anywhere exercises',
    description:
      'Reach your mental health goals with proven courses and expert-led guidance. Check out a preview here.',
    bgColor: 'bg-green-600',
    image:
      'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?q=80&w=2140&auto=format&fit=crop',
    audioTitle: 'Travel Sleep Tips',
    audioSrc: '/meditations/mindfulness.mp3',
    duration: '5:34',
    buttonText: 'Learn more',
    buttonLink: '/mental-health',
  },
];

const tabs = [
  { id: 1, label: 'Guided meditations' },
  { id: 2, label: 'Mindfulness' },
  { id: 3, label: 'Sleep resources' },
  { id: 4, label: 'Expert-led programs' },
];

const AudioPlayer = ({ audioSrc, audioTitle, duration }) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [progress, setProgress] = useState(0);

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
      const progress =
        (audioRef.current.currentTime / audioRef.current.duration) * 100;
      setProgress(progress);
    }
  };

  const formatTime = time => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="bg-white/10 rounded-lg p-4">
      <audio
        ref={audioRef}
        src={audioSrc}
        onTimeUpdate={handleTimeUpdate}
        onEnded={() => setIsPlaying(false)}
      />
      <div className="flex items-center gap-4">
        <button
          onClick={togglePlay}
          className="w-10 h-10 rounded-full bg-white flex items-center justify-center"
        >
          {isPlaying ? (
            <Pause className="w-5 h-5 text-black" />
          ) : (
            <Play className="w-5 h-5 text-black" />
          )}
        </button>
        <div className="flex-1">
          <div className="text-white text-sm mb-1">{audioTitle}</div>
          <div className="bg-white/20 h-1 rounded-full">
            <div
              className="bg-white h-full rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          <div className="text-white/80 text-xs mt-1">
            {formatTime(currentTime)} / {duration}
          </div>
        </div>
      </div>
    </div>
  );
};

export default function MentalHealthSection() {
  const [activeSlide, setActiveSlide] = useState(0);
  const [activeTab, setActiveTab] = useState(0);

  const nextSlide = () => {
    setActiveSlide(prev => (prev + 1) % slides.length);
    setActiveTab(prev => (prev + 1) % tabs.length);
  };

  const prevSlide = () => {
    setActiveSlide(prev => (prev - 1 + slides.length) % slides.length);
    setActiveTab(prev => (prev - 1 + tabs.length) % tabs.length);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-16">
      <h2 className="text-4xl font-bold text-center mb-8">
        The mental health app
        <br />
        for every moment
      </h2>

      <div className="flex justify-center gap-4 mb-8 font-medium">
        {tabs.map((tab, index) => (
          <button
            key={tab.id}
            onClick={() => {
              setActiveTab(index);
              setActiveSlide(index);
            }}
            className={`px-4 py-2 rounded-full transition-all ${
              activeTab === index
                ? 'dark:bg-blue-600 bg-black text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Carousel */}
      <div className="relative overflow-hidden rounded-2xl">
        <div
          className="flex transition-transform duration-500 ease-in-out"
          style={{ transform: `translateX(-${activeSlide * 100}%)` }}
        >
          {slides.map(slide => (
            <div
              key={slide.id}
              className={`w-full flex-shrink-0 ${slide.bgColor} p-12`}
            >
              <div className="flex items-center gap-12">
                <div className="w-1/2">
                  <h3 className="text-3xl font-bold text-white mb-4">
                    {slide.title}
                  </h3>
                  <p className="text-white/90 mb-6">{slide.description}</p>

                  {slide.audioSrc && (
                    <div className="mb-6">
                      <AudioPlayer
                        audioSrc={slide.audioSrc}
                        audioTitle={slide.audioTitle}
                        duration={slide.duration}
                      />
                    </div>
                  )}

                  <a
                    href={slide.buttonLink}
                    className="inline-block bg-white text-black px-6 py-3 rounded-full font-medium hover:bg-white/90 transition-colors"
                  >
                    {slide.buttonText}
                  </a>
                </div>
                <div className="w-1/2">
                  <img
                    src={slide.image}
                    alt={slide.title}
                    className="w-full h-96 object-cover rounded-lg"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Navigation */}
        <div className="absolute bottom-8 right-8 flex items-center gap-4">
          <div className="text-white">
            {activeSlide + 1}/{slides.length}
          </div>
          <div className="flex gap-2">
            <button
              onClick={prevSlide}
              className="p-2 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={activeSlide === 0}
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={nextSlide}
              className="p-2 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={activeSlide === slides.length - 1}
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
