// components/breathing/breathing-exercise.tsx
'use client';

import { useState, useEffect, useRef, FC } from 'react';
import {
  PlayCircle,
  PauseCircle,
  RefreshCw,
  Settings,
  VolumeX,
  Volume2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useActivityStore } from '@/store/activity-store';

interface BreathingPattern {
  phase: string;
  duration: number;
  instruction: string;
}

interface BreathingTechnique {
  name: string;
  pattern: BreathingPattern[];
}

interface BreathingExerciseProps {
  onExerciseComplete?: (technique: string, duration: number) => void;
}

const BreathingExercise: FC<BreathingExerciseProps> = ({
  onExerciseComplete,
}) => {
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentPhase, setCurrentPhase] = useState<string>('ready');
  const [progress, setProgress] = useState<number>(0);
  const [breathCount, setBreathCount] = useState<number>(0);
  const [totalTime, setTotalTime] = useState<number>(300); // 5 minutes in seconds
  const [remainingTime, setRemainingTime] = useState<number>(totalTime);
  const [technique, setTechnique] = useState<string>('box');
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [showSettings, setShowSettings] = useState<boolean>(false);

  const animationRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  // Get the activity logging function from store
  const logActivity = useActivityStore(state => state.logActivity);

  // Breathing patterns for different techniques
  const techniques: Record<string, BreathingTechnique> = {
    box: {
      name: 'Box Breathing',
      pattern: [
        {
          phase: 'inhale',
          duration: 4,
          instruction: 'Inhale slowly through your nose',
        },
        { phase: 'hold', duration: 4, instruction: 'Hold your breath' },
        {
          phase: 'exhale',
          duration: 4,
          instruction: 'Exhale slowly through your mouth',
        },
        { phase: 'hold', duration: 4, instruction: 'Hold your breath' },
      ],
    },
    relaxing: {
      name: 'Relaxing Breath (4-7-8)',
      pattern: [
        {
          phase: 'inhale',
          duration: 4,
          instruction: 'Inhale quietly through your nose',
        },
        { phase: 'hold', duration: 7, instruction: 'Hold your breath' },
        {
          phase: 'exhale',
          duration: 8,
          instruction: 'Exhale completely through your mouth',
        },
        { phase: 'reset', duration: 1, instruction: 'Prepare for next breath' },
      ],
    },
    energizing: {
      name: 'Energizing Breath',
      pattern: [
        {
          phase: 'inhale',
          duration: 2,
          instruction: 'Quick inhale through your nose',
        },
        {
          phase: 'exhale',
          duration: 2,
          instruction: 'Sharp exhale through your mouth',
        },
      ],
    },
    diaphragmatic: {
      name: 'Diaphragmatic Breathing',
      pattern: [
        {
          phase: 'inhale',
          duration: 5,
          instruction: 'Inhale deeply, expand your belly',
        },
        { phase: 'hold', duration: 2, instruction: 'Brief pause' },
        { phase: 'exhale', duration: 6, instruction: 'Long, slow exhale' },
      ],
    },
  };

  const [currentPatternIndex, setCurrentPatternIndex] = useState<number>(0);
  const [secondsInPhase, setSecondsInPhase] = useState<number>(0);

  const resetExercise = () => {
    setIsPlaying(false);
    setCurrentPhase('ready');
    setProgress(0);
    setBreathCount(0);
    setRemainingTime(totalTime);
    setCurrentPatternIndex(0);
    setSecondsInPhase(0);
  };

  const togglePlay = () => {
    if (!isPlaying) {
      setCurrentPhase('inhale');
    }
    setIsPlaying(!isPlaying);
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // Log completed exercise
  const completeExercise = () => {
    const durationInMinutes = Math.ceil((totalTime - remainingTime) / 60);

    // Log to activity store
    logActivity('breathing', {
      minutes: durationInMinutes || 1, // Minimum 1 minute
      exercise: techniques[technique].name,
    });

    // Call the callback if provided
    if (onExerciseComplete) {
      onExerciseComplete(techniques[technique].name, durationInMinutes || 1);
    }
  };

  // Effect for the main timer
  useEffect(() => {
    if (isPlaying) {
      const timerInterval = setInterval(() => {
        setRemainingTime(prev => {
          if (prev <= 1) {
            setIsPlaying(false);
            setCurrentPhase('complete');
            completeExercise();
            return 0;
          }
          return prev - 1;
        });

        setProgress(((totalTime - remainingTime + 1) / totalTime) * 100);
      }, 1000);

      return () => clearInterval(timerInterval);
    }
  }, [isPlaying, remainingTime, totalTime]);

  // Effect for the breathing pattern
  useEffect(() => {
    if (isPlaying && currentPhase !== 'ready' && currentPhase !== 'complete') {
      const pattern = techniques[technique].pattern;
      const currentPhaseConfig = pattern[currentPatternIndex];

      const patternInterval = setInterval(() => {
        setSecondsInPhase(prev => {
          if (prev + 1 >= currentPhaseConfig.duration) {
            // Move to next phase
            const nextPatternIndex = (currentPatternIndex + 1) % pattern.length;
            setCurrentPatternIndex(nextPatternIndex);
            setCurrentPhase(pattern[nextPatternIndex].phase);

            // Count completed breath cycles
            if (nextPatternIndex === 0) {
              setBreathCount(prev => prev + 1);
            }

            return 0;
          }
          return prev + 1;
        });
      }, 1000);

      return () => clearInterval(patternInterval);
    }
  }, [isPlaying, currentPhase, currentPatternIndex, technique]);

  // Handle technique change
  const handleTechniqueChange = (value: string) => {
    setTechnique(value);
    resetExercise();
  };

  // Handle duration change
  const handleDurationChange = (value: string) => {
    const newTime = parseInt(value) * 60;
    setTotalTime(newTime);
    setRemainingTime(newTime);
  };

  const getCurrentInstruction = (): string => {
    if (currentPhase === 'ready') return 'Get ready to begin';
    if (currentPhase === 'complete') return 'Session complete';

    return techniques[technique].pattern[currentPatternIndex].instruction;
  };

  const getCurrentPhaseProgress = (): number => {
    if (currentPhase === 'ready' || currentPhase === 'complete') return 0;

    const currentPhaseDuration =
      techniques[technique].pattern[currentPatternIndex].duration;
    return (secondsInPhase / currentPhaseDuration) * 100;
  };

  return (
    <Card className="border-0 shadow-lg overflow-hidden">
      <CardContent className="p-6">
        <div className="mb-5 flex justify-between items-center">
          <Select
            value={technique}
            onValueChange={handleTechniqueChange}
            disabled={isPlaying}
          >
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Select technique" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="box">Box Breathing (4-4-4-4)</SelectItem>
              <SelectItem value="relaxing">Relaxing Breath (4-7-8)</SelectItem>
              <SelectItem value="energizing">
                Energizing Breath (2-2)
              </SelectItem>
              <SelectItem value="diaphragmatic">
                Diaphragmatic Breathing
              </SelectItem>
            </SelectContent>
          </Select>

          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsMuted(!isMuted)}
            >
              {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
            </Button>

            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowSettings(!showSettings)}
            >
              <Settings size={20} />
            </Button>
          </div>
        </div>

        {showSettings && (
          <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <h3 className="text-sm font-medium mb-3">Settings</h3>

            <div className="space-y-4">
              <div>
                <Label htmlFor="duration" className="text-xs">
                  Duration
                </Label>
                <Select
                  value={String(totalTime / 60)}
                  onValueChange={handleDurationChange}
                  disabled={isPlaying}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select duration" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="2">2 minutes</SelectItem>
                    <SelectItem value="5">5 minutes</SelectItem>
                    <SelectItem value="10">10 minutes</SelectItem>
                    <SelectItem value="15">15 minutes</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="sound" className="text-xs">
                  Sound Guidance
                </Label>
                <Switch
                  id="sound"
                  checked={!isMuted}
                  onCheckedChange={checked => setIsMuted(!checked)}
                />
              </div>

              <div>
                <Label htmlFor="volume" className="text-xs mb-2 block">
                  Volume
                </Label>
                <Slider
                  id="volume"
                  disabled={isMuted}
                  defaultValue={[70]}
                  max={100}
                  step={1}
                />
              </div>
            </div>
          </div>
        )}

        <div className="flex flex-col items-center mb-8">
          {/* Breathing Circle Animation */}
          <div
            ref={animationRef}
            className={`
              relative w-56 h-56 rounded-full flex items-center justify-center 
              ${
                currentPhase === 'inhale'
                  ? 'animate-breathe-in'
                  : currentPhase === 'exhale'
                    ? 'animate-breathe-out'
                    : currentPhase === 'hold'
                      ? 'animate-hold'
                      : ''
              }
            `}
            style={{
              background: `conic-gradient(from 0deg, ${isPlaying ? 'rgba(59, 130, 246, 0.2)' : 'rgba(203, 213, 225, 0.2)'} 0%, rgba(99, 102, 241, 0.6) 100%)`,
            }}
          >
            <div className="w-44 h-44 rounded-full bg-card flex items-center justify-center">
              <div className="text-center">
                {currentPhase === 'ready' ? (
                  <div className="text-2xl font-semibold">Get Ready</div>
                ) : currentPhase === 'complete' ? (
                  <div className="text-2xl font-semibold text-green-500">
                    Complete!
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="text-2xl font-bold text-blue-500">
                      {currentPhase === 'inhale'
                        ? 'Inhale'
                        : currentPhase === 'exhale'
                          ? 'Exhale'
                          : currentPhase === 'hold'
                            ? 'Hold'
                            : 'Reset'}
                    </div>
                    <div className="text-4xl font-bold">
                      {currentPhase !== 'ready' && currentPhase !== 'complete'
                        ? techniques[technique].pattern[currentPatternIndex]
                            .duration - secondsInPhase
                        : ''}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Circular progress */}
            <svg className="absolute inset-0 w-full h-full -rotate-90">
              <circle
                cx="28"
                cy="28"
                r="24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeDasharray="150.8"
                strokeDashoffset={150.8 * (1 - getCurrentPhaseProgress() / 100)}
                className="text-blue-500 opacity-70"
                style={{
                  transformOrigin: 'center',
                  transform: 'scale(5)',
                }}
              />
            </svg>
          </div>

          <div className="text-center mt-4">
            <p className="text-lg">{getCurrentInstruction()}</p>
          </div>
        </div>

        <div className="space-y-6">
          <div className="flex justify-center space-x-4">
            <Button
              variant={isPlaying ? 'outline' : 'default'}
              size="lg"
              className={isPlaying ? 'border-red-500 text-red-500' : ''}
              onClick={togglePlay}
            >
              {isPlaying ? (
                <>
                  <PauseCircle className="mr-2 h-5 w-5" /> Pause
                </>
              ) : (
                <>
                  <PlayCircle className="mr-2 h-5 w-5" />{' '}
                  {currentPhase === 'complete' ? 'Restart' : 'Start'}
                </>
              )}
            </Button>

            <Button variant="outline" size="lg" onClick={resetExercise}>
              <RefreshCw className="mr-2 h-5 w-5" /> Reset
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="flex justify-between mb-1 text-sm">
                <span>Time Remaining</span>
                <span>{formatTime(remainingTime)}</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>

            <div>
              <div className="flex justify-between mb-1 text-sm">
                <span>Breath Cycles</span>
                <span>{breathCount}</span>
              </div>
              <div className="bg-gray-100 dark:bg-gray-800 h-2 rounded-full relative">
                <div
                  className="absolute top-0 left-0 h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full transition-all"
                  style={{
                    width: `${Math.min((breathCount / (totalTime / 60)) * 2 * 100, 100)}%`,
                  }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>

      {/* Audio element for guidance (hidden) */}
      <audio ref={audioRef} src="/breathing-sound.mp3" muted={isMuted} />

      {/* CSS for Breathing Animation */}
      <style jsx global>{`
        @keyframes breathe-in {
          0% {
            transform: scale(0.85);
            box-shadow: 0 0 0 rgba(59, 130, 246, 0.1);
          }
          100% {
            transform: scale(1.05);
            box-shadow: 0 0 20px rgba(59, 130, 246, 0.3);
          }
        }

        @keyframes breathe-out {
          0% {
            transform: scale(1.05);
            box-shadow: 0 0 20px rgba(59, 130, 246, 0.3);
          }
          100% {
            transform: scale(0.85);
            box-shadow: 0 0 0 rgba(59, 130, 246, 0.1);
          }
        }

        @keyframes hold {
          0%,
          100% {
            box-shadow: 0 0 10px rgba(59, 130, 246, 0.3);
          }
          50% {
            box-shadow: 0 0 20px rgba(99, 102, 241, 0.4);
          }
        }

        .animate-breathe-in {
          animation: breathe-in 4s forwards ease-in-out;
        }

        .animate-breathe-out {
          animation: breathe-out 4s forwards ease-in-out;
        }

        .animate-hold {
          animation: hold 2s infinite ease-in-out;
        }
      `}</style>
    </Card>
  );
};

export default BreathingExercise;
