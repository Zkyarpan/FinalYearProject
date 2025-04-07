'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Toaster, toast } from 'sonner';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Sparkles,
  Info,
  X,
  RotateCcw,
  CheckCircle,
  Brain,
  Rocket,
  AlertCircle,
  KeyRound,
  Trophy,
  Keyboard as KeyboardIcon,
  HelpCircle,
  BarChart4,
  Gamepad,
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetTrigger,
  SheetFooter,
} from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// Import from your store
import { useActivityStore, logActivity } from '@/store/activity-store';

// Word list for the game (this is a small sample, you'd want a larger list in production)
const WORD_LIST = [
  'FOCUS',
  'BRAIN',
  'RELAX',
  'PEACE',
  'SLEEP',
  'HAPPY',
  'CALM',
  'AWARE',
  'BREATH',
  'ALERT',
  'CLEAR',
  'QUIET',
  'SMILE',
  'TRUST',
  'FRESH',
  'VITAL',
  'SOUND',
  'HEART',
  'LIGHT',
  'DREAM',
  'POWER',
  'SHINE',
  'THINK',
  'BLOOM',
  'GROW',
  'SENSE',
  'VIBE',
  'ZEAL',
  'MIND',
  'AURA',
  'FLOW',
  'GLOW',
];

const KEYBOARD_ROWS = [
  ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
  ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
  ['ENTER', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', 'BACKSPACE'],
];

// Game completion modal
const GameCompletionModal = ({ isOpen, onClose, gameData, isWin }) => {
  if (!isOpen || !gameData) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-gradient-to-br from-gray-900 to-gray-950 border-gray-800 text-white max-w-md mx-auto">
        <DialogHeader>
          <div className="flex justify-center mb-4">
            {isWin ? (
              <div className="w-16 h-16 rounded-full bg-emerald-900/30 flex items-center justify-center">
                <Trophy className="h-8 w-8 text-emerald-500" />
              </div>
            ) : (
              <div className="w-16 h-16 rounded-full bg-amber-900/30 flex items-center justify-center">
                <AlertCircle className="h-8 w-8 text-amber-500" />
              </div>
            )}
          </div>
          <DialogTitle className="text-center text-2xl">
            {isWin ? 'Congratulations!' : 'Good Try!'}
          </DialogTitle>
          <DialogDescription className="text-center text-gray-400">
            {isWin
              ? `You found the word in ${gameData.guesses.length} ${gameData.guesses.length === 1 ? 'guess' : 'guesses'}!`
              : `The word was ${gameData.targetWord}. Try again!`}
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-4 my-4">
          <Card className="bg-gray-800 border-0">
            <CardContent className="p-4 text-center">
              <p className="text-gray-400 text-sm">Guesses</p>
              <p className="text-2xl font-bold">{gameData.guesses.length}/6</p>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-0">
            <CardContent className="p-4 text-center">
              <p className="text-gray-400 text-sm">Win Rate</p>
              <p className="text-2xl font-bold">{gameData.winRate}%</p>
            </CardContent>
          </Card>
        </div>

        <div className="mb-4">
          <p className="text-sm text-center mb-2 text-gray-400">
            Word Distribution
          </p>
          <div className="space-y-2">
            {gameData.wordDistribution.map((count, index) => (
              <div key={index} className="flex items-center gap-2">
                <span className="text-xs w-4">{index + 1}</span>
                <div className="flex-1 h-6 rounded-sm overflow-hidden bg-gray-800 relative">
                  <div
                    className={`h-full ${isWin && gameData.guesses.length === index + 1 ? 'bg-emerald-600' : 'bg-indigo-600'}`}
                    style={{
                      width: `${(count / Math.max(...gameData.wordDistribution, 1)) * 100}%`,
                    }}
                  ></div>
                  <span className="absolute right-2 top-1/2 transform -translate-y-1/2 text-xs text-white">
                    {count}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <DialogFooter className="flex gap-3 sm:gap-0">
          <Button
            variant="outline"
            className="flex-1 text-gray-300 border-gray-700 hover:bg-gray-800"
            onClick={onClose}
          >
            Close
          </Button>
          <Button
            className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
            onClick={() => {
              onClose();
              window.location.reload();
            }}
          >
            Play Again
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// Help modal to explain rules
const HelpModal = ({ isOpen, onClose }) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-gradient-to-br from-gray-900 to-gray-950 border-gray-800 text-white max-w-md mx-auto">
        <DialogHeader>
          <DialogTitle>How to Play Wordle</DialogTitle>
          <DialogDescription>Guess the word in 6 tries.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <p className="mb-2">Each guess must be a valid 5-letter word.</p>
            <p className="mb-2">
              The color of the tiles will change to show how close your guess
              was.
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 flex items-center justify-center font-bold bg-emerald-600 rounded">
                R
              </div>
              <span>Correct letter and position</span>
            </div>

            <div className="flex items-center gap-2">
              <div className="w-8 h-8 flex items-center justify-center font-bold bg-amber-500 rounded">
                I
              </div>
              <span>Correct letter, wrong position</span>
            </div>

            <div className="flex items-center gap-2">
              <div className="w-8 h-8 flex items-center justify-center font-bold bg-gray-700 rounded">
                G
              </div>
              <span>Letter not in the word</span>
            </div>
          </div>

          <div>
            <p>Example:</p>
            <div className="flex gap-1 mt-2">
              <div className="w-8 h-8 flex items-center justify-center font-bold bg-emerald-600 rounded">
                P
              </div>
              <div className="w-8 h-8 flex items-center justify-center font-bold bg-gray-700 rounded">
                I
              </div>
              <div className="w-8 h-8 flex items-center justify-center font-bold bg-gray-700 rounded">
                X
              </div>
              <div className="w-8 h-8 flex items-center justify-center font-bold bg-amber-500 rounded">
                E
              </div>
              <div className="w-8 h-8 flex items-center justify-center font-bold bg-gray-700 rounded">
                L
              </div>
            </div>
            <p className="mt-2 text-sm text-gray-400">
              'P' is in the correct spot, 'E' is in the word but in the wrong
              spot, and the other letters are not in the word.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white"
            onClick={onClose}
          >
            Got it!
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// Stats sheet for game statistics
const StatsSheet = ({ isOpen, onClose, gameStats }) => {
  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="bg-gradient-to-br from-gray-900 to-gray-950 border-gray-800 text-white">
        <SheetHeader>
          <SheetTitle>Your Stats</SheetTitle>
          <SheetDescription>Your Wordle performance</SheetDescription>
        </SheetHeader>

        <div className="py-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
            <div className="bg-gray-800 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold">{gameStats.played}</p>
              <p className="text-xs text-gray-400">Played</p>
            </div>

            <div className="bg-gray-800 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold">{gameStats.winPercentage}%</p>
              <p className="text-xs text-gray-400">Win %</p>
            </div>

            <div className="bg-gray-800 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold">{gameStats.currentStreak}</p>
              <p className="text-xs text-gray-400">Current Streak</p>
            </div>

            <div className="bg-gray-800 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold">{gameStats.maxStreak}</p>
              <p className="text-xs text-gray-400">Max Streak</p>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-medium mb-2">Guess Distribution</h4>
            <div className="space-y-2">
              {gameStats.guessDistribution.map((count, index) => (
                <div key={index} className="flex items-center gap-2">
                  <span className="text-xs w-4">{index + 1}</span>
                  <div className="flex-1 h-6 rounded-sm overflow-hidden bg-gray-800 relative">
                    <div
                      className="h-full bg-indigo-600"
                      style={{
                        width: `${(count / Math.max(...gameStats.guessDistribution, 1)) * 100}%`,
                      }}
                    ></div>
                    <span className="absolute right-2 top-1/2 transform -translate-y-1/2 text-xs text-white">
                      {count}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <SheetFooter>
          <Button
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white"
            onClick={onClose}
          >
            Close
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
};

// Main Wordle Game Component
const WordleGame = ({ onGameComplete }) => {
  const [targetWord, setTargetWord] = useState('');
  const [guesses, setGuesses] = useState<string[]>([]);
  const [currentGuess, setCurrentGuess] = useState('');
  const [gameState, setGameState] = useState('playing'); // playing, won, lost
  const [keyboardStatus, setKeyboardStatus] = useState({});
  const [shake, setShake] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [usedHint, setUsedHint] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Initialize game
  useEffect(() => {
    // Pick a random word from our word list
    const randomIndex = Math.floor(Math.random() * WORD_LIST.length);
    setTargetWord(WORD_LIST[randomIndex]);

    // Focus the invisible input for keyboard capture
    if (inputRef.current) {
      inputRef.current.focus();
    }

    // Listen for keyboard input
    const handleKeyDown = e => {
      handleKeyInput(e.key.toUpperCase());
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Handle keyboard or on-screen keyboard input
  const handleKeyInput = key => {
    if (gameState !== 'playing') return;

    if (key === 'ENTER') {
      submitGuess();
    } else if (key === 'BACKSPACE') {
      setCurrentGuess(prev => prev.slice(0, -1));
    } else if (/^[A-Z]$/.test(key) && currentGuess.length < 5) {
      setCurrentGuess(prev => prev + key);
    }
  };

  // Submit the current guess
  const submitGuess = () => {
    // Check if the guess is complete
    if (currentGuess.length !== 5) {
      // Animate shake effect
      setShake(true);
      toast.error('Not enough letters');
      setTimeout(() => setShake(false), 500);
      return;
    }

    // Check if the word is valid (in a real app, you might check against a dictionary)
    if (!WORD_LIST.includes(currentGuess)) {
      setShake(true);
      toast.error('Not in word list');
      setTimeout(() => setShake(false), 500);
      return;
    }

    // Add the guess to the list
    const newGuesses = [...guesses, currentGuess];
    setGuesses(newGuesses);

    // Update keyboard status
    updateKeyboardStatus(currentGuess);

    // Check if the guess is correct
    if (currentGuess === targetWord) {
      setGameState('won');
      toast.success('Excellent! You got it!');
      onGameComplete({
        result: 'win',
        guesses: newGuesses.length,
        word: targetWord,
      });
    }
    // Check if out of guesses
    else if (newGuesses.length >= 6) {
      setGameState('lost');
      toast.error(`The word was ${targetWord}`, {
        description: 'Better luck next time!',
      });
      onGameComplete({
        result: 'loss',
        guesses: newGuesses.length,
        word: targetWord,
      });
    }

    // Reset current guess
    setCurrentGuess('');
  };

  // Update the keyboard key colors based on guesses
  const updateKeyboardStatus = guess => {
    const newStatus = { ...keyboardStatus };

    for (let i = 0; i < guess.length; i++) {
      const letter = guess[i];

      if (letter === targetWord[i]) {
        // Letter is in correct position
        newStatus[letter] = 'correct';
      } else if (
        targetWord.includes(letter) &&
        newStatus[letter] !== 'correct'
      ) {
        // Letter is in word but wrong position, and not already marked correct
        newStatus[letter] = 'present';
      } else if (!targetWord.includes(letter)) {
        // Letter is not in word
        newStatus[letter] = 'absent';
      }
    }

    setKeyboardStatus(newStatus);
  };

  // Get the status of a letter in a specific guess
  const getLetterStatus = (letter, position, guessIndex) => {
    // Only process completed guesses
    if (guessIndex >= guesses.length) return '';

    const guess = guesses[guessIndex];

    if (guess[position] === targetWord[position]) {
      return 'correct';
    } else if (targetWord.includes(guess[position])) {
      // Check if this same letter appears elsewhere in the correct position
      // This handles cases where a letter appears multiple times
      let letterCount = 0;
      for (let i = 0; i < targetWord.length; i++) {
        if (targetWord[i] === guess[position]) {
          letterCount++;
        }
      }

      // Count correctly placed instances of this letter
      let correctPositions = 0;
      let earlierPositions = 0;
      for (let i = 0; i < targetWord.length; i++) {
        if (guess[i] === guess[position] && targetWord[i] === guess[i]) {
          correctPositions++;
          if (i < position) earlierPositions++;
        }
      }

      // Count earlier instances of this letter in incorrect positions
      let earlierOccurrences = 0;
      for (let i = 0; i < position; i++) {
        if (
          guess[i] === guess[position] &&
          targetWord[i] !== guess[i] &&
          targetWord.includes(guess[i])
        ) {
          earlierOccurrences++;
        }
      }

      // If we've already accounted for all instances of this letter, mark as absent
      if (earlierOccurrences + correctPositions >= letterCount) {
        return 'absent';
      }

      return 'present';
    } else {
      return 'absent';
    }
  };

  // Show a hint (reveals one letter)
  const revealHint = () => {
    if (usedHint) return;

    setUsedHint(true);
    setShowHint(true);

    // In a real app, you might want to penalize the score or limit hints
    toast.info('Hint revealed: one letter shown', {
      description: 'This helps, but affects your score',
    });
  };

  // Render the game board
  const renderGameBoard = () => {
    const rows: JSX.Element[] = [];

    // Render past guesses
    for (let i = 0; i < guesses.length; i++) {
      rows.push(
        <div key={`guess-${i}`} className="flex gap-1 mb-1">
          {guesses[i].split('').map((letter, j) => (
            <motion.div
              key={`letter-${i}-${j}`}
              initial={{ rotateX: -90 }}
              animate={{ rotateX: 0 }}
              transition={{ delay: j * 0.1, duration: 0.3 }}
              className={`w-12 h-12 sm:w-14 sm:h-14 flex items-center justify-center font-bold text-lg rounded-md
                ${
                  getLetterStatus(letter, j, i) === 'correct'
                    ? 'bg-emerald-600'
                    : getLetterStatus(letter, j, i) === 'present'
                      ? 'bg-amber-500'
                      : 'bg-gray-700'
                }`}
            >
              {letter}
            </motion.div>
          ))}
        </div>
      );
    }

    // Render current guess (if the game is still playing)
    if (gameState === 'playing') {
      rows.push(
        <motion.div
          key="current-guess"
          className="flex gap-1 mb-1"
          animate={{ x: shake ? [-5, 5, -5, 5, 0] : 0 }}
          transition={{ duration: 0.4 }}
        >
          {Array(5)
            .fill(0)
            .map((_, i) => (
              <div
                key={`current-${i}`}
                className={`w-12 h-12 sm:w-14 sm:h-14 flex items-center justify-center font-bold text-lg rounded-md border-2 
                ${i < currentGuess.length ? 'border-gray-500 bg-gray-800' : 'border-gray-700 bg-transparent'}
                ${showHint && i === 2 && usedHint ? 'bg-indigo-900 border-indigo-700' : ''}`}
              >
                {i < currentGuess.length ? currentGuess[i] : ''}
                {showHint && i === 2 && usedHint && !currentGuess[i]
                  ? targetWord[2]
                  : ''}
              </div>
            ))}
        </motion.div>
      );
    }

    // Render empty spaces for remaining guesses
    const remainingGuesses =
      6 - guesses.length - (gameState === 'playing' ? 1 : 0);
    for (let i = 0; i < remainingGuesses; i++) {
      rows.push(
        <div key={`empty-${i}`} className="flex gap-1 mb-1">
          {Array(5)
            .fill(0)
            .map((_, j) => (
              <div
                key={`empty-${i}-${j}`}
                className="w-12 h-12 sm:w-14 sm:h-14 flex items-center justify-center font-bold text-lg rounded-md border-2 border-gray-800"
              ></div>
            ))}
        </div>
      );
    }

    return rows;
  };

  // Render on-screen keyboard
  const renderKeyboard = () => {
    return (
      <div className="w-full max-w-md mx-auto">
        {KEYBOARD_ROWS.map((row, rowIndex) => (
          <div
            key={`row-${rowIndex}`}
            className="flex justify-center gap-1 mb-1.5"
          >
            {row.map(key => {
              let classes = 'font-medium rounded';
              let width = 'w-8 sm:w-10';

              if (key === 'ENTER') {
                width = 'w-14 sm:w-16 text-xs';
              } else if (key === 'BACKSPACE') {
                width = 'w-14 sm:w-16 text-xs';
              }

              if (keyboardStatus[key] === 'correct') {
                classes += ' bg-emerald-600 text-white';
              } else if (keyboardStatus[key] === 'present') {
                classes += ' bg-amber-500 text-white';
              } else if (keyboardStatus[key] === 'absent') {
                classes += ' bg-gray-700 text-gray-300';
              } else {
                classes += ' bg-gray-600 text-white';
              }

              return (
                <button
                  key={key}
                  className={`${classes} ${width} h-10 sm:h-12 flex items-center justify-center`}
                  onClick={() => handleKeyInput(key)}
                  disabled={gameState !== 'playing'}
                >
                  {key === 'BACKSPACE' ? '⌫' : key}
                </button>
              );
            })}
          </div>
        ))}
      </div>
    );
  };

  // Invisible input to capture keyboard events
  const hiddenInput = (
    <input
      ref={inputRef}
      type="text"
      className="opacity-0 absolute pointer-events-none"
      value={currentGuess}
      onChange={e => {}} // We handle this through keydown events
      autoFocus
    />
  );

  return (
    <div className="flex flex-col items-center">
      <div className="w-full max-w-md px-2 mb-3 flex items-center justify-between">
        <Badge variant="outline" className="text-xs px-2 py-0">
          {gameState === 'playing'
            ? 'IN PROGRESS'
            : gameState === 'won'
              ? 'COMPLETED'
              : 'FAILED'}
        </Badge>

        <div className="flex items-center gap-1.5">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-full bg-gray-800"
            onClick={revealHint}
            disabled={usedHint || gameState !== 'playing'}
          >
            <KeyRound className="h-4 w-4" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-full bg-gray-800"
            onClick={() => {
              window.location.reload();
            }}
          >
            <RotateCcw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="mb-6">{renderGameBoard()}</div>

      {renderKeyboard()}
      {hiddenInput}
    </div>
  );
};

// Main Wordle Page
export default function WordlePage() {
  const router = useRouter();
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [showStatsSheet, setShowStatsSheet] = useState(false);
  interface GameData {
    targetWord: string;
    guesses: string[];
    winRate: number;
    wordDistribution: number[];
  }

  const [currentGameData, setCurrentGameData] = useState<GameData | null>(null);
  const [gameStats, setGameStats] = useState({
    played: 0,
    wins: 0,
    winPercentage: 0,
    currentStreak: 0,
    maxStreak: 0,
    guessDistribution: [0, 0, 0, 0, 0, 0],
  });

  // Track if this is the first render (to show the help modal)
  const isFirstRender = useRef(true);

  // On component mount, check if we should show help
  useEffect(() => {
    if (isFirstRender.current) {
      // Check if the user has played before
      const hasPlayedBefore = localStorage.getItem('wordleHasPlayed');
      if (!hasPlayedBefore) {
        // Show the help dialog on first play
        setShowHelpModal(true);
        localStorage.setItem('wordleHasPlayed', 'true');
      }
      isFirstRender.current = false;

      // Load game stats
      const savedStats = localStorage.getItem('wordleStats');
      if (savedStats) {
        setGameStats(JSON.parse(savedStats));
      }
    }
  }, []);

  // Handle game completion
  const handleGameComplete = data => {
    // Create updated stats
    const newStats = { ...gameStats };
    newStats.played += 1;

    if (data.result === 'win') {
      newStats.wins += 1;
      newStats.currentStreak += 1;
      newStats.maxStreak = Math.max(newStats.maxStreak, newStats.currentStreak);
      newStats.guessDistribution[data.guesses - 1] += 1;
    } else {
      newStats.currentStreak = 0;
    }

    newStats.winPercentage = Math.round(
      (newStats.wins / newStats.played) * 100
    );

    // Save to localStorage
    localStorage.setItem('wordleStats', JSON.stringify(newStats));
    setGameStats(newStats);

    // Log the activity
    logActivity('wordle', {
      result: data.result,
      guesses: data.guesses,
      word: data.word,
      points: data.result === 'win' ? (7 - data.guesses) * 10 : 0,
    });

    // Prepare completion modal data
    setCurrentGameData({
      targetWord: data.word,
      guesses: Array(data.guesses).fill(''),
      winRate: newStats.winPercentage,
      wordDistribution: newStats.guessDistribution,
    });

    // Show completion modal with slight delay
    setTimeout(() => {
      setShowCompletionModal(true);
    }, 1500);
  };

  return (
    <div className="min-h-screen">
      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Hero section */}
        <div className="text-center mb-10">
          <motion.h1
            className="text-4xl font-extrabold mb-3"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            Wordle
          </motion.h1>
          <motion.p
            className="text-lg text-gray-300 max-w-md mx-auto"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            Challenge your vocabulary and deduction skills
          </motion.p>

          <div className="flex justify-center gap-3 mt-4">
            <Button
              variant="ghost"
              size="sm"
              className="text-xs text-gray-400 rounded-full"
              onClick={() => setShowHelpModal(true)}
            >
              <HelpCircle className="h-3.5 w-3.5 mr-1" />
              How to Play
            </Button>

            <Button
              variant="ghost"
              size="sm"
              className="text-xs text-gray-400 rounded-full"
              onClick={() => setShowStatsSheet(true)}
            >
              <BarChart4 className="h-3.5 w-3.5 mr-1" />
              Statistics
            </Button>
          </div>
        </div>

        {/* Game Board */}
        <Card className="border-0 bg-gradient-to-br from-gray-800 to-gray-900 shadow-xl mb-8">
          <CardHeader className="space-y-1">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center">
                <Gamepad className="h-5 w-5 mr-2 text-emerald-500" />
                Wordle Game
              </CardTitle>

              <div className="flex items-center gap-1 text-xs text-gray-400">
                <KeyboardIcon className="h-3 w-3" />
                <span>or use keyboard</span>
              </div>
            </div>
            <CardDescription>Find the 5-letter word in 6 tries</CardDescription>
          </CardHeader>

          <CardContent>
            <WordleGame onGameComplete={handleGameComplete} />
          </CardContent>
        </Card>

        {/* Benefits section */}
        <div className="mb-8">
          <h2 className="text-xl font-bold mb-4 flex items-center">
            <Brain className="h-5 w-5 mr-2 text-emerald-500" />
            Benefits of Word Games
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gray-800 p-4 rounded-lg">
              <h3 className="font-medium text-emerald-400 mb-2 flex items-center">
                <Sparkles className="h-4 w-4 mr-1.5" />
                Vocabulary Growth
              </h3>
              <p className="text-sm text-gray-300">
                Expand your language skills and word recognition abilities
              </p>
            </div>

            <div className="bg-gray-800 p-4 rounded-lg">
              <h3 className="font-medium text-emerald-400 mb-2 flex items-center">
                <Brain className="h-4 w-4 mr-1.5" />
                Cognitive Exercise
              </h3>
              <p className="text-sm text-gray-300">
                Improve problem-solving skills and pattern recognition
              </p>
            </div>

            <div className="bg-gray-800 p-4 rounded-lg">
              <h3 className="font-medium text-emerald-400 mb-2 flex items-center">
                <Rocket className="h-4 w-4 mr-1.5" />
                Mental Agility
              </h3>
              <p className="text-sm text-gray-300">
                Enhance mental flexibility and adaptability to new challenges
              </p>
            </div>
          </div>
        </div>

        {/* Game Tip */}
        <Card className="border-0 bg-gradient-to-r from-emerald-900/30 to-teal-900/30 shadow-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center">
              <Info className="h-5 w-5 mr-2 text-emerald-500" />
              Wordle Strategy Tip
            </CardTitle>
          </CardHeader>

          <CardContent>
            <p className="text-gray-300">
              Start with a word that has common vowels and consonants like
              "ADIEU" or "STARE" to quickly identify which letters are in the
              target word.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Modals and Sheets */}
      <GameCompletionModal
        isOpen={showCompletionModal}
        onClose={() => setShowCompletionModal(false)}
        gameData={currentGameData}
        isWin={
          currentGameData?.targetWord ===
          currentGameData?.guesses[currentGameData?.guesses.length - 1]
        }
      />

      <HelpModal
        isOpen={showHelpModal}
        onClose={() => setShowHelpModal(false)}
      />

      <StatsSheet
        isOpen={showStatsSheet}
        onClose={() => setShowStatsSheet(false)}
        gameStats={gameStats}
      />
    </div>
  );
}
