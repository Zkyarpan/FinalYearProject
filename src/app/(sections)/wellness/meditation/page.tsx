'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Moon,
  Play,
  Pause,
  Heart,
  Clock,
  ChevronRight,
  Volume2,
  VolumeX,
  SkipBack,
  SkipForward,
  Bookmark,
  BookmarkCheck,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Progress } from '@/components/ui/progress';
import { Tooltip } from '@/components/ui/tooltip';

// Import from your store
import { useActivityStore, logActivity } from '@/store/activity-store';

// Types
interface Meditation {
  id: string;
  title: string;
  description: string;
  category: string;
  level: string;
  duration: number;
  audioSrc: string;
  imageSrc?: string;
  tags: string[];
}

// Sample meditation data
const MEDITATIONS: Meditation[] = [
  {
    id: 'breath-awareness',
    title: 'Breath Awareness',
    description:
      'A simple meditation focusing on the breath to calm the mind and reduce stress.',
    category: 'Focus',
    level: 'Beginner',
    duration: 10,
    audioSrc: '/meditations/breathe.mp3', // Replace with actual paths
    imageSrc: '/images/meditations/breath.jpg',
    tags: ['stress', 'focus', 'beginner'],
  },
  {
    id: 'body-scan',
    title: 'Body Scan',
    description:
      'Progressive relaxation through focused attention on different parts of the body.',
    category: 'Relaxation',
    level: 'Beginner',
    duration: 15,
    audioSrc: '/meditations/mindfulness.mp3',
    imageSrc: '/images/meditations/body-scan.jpg',
    tags: ['relaxation', 'sleep', 'stress'],
  },
  {
    id: 'loving-kindness',
    title: 'Loving Kindness',
    description:
      'Cultivate compassion for yourself and others through guided visualization.',
    category: 'Compassion',
    level: 'Intermediate',
    duration: 12,
    audioSrc: '/meditations/loving-kindness.mp3',
    imageSrc: '/images/meditations/compassion.jpg',
    tags: ['compassion', 'emotional', 'healing'],
  },
  {
    id: 'mindful-walking',
    title: 'Mindful Walking',
    description:
      'Practice mindfulness while walking to bring awareness to everyday movements.',
    category: 'Movement',
    level: 'Beginner',
    duration: 8,
    audioSrc: '/meditations/mindful-walking.mp3',
    imageSrc: '/images/meditations/walking.jpg',
    tags: ['movement', 'mindfulness', 'daily'],
  },
  {
    id: 'sleep-meditation',
    title: 'Sleep Meditation',
    description:
      'Gentle guidance to help you relax and prepare for a restful sleep.',
    category: 'Sleep',
    level: 'All Levels',
    duration: 20,
    audioSrc: '/meditations/sleep-meditation.mp3',
    imageSrc: '/images/meditations/sleep.jpg',
    tags: ['sleep', 'relaxation', 'evening'],
  },
  {
    id: 'gratitude-practice',
    title: 'Gratitude Practice',
    description:
      'Develop appreciation and positive outlook through guided gratitude meditation.',
    category: 'Positivity',
    level: 'Beginner',
    duration: 10,
    audioSrc: '/meditations/gratitude.mp3',
    imageSrc: '/images/meditations/gratitude.jpg',
    tags: ['gratitude', 'positivity', 'morning'],
  },
  {
    id: 'anxiety-relief',
    title: 'Anxiety Relief',
    description:
      'Reduce anxiety and find calm through breath and visualization techniques.',
    category: 'Therapeutic',
    level: 'Intermediate',
    duration: 15,
    audioSrc: '/meditations/anxiety-relief.mp3',
    imageSrc: '/images/meditations/anxiety.jpg',
    tags: ['anxiety', 'stress', 'therapeutic'],
  },
  {
    id: 'morning-clarity',
    title: 'Morning Clarity',
    description:
      'Start your day with intention and mental clarity through guided meditation.',
    category: 'Focus',
    level: 'All Levels',
    duration: 8,
    audioSrc: '/meditations/morning-clarity.mp3',
    imageSrc: '/images/meditations/morning.jpg',
    tags: ['morning', 'focus', 'energy'],
  },
];

