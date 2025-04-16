'use client';

import { useState, useEffect } from 'react';
import {
  Brain,
  Trophy,
  Dices,
  Award,
  Clock,
  BarChart,
  X,
  CheckCircle,
  Star,
  ArrowUp,
  Sparkles,
  RefreshCw,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';

// Import from your store
import { useActivityStore, logActivity } from '@/store/activity-store';

// MemoryMatchGame Component
const MemoryMatchGame = ({ onComplete }) => {
  const [cards, setCards] = useState<
    Array<{ id: number; icon: string; flipped: boolean; matched: boolean }>
  >([]);
  const [flipped, setFlipped] = useState<number[]>([]);
  const [matched, setMatched] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [score, setScore] = useState(0);
  const [gameStarted, setGameStarted] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [timer, setTimer] = useState(0);
  const [timerInterval, setTimerInterval] = useState<NodeJS.Timeout | null>(
    null
  );
  const [streakCount, setStreakCount] = useState(0);

  // Card icons
  const icons = [
    '🌟',
    '🌈',
    '🌸',
    '🍀',
    '🍎',
    '🐬',
    '🦋',
    '🦉',
    '🐘',
    '🦁',
    '🐢',
    '🐙',
  ];

  // Initialize or reset game
  const initializeGame = () => {
    // Create pairs of cards with icons
    const shuffledCards = [...icons, ...icons]
      .sort(() => Math.random() - 0.5)
      .map((icon, index) => ({
        id: index,
        icon,
        flipped: false,
        matched: false,
      }));

    setCards(shuffledCards);
    setFlipped([]);
    setMatched([]);
    setMoves(0);
    setScore(0);
    setGameOver(false);
    setTimer(0);
    setStreakCount(0);

    if (timerInterval) {
      clearInterval(timerInterval);
    }

    if (gameStarted) {
      toast.info('Game reset', {
        description: 'Starting a new game with fresh cards',
        icon: <RefreshCw className="h-4 w-4" />,
      });
    }
  };

  // Start the game and timer
  const startGame = () => {
    initializeGame();
    setGameStarted(true);

    const interval = setInterval(() => {
      setTimer(prevTime => prevTime + 1);
    }, 1000);

    setTimerInterval(interval);

    toast.success('Game started!', {
      description: 'Find all matching pairs as quickly as you can.',
      icon: <Dices className="h-5 w-5" />,
    });
  };

  // Handle card flipping
  const handleCardClick = (id: number) => {
    // Don't allow click if already two cards flipped or clicking on matched/flipped card
    if (flipped.length === 2 || matched.includes(id) || flipped.includes(id))
      return;

    // Flip the card
    setFlipped(prev => [...prev, id]);

    // If first card, just flip it
    if (flipped.length === 0) return;

    // If second card, check for match
    setMoves(prev => prev + 1);

    const firstCard = cards.find(card => card.id === flipped[0]);
    const secondCard = cards.find(card => card.id === id);

    if (firstCard && secondCard && firstCard.icon === secondCard.icon) {
      // Match found
      setMatched(prev => [...prev, flipped[0], id]);
      setScore(prev => prev + 10);
      setFlipped([]);

      // Increment streak count
      const newStreakCount = streakCount + 1;
      setStreakCount(newStreakCount);

      // Show toast for match
      if (newStreakCount >= 3) {
        toast.success(`${newStreakCount} streak! 🔥`, {
          description: "You're on fire!",
          icon: <Sparkles className="h-4 w-4 text-amber-400" />,
        });
      } else {
        toast('Match found!', {
          description: `+10 points added to your score`,
          icon: <CheckCircle className="h-4 w-4 text-green-500" />,
        });
      }
    } else {
      // No match, flip back after delay
      setTimeout(() => {
        setFlipped([]);
      }, 1000);

      // Reset streak
      if (streakCount > 0) {
        setStreakCount(0);
      }
    }
  };

  // Check for game completion
  useEffect(() => {
    if (matched.length === cards.length && cards.length > 0) {
      // All cards matched, game over
      if (timerInterval) {
        clearInterval(timerInterval);
      }

      setGameOver(true);

      // Calculate final score including time bonus
      const timeBonus = Math.max(0, 300 - timer); // Time bonus decreases as time increases
      const finalScore = score + timeBonus;
      setScore(finalScore);

      // Call the completion handler
      onComplete({
        score: finalScore,
        moves: moves,
        time: timer,
        gameType: 'memory-match',
      });

      // Don't need to show a toast here since we'll show the completion modal
    }
  }, [matched, cards, timerInterval, score, timer, moves, onComplete]);

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (timerInterval) {
        clearInterval(timerInterval);
      }
    };
  }, [timerInterval]);

  // Format timer display
  const formatTime = seconds => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // Render the game UI
  return (
    <div className="flex flex-col items-center">
      {!gameStarted ? (
        <div className="text-center p-8 bg-card border border-border rounded-xl max-w-md mx-auto shadow-sm">
          <div className="w-16 h-16 rounded-full bg-amber-500/10 text-amber-500 flex items-center justify-center mx-auto mb-4">
            <Dices className="h-8 w-8" />
          </div>
          <h2 className="text-2xl font-bold mb-4">Memory Match</h2>
          <p className="mb-6 text-muted-foreground">
            Test your memory by matching pairs of cards. Find all matches as
            quickly as possible!
          </p>
          <Button
            onClick={startGame}
            className="bg-amber-600 hover:bg-amber-700 text-white px-8 py-6 text-lg"
          >
            Start Game
          </Button>
        </div>
      ) : (
        <div className="w-full max-w-3xl mx-auto">
          {/* Game stats */}
          <div className="flex justify-between items-center mb-6 bg-card p-4 rounded-lg border border-border shadow-sm">
            <div className="flex items-center gap-6">
              <div>
                <span className="block text-sm text-muted-foreground">
                  Moves
                </span>
                <span className="text-xl font-bold">{moves}</span>
              </div>
              <div>
                <span className="block text-sm text-muted-foreground">
                  Time
                </span>
                <span className="text-xl font-bold">{formatTime(timer)}</span>
              </div>
            </div>
            <div>
              <span className="block text-sm text-muted-foreground">Score</span>
              <span className="text-xl font-bold">{score}</span>
            </div>
          </div>

          {/* Game grid */}
          <div className="grid grid-cols-4 md:grid-cols-6 gap-2 md:gap-4">
            {cards.map(card => (
              <div
                key={card.id}
                className={`aspect-square rounded-lg cursor-pointer transition-all duration-300 transform ${
                  matched.includes(card.id)
                    ? 'bg-green-500/20 dark:bg-green-500/30 scale-95'
                    : flipped.includes(card.id)
                      ? 'bg-amber-500/20 dark:bg-amber-500/30 rotate-y-180'
                      : 'bg-card border border-border hover:bg-muted dark:hover:bg-muted'
                } flex items-center justify-center text-3xl`}
                onClick={() => handleCardClick(card.id)}
              >
                {flipped.includes(card.id) || matched.includes(card.id)
                  ? card.icon
                  : ''}
              </div>
            ))}
          </div>

          <div className="flex justify-center mt-6">
            <Button
              variant="outline"
              onClick={initializeGame}
              className="border-amber-500 text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/10"
            >
              Reset Game
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

// Game Completion Modal Component
const GameCompletionModal = ({
  isOpen,
  onClose,
  gameData,
  highScore = false,
  isNewHighScore = false,
}) => {
  if (!isOpen || !gameData) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="relative bg-card w-full max-w-md rounded-xl shadow-2xl p-6 animate-in fade-in-0 slide-in-from-bottom-10 border border-border">
        <button
          onClick={onClose}
          className="absolute top-2 right-2 text-muted-foreground hover:text-foreground"
        >
          <X className="h-6 w-6" />
        </button>

        <div className="text-center mb-4">
          <div className="mx-auto w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mb-4">
            <CheckCircle className="h-10 w-10 text-green-500" />
          </div>
          <h2 className="text-2xl font-bold mb-1">Game Complete!</h2>
          <p className="text-muted-foreground mb-4">
            Great job on completing the challenge.
          </p>

          {isNewHighScore && (
            <div className="bg-amber-500/10 text-amber-600 p-3 rounded-lg mb-4 flex items-center justify-center">
              <Star className="h-5 w-5 mr-2 text-amber-500" />
              <span className="font-medium">New High Score!</span>
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="bg-muted p-3 rounded-lg text-center">
            <div className="text-sm text-muted-foreground mb-1">Score</div>
            <div className="text-2xl font-bold">{gameData.score}</div>
          </div>
          <div className="bg-muted p-3 rounded-lg text-center">
            <div className="text-sm text-muted-foreground mb-1">Time</div>
            <div className="text-2xl font-bold">
              {Math.floor(gameData.time / 60)}:
              {gameData.time % 60 < 10 ? '0' : ''}
              {gameData.time % 60}
            </div>
          </div>
          <div className="bg-muted p-3 rounded-lg text-center">
            <div className="text-sm text-muted-foreground mb-1">Moves</div>
            <div className="text-2xl font-bold">{gameData.moves}</div>
          </div>
          <div className="bg-muted p-3 rounded-lg text-center">
            <div className="text-sm text-muted-foreground mb-1">High Score</div>
            <div className="text-2xl font-bold">{highScore}</div>
          </div>
        </div>

        <div className="flex gap-3">
          <Button variant="outline" className="flex-1" onClick={onClose}>
            Back to Games
          </Button>
          <Button
            className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
            onClick={() => {
              onClose();
              // This would trigger the game to reset and start again
              // We'll leave the implementation to the parent component
            }}
          >
            Play Again
          </Button>
        </div>
      </div>
    </div>
  );
};

// Main Focus Games Page
export default function FocusGamesPage() {
  const [selectedGame, setSelectedGame] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('games');
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [currentGameData, setCurrentGameData] = useState<{
    gameType: string;
    score: number;
    moves: number;
    time: number;
  } | null>(null);
  const [isNewHighScore, setIsNewHighScore] = useState(false);

  // Local stats - would be replaced by your store in production
  const [stats, setStats] = useState({
    gamesPlayed: 15,
    highScore: 120,
    totalTime: 45,
    averageScore: 85,
    gameStats: {
      'memory-match': {
        highScore: 120,
        bestTime: 57,
        totalGames: 12,
      },
      'attention-training': {
        highScore: 85,
        bestTime: 180,
        totalGames: 3,
      },
    },
  });

  // Get stats from your activity store
  const focusStats = useActivityStore(state =>
    state.getActivityStats<any>('focus')
  );

  const games = [
    {
      id: 'memory-match',
      title: 'Memory Match',
      description: 'Test and improve your memory by matching pairs of cards',
      icon: <Dices className="h-6 w-6" />,
      color: 'bg-amber-500',
      textColor: 'text-amber-600',
      bgColor: 'bg-amber-500/10',
      difficulty: 'beginner',
      duration: '3-5 min',
      stats: {
        highScore: stats.gameStats['memory-match']?.highScore || 0,
        bestTime: stats.gameStats['memory-match']?.bestTime
          ? `${Math.floor(stats.gameStats['memory-match'].bestTime / 60)}:${stats.gameStats['memory-match'].bestTime % 60 < 10 ? '0' : ''}${stats.gameStats['memory-match'].bestTime % 60}`
          : '-',
      },
    },
    {
      id: 'attention-training',
      title: 'Attention Training',
      description: 'Improve your focus and concentration abilities',
      icon: <Brain className="h-6 w-6" />,
      color: 'bg-emerald-500',
      textColor: 'text-emerald-600',
      bgColor: 'bg-emerald-500/10',
      difficulty: 'intermediate',
      duration: '5-10 min',
      stats: {
        highScore: stats.gameStats['attention-training']?.highScore || 0,
        sessions: stats.gameStats['attention-training']?.totalGames || 0,
      },
    },
  ];

  // Handle game completion
  const handleGameComplete = data => {
    console.log('Game completed:', data);

    // Update local stats
    setStats(prevStats => {
      const gameID = data.gameType;
      const currentHighScore = prevStats.gameStats[gameID]?.highScore || 0;
      const isNewHigh = data.score > currentHighScore;

      // Check if it's a new high score
      setIsNewHighScore(isNewHigh);

      // Store the game data for the completion modal
      setCurrentGameData(data);

      // Show completion modal
      setShowCompletionModal(true);

      // Calculate new stats
      const totalGames = (prevStats.gameStats[gameID]?.totalGames || 0) + 1;
      const newHighScore = isNewHigh ? data.score : currentHighScore;
      const bestTime = prevStats.gameStats[gameID]?.bestTime
        ? Math.min(prevStats.gameStats[gameID].bestTime, data.time)
        : data.time;

      // Show appropriate toast
      if (isNewHigh) {
        toast.success('New high score!', {
          description: `You've beaten your previous record of ${currentHighScore} points!`,
          icon: <ArrowUp className="h-4 w-4 text-green-500" />,
        });
      } else {
        toast.success('Game completed!', {
          description: `You scored ${data.score} points in ${Math.floor(data.time / 60)}:${data.time % 60 < 10 ? '0' : ''}${data.time % 60}`,
          icon: <Trophy className="h-4 w-4 text-amber-500" />,
        });
      }

      // Update all stats
      return {
        ...prevStats,
        gamesPlayed: prevStats.gamesPlayed + 1,
        highScore: Math.max(prevStats.highScore, newHighScore),
        totalTime: prevStats.totalTime + Math.ceil(data.time / 60),
        averageScore: Math.round(
          (prevStats.averageScore * prevStats.gamesPlayed + data.score) /
            (prevStats.gamesPlayed + 1)
        ),
        gameStats: {
          ...prevStats.gameStats,
          [gameID]: {
            highScore: newHighScore,
            bestTime: bestTime,
            totalGames: totalGames,
          },
        },
      };
    });

    // In a real implementation, you would use your activity store here
    logActivity('focus', {
      score: data.score,
      minutes: Math.ceil(data.time / 60),
      gameType: data.gameType,
      moves: data.moves,
    });
  };

  // Close the completion modal
  const handleCloseModal = () => {
    setShowCompletionModal(false);
  };

  // Handle selecting a game
  const handleSelectGame = gameId => {
    setSelectedGame(gameId);

    // Show toast when game is selected
    const game = games.find(g => g.id === gameId);
    if (game) {
      toast.info(`Loading ${game.title}`, {
        description: game.description,
        icon: game.icon,
      });
    }
  };

  return (
    <div className="mx-auto px-4 py-8">
      {!selectedGame ? (
        <>
          {/* Hero section */}
          <div className="relative bg-card rounded-xl shadow-sm mb-10 overflow-hidden border dark:border-[#333333]">
            <div className="absolute inset-0 bg-[url('/focus-pattern.svg')] opacity-10"></div>
            <div className="py-12 px-6 sm:px-8 relative z-10">
              <div className="max-w-3xl mx-auto text-center">
                <h1 className="text-4xl font-extrabold mb-4">
                  Focus & Cognitive Games
                </h1>
                <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                  Fun, interactive games designed to improve your concentration,
                  memory, and mental flexibility.
                </p>

                {/* Quick Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
                  <div className="border dark:border-[#333333] rounded-lg p-4">
                    <div className="text-3xl font-bold">
                      {stats.gamesPlayed}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Games Played
                    </div>
                  </div>
                  <div className="border dark:border-[#333333] rounded-lg p-4">
                    <div className="text-3xl font-bold ">{stats.highScore}</div>
                    <div className="text-sm text-muted-foreground">
                      High Score
                    </div>
                  </div>
                  <div className="border dark:border-[#333333] rounded-lg p-4">
                    <div className="text-3xl font-bold ">
                      {stats.totalTime} min
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Total Time
                    </div>
                  </div>
                  <div className="border dark:border-[#333333] rounded-lg p-4">
                    <div className="text-3xl font-bold ">
                      {stats.averageScore}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Average Score
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Main content */}
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-full"
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-3xl font-bold flex items-center gap-2">
                <Brain className="h-7 w-7 text-primary" /> Brain Games
              </h2>

              <TabsList>
                <TabsTrigger value="games">Games</TabsTrigger>
                <TabsTrigger value="progress">Progress</TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="games">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
                {games.map(game => (
                  <Card
                    key={game.id}
                    className="border-border shadow-sm hover:shadow-md transition-all cursor-pointer overflow-hidden group"
                    onClick={() => handleSelectGame(game.id)}
                  >
                    <div className={`h-1 w-full ${game.color}`}></div>
                    <CardHeader className="pb-2">
                      <div className="flex justify-between">
                        <div
                          className={`w-12 h-12 rounded-full ${game.bgColor} ${game.textColor} flex items-center justify-center transform group-hover:scale-110 transition-transform duration-200`}
                        >
                          {game.icon}
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {game.difficulty}
                        </Badge>
                      </div>
                      <CardTitle className="mt-2">{game.title}</CardTitle>
                      <CardDescription>{game.description}</CardDescription>
                    </CardHeader>
                    <CardContent className="pb-2">
                      <div className="flex justify-between items-center text-sm mt-2">
                        <div className="flex items-center text-muted-foreground">
                          <Clock className="h-4 w-4 mr-1" />
                          <span>{game.duration}</span>
                        </div>
                        <div className="flex items-center text-muted-foreground">
                          <Trophy className="h-4 w-4 mr-1 text-amber-500" />
                          <span>{game.stats.highScore}</span>
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter>
                      <Button className="w-full bg-primary hover:bg-primary/90 group-hover:shadow-sm transition-shadow">
                        Start Game
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>

              <div className="bg-card rounded-lg p-6 shadow-sm border dark:border-[#333333]">
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-amber-500" /> Benefits of
                  Brain Games
                </h3>
                <p className="mb-4 text-muted-foreground">
                  Regular cognitive training has been shown to improve various
                  aspects of mental performance:
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 border dark:border-[#333333] rounded-lg">
                    <h4 className="font-medium mb-2">Memory</h4>
                    <p className="text-sm text-muted-foreground">
                      Strengthens working memory and recall abilities
                    </p>
                  </div>
                  <div className="p-4 border dark:border-[#333333] rounded-lg">
                    <h4 className="font-medium mb-2">Attention</h4>
                    <p className="text-sm text-muted-foreground">
                      Enhances focus duration and ability to ignore distractions
                    </p>
                  </div>
                  <div className="p-4 border dark:border-[#333333] rounded-lg">
                    <h4 className="font-medium mb-2">Processing Speed</h4>
                    <p className="text-sm text-muted-foreground">
                      Improves how quickly you can process and respond to
                      information
                    </p>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="progress">
              <Card className="border-border shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart className="h-5 w-5 text-primary" />
                    Your Progress
                  </CardTitle>
                  <CardDescription>
                    Track your cognitive training journey
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {Object.keys(stats.gameStats).length > 0 ? (
                      <div className="space-y-6">
                        {Object.entries(stats.gameStats).map(
                          ([gameId, gameStats]) => {
                            const game = games.find(g => g.id === gameId);
                            if (!game || gameStats.totalGames === 0)
                              return null;

                            return (
                              <div key={gameId} className="space-y-2">
                                <div className="flex items-center justify-between">
                                  <h4 className="font-medium flex items-center">
                                    <span
                                      className={`w-3 h-3 rounded-full ${game.color} mr-2`}
                                    ></span>
                                    {game.title}
                                  </h4>
                                  <span className="text-sm text-muted-foreground">
                                    {gameStats.totalGames} plays
                                  </span>
                                </div>
                                <div className="space-y-1">
                                  <div className="flex justify-between text-sm">
                                    <span>
                                      High Score: {gameStats.highScore}
                                    </span>
                                    <span>
                                      Best Time:{' '}
                                      {gameStats.bestTime
                                        ? `${Math.floor(gameStats.bestTime / 60)}:${gameStats.bestTime % 60 < 10 ? '0' : ''}${gameStats.bestTime % 60}`
                                        : '-'}
                                    </span>
                                  </div>
                                  <Progress
                                    value={gameStats.highScore / 2}
                                    className="h-2"
                                  />
                                </div>
                              </div>
                            );
                          }
                        )}
                      </div>
                    ) : (
                      <p className="text-center text-muted-foreground">
                        Progress tracking statistics will appear here as you
                        play more games.
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </>
      ) : (
        // Game view
        <div>
          <div className="mb-6">
            <h1 className="text-3xl font-bold">
              {games.find(g => g.id === selectedGame)?.title}
            </h1>
            <p className="text-muted-foreground">
              {games.find(g => g.id === selectedGame)?.description}
            </p>
          </div>

          {selectedGame === 'memory-match' && (
            <MemoryMatchGame onComplete={handleGameComplete} />
          )}

          {selectedGame === 'attention-training' && (
            <div className="text-center p-12 bg-muted/50 rounded-lg">
              <Brain className="h-16 w-16 text-emerald-500 mx-auto mb-4" />
              <h3 className="text-xl font-bold mb-2">
                Attention Training Game
              </h3>
              <p className="text-muted-foreground mb-6">
                This game will be available soon. Check back later!
              </p>
              <Button
                variant="outline"
                onClick={() => {
                  setSelectedGame(null);
                  toast.info('Coming soon!', {
                    description:
                      "We're still developing this game. Try Memory Match in the meantime!",
                    icon: <Brain className="h-4 w-4" />,
                  });
                }}
              >
                Return to Games
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Game Completion Modal */}
      <GameCompletionModal
        isOpen={showCompletionModal}
        onClose={handleCloseModal}
        gameData={currentGameData}
        highScore={
          currentGameData
            ? stats.gameStats[currentGameData.gameType]?.highScore
            : 0
        }
        isNewHighScore={isNewHighScore}
      />
    </div>
  );
}
