// components/focus-games/memory-match.tsx
'use client';

import { useState, useEffect, useRef, FC } from 'react';
import { shuffle } from 'lodash';
import { RefreshCw, Trophy, Clock, Star, Check, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useActivityStore } from '@/store/activity-store';

// Card interface for the game
interface GameCard {
  id: string;
  symbol: string;
  flipped: boolean;
  matched: boolean;
}

// Difficulty level interface
interface DifficultyLevel {
  rows: number;
  cols: number;
  name: string;
}

// Difficulty levels object
const DIFFICULTY_LEVELS: Record<string, DifficultyLevel> = {
  easy: { rows: 3, cols: 4, name: 'Easy' },
  medium: { rows: 4, cols: 5, name: 'Medium' },
  hard: { rows: 5, cols: 6, name: 'Hard' },
};

// Game results interface
interface GameResults {
  difficulty: string;
  time: number;
  moves: number;
  score: number;
  newBest: boolean;
}

// Symbol options for cards
const SYMBOLS = [
  '🧠',
  '🌟',
  '🌈',
  '🔥',
  '💧',
  '🌱',
  '🦋',
  '🐬',
  '🦉',
  '🐢',
  '🍀',
  '🎵',
];

interface MemoryMatchGameProps {
  onComplete?: (data: {
    activity: string;
    exercise: string;
    difficulty: string;
    score: number;
    minutes: number;
  }) => void;
}