// MindfulnessGrid component
const MindfulnessGrid = ({
  onSelectMeditation,
}: {
  onSelectMeditation: (meditation: Meditation) => void;
}) => {
  const [favorites, setFavorites] = useState<string[]>([]);

  // Toggle favorite status
  const toggleFavorite = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setFavorites(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
      {MEDITATIONS.map(meditation => (
        <div
          key={meditation.id}
          className="group bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer relative"
          onClick={() => onSelectMeditation(meditation)}
        >
          <div className="absolute top-3 right-3 z-10">
            <button
              onClick={e => toggleFavorite(meditation.id, e)}
              className="h-8 w-8 rounded-full bg-black/30 backdrop-blur-sm text-white hover:bg-black/50 transition-colors flex items-center justify-center"
            >
              {favorites.includes(meditation.id) ? (
                <BookmarkCheck className="h-4 w-4 text-yellow-400" />
              ) : (
                <Bookmark className="h-4 w-4" />
              )}
            </button>
          </div>

          <div
            className="h-40 bg-gradient-to-r relative"
            style={{
              backgroundColor:
                meditation.category === 'Focus'
                  ? '#4361ee'
                  : meditation.category === 'Relaxation'
                    ? '#7209b7'
                    : meditation.category === 'Compassion'
                      ? '#e63946'
                      : meditation.category === 'Movement'
                        ? '#2a9d8f'
                        : meditation.category === 'Sleep'
                          ? '#22223b'
                          : meditation.category === 'Positivity'
                            ? '#f77f00'
                            : meditation.category === 'Therapeutic'
                              ? '#7678ed'
                              : '#457b9d',
            }}
          >
            <div className="absolute inset-0 bg-[url('/meditation-pattern.svg')] opacity-20 mix-blend-overlay"></div>
            <div className="absolute inset-0 flex items-center justify-center transition-transform group-hover:scale-110 duration-300">
              <div className="h-16 w-16 rounded-full bg-white/20 flex items-center justify-center">
                <Play className="h-8 w-8 text-white" />
              </div>
            </div>
          </div>

          <div className="p-4">
            <h3 className="font-semibold text-lg mb-1">{meditation.title}</h3>
            <p className="text-gray-400 text-sm line-clamp-2 mb-3">
              {meditation.description}
            </p>

            <div className="flex flex-wrap gap-2 mb-3">
              <Badge variant="outline" className="bg-gray-800 text-xs">
                {meditation.category}
              </Badge>
              <Badge variant="outline" className="bg-gray-800 text-xs">
                {meditation.level}
              </Badge>
            </div>

            <div className="flex items-center justify-between text-gray-400 text-sm">
              <div className="flex items-center">
                <Clock className="h-3.5 w-3.5 mr-1" />
                <span>{meditation.duration} min</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="text-xs p-0 hover:bg-transparent hover:text-white h-auto"
              >
                <span>Start</span>
                <ChevronRight className="h-3.5 w-3.5 ml-1" />
              </Button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

// Main Meditation Player
const MeditationPlayer = ({
  meditation,
  onClose,
  onComplete,
}: {
  meditation: Meditation;
  onClose: () => void;
  onComplete: (duration: number) => void;
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const [isMuted, setIsMuted] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasEnded, setHasEnded] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  // For this example, we'll simulate audio without actual files
  useEffect(() => {
    // Create audio element
    const audio = new Audio();
    // In a real app, this would be the actual audio file
    // Since we don't have actual files, we'll use a silent fallback
    audio.src =
      meditation.audioSrc ||
      'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=';
    audio.volume = volume;
    audio.muted = isMuted;

    // Set up event listeners
    audio.addEventListener('loadedmetadata', () => {
      setDuration(audio.duration || meditation.duration * 60);
      setIsLoaded(true);
    });

    audio.addEventListener('timeupdate', () => {
      setCurrentTime(audio.currentTime);
    });

    audio.addEventListener('ended', () => {
      setIsPlaying(false);
      setHasEnded(true);
      onComplete(meditation.duration);
    });

    audioRef.current = audio;

    // For the purposes of our example (without actual audio files)
    // Let's set the duration based on the meditation length
    setDuration(meditation.duration * 60);
    setIsLoaded(true);

    return () => {
      audio.pause();
      audio.src = '';
      audio.removeEventListener('loadedmetadata', () => {});
      audio.removeEventListener('timeupdate', () => {});
      audio.removeEventListener('ended', () => {});
    };
  }, [meditation, volume, isMuted]);

  // Play/Pause controls
  const togglePlayPause = () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
    } else {
      // If we've reached the end, start over
      if (hasEnded) {
        audioRef.current.currentTime = 0;
        setHasEnded(false);
      }
      audioRef.current
        .play()
        .catch(e => console.error('Could not play audio:', e));
    }

    setIsPlaying(!isPlaying);
  };

  // Volume controls
  const handleVolumeChange = (newVolume: number[]) => {
    if (!audioRef.current) return;

    const vol = newVolume[0];
    setVolume(vol);
    audioRef.current.volume = vol;

    if (vol === 0) {
      setIsMuted(true);
    } else if (isMuted) {
      setIsMuted(false);
    }
  };

  const toggleMute = () => {
    if (!audioRef.current) return;

    const newMutedState = !isMuted;
    setIsMuted(newMutedState);
    audioRef.current.muted = newMutedState;
  };

  // Seek controls
  const handleSeek = (newPosition: number[]) => {
    if (!audioRef.current || !isLoaded) return;

    const seekTime = newPosition[0];
    audioRef.current.currentTime = seekTime;
    setCurrentTime(seekTime);
  };

  // For skip back/forward 15 seconds
  const skipTime = (seconds: number) => {
    if (!audioRef.current || !isLoaded) return;

    const newTime = Math.max(0, Math.min(duration, currentTime + seconds));
    audioRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  // Format time helper
  const formatTime = (timeInSeconds: number) => {
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = Math.floor(timeInSeconds % 60);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  // Progress percentage
  const progress = isLoaded ? (currentTime / duration) * 100 : 0;

  // Find related meditations based on category and tags
  const relatedMeditations = MEDITATIONS.filter(
    item =>
      item.id !== meditation.id &&
      (item.category === meditation.category ||
        item.tags.some(tag => meditation.tags.includes(tag)))
  ).slice(0, 3);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2">
        <Card className="border-0 shadow-lg overflow-hidden">
          <div className="relative h-64">
            <div
              className="absolute inset-0 bg-gradient-to-r"
              style={{
                backgroundColor:
                  meditation.category === 'Focus'
                    ? '#4361ee'
                    : meditation.category === 'Relaxation'
                      ? '#7209b7'
                      : meditation.category === 'Compassion'
                        ? '#e63946'
                        : meditation.category === 'Movement'
                          ? '#2a9d8f'
                          : meditation.category === 'Sleep'
                            ? '#22223b'
                            : meditation.category === 'Positivity'
                              ? '#f77f00'
                              : meditation.category === 'Therapeutic'
                                ? '#7678ed'
                                : '#457b9d',
              }}
            ></div>
            <div className="absolute inset-0 bg-[url('/meditation-pattern.svg')] opacity-20 mix-blend-overlay"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <button
                onClick={togglePlayPause}
                className="w-20 h-20 rounded-full bg-white/20 hover:bg-white/30 transition-colors flex items-center justify-center"
              >
                {isPlaying ? (
                  <Pause className="h-10 w-10 text-white" />
                ) : (
                  <Play className="h-10 w-10 text-white ml-1" />
                )}
              </button>
            </div>
          </div>

          <CardContent className="pt-6">
            <h3 className="text-2xl font-bold mb-2">{meditation.title}</h3>
            <p className="text-gray-500 dark:text-gray-400 mb-6">
              {meditation.description}
            </p>

            <div className="flex items-center gap-4 mb-6">
              <Badge variant="outline">{meditation.category}</Badge>
              <Badge variant="outline">{meditation.level}</Badge>
              <div className="flex items-center text-gray-500">
                <Clock className="h-4 w-4 mr-1" />
                <span>{meditation.duration} min</span>
              </div>
            </div>

            {/* Audio controls */}
            <div className="space-y-4 mb-6">
              {/* Progress bar */}
              <div className="space-y-2">
                <Slider
                  value={[currentTime]}
                  min={0}
                  max={duration}
                  step={1}
                  onValueChange={handleSeek}
                  disabled={!isLoaded}
                />
                <div className="flex justify-between text-xs text-gray-500">
                  <span>{formatTime(currentTime)}</span>
                  <span>{formatTime(duration)}</span>
                </div>
              </div>

              {/* Control buttons */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-9 w-9 p-0 rounded-full"
                    onClick={toggleMute}
                  >
                    {isMuted || volume === 0 ? (
                      <VolumeX className="h-4 w-4" />
                    ) : (
                      <Volume2 className="h-4 w-4" />
                    )}
                  </Button>
                  <div className="w-24">
                    <Slider
                      value={[volume]}
                      min={0}
                      max={1}
                      step={0.01}
                      onValueChange={handleVolumeChange}
                    />
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-10 w-10 p-0 rounded-full"
                    onClick={() => skipTime(-15)}
                  >
                    <SkipBack className="h-5 w-5" />
                  </Button>
                  <Button
                    variant="default"
                    size="lg"
                    className="h-12 w-12 p-0 rounded-full bg-gradient-to-r from-purple-600 to-indigo-600"
                    onClick={togglePlayPause}
                  >
                    {isPlaying ? (
                      <Pause className="h-6 w-6 text-white" />
                    ) : (
                      <Play className="h-6 w-6 text-white ml-0.5" />
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-10 w-10 p-0 rounded-full"
                    onClick={() => skipTime(15)}
                  >
                    <SkipForward className="h-5 w-5" />
                  </Button>
                </div>

                <div className="w-[88px]">
                  {/* Placeholder to balance layout */}
                </div>
              </div>
            </div>

            {/* Background sounds - just UI for completeness */}
            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 mb-4">
              <h4 className="text-sm font-medium mb-3">Background Sounds</h4>
              <div className="grid grid-cols-3 gap-2">
                {[
                  'Rain',
                  'Ocean',
                  'Forest',
                  'White Noise',
                  'Birds',
                  'Stream',
                ].map(sound => (
                  <button
                    key={sound}
                    className="py-2 px-3 text-xs rounded-md bg-gray-200 dark:bg-gray-700 hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors"
                  >
                    {sound}
                  </button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div>
        <Card className="border-0 shadow-md sticky top-8">
          <CardHeader className="bg-gradient-to-r from-purple-100 to-indigo-100 dark:from-purple-900/30 dark:to-indigo-900/30">
            <CardTitle className="flex items-center text-xl">
              Related Meditations
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-4">
              {relatedMeditations.map(relMeditation => (
                <div
                  key={relMeditation.id}
                  className="flex gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  onClick={() => {
                    onClose();
                    setTimeout(() => onClose(), 0); // This is a hack to reset the player
                  }}
                >
                  <div
                    className="w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center"
                    style={{
                      backgroundColor:
                        relMeditation.category === 'Focus'
                          ? 'rgba(67, 97, 238, 0.2)'
                          : relMeditation.category === 'Relaxation'
                            ? 'rgba(114, 9, 183, 0.2)'
                            : relMeditation.category === 'Compassion'
                              ? 'rgba(230, 57, 70, 0.2)'
                              : relMeditation.category === 'Movement'
                                ? 'rgba(42, 157, 143, 0.2)'
                                : relMeditation.category === 'Sleep'
                                  ? 'rgba(34, 34, 59, 0.2)'
                                  : relMeditation.category === 'Positivity'
                                    ? 'rgba(247, 127, 0, 0.2)'
                                    : relMeditation.category === 'Therapeutic'
                                      ? 'rgba(118, 120, 237, 0.2)'
                                      : 'rgba(69, 123, 157, 0.2)',
                      color:
                        relMeditation.category === 'Focus'
                          ? 'rgb(67, 97, 238)'
                          : relMeditation.category === 'Relaxation'
                            ? 'rgb(114, 9, 183)'
                            : relMeditation.category === 'Compassion'
                              ? 'rgb(230, 57, 70)'
                              : relMeditation.category === 'Movement'
                                ? 'rgb(42, 157, 143)'
                                : relMeditation.category === 'Sleep'
                                  ? 'rgb(34, 34, 59)'
                                  : relMeditation.category === 'Positivity'
                                    ? 'rgb(247, 127, 0)'
                                    : relMeditation.category === 'Therapeutic'
                                      ? 'rgb(118, 120, 237)'
                                      : 'rgb(69, 123, 157)',
                    }}
                  >
                    <Moon className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="font-medium">{relMeditation.title}</h4>
                    <div className="flex items-center text-xs text-gray-500">
                      <Clock className="h-3 w-3 mr-1" />
                      <span>{relMeditation.duration} min</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
              <p className="text-sm font-medium mb-2">Meditation Tip</p>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                If your mind wanders during meditation, simply notice this
                without judgment and gently bring your attention back to your
                breath.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default function MeditationPage() {
  const router = useRouter();
  const [selectedMeditation, setSelectedMeditation] =
    useState<Meditation | null>(null);
  const [meditationStats, setMeditationStats] = useState({
    sessions: 8,
    minutes: 60,
    streak: 3,
  });

  // Get stats from the activity store
  const breathingStats = useActivityStore(state =>
    state.getActivityStats('meditation')
  );

  // Handle meditation selection
  const handleMeditationSelect = (meditation: Meditation) => {
    setSelectedMeditation(meditation);
  };

  // Handle meditation completion
  const handleMeditationComplete = (duration: number) => {
    // Log the activity in your store
    logActivity('meditation', {
      minutes: duration,
      exercise: selectedMeditation?.title,
      category: selectedMeditation?.category,
    });

    // Update local stats for immediate UI feedback
    setMeditationStats(prev => ({
      sessions: prev.sessions + 1,
      minutes: prev.minutes + duration,
      streak: prev.streak + 1,
    }));

    // You could show a completion message or reward here
    console.log(`Completed ${duration} minutes of meditation`);
  };

  return (
    <div className="mx-auto px-4 py-8">
      <Button
        variant="ghost"
        className="mb-6"
        onClick={() => {
          if (selectedMeditation) {
            setSelectedMeditation(null);
          } else {
            router.push('/wellness');
          }
        }}
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        {selectedMeditation ? 'Back to Meditations' : 'Back to Wellness'}
      </Button>

      {/* Hero section */}
      <div className="relative bg-card rounded-md mb-10 overflow-hidden">
        <div className="absolute inset-0 bg-[url('/meditation-pattern.svg')] opacity-10"></div>
        <div className="py-12 px-6 sm:px-8 relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl font-extrabold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-indigo-500">
              Guided Meditation
            </h1>
            <p className="text-xl opacity-90 max-w-2xl mx-auto">
              Mindfulness practices for relaxation, mental clarity, and
              emotional balance.
            </p>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-8">
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                <div className="text-3xl font-bold">
                  {meditationStats.sessions}
                </div>
                <div className="text-sm opacity-80">Sessions</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                <div className="text-3xl font-bold">
                  {meditationStats.minutes}
                </div>
                <div className="text-sm opacity-80">Minutes</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                <div className="text-3xl font-bold">
                  {meditationStats.streak}
                </div>
                <div className="text-sm opacity-80">Day Streak</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {!selectedMeditation ? (
        <div>
          <h2 className="text-3xl font-bold flex items-center gap-2 mb-6">
            <Moon className="h-7 w-7 text-purple-500" /> Meditation Library
          </h2>

          <MindfulnessGrid onSelectMeditation={handleMeditationSelect} />

          <div className="mt-12 bg-card rounded-lg p-6 shadow-md">
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Heart className="h-5 w-5 text-purple-500" /> Benefits of
              Meditation
            </h3>
            <p className="mb-4 text-gray-500">
              Regular meditation practice can help improve various aspects of
              your mental and physical wellbeing:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <h4 className="font-medium mb-2">Stress Reduction</h4>
                <p className="text-sm text-gray-500">
                  Lowers cortisol levels and helps manage stress responses
                </p>
              </div>
              <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <h4 className="font-medium mb-2">Emotional Regulation</h4>
                <p className="text-sm text-gray-500">
                  Improves ability to manage difficult emotions
                </p>
              </div>
              <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <h4 className="font-medium mb-2">Better Sleep</h4>
                <p className="text-sm text-gray-500">
                  Helps calm the mind for more restful and higher quality sleep
                </p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        // Meditation player view
        <MeditationPlayer
          meditation={selectedMeditation}
          onClose={() => setSelectedMeditation(null)}
          onComplete={handleMeditationComplete}
        />
      )}
    </div>
  );
}
