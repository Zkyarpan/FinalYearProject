'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
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
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Play, Pause, RotateCcw, Info, Medal, Clock } from 'lucide-react';

// Breathing patterns with instructions
const BREATHING_PATTERNS = {
  box: {
    name: 'Box Breathing',
    description: 'Inhale, hold, exhale, hold - each for the same duration',
    steps: ['Inhale', 'Hold', 'Exhale', 'Hold'],
    defaultDurations: [4, 4, 4, 4],
    benefits: [
      'Reduces stress and anxiety',
      'Improves focus and concentration',
      'Regulates the autonomic nervous system',
      'Used by Navy SEALs for stress management',
    ],
    color: 'from-blue-500 to-cyan-400',
    iconColor: 'bg-blue-100 text-blue-600 dark:bg-blue-950 dark:text-blue-400',
  },
  relaxing: {
    name: 'Relaxing Breath',
    description:
      'Longer exhale than inhale to activate the parasympathetic nervous system',
    steps: ['Inhale', 'Exhale'],
    defaultDurations: [4, 6],
    benefits: [
      'Activates relaxation response',
      'Helps with falling asleep',
      'Reduces anxiety',
      'Lowers heart rate and blood pressure',
    ],
    color: 'from-purple-500 to-indigo-400',
    iconColor:
      'bg-purple-100 text-purple-600 dark:bg-purple-950 dark:text-purple-400',
  },
  energizing: {
    name: 'Energizing Breath',
    description: 'Short, powerful inhales and exhales to increase energy',
    steps: ['Inhale', 'Exhale'],
    defaultDurations: [2, 2],
    benefits: [
      'Increases energy and alertness',
      'Improves oxygen delivery to tissues',
      'Enhances mental clarity',
      'Can help with afternoon fatigue',
    ],
    color: 'from-orange-500 to-yellow-400',
    iconColor:
      'bg-orange-100 text-orange-600 dark:bg-orange-950 dark:text-orange-400',
  },
};