const MemoryMatchGame: FC<MemoryMatchGameProps> = ({ onComplete }) => {
  const [difficulty, setDifficulty] = useState<string>('easy');
  const [gameState, setGameState] = useState<
    'setup' | 'playing' | 'paused' | 'complete'
  >('setup');
  const [cards, setCards] = useState<GameCard[]>([]);
  const [flipped, setFlipped] = useState<string[]>([]);
  const [matched, setMatched] = useState<string[]>([]);
  const [score, setScore] = useState<number>(0);
  const [moves, setMoves] = useState<number>(0);
  const [time, setTime] = useState<number>(0);
  const [showResults, setShowResults] = useState<boolean>(false);
  const [results, setResults] = useState<GameResults | null>(null);
  const [bestScores, setBestScores] = useState<
    Record<string, { time: number | null; moves: number | null; score: number }>
  >({
    easy: { time: null, moves: null, score: 0 },
    medium: { time: null, moves: null, score: 0 },
    hard: { time: null, moves: null, score: 0 },
  });

  // Get activity logging function from store
  const logActivity = useActivityStore(state => state.logActivity);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const timerStartRef = useRef<number | null>(null);

  // Initialize the game with cards based on difficulty
  const initializeGame = () => {
    const { rows, cols } = DIFFICULTY_LEVELS[difficulty];
    const totalPairs = (rows * cols) / 2;

    // Get symbols for the game
    const gameSymbols = SYMBOLS.slice(0, totalPairs);

    // Create card pairs and shuffle
    const cardPairs = gameSymbols.flatMap(symbol => [
      { id: `${symbol}-1`, symbol, flipped: false, matched: false },
      { id: `${symbol}-2`, symbol, flipped: false, matched: false },
    ]);

    setCards(shuffle(cardPairs));
    setFlipped([]);
    setMatched([]);
    setMoves(0);
    setTime(0);
    setScore(0);
    setGameState('setup');
    setShowResults(false);
  };

  // Start the game timer
  const startGame = () => {
    setGameState('playing');
    timerStartRef.current = Date.now();
    timerRef.current = setInterval(() => {
      setTime(Math.floor((Date.now() - (timerStartRef.current || 0)) / 1000));
    }, 1000);
  };

  // Pause the game
  const pauseGame = () => {
    if (gameState === 'playing') {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      setGameState('paused');
    } else if (gameState === 'paused') {
      // Resume the game and adjust the timer start time
      timerStartRef.current = Date.now() - time * 1000;
      timerRef.current = setInterval(() => {
        setTime(Math.floor((Date.now() - (timerStartRef.current || 0)) / 1000));
      }, 1000);
      setGameState('playing');
    }
  };

  // Handle card flip
  const handleCardFlip = (cardId: string) => {
    // Don't allow flips if game is not in playing state
    if (gameState !== 'playing') return;

    // Don't allow flips if already matched or if two cards are already flipped
    if (
      matched.includes(cardId) ||
      flipped.includes(cardId) ||
      flipped.length === 2
    )
      return;

    // Start the game if this is the first move
    if (flipped.length === 0 && moves === 0) {
      startGame();
    }

    // Add card to flipped state
    const newFlipped = [...flipped, cardId];
    setFlipped(newFlipped);

    // If two cards are flipped, check for a match
    if (newFlipped.length === 2) {
      setMoves(moves + 1);

      const card1 = cards.find(card => card.id === newFlipped[0]);
      const card2 = cards.find(card => card.id === newFlipped[1]);

      // If symbols match, add to matched state
      if (card1 && card2 && card1.symbol === card2.symbol) {
        setMatched([...matched, card1.id, card2.id]);
        setScore(score + 10);
        setFlipped([]);
      } else {
        // If no match, flip cards back after a delay
        setTimeout(() => {
          setFlipped([]);
        }, 800);
      }
    }
  };

  // Check if game is complete
  useEffect(() => {
    if (matched.length > 0 && matched.length === cards.length) {
      // Game complete
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      setGameState('complete');

      // Calculate score based on difficulty, time, and moves
      const difficultyFactor =
        difficulty === 'easy' ? 1 : difficulty === 'medium' ? 1.5 : 2;
      const timeBonus = Math.max(300 - time, 0);
      const movesBonus = Math.max(100 - moves * 2, 0);
      const totalScore = Math.round(
        (score + timeBonus + movesBonus) * difficultyFactor
      );

      // Prepare results
      const gameResults: GameResults = {
        difficulty: DIFFICULTY_LEVELS[difficulty].name,
        time,
        moves,
        score: totalScore,
        newBest: false,
      };

      // Check if this is a new high score
      if (totalScore > bestScores[difficulty].score) {
        setBestScores({
          ...bestScores,
          [difficulty]: {
            time,
            moves,
            score: totalScore,
          },
        });
        gameResults.newBest = true;
      }

      setResults(gameResults);
      setShowResults(true);

      // Log activity to store
      logActivity('focus', {
        minutes: Math.ceil(time / 60),
        exercise: 'Memory Match',
        difficulty: DIFFICULTY_LEVELS[difficulty].name,
        score: totalScore,
      });

      // Call onComplete callback if provided
      if (onComplete) {
        onComplete({
          activity: 'focus',
          exercise: 'Memory Match',
          difficulty: DIFFICULTY_LEVELS[difficulty].name,
          score: totalScore,
          minutes: Math.ceil(time / 60),
        });
      }
    }
  }, [
    matched,
    cards.length,
    difficulty,
    time,
    moves,
    score,
    bestScores,
    onComplete,
    logActivity,
  ]);

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  // Initialize game when difficulty changes
  useEffect(() => {
    initializeGame();
  }, [difficulty]);

  // Format time as mm:ss
  const formatTime = (timeInSeconds: number): string => {
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = timeInSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  // Render the game interface
  return (
    <div className="flex flex-col">
      {/* Game controls */}
      <div className="mb-4 flex flex-wrap justify-between items-center gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={difficulty}
            onChange={e => setDifficulty(e.target.value)}
            disabled={gameState === 'playing' || gameState === 'paused'}
            className="py-2 px-3 rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
          >
            <option value="easy">Easy (3×4)</option>
            <option value="medium">Medium (4×5)</option>
            <option value="hard">Hard (5×6)</option>
          </select>

          {gameState === 'setup' ? (
            <Button
              onClick={() => startGame()}
              className="bg-gradient-to-r from-amber-500 to-orange-500"
            >
              Start Game
            </Button>
          ) : (
            <Button
              onClick={pauseGame}
              variant={gameState === 'paused' ? 'default' : 'outline'}
            >
              {gameState === 'paused' ? 'Resume' : 'Pause'}
            </Button>
          )}

          <Button variant="outline" onClick={initializeGame} className="ml-1">
            <RefreshCw className="h-4 w-4 mr-1" /> Reset
          </Button>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center">
            <Clock className="h-4 w-4 mr-1 text-gray-500" />
            <span className="text-sm font-medium">{formatTime(time)}</span>
          </div>
          <div className="flex items-center">
            <div className="h-5 w-5 rounded-full bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400 flex-shrink-0 flex items-center justify-center mr-1">
              <Star className="h-3 w-3" />
            </div>
            <span className="text-sm font-medium">{score}</span>
          </div>
          <div className="flex items-center">
            <Badge variant="outline" className="text-xs">
              Moves: {moves}
            </Badge>
          </div>
        </div>
      </div>

      {/* Game board */}
      <div
        className={`grid gap-2 mx-auto w-full max-w-3xl
          ${difficulty === 'easy' ? 'grid-cols-4' : difficulty === 'medium' ? 'grid-cols-5' : 'grid-cols-6'}
        `}
        style={{
          opacity: gameState === 'paused' ? 0.5 : 1,
          pointerEvents: gameState === 'playing' ? 'auto' : 'none',
        }}
      >
        {cards.map(card => (
          <div
            key={card.id}
            className={`aspect-square rounded-lg cursor-pointer transform transition-all duration-300
              ${matched.includes(card.id) ? 'bg-emerald-100 dark:bg-emerald-900/20' : flipped.includes(card.id) ? 'bg-blue-100 dark:bg-blue-900/20' : 'bg-gray-200 dark:bg-gray-700'}
              ${flipped.includes(card.id) || matched.includes(card.id) ? 'rotate-y-180' : ''}
              hover:bg-gray-300 dark:hover:bg-gray-600
              flex items-center justify-center text-3xl
              ${matched.includes(card.id) ? 'text-emerald-600 dark:text-emerald-400' : 'text-blue-600 dark:text-blue-400'}
            `}
            onClick={() => handleCardFlip(card.id)}
          >
            {(flipped.includes(card.id) || matched.includes(card.id)) &&
              card.symbol}
          </div>
        ))}
      </div>

      {/* Game complete dialog */}
      <Dialog open={showResults} onOpenChange={setShowResults}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-amber-500" /> Game Complete!
            </DialogTitle>
            <DialogDescription>
              You've successfully matched all the cards!
            </DialogDescription>
          </DialogHeader>

          {results && (
            <div className="py-4">
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 text-center">
                  <div className="text-2xl font-bold">
                    {formatTime(results.time)}
                  </div>
                  <div className="text-xs text-gray-500">Time</div>
                </div>
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 text-center">
                  <div className="text-2xl font-bold">{results.moves}</div>
                  <div className="text-xs text-gray-500">Moves</div>
                </div>
              </div>

              <div className="bg-gradient-to-r from-amber-100 to-orange-100 dark:from-amber-900/30 dark:to-orange-900/30 rounded-lg p-4 text-center mb-4">
                <div className="text-3xl font-bold">{results.score}</div>
                <div className="text-sm">Final Score</div>
                {results.newBest && (
                  <Badge className="mt-2 bg-gradient-to-r from-amber-500 to-orange-500">
                    New High Score!
                  </Badge>
                )}
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Difficulty</span>
                  <Badge variant="outline">{results.difficulty}</Badge>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-sm">Match Bonus</span>
                  <span className="font-medium">
                    {(cards.length / 2) * 10} pts
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-sm">Time Bonus</span>
                  <span className="font-medium">
                    {Math.max(300 - results.time, 0)} pts
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-sm">Efficiency Bonus</span>
                  <span className="font-medium">
                    {Math.max(100 - results.moves * 2, 0)} pts
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-sm">Difficulty Multiplier</span>
                  <span className="font-medium">
                    {difficulty === 'easy'
                      ? '1x'
                      : difficulty === 'medium'
                        ? '1.5x'
                        : '2x'}
                  </span>
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="flex gap-2">
            <Button variant="outline" onClick={initializeGame}>
              <RefreshCw className="h-4 w-4 mr-2" /> Play Again
            </Button>
            <Button
              className="bg-gradient-to-r from-amber-500 to-orange-500"
              onClick={() => setShowResults(false)}
            >
              <Check className="h-4 w-4 mr-2" /> Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Paused overlay */}
      {gameState === 'paused' && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 text-center max-w-sm mx-4">
            <h3 className="text-xl font-bold mb-4">Game Paused</h3>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Take a breath and continue when you're ready.
            </p>
            <Button
              className="bg-gradient-to-r from-amber-500 to-orange-500"
              onClick={pauseGame}
            >
              Resume Game
            </Button>
          </div>
        </div>
      )}

      {/* Additional global styles for card rotation */}
      <style jsx global>{`
        .rotate-y-180 {
          transform: rotateY(180deg);
        }
      `}</style>
    </div>
  );
};

export default MemoryMatchGame;
