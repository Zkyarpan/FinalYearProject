'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  KeyRound,
  RotateCcw,
  Trophy,
  AlertCircle,
  Brain,
  Sparkles,
  Zap,
  Award,
  BookOpen,
  Clock,
  Target,
  BarChart3,
  ArrowRight,
  X,
  Crown,
  Flame,
  Calendar,
  Puzzle,
  RefreshCw,
  ChevronRight,
  HelpCircle,
  Eye,
  Key,
} from 'lucide-react';

// Adjusted word list for the game
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

// Toast notification component
const Toast = ({ message, type, isVisible, onClose }) => {
  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(() => {
        onClose();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isVisible, onClose]);

  if (!isVisible) return null;

  const bgColor =
    type === 'error'
      ? 'bg-red-500/80'
      : type === 'success'
        ? 'bg-green-500/80'
        : 'bg-blue-500/80';

  return (
    <motion.div
      initial={{ opacity: 0, y: -50 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -50 }}
      className={`fixed top-4 left-1/2 transform -translate-x-1/2 backdrop-blur-md rounded-lg px-6 py-3 shadow-lg z-50 flex items-center gap-3`}
    >
      {type === 'error' && <AlertCircle className="h-5 w-5" />}
      {type === 'success' && <Trophy className="h-5 w-5" />}
      {type === 'info' && <Eye className="h-5 w-5" />}
      <p className="font-medium text-white">{message}</p>
    </motion.div>
  );
};