export default function BreathingExercise() {
  // State variables
  const [pattern, setPattern] = useState('box');
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [duration, setDuration] = useState(5); // Exercise duration in minutes
  const [timeRemaining, setTimeRemaining] = useState(duration * 60); // in seconds
  const [breathCount, setBreathCount] = useState(0);
  const [currentInhaleExhale, setCurrentInhaleExhale] = useState('Get Ready');
  const [showInfo, setShowInfo] = useState(false);
  const [stepProgress, setStepProgress] = useState(0);

  // Refs
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const stepTimerRef = useRef<NodeJS.Timeout | null>(null);
  const stepProgressRef = useRef<NodeJS.Timeout | null>(null);
  const patternSteps = BREATHING_PATTERNS[pattern].steps;
  const stepDurations = BREATHING_PATTERNS[pattern].defaultDurations;

  // Total time for one breath cycle
  const cycleDuration = stepDurations.reduce(
    (sum, duration) => sum + duration,
    0
  );

  // Effect for step timing
  useEffect(() => {
    if (!isPlaying) return;

    // Clear previous timers
    if (stepTimerRef.current) clearTimeout(stepTimerRef.current);
    if (stepProgressRef.current) clearInterval(stepProgressRef.current);

    const currentDuration = stepDurations[currentStep];

    // Update the instruction text
    setCurrentInhaleExhale(patternSteps[currentStep]);
    setStepProgress(0);

    // Set up progress animation
    const progressInterval = 50; // Update every 50ms for smooth animation
    const progressIncrement =
      (progressInterval / (currentDuration * 1000)) * 100;

    stepProgressRef.current = setInterval(() => {
      setStepProgress(prev => {
        const newValue = prev + progressIncrement;
        return newValue > 100 ? 100 : newValue;
      });
    }, progressInterval);

    // Set up next step
    stepTimerRef.current = setTimeout(() => {
      const nextStep = (currentStep + 1) % patternSteps.length;
      setCurrentStep(nextStep);

      // Count completed breaths
      if (nextStep === 0) {
        setBreathCount(prev => prev + 1);
      }
    }, currentDuration * 1000);

    return () => {
      if (stepTimerRef.current) clearTimeout(stepTimerRef.current);
      if (stepProgressRef.current) clearInterval(stepProgressRef.current);
    };
  }, [currentStep, isPlaying, pattern]);

  // Effect for overall timer
  useEffect(() => {
    if (!isPlaying) return;

    timerRef.current = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          // Exercise complete
          handleStop();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isPlaying]);

  // Effect to reset timers when duration changes
  useEffect(() => {
    setTimeRemaining(duration * 60);
  }, [duration]);

  // Effect to reset current step when pattern changes
  useEffect(() => {
    setCurrentStep(0);
    setCurrentInhaleExhale('Get Ready');
    setStepProgress(0);
  }, [pattern]);

  // Format time as mm:ss
  const formatTime = seconds => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // Handle start/resume
  const handleStart = () => {
    setIsPlaying(true);
    if (currentInhaleExhale === 'Get Ready') {
      setCurrentInhaleExhale(patternSteps[0]);
    }
  };

  // Handle pause
  const handlePause = () => {
    setIsPlaying(false);
  };

  // Handle stop/reset
  const handleStop = () => {
    setIsPlaying(false);
    setCurrentStep(0);
    setBreathCount(0);
    setTimeRemaining(duration * 60);
    setCurrentInhaleExhale('Get Ready');
    setStepProgress(0);

    if (timerRef.current) clearInterval(timerRef.current);
    if (stepTimerRef.current) clearTimeout(stepTimerRef.current);
    if (stepProgressRef.current) clearInterval(stepProgressRef.current);
  };

  // Calculate session progress percentage
  const calculateSessionProgress = () => {
    const totalSeconds = duration * 60;
    const secondsElapsed = totalSeconds - timeRemaining;
    return (secondsElapsed / totalSeconds) * 100;
  };

  // Get animation instructions based on current step
  const getAnimationStyles = () => {
    if (currentInhaleExhale === 'Inhale') {
      return {
        scale: 1 + (stepProgress / 100) * 0.3,
        opacity: 0.9,
      };
    } else if (currentInhaleExhale === 'Exhale') {
      return {
        scale: 1 - (stepProgress / 100) * 0.3,
        opacity: 0.7,
      };
    } else if (currentInhaleExhale === 'Hold') {
      return {
        scale: 1,
        opacity: 0.8,
      };
    } else {
      return {
        scale: 0.9,
        opacity: 0.6,
      };
    }
  };

  const animationStyles = getAnimationStyles();

  return (
    <Card className="shadow-lg overflow-hidden border-0">
      <CardHeader
        className={`bg-gradient-to-r ${BREATHING_PATTERNS[pattern].color} text-white`}
      >
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl font-bold">
            Breathing Exercise
          </CardTitle>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowInfo(!showInfo)}
            className="text-white hover:bg-white/20"
          >
            <Info size={20} />
          </Button>
        </div>
        <div className="mt-2 text-sm opacity-90">
          {BREATHING_PATTERNS[pattern].name}
        </div>
      </CardHeader>

      {showInfo && (
        <div className="px-6 py-3 bg-gray-50 dark:bg-gray-900 border-b">
          <p className="text-sm mb-2">
            {BREATHING_PATTERNS[pattern].description}
          </p>
          <h4 className="font-semibold text-sm mt-3 mb-1">Benefits:</h4>
          <ul className="text-sm list-disc pl-5">
            {BREATHING_PATTERNS[pattern].benefits.map((benefit, i) => (
              <li key={i} className="mb-1">
                {benefit}
              </li>
            ))}
          </ul>
        </div>
      )}

      <CardContent className="pt-6 flex flex-col items-center">
        <div className="mb-6 w-full flex flex-wrap justify-between items-center gap-4">
          <div className="w-full sm:w-auto flex-1">
            <div className="flex items-center gap-2 mb-1">
              <div
                className={`p-1 rounded-full ${BREATHING_PATTERNS[pattern].iconColor}`}
              >
                <Medal size={14} />
              </div>
              <p className="text-sm font-medium">Technique:</p>
            </div>
            <Select
              value={pattern}
              onValueChange={value => {
                if (isPlaying) handleStop();
                setPattern(value);
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select pattern" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="box">Box Breathing</SelectItem>
                <SelectItem value="relaxing">Relaxing Breath</SelectItem>
                <SelectItem value="energizing">Energizing Breath</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="w-full sm:w-auto">
            <div className="flex items-center gap-2 mb-1">
              <div
                className={`p-1 rounded-full ${BREATHING_PATTERNS[pattern].iconColor}`}
              >
                <Clock size={14} />
              </div>
              <p className="text-sm font-medium">Duration:</p>
            </div>
            <Select
              value={duration.toString()}
              onValueChange={value => {
                if (isPlaying) handleStop();
                setDuration(parseInt(value));
              }}
            >
              <SelectTrigger className="w-full sm:w-32">
                <SelectValue placeholder="Time" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="2">2 min</SelectItem>
                <SelectItem value="5">5 min</SelectItem>
                <SelectItem value="10">10 min</SelectItem>
                <SelectItem value="15">15 min</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="relative w-64 h-64 flex items-center justify-center mb-6">
          {/* Outer animation circle */}
          <div
            className={`absolute inset-0 rounded-full transition-all duration-300 bg-gradient-to-b ${BREATHING_PATTERNS[pattern].color} opacity-10`}
          ></div>

          {/* Middle pulsing circle */}
          <div
            className={`absolute inset-8 rounded-full shadow-lg transition-all duration-1000 ease-in-out transform bg-gradient-to-b ${BREATHING_PATTERNS[pattern].color}`}
            style={{
              transform: `scale(${animationStyles.scale})`,
              opacity: animationStyles.opacity,
            }}
          ></div>

          {/* Inner guidance circle */}
          <div className="absolute inset-20 bg-white dark:bg-gray-900 rounded-full flex items-center justify-center shadow-inner z-10">
            <div className="text-center">
              <div className="text-3xl font-bold">{currentInhaleExhale}</div>
              {currentInhaleExhale !== 'Get Ready' && (
                <div className="text-xl mt-1 opacity-80">
                  {stepDurations[currentStep]}s
                </div>
              )}
            </div>
          </div>

          {/* Step progress indicator */}
          {isPlaying && currentInhaleExhale !== 'Get Ready' && (
            <svg
              className="absolute inset-0 w-full h-full"
              viewBox="0 0 100 100"
            >
              <circle
                cx="50"
                cy="50"
                r="48"
                fill="none"
                stroke="currentColor"
                strokeWidth="0.5"
                className="opacity-10"
              />
              <circle
                cx="50"
                cy="50"
                r="48"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeDasharray={`${stepProgress * 3.02} 1000`}
                className="text-white opacity-50"
                transform="rotate(-90 50 50)"
              />
            </svg>
          )}
        </div>

        {/* Session progress */}
        <div className="w-full mb-4">
          <div className="flex justify-between items-center mb-1">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Session progress:
            </p>
            <p className="text-sm font-medium">
              {Math.round(calculateSessionProgress())}%
            </p>
          </div>
          <Progress value={calculateSessionProgress()} className="h-1.5" />
        </div>

        <div className="w-full flex justify-between items-center mb-2 px-1">
          <Badge
            variant="outline"
            className="flex gap-2 text-sm py-1.5 rounded-lg border-2"
          >
            <span className="font-semibold text-gray-500">Breaths:</span>
            <span className="font-bold">{breathCount}</span>
          </Badge>
          <Badge
            variant="outline"
            className="text-sm py-1.5 px-3 rounded-lg border-2 font-mono"
          >
            {formatTime(timeRemaining)}
          </Badge>
        </div>
      </CardContent>

      <CardFooter className="flex justify-center gap-3 pb-6">
        {!isPlaying ? (
          <Button
            onClick={handleStart}
            className={`w-36 font-medium py-6 flex items-center gap-2 bg-gradient-to-r ${BREATHING_PATTERNS[pattern].color} hover:opacity-90 transition-opacity text-white border-0`}
            size="lg"
          >
            <Play size={20} />
            {timeRemaining === duration * 60 ? 'Start' : 'Resume'}
          </Button>
        ) : (
          <Button
            onClick={handlePause}
            variant="outline"
            className="w-36 font-medium py-6 flex items-center gap-2"
            size="lg"
          >
            <Pause size={20} />
            Pause
          </Button>
        )}

        <Button
          onClick={handleStop}
          variant="outline"
          className="w-36 font-medium py-6 flex items-center gap-2"
          size="lg"
          disabled={!isPlaying && timeRemaining === duration * 60}
        >
          <RotateCcw size={20} />
          Reset
        </Button>
      </CardFooter>
    </Card>
  );
}