// Game completion modal
const GameCompletionModal = ({ isOpen, onClose, gameData, isWin }) => {
  if (!isOpen || !gameData) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 flex items-center justify-center backdrop-blur-sm z-50 px-4"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className=" rounded-xl shadow-xl max-w-md w-full overflow-hidden"
          >
            <div className="relative">
              <div className="absolute top-0 left-0 w-full h-1">
                <div className="absolute inset-0 blur"></div>
              </div>

              <div className="pt-8 pb-4 px-6">
                <div className="flex justify-center mb-6">
                  {isWin ? (
                    <div className="relative">
                      <div className="absolute inset-0 bg-green-500/20 rounded-full blur-xl"></div>
                      <div className="w-20 h-20 rounded-full bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center relative">
                        <Crown className="h-10 w-10 text-white" />
                      </div>
                    </div>
                  ) : (
                    <div className="relative">
                      <div className="absolute inset-0 bg-amber-500/20 rounded-full blur-xl"></div>
                      <div className="w-20 h-20 rounded-full bg-gradient-to-br from-amber-400 to-orange-600 flex items-center justify-center">
                        <Target className="h-10 w-10 text-white" />
                      </div>
                    </div>
                  )}
                </div>

                <h2 className="text-center text-3xl font-bold mb-2 bg-gradient-to-r from-cyan-400 to-blue-600 text-transparent bg-clip-text">
                  {isWin ? 'Brilliant!' : 'Next Time!'}
                </h2>

                <p className="text-center text-slate-400 mb-6">
                  {isWin
                    ? `You found the word in ${gameData.guesses.length} ${gameData.guesses.length === 1 ? 'guess' : 'guesses'}!`
                    : `The word was "${gameData.targetWord}". Try again!`}
                </p>

                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-lg p-4">
                    <div className="text-center">
                      <p className="text-slate-500 text-xs uppercase tracking-wider mb-1">
                        Guesses
                      </p>
                      <p className="text-3xl font-bold text-white">
                        {gameData.guesses.length}/6
                      </p>
                    </div>
                  </div>

                  <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-lg p-4">
                    <div className="text-center">
                      <p className="text-slate-500 text-xs uppercase tracking-wider mb-1">
                        Success Rate
                      </p>
                      <p className="text-3xl font-bold text-white">
                        {gameData.winRate}%
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mb-6">
                  <p className="text-sm text-center text-slate-500 uppercase tracking-wider mb-3">
                    Word Distribution
                  </p>
                  <div className="space-y-2.5">
                    {gameData.wordDistribution.map((count, index) => (
                      <div key={index} className="flex items-center gap-3">
                        <div className="w-5 text-center text-xs font-medium text-slate-400">
                          {index + 1}
                        </div>
                        <div className="flex-1 h-8 rounded-md overflow-hidden bg-slate-800/60 relative">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{
                              width: `${(count / Math.max(...gameData.wordDistribution, 1)) * 100}%`,
                            }}
                            transition={{ duration: 1, ease: 'easeOut' }}
                            className={`h-full ${
                              isWin && gameData.guesses.length === index + 1
                                ? 'bg-gradient-to-r from-green-500 to-emerald-600'
                                : 'bg-gradient-to-r from-blue-500 to-indigo-600'
                            }`}
                          ></motion.div>
                          <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-xs font-medium text-white z-10">
                            {count}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex border-t border-slate-800">
                <button
                  className="flex-1 py-4 text-slate-400 hover:text-white hover:bg-slate-800/50 transition-colors"
                  onClick={onClose}
                >
                  Close
                </button>
                <div className="w-px bg-slate-800"></div>
                <button
                  className="flex-1 py-4 text-cyan-400 hover:text-cyan-300 hover:bg-slate-800/50 transition-colors font-medium"
                  onClick={() => {
                    onClose();
                    window.location.reload();
                  }}
                >
                  Play Again
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// Help modal
const HelpModal = ({ isOpen, onClose }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm z-50 px-4"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className=" border border-slate-800/50 rounded-xl shadow-xl max-w-md w-full overflow-hidden"
          >
            <div className="relative">
              <div className="absolute top-0 left-0 w-full h-1">
                <div className="absolute inset-0 bg-gradient-to-r from-purple-500 via-blue-500 to-cyan-600 blur"></div>
              </div>

              <div className="pt-8 pb-4 px-6">
                <div className="flex items-center justify-center mb-6">
                  <div className="relative">
                    <div className="absolute inset-0 bg-blue-500/20 rounded-full blur-xl"></div>
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-400 to-indigo-600 flex items-center justify-center">
                      <BookOpen className="h-8 w-8 text-white" />
                    </div>
                  </div>
                </div>

                <h2 className="text-center text-2xl font-bold mb-2 bg-gradient-to-r from-purple-400 to-blue-600 text-transparent bg-clip-text">
                  How to Play Wordle
                </h2>

                <p className="text-center text-slate-400 mb-6">
                  Guess the 5-letter word in 6 tries or fewer.
                </p>

                <div className="space-y-6 mb-6">
                  <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-lg p-4">
                    <p className="text-slate-300 mb-3">
                      Each guess must be a valid 5-letter word. The color of the
                      tiles will change to show how close your guess was.
                    </p>

                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 flex items-center justify-center font-bold bg-gradient-to-br from-green-500 to-emerald-600 rounded-md">
                          R
                        </div>
                        <p className="text-sm text-slate-300">
                          Correct letter and position
                        </p>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 flex items-center justify-center font-bold bg-gradient-to-br from-amber-500 to-orange-600 rounded-md">
                          I
                        </div>
                        <p className="text-sm text-slate-300">
                          Correct letter, wrong position
                        </p>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 flex items-center justify-center font-bold bg-slate-700 rounded-md border border-slate-600">
                          G
                        </div>
                        <p className="text-sm text-slate-300">
                          Letter not in the word
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-lg p-4">
                    <p className="text-slate-300 mb-3">Example:</p>
                    <div className="flex gap-1.5">
                      <div className="w-10 h-10 flex items-center justify-center font-bold bg-gradient-to-br from-green-500 to-emerald-600 rounded-md">
                        P
                      </div>
                      <div className="w-10 h-10 flex items-center justify-center font-bold bg-slate-700 rounded-md border border-slate-600">
                        I
                      </div>
                      <div className="w-10 h-10 flex items-center justify-center font-bold bg-slate-700 rounded-md border border-slate-600">
                        X
                      </div>
                      <div className="w-10 h-10 flex items-center justify-center font-bold bg-gradient-to-br from-amber-500 to-orange-600 rounded-md">
                        E
                      </div>
                      <div className="w-10 h-10 flex items-center justify-center font-bold bg-slate-700 rounded-md border border-slate-600">
                        L
                      </div>
                    </div>
                    <p className="mt-3 text-sm text-slate-400">
                      "P" is in the correct spot, "E" is in the word but wrong
                      spot, other letters aren't in the word.
                    </p>
                  </div>
                </div>
              </div>

              <div className="border-t border-slate-800">
                <button
                  className="w-full py-4 text-cyan-400 hover:text-cyan-300 hover:bg-slate-800/50 transition-colors font-medium"
                  onClick={onClose}
                >
                  Got It
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// Stats modal
const StatsModal = ({ isOpen, onClose, gameStats }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm z-50 px-4"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800/50 rounded-xl shadow-xl max-w-md w-full overflow-hidden"
          >
            <div className="relative">
              <div className="absolute top-0 left-0 w-full h-1">
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-600 blur"></div>
              </div>

              <div className="pt-8 pb-4 px-6">
                <div className="flex justify-center mb-6">
                  <div className="relative">
                    <div className="absolute inset-0 bg-indigo-500/20 rounded-full blur-xl"></div>
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-400 to-purple-600 flex items-center justify-center">
                      <BarChart3 className="h-8 w-8 text-white" />
                    </div>
                  </div>
                </div>

                <h2 className="text-center text-2xl font-bold mb-2 bg-gradient-to-r from-indigo-400 to-purple-600 text-transparent bg-clip-text">
                  Your Statistics
                </h2>

                <p className="text-center text-slate-400 mb-6">
                  Track your Wordle performance
                </p>

                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="col-span-2 sm:col-span-1">
                    <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-lg p-4">
                      <div className="text-center">
                        <p className="text-slate-500 text-xs uppercase tracking-wider mb-1">
                          Games Played
                        </p>
                        <div className="flex items-center justify-center gap-1.5">
                          <Puzzle className="w-4 h-4 text-indigo-400" />
                          <p className="text-3xl font-bold text-white">
                            {gameStats.played}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="col-span-2 sm:col-span-1">
                    <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-lg p-4">
                      <div className="text-center">
                        <p className="text-slate-500 text-xs uppercase tracking-wider mb-1">
                          Win Rate
                        </p>
                        <div className="flex items-center justify-center gap-1.5">
                          <Trophy className="w-4 h-4 text-amber-400" />
                          <p className="text-3xl font-bold text-white">
                            {gameStats.winPercentage}%
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="col-span-2 sm:col-span-1">
                    <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-lg p-4">
                      <div className="text-center">
                        <p className="text-slate-500 text-xs uppercase tracking-wider mb-1">
                          Current Streak
                        </p>
                        <div className="flex items-center justify-center gap-1.5">
                          <Flame className="w-4 h-4 text-orange-400" />
                          <p className="text-3xl font-bold text-white">
                            {gameStats.currentStreak}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="col-span-2 sm:col-span-1">
                    <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-lg p-4">
                      <div className="text-center">
                        <p className="text-slate-500 text-xs uppercase tracking-wider mb-1">
                          Max Streak
                        </p>
                        <div className="flex items-center justify-center gap-1.5">
                          <Award className="w-4 h-4 text-rose-400" />
                          <p className="text-3xl font-bold text-white">
                            {gameStats.maxStreak}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mb-6">
                  <p className="text-sm text-center text-slate-500 uppercase tracking-wider mb-3">
                    Guess Distribution
                  </p>
                  <div className="space-y-2.5">
                    {gameStats.guessDistribution.map((count, index) => (
                      <div key={index} className="flex items-center gap-3">
                        <div className="w-5 text-center text-xs font-medium text-slate-400">
                          {index + 1}
                        </div>
                        <div className="flex-1 h-8 rounded-md overflow-hidden bg-slate-800/60 relative">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{
                              width: `${(count / Math.max(...gameStats.guessDistribution, 1)) * 100}%`,
                            }}
                            transition={{
                              duration: 1,
                              ease: 'easeOut',
                              delay: index * 0.1,
                            }}
                            className="h-full bg-gradient-to-r from-indigo-500 to-purple-600"
                          ></motion.div>
                          <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-xs font-medium text-white z-10">
                            {count}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="border-t border-slate-800">
                <button
                  className="w-full py-4 text-indigo-400 hover:text-indigo-300 hover:bg-slate-800/50 transition-colors font-medium"
                  onClick={onClose}
                >
                  Close
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// Feature card component
const FeatureCard = ({ icon: Icon, title, description, gradient }) => {
  return (
    <div className="relative overflow-hidden rounded-xl border border-slate-800/50 backdrop-blur-sm group hover:border-slate-700/50 transition-all duration-300">
      <div className="absolute inset-0 bg-gradient-to-br from-slate-800/80 to-slate-900/80 z-0"></div>
      <div
        className={`absolute -top-24 -right-24 w-40 h-40 rounded-full blur-3xl opacity-20 group-hover:opacity-30 transition-opacity duration-300 ${gradient}`}
      ></div>

      <div className="relative p-5 z-10">
        <div
          className={`w-12 h-12 rounded-lg flex items-center justify-center mb-4 ${gradient}`}
        >
          <Icon className="w-6 h-6 text-white" />
        </div>

        <h3 className="font-bold text-lg text-white mb-2">{title}</h3>
        <p className="text-slate-400 text-sm">{description}</p>
      </div>
    </div>
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
  const [toast, setToast] = useState({
    show: false,
    message: '',
    type: 'info',
  });
  const inputRef = useRef<HTMLInputElement>(null);
  const [revealAnimation, setRevealAnimation] = useState(false);
  const [activeTile, setActiveTile] = useState(-1);

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

  // Show toast message
  const showToastMessage = (message, type = 'info') => {
    setToast({ show: true, message, type });
  };

  // Handle keyboard or on-screen keyboard input
  const handleKeyInput = key => {
    if (gameState !== 'playing') return;

    if (key === 'ENTER') {
      submitGuess();
    } else if (key === 'BACKSPACE' || key === '←' || key === 'ARROWLEFT') {
      setCurrentGuess(prev => prev.slice(0, -1));
      setActiveTile(currentGuess.length > 0 ? currentGuess.length - 1 : -1);
    } else if (/^[A-Z]$/.test(key) && currentGuess.length < 5) {
      const newGuess = currentGuess + key;
      setCurrentGuess(newGuess);
      setActiveTile(newGuess.length - 1);
    }
  };

  // Submit the current guess
  const submitGuess = () => {
    // Check if the guess is complete
    if (currentGuess.length !== 5) {
      setShake(true);
      showToastMessage('Not enough letters', 'error');
      setTimeout(() => setShake(false), 500);
      return;
    }

    // Check if the word is valid (in a real app, you might check against a dictionary)
    if (!WORD_LIST.includes(currentGuess)) {
      setShake(true);
      showToastMessage('Not in word list', 'error');
      setTimeout(() => setShake(false), 500);
      return;
    }

    // Add the guess to the list and trigger reveal animation
    const newGuesses = [...guesses, currentGuess];
    setGuesses(newGuesses);
    setRevealAnimation(true);

    setTimeout(() => {
      // Update keyboard status
      updateKeyboardStatus(currentGuess);

      // Check if the guess is correct
      if (currentGuess === targetWord) {
        setGameState('won');
        showToastMessage('Excellent! You got it!', 'success');
        onGameComplete({
          result: 'win',
          guesses: newGuesses.length,
          word: targetWord,
        });
      }
      // Check if out of guesses
      else if (newGuesses.length >= 6) {
        setGameState('lost');
        showToastMessage(`The word was ${targetWord}`, 'error');
        onGameComplete({
          result: 'loss',
          guesses: newGuesses.length,
          word: targetWord,
        });
      }

      // Reset current guess and animation state
      setCurrentGuess('');
      setActiveTile(-1);
      setRevealAnimation(false);
    }, 1600); // Delay to allow for tile flip animation
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
  const getLetterStatus = (
    letter: string,
    position: number,
    guessIndex: number
  ): string => {
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
    setCurrentGuess(
      currentGuess.length >= 3 ? currentGuess : currentGuess.padEnd(3, ' ')
    );

    showToastMessage('Hint revealed: middle letter shown', 'info');
  };

  // Get tile background based on status
  const getTileBackground = (status, revealed) => {
    if (!revealed)
      return 'bg-slate-800/60 backdrop-blur-sm border border-slate-700/50';

    if (status === 'correct') {
      return 'bg-gradient-to-br from-green-500 to-emerald-600 border-0';
    } else if (status === 'present') {
      return 'bg-gradient-to-br from-amber-500 to-orange-600 border-0';
    } else if (status === 'absent') {
      return 'bg-slate-700 border border-slate-600';
    }

    return 'bg-slate-800/60 backdrop-blur-sm border border-slate-700/50';
  };

  // Get keyboard key background
  const getKeyBackground = status => {
    if (status === 'correct') {
      return 'bg-gradient-to-br from-green-500 to-emerald-600 text-white';
    } else if (status === 'present') {
      return 'bg-gradient-to-br from-amber-500 to-orange-600 text-white';
    } else if (status === 'absent') {
      return 'bg-slate-700 text-slate-300';
    }

    return 'bg-slate-700/60 backdrop-blur-sm text-white border border-slate-600/50';
  };

  // Render the game board
  const renderGameBoard = () => {
    const rows: JSX.Element[] = [];

    // Render past guesses
    for (let i = 0; i < guesses.length; i++) {
      rows.push(
        <div key={`guess-${i}`} className="flex gap-1.5 mb-1.5">
          {guesses[i].split('').map((letter, j) => {
            const status = getLetterStatus(letter, j, i);
            const isRevealing = revealAnimation && i === guesses.length - 1;

            return (
              <motion.div
                key={`letter-${i}-${j}`}
                className={`w-14 h-14 sm:w-16 sm:h-16 flex items-center justify-center font-bold text-xl rounded-md 
                  ${getTileBackground(status, true)} transform perspective-500`}
                initial={{ rotateX: isRevealing ? -90 : 0 }}
                animate={{ rotateX: 0 }}
                transition={{
                  delay: isRevealing ? j * 0.2 : 0,
                  duration: 0.3,
                  type: 'spring',
                  stiffness: 260,
                  damping: 20,
                }}
              >
                {letter}
              </motion.div>
            );
          })}
        </div>
      );
    }

    // Render current guess (if the game is still playing)
    if (gameState === 'playing') {
      rows.push(
        <motion.div
          key="current-guess"
          className="flex gap-1.5 mb-1.5"
          animate={{ x: shake ? [-5, 5, -5, 5, 0] : 0 }}
          transition={{ duration: 0.4 }}
        >
          {Array(5)
            .fill(0)
            .map((_, i) => {
              const isActive = i === activeTile;
              const showHintTile =
                showHint && i === 2 && usedHint && !currentGuess[i];

              return (
                <motion.div
                  key={`current-${i}`}
                  className={`w-14 h-14 sm:w-16 sm:h-16 flex items-center justify-center font-bold text-xl rounded-md
                    ${i < currentGuess.length ? 'bg-slate-700/80 border-0' : 'border-2 border-slate-700/50 bg-transparent'}
                    ${showHintTile ? 'bg-gradient-to-br from-indigo-500/50 to-blue-600/50 border-0' : ''}
                    ${isActive ? 'ring-2 ring-blue-500 ring-opacity-50' : ''}`}
                  animate={{
                    scale: isActive ? [1, 1.05, 1] : 1,
                  }}
                  transition={{ duration: 0.2 }}
                >
                  {i < currentGuess.length && currentGuess[i] !== ' '
                    ? currentGuess[i]
                    : ''}
                  {showHintTile ? targetWord[2] : ''}
                </motion.div>
              );
            })}
        </motion.div>
      );
    }

    // Render empty spaces for remaining guesses
    const remainingGuesses =
      6 - guesses.length - (gameState === 'playing' ? 1 : 0);
    for (let i = 0; i < remainingGuesses; i++) {
      rows.push(
        <div key={`empty-${i}`} className="flex gap-1.5 mb-1.5">
          {Array(5)
            .fill(0)
            .map((_, j) => (
              <div
                key={`empty-${i}-${j}`}
                className="w-14 h-14 sm:w-16 sm:h-16 flex items-center justify-center font-bold text-xl rounded-md border border-slate-800/80"
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
            className="flex justify-center gap-1.5 mb-2"
          >
            {row.map(key => {
              let width = 'w-9 sm:w-10';
              let content: string | JSX.Element = key;

              if (key === 'ENTER') {
                width = 'w-16 sm:w-16 text-xs';
                content = <ChevronRight className="w-4 h-4" />;
              } else if (key === 'BACKSPACE') {
                width = 'w-16 sm:w-16 text-xs';
                content = (
                  <svg
                    className="w-4 h-4"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    strokeWidth="2"
                    stroke="currentColor"
                  >
                    <path d="M21 4H8l-7 8 7 8h13a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z" />
                    <path d="M18 9l-6 6" />
                    <path d="M12 9l6 6" />
                  </svg>
                );
              }

              return (
                <motion.button
                  key={key}
                  className={`${getKeyBackground(keyboardStatus[key])} ${width} h-12 flex items-center justify-center rounded-md font-medium`}
                  onClick={() => handleKeyInput(key)}
                  disabled={gameState !== 'playing' || revealAnimation}
                  whileTap={{ scale: 0.95 }}
                  transition={{ duration: 0.1 }}
                >
                  {content}
                </motion.button>
              );
            })}
          </div>
        ))}
      </div>
    );
  };

  // Game progress indicator (6 small dots)
  const renderProgressIndicator = () => {
    return (
      <div className="flex justify-center gap-1.5 mb-2">
        {Array(6)
          .fill(0)
          .map((_, i) => {
            let bgColor = 'bg-slate-700/50';

            if (i < guesses.length) {
              const guess = guesses[i];
              if (guess === targetWord) {
                bgColor = 'bg-green-500';
              } else {
                bgColor = 'bg-amber-500/70';
              }
            }

            return (
              <div
                key={`progress-${i}`}
                className={`w-1.5 h-1.5 rounded-full ${bgColor} transition-colors duration-300`}
              ></div>
            );
          })}
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
      onChange={() => {}} // We handle this through keydown events
      autoFocus
    />
  );

  return (
    <div className="flex flex-col items-center">
      <Toast
        message={toast.message}
        type={toast.type}
        isVisible={toast.show}
        onClose={() => setToast({ ...toast, show: false })}
      />

      <div className="w-full max-w-md px-2 mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div
            className={`px-2.5 py-1 rounded-full text-xs font-medium
            ${
              gameState === 'playing'
                ? 'bg-blue-500/20 text-blue-400'
                : gameState === 'won'
                  ? 'bg-green-500/20 text-green-400'
                  : 'bg-amber-500/20 text-amber-400'
            }`}
          >
            {gameState === 'playing'
              ? 'IN PROGRESS'
              : gameState === 'won'
                ? 'COMPLETED'
                : 'GAME OVER'}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <motion.button
            className={`w-8 h-8 rounded-full flex items-center justify-center 
              ${usedHint || gameState !== 'playing' ? 'bg-slate-800/60 text-slate-600' : 'bg-indigo-500/20 text-indigo-400 hover:bg-indigo-500/30'} 
              transition-colors`}
            onClick={revealHint}
            disabled={usedHint || gameState !== 'playing' || revealAnimation}
            whileTap={{ scale: 0.9 }}
          >
            <Key className="w-3.5 h-3.5" />
          </motion.button>

          <motion.button
            className="w-8 h-8 rounded-full bg-slate-800/60 text-slate-400 hover:bg-slate-700/60 transition-colors flex items-center justify-center"
            onClick={() => {
              window.location.reload();
            }}
            whileTap={{ scale: 0.9 }}
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </motion.button>
        </div>
      </div>

      {renderProgressIndicator()}

      <div className="mb-6 relative">
        {/* Subtle animated glow behind the game board */}
        <div className="absolute -inset-10 bg-gradient-to-br from-blue-500/5 via-indigo-500/5 to-purple-500/5 rounded-full blur-3xl"></div>

        <div className="relative">{renderGameBoard()}</div>
      </div>

      {renderKeyboard()}
      {hiddenInput}
    </div>
  );
};

// Main Wordle Page
const WordlePage = () => {
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [showStatsModal, setShowStatsModal] = useState(false);
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

    newStats.winPercentage =
      Math.round((newStats.wins / newStats.played) * 100) || 0;

    // Save to localStorage
    localStorage.setItem('wordleStats', JSON.stringify(newStats));
    setGameStats(newStats);

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
    <div className="min-h-screen ">
      <div className="relative pt-16 pb-20 px-4">
        <div className="max-w-3xl mx-auto relative">
          {/* Header */}
          <motion.div
            className="text-center mb-12"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          >
            <h1 className="text-5xl font-extrabold mb-4 tracking-tight">
              NEUROWORDLE
            </h1>

            <p className="text-slate-400 max-w-md mx-auto mb-6 text-lg">
              Challenge your vocabulary and cognitive skills with this enhanced
              word puzzle
            </p>

            <div className="flex flex-wrap justify-center gap-3">
              <motion.button
                className="flex items-center gap-1.5 px-4 py-2 bg-slate-800/80 backdrop-blur-sm rounded-lg text-slate-300 text-sm hover:bg-slate-700/80 transition-colors"
                onClick={() => setShowHelpModal(true)}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
              >
                <HelpCircle className="w-4 h-4" />
                How to Play
              </motion.button>

              <motion.button
                className="flex items-center gap-1.5 px-4 py-2 bg-slate-800/80 backdrop-blur-sm rounded-lg text-slate-300 text-sm hover:bg-slate-700/80 transition-colors"
                onClick={() => setShowStatsModal(true)}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
              >
                <BarChart3 className="w-4 h-4" />
                Statistics
              </motion.button>
            </div>
          </motion.div>

          {/* Game panel */}
          <motion.div
            className="bg-gradient-to-br from-slate-900/80 to-slate-950/90 backdrop-blur-md rounded-2xl border border-slate-800/50 shadow-xl overflow-hidden mb-14"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2, ease: 'easeOut' }}
          >
            <div className="relative">
              <div className="absolute top-0 inset-x-0 h-1 overflow-hidden">
                <div className="absolute inset-0  blur-sm"></div>
              </div>

              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-bold flex items-center">
                    <Puzzle className="w-5 h-5 mr-2 text-blue-500" />
                    <span>NEUROWORDLE CHALLENGE</span>
                  </h2>

                  <div className="text-xs text-slate-500 flex items-center">
                    <div className="hidden sm:flex items-center mr-1">
                      <span>Use</span>
                      <span className="mx-1 inline-block px-1.5 py-0.5 bg-slate-800 rounded text-slate-400">
                        keyboard
                      </span>
                      <span>or click</span>
                    </div>
                  </div>
                </div>

                <div className="mb-2 -mx-1">
                  <WordleGame onGameComplete={handleGameComplete} />
                </div>
              </div>
            </div>
          </motion.div>

          {/* Features section */}
          <div className="mb-14">
            <motion.h2
              className="font-bold text-2xl mb-8 flex items-center justify-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              <Brain className="w-5 h-5 mr-2 text-cyan-500" />
              <span className="bg-gradient-to-r from-cyan-400 to-blue-400 text-transparent bg-clip-text">
                Benefits of Word Games
              </span>
            </motion.h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.5 }}
              >
                <FeatureCard
                  icon={Sparkles}
                  title="Vocabulary Enhancement"
                  description="Expand your language skills and word recognition abilities through regular play."
                  gradient="bg-gradient-to-br from-cyan-500 to-blue-600"
                />
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.6 }}
              >
                <FeatureCard
                  icon={Brain}
                  title="Cognitive Exercise"
                  description="Improve problem-solving skills and pattern recognition with each puzzle."
                  gradient="bg-gradient-to-br from-blue-500 to-indigo-600"
                />
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.7 }}
              >
                <FeatureCard
                  icon={Zap}
                  title="Mental Agility"
                  description="Enhance mental flexibility and adaptability to challenging scenarios."
                  gradient="bg-gradient-to-br from-indigo-500 to-purple-600"
                />
              </motion.div>
            </div>
          </div>

          {/* Tips card */}
          <motion.div
            className="bg-gradient-to-r from-blue-900/30 to-indigo-900/30 backdrop-blur-sm border border-blue-800/30 rounded-xl p-6 relative overflow-hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.8 }}
          >
            <div className="absolute -top-24 -right-24 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl"></div>

            <div className="flex items-start gap-4">
              <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg p-3 mt-1">
                <HelpCircle className="w-6 h-6 text-white" />
              </div>

              <div>
                <h3 className="font-bold text-xl mb-2 text-white">
                  Pro Strategy Tip
                </h3>
                <p className="text-slate-300">
                  Start with words that contain common vowels (A, E, I, O, U)
                  and consonants (R, S, T, L, N). Words like "STARE," "ADIEU,"
                  or "TRAIN" can help you quickly identify which letters are in
                  the target word.
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Modal components */}
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

      <StatsModal
        isOpen={showStatsModal}
        onClose={() => setShowStatsModal(false)}
        gameStats={gameStats}
      />
    </div>
  );
};

export default WordlePage;
