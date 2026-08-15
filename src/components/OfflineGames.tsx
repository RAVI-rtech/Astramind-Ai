import React, { useState, useEffect } from "react";
import {
  Gamepad2,
  RotateCcw,
  Trophy,
  Brain,
  Hash,
  Grid3X3,
  Scissors,
  HelpCircle,
  Sparkles,
  Zap,
  CheckCircle2,
  XCircle,
  Flame,
  ArrowRight,
  RefreshCw,
  Award,
  Play,
  Wifi,
  WifiOff,
  Filter,
  BarChart2,
  Info,
  Check
} from "lucide-react";
import {
  HANGMAN_TERMS,
  ALL_QUIZ_QUESTIONS,
  Category,
  Difficulty,
  loadHangmanStats,
  saveHangmanStats,
  loadQuizStats,
  saveQuizStats,
  getLocalContentVersion,
  CONTENT_VERSION
} from "../data/quizAndHangmanData";

export type GameType = "number" | "tictactoe" | "rps" | "hangman" | "memory" | "math" | "coding";

interface OfflineGamesProps {
  initialGame?: GameType;
  onBack?: () => void;
}

export default function OfflineGames({ initialGame = "number", onBack }: OfflineGamesProps) {
  const [activeGame, setActiveGame] = useState<GameType>(initialGame);

  useEffect(() => {
    if (initialGame) {
      setActiveGame(initialGame);
    }
  }, [initialGame]);

  const gameTabs: { id: GameType; name: string; icon: string; desc: string }[] = [
    { id: "number", name: "Number Guessing", icon: "🔢", desc: "Guess the secret number in minimum tries" },
    { id: "tictactoe", name: "Tic Tac Toe", icon: "❌", desc: "Classic 3x3 strategy against smart AI" },
    { id: "rps", name: "Rock Paper Scissors", icon: "✂️", desc: "Battle the computer and build a win streak" },
    { id: "hangman", name: "Hangman", icon: "🔤", desc: "Guess the hidden programming term" },
    { id: "memory", name: "Memory Game", icon: "🧠", desc: "Match tech icon pairs in minimum moves" },
    { id: "math", name: "Math Quiz", icon: "⚡", desc: "Speed arithmetic quiz against the clock" },
    { id: "coding", name: "Coding Quiz", icon: "💻", desc: "Test your programming knowledge offline" },
  ];

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Games Selection Tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
        {gameTabs.map((game) => {
          const isActive = activeGame === game.id;
          return (
            <button
              key={game.id}
              onClick={() => setActiveGame(game.id)}
              className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                isActive
                  ? "bg-indigo-600/90 border-indigo-400 text-white shadow-lg shadow-indigo-600/30 scale-102"
                  : "bg-white/5 border-white/10 text-slate-300 hover:bg-white/10 hover:text-white"
              }`}
            >
              <div className="text-xl mb-1">{game.icon}</div>
              <div>
                <div className="text-xs font-bold leading-tight">{game.name}</div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Active Game Container */}
      <div className="bg-[#0c102b]/90 border border-white/10 rounded-3xl p-5 sm:p-7 shadow-2xl backdrop-blur-xl">
        {activeGame === "number" && <NumberGuessingGame />}
        {activeGame === "tictactoe" && <TicTacToeGame />}
        {activeGame === "rps" && <RockPaperScissorsGame />}
        {activeGame === "hangman" && <HangmanGame />}
        {activeGame === "memory" && <MemoryCardGame />}
        {activeGame === "math" && <MathQuizGame />}
        {activeGame === "coding" && <CodingQuizGame />}
      </div>
    </div>
  );
}

/* ====================================================================
   1. NUMBER GUESSING GAME
   ==================================================================== */
export function NumberGuessingGame() {
  const [maxRange, setMaxRange] = useState<number>(100);
  const [targetNumber, setTargetNumber] = useState<number>(() => Math.floor(Math.random() * 100) + 1);
  const [guessInput, setGuessInput] = useState<string>("");
  const [guessHistory, setGuessHistory] = useState<{ guess: number; feedback: "high" | "low" | "correct" }[]>([]);
  const [isWon, setIsWon] = useState<boolean>(false);
  const [bestScore, setBestScore] = useState<number>(() => {
    return parseInt(localStorage.getItem("astramind_game_num_best") || "999", 10);
  });

  const startNewGame = (range = maxRange) => {
    setMaxRange(range);
    setTargetNumber(Math.floor(Math.random() * range) + 1);
    setGuessInput("");
    setGuessHistory([]);
    setIsWon(false);
  };

  const handleGuess = (e: React.FormEvent) => {
    e.preventDefault();
    const num = parseInt(guessInput, 10);
    if (isNaN(num) || num < 1 || num > maxRange || isWon) return;

    let feedback: "high" | "low" | "correct" = "correct";
    if (num > targetNumber) feedback = "high";
    else if (num < targetNumber) feedback = "low";

    const newHistory = [{ guess: num, feedback }, ...guessHistory];
    setGuessHistory(newHistory);
    setGuessInput("");

    if (feedback === "correct") {
      setIsWon(true);
      const score = newHistory.length;
      if (score < bestScore) {
        setBestScore(score);
        localStorage.setItem("astramind_game_num_best", score.toString());
      }
    }
  };

  return (
    <div className="space-y-6 text-center">
      <div className="flex items-center justify-between border-b border-white/10 pb-4">
        <div className="text-left">
          <h3 className="text-xl font-black text-white flex items-center gap-2">
            <span>🔢 Number Guessing Game</span>
          </h3>
          <p className="text-xs text-slate-400">Guess the secret number between 1 and {maxRange}</p>
        </div>
        <div className="flex items-center gap-2">
          {bestScore < 999 && (
            <span className="text-xs font-mono text-amber-400 bg-amber-400/10 px-3 py-1 rounded-full border border-amber-400/20">
              Best: {bestScore} tries
            </span>
          )}
          <button
            onClick={() => startNewGame()}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition-all cursor-pointer"
            title="Restart Game"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Range selector */}
      <div className="flex items-center justify-center gap-2">
        {[50, 100, 500].map((r) => (
          <button
            key={r}
            onClick={() => startNewGame(r)}
            className={`px-3 py-1 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              maxRange === r
                ? "bg-indigo-600 text-white font-bold"
                : "bg-white/5 text-slate-400 hover:text-white"
            }`}
          >
            1 - {r}
          </button>
        ))}
      </div>

      {/* Input Form */}
      {!isWon ? (
        <form onSubmit={handleGuess} className="max-w-xs mx-auto space-y-3">
          <div className="flex items-center gap-2">
            <input
              type="number"
              min={1}
              max={maxRange}
              value={guessInput}
              onChange={(e) => setGuessInput(e.target.value)}
              placeholder={`Enter 1-${maxRange}`}
              className="w-full bg-white/5 border border-white/15 rounded-2xl px-4 py-3 text-center text-lg font-mono text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
            <button
              type="submit"
              className="px-5 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm transition-all shadow-lg shadow-indigo-600/30 cursor-pointer shrink-0"
            >
              Guess
            </button>
          </div>
        </form>
      ) : (
        <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-3xl p-6 text-center space-y-3 max-w-sm mx-auto animate-bounce">
          <Trophy className="w-10 h-10 text-amber-400 mx-auto" />
          <h4 className="text-xl font-black text-emerald-400">Correct! The number was {targetNumber}</h4>
          <p className="text-xs text-slate-300">You guessed it in <strong>{guessHistory.length}</strong> attempts!</p>
          <button
            onClick={() => startNewGame()}
            className="px-6 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-all shadow-lg cursor-pointer"
          >
            Play Again
          </button>
        </div>
      )}

      {/* Guess History */}
      {guessHistory.length > 0 && (
        <div className="max-w-md mx-auto space-y-2 pt-2">
          <div className="text-xs text-slate-400 font-medium">Guess History ({guessHistory.length} attempts):</div>
          <div className="flex flex-wrap items-center justify-center gap-2 max-h-36 overflow-y-auto scrollbar-thin">
            {guessHistory.map((item, idx) => (
              <div
                key={idx}
                className={`px-3 py-1.5 rounded-xl border text-xs font-mono flex items-center gap-1.5 ${
                  item.feedback === "correct"
                    ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-300 font-bold"
                    : item.feedback === "high"
                    ? "bg-rose-500/10 border-rose-500/20 text-rose-300"
                    : "bg-blue-500/10 border-blue-500/20 text-blue-300"
                }`}
              >
                <span>#{guessHistory.length - idx}: {item.guess}</span>
                <span>
                  {item.feedback === "correct" ? "🎯" : item.feedback === "high" ? "📉 Too High" : "📈 Too Low"}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ====================================================================
   2. TIC TAC TOE GAME
   ==================================================================== */
export function TicTacToeGame() {
  const [board, setBoard] = useState<(string | null)[]>(Array(9).fill(null));
  const [isXNext, setIsXNext] = useState<boolean>(true);
  const [mode, setMode] = useState<"ai" | "pvp">("ai");
  const [scores, setScores] = useState({ x: 0, o: 0, draws: 0 });

  const calculateWinner = (squares: (string | null)[]) => {
    const lines = [
      [0, 1, 2], [3, 4, 5], [6, 7, 8],
      [0, 3, 6], [1, 4, 7], [2, 5, 8],
      [0, 4, 8], [2, 4, 6]
    ];
    for (let i = 0; i < lines.length; i++) {
      const [a, b, c] = lines[i];
      if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
        return { winner: squares[a], line: lines[i] };
      }
    }
    if (squares.every((s) => s !== null)) {
      return { winner: "draw", line: [] };
    }
    return null;
  };

  const winnerInfo = calculateWinner(board);

  // AI Move logic
  useEffect(() => {
    if (mode === "ai" && !isXNext && !winnerInfo) {
      const timer = setTimeout(() => {
        makeAiMove();
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isXNext, mode, winnerInfo]);

  const makeAiMove = () => {
    const emptyIndices: number[] = [];
    board.forEach((val, idx) => {
      if (val === null) emptyIndices.push(idx);
    });
    if (emptyIndices.length === 0) return;

    // Check if AI can win
    for (let idx of emptyIndices) {
      const clone = [...board];
      clone[idx] = "O";
      if (calculateWinner(clone)?.winner === "O") {
        executeMove(idx, "O");
        return;
      }
    }

    // Check if AI needs to block player
    for (let idx of emptyIndices) {
      const clone = [...board];
      clone[idx] = "X";
      if (calculateWinner(clone)?.winner === "X") {
        executeMove(idx, "O");
        return;
      }
    }

    // Otherwise random move or center
    if (board[4] === null) {
      executeMove(4, "O");
      return;
    }

    const randomIndex = emptyIndices[Math.floor(Math.random() * emptyIndices.length)];
    executeMove(randomIndex, "O");
  };

  const executeMove = (idx: number, symbol: "X" | "O") => {
    if (board[idx] !== null || winnerInfo) return;
    const nextBoard = [...board];
    nextBoard[idx] = symbol;
    setBoard(nextBoard);
    setIsXNext(symbol === "X" ? false : true);

    const winCheck = calculateWinner(nextBoard);
    if (winCheck) {
      if (winCheck.winner === "X") setScores((prev) => ({ ...prev, x: prev.x + 1 }));
      else if (winCheck.winner === "O") setScores((prev) => ({ ...prev, o: prev.o + 1 }));
      else if (winCheck.winner === "draw") setScores((prev) => ({ ...prev, draws: prev.draws + 1 }));
    }
  };

  const handleClickSquare = (idx: number) => {
    if (board[idx] !== null || winnerInfo) return;
    if (mode === "ai" && !isXNext) return; // wait for AI
    executeMove(idx, isXNext ? "X" : "O");
  };

  const resetBoard = () => {
    setBoard(Array(9).fill(null));
    setIsXNext(true);
  };

  return (
    <div className="space-y-6 text-center max-w-md mx-auto">
      <div className="flex items-center justify-between border-b border-white/10 pb-4">
        <div>
          <h3 className="text-xl font-black text-white text-left">❌ Tic Tac Toe</h3>
          <p className="text-xs text-slate-400 text-left">Play against AI or a friend offline</p>
        </div>
        <button
          onClick={resetBoard}
          className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition-all cursor-pointer"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>

      {/* Mode & Scores */}
      <div className="flex items-center justify-between text-xs font-semibold">
        <div className="flex items-center gap-1 bg-white/5 p-1 rounded-xl">
          <button
            onClick={() => { setMode("ai"); resetBoard(); }}
            className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${mode === "ai" ? "bg-indigo-600 text-white font-bold" : "text-slate-400"}`}
          >
            vs AI
          </button>
          <button
            onClick={() => { setMode("pvp"); resetBoard(); }}
            className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${mode === "pvp" ? "bg-indigo-600 text-white font-bold" : "text-slate-400"}`}
          >
            2-Player
          </button>
        </div>

        <div className="flex items-center gap-3 text-slate-300 font-mono">
          <span className="text-blue-400 font-bold">X: {scores.x}</span>
          <span className="text-rose-400 font-bold">O: {scores.o}</span>
          <span className="text-slate-500">Ties: {scores.draws}</span>
        </div>
      </div>

      {/* Status banner */}
      <div className="text-sm font-bold text-white min-h-[24px]">
        {winnerInfo ? (
          winnerInfo.winner === "draw" ? (
            <span className="text-amber-400">It's a Draw! 🤝</span>
          ) : (
            <span className={winnerInfo.winner === "X" ? "text-blue-400" : "text-rose-400"}>
              Player {winnerInfo.winner} Wins! 🎉
            </span>
          )
        ) : (
          <span>Current Turn: <strong className={isXNext ? "text-blue-400" : "text-rose-400"}>{isXNext ? "X" : "O"}</strong></span>
        )}
      </div>

      {/* 3x3 Grid */}
      <div className="grid grid-cols-3 gap-3 w-64 h-64 mx-auto">
        {board.map((cell, idx) => {
          const isWinningCell = winnerInfo?.line?.includes(idx);
          return (
            <button
              key={idx}
              onClick={() => handleClickSquare(idx)}
              className={`rounded-2xl border text-3xl font-black flex items-center justify-center transition-all cursor-pointer ${
                isWinningCell
                  ? "bg-emerald-500/30 border-emerald-400 text-emerald-300 scale-105"
                  : cell === "X"
                  ? "bg-blue-500/10 border-blue-500/30 text-blue-400"
                  : cell === "O"
                  ? "bg-rose-500/10 border-rose-500/30 text-rose-400"
                  : "bg-white/5 border-white/10 hover:bg-white/10"
              }`}
            >
              {cell}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ====================================================================
   3. ROCK PAPER SCISSORS GAME
   ==================================================================== */
export function RockPaperScissorsGame() {
  const choices = [
    { id: "rock", name: "Rock", icon: "🪨" },
    { id: "paper", name: "Paper", icon: "📄" },
    { id: "scissors", name: "Scissors", icon: "✂️" },
  ];

  const [playerChoice, setPlayerChoice] = useState<string | null>(null);
  const [computerChoice, setComputerChoice] = useState<string | null>(null);
  const [result, setResult] = useState<"win" | "lose" | "draw" | null>(null);
  const [score, setScore] = useState({ wins: 0, losses: 0, draws: 0, streak: 0 });

  const handlePlay = (choiceId: string) => {
    const compIndex = Math.floor(Math.random() * 3);
    const compChoice = choices[compIndex].id;

    setPlayerChoice(choiceId);
    setComputerChoice(compChoice);

    if (choiceId === compChoice) {
      setResult("draw");
      setScore((prev) => ({ ...prev, draws: prev.draws + 1, streak: 0 }));
    } else if (
      (choiceId === "rock" && compChoice === "scissors") ||
      (choiceId === "paper" && compChoice === "rock") ||
      (choiceId === "scissors" && compChoice === "paper")
    ) {
      setResult("win");
      setScore((prev) => ({ ...prev, wins: prev.wins + 1, streak: prev.streak + 1 }));
    } else {
      setResult("lose");
      setScore((prev) => ({ ...prev, losses: prev.losses + 1, streak: 0 }));
    }
  };

  return (
    <div className="space-y-6 text-center max-w-md mx-auto">
      <div className="flex items-center justify-between border-b border-white/10 pb-4">
        <div className="text-left">
          <h3 className="text-xl font-black text-white">✂️ Rock Paper Scissors</h3>
          <p className="text-xs text-slate-400">Compete against computer offline</p>
        </div>
        <div className="flex items-center gap-1.5 bg-amber-500/10 border border-amber-500/20 px-3 py-1 rounded-full text-amber-400 text-xs font-bold">
          <Flame className="w-4 h-4" />
          <span>Streak: {score.streak}</span>
        </div>
      </div>

      {/* Score tally */}
      <div className="flex justify-center gap-6 text-xs font-mono">
        <span className="text-emerald-400 font-bold">Wins: {score.wins}</span>
        <span className="text-rose-400 font-bold">Losses: {score.losses}</span>
        <span className="text-slate-400">Draws: {score.draws}</span>
      </div>

      {/* Battle Arena */}
      <div className="bg-white/5 border border-white/10 rounded-3xl p-6 flex items-center justify-around">
        <div className="space-y-2">
          <div className="text-xs text-slate-400 uppercase font-mono">You</div>
          <div className="text-5xl">{playerChoice ? choices.find((c) => c.id === playerChoice)?.icon : "❓"}</div>
        </div>

        <div className="text-xl font-black text-slate-500">VS</div>

        <div className="space-y-2">
          <div className="text-xs text-slate-400 uppercase font-mono">Computer</div>
          <div className="text-5xl">{computerChoice ? choices.find((c) => c.id === computerChoice)?.icon : "❓"}</div>
        </div>
      </div>

      {/* Result Announcement */}
      {result && (
        <div className={`p-3 rounded-2xl border text-sm font-bold ${
          result === "win"
            ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-300"
            : result === "lose"
            ? "bg-rose-500/20 border-rose-500/40 text-rose-300"
            : "bg-amber-500/20 border-amber-500/40 text-amber-300"
        }`}>
          {result === "win" && "🎉 You Win!"}
          {result === "lose" && "💻 Computer Wins!"}
          {result === "draw" && "🤝 It's a Draw!"}
        </div>
      )}

      {/* Choices Buttons */}
      <div className="flex justify-center gap-4">
        {choices.map((c) => (
          <button
            key={c.id}
            onClick={() => handlePlay(c.id)}
            className="px-5 py-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-indigo-500/50 text-2xl flex flex-col items-center gap-1 transition-all cursor-pointer hover:scale-105 active:scale-95"
          >
            <span>{c.icon}</span>
            <span className="text-[10px] font-bold text-slate-300">{c.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

/* ====================================================================
   4. HANGMAN GAME
   ==================================================================== */
export function HangmanGame() {
  const [selectedCat, setSelectedCat] = useState<Category | "All">("All");
  const [selectedDiff, setSelectedDiff] = useState<Difficulty | "All">("All");
  const [stats, setStats] = useState(() => loadHangmanStats());
  const [isOnline, setIsOnline] = useState(() => (typeof navigator !== "undefined" ? navigator.onLine : true));
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const filteredTerms = HANGMAN_TERMS.filter((item) => {
    const matchCat = selectedCat === "All" || item.category === selectedCat;
    const matchDiff = selectedDiff === "All" || item.difficulty === selectedDiff;
    return matchCat && matchDiff;
  });

  const getRandomTerm = (list: typeof HANGMAN_TERMS) => {
    const pool = list.length > 0 ? list : HANGMAN_TERMS;
    return pool[Math.floor(Math.random() * pool.length)];
  };

  const [currentTermObj, setCurrentTermObj] = useState(() => getRandomTerm(filteredTerms));
  const [guessedLetters, setGuessedLetters] = useState<Set<string>>(new Set());
  const [showHint, setShowHint] = useState<boolean>(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setToastMsg("✓ Content Updated: New coding questions and programming terms available.");
      setTimeout(() => setToastMsg(null), 4000);
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const word = currentTermObj.word.toUpperCase();
  const maxLives = 6;

  const lettersOnly = word.split("").filter((char) => /[A-Z]/.test(char));
  const wrongGuesses = Array.from(guessedLetters).filter((letter) => !word.includes(letter));
  const remainingLives = Math.max(0, maxLives - wrongGuesses.length);

  const isWon = lettersOnly.length > 0 && lettersOnly.every((letter) => guessedLetters.has(letter));
  const isLost = remainingLives <= 0;

  useEffect(() => {
    if (isWon) {
      const newStats = {
        ...stats,
        wins: stats.wins + 1,
        currentStreak: stats.currentStreak + 1,
        bestStreak: Math.max(stats.bestStreak, stats.currentStreak + 1),
        totalGames: stats.totalGames + 1
      };
      setStats(newStats);
      saveHangmanStats(newStats);
    } else if (isLost) {
      const newStats = {
        ...stats,
        losses: stats.losses + 1,
        currentStreak: 0,
        totalGames: stats.totalGames + 1
      };
      setStats(newStats);
      saveHangmanStats(newStats);
    }
  }, [isWon, isLost]);

  const handleGuess = (letter: string) => {
    if (guessedLetters.has(letter) || isWon || isLost) return;
    const next = new Set(guessedLetters);
    next.add(letter);
    setGuessedLetters(next);
  };

  const startNextWord = () => {
    setCurrentTermObj(getRandomTerm(filteredTerms));
    setGuessedLetters(new Set());
    setShowHint(false);
  };

  const handleCatChange = (cat: Category | "All") => {
    setSelectedCat(cat);
    const newPool = HANGMAN_TERMS.filter(
      (item) => (cat === "All" || item.category === cat) && (selectedDiff === "All" || item.difficulty === selectedDiff)
    );
    setCurrentTermObj(getRandomTerm(newPool));
    setGuessedLetters(new Set());
    setShowHint(false);
  };

  const handleDiffChange = (diff: Difficulty | "All") => {
    setSelectedDiff(diff);
    const newPool = HANGMAN_TERMS.filter(
      (item) => (selectedCat === "All" || item.category === selectedCat) && (diff === "All" || item.difficulty === diff)
    );
    setCurrentTermObj(getRandomTerm(newPool));
    setGuessedLetters(new Set());
    setShowHint(false);
  };

  return (
    <div className="space-y-5 text-center max-w-xl mx-auto">
      {toastMsg && (
        <div className="p-3 bg-emerald-500/20 border border-emerald-500/40 rounded-2xl text-emerald-300 font-bold text-xs flex items-center justify-between">
          <span>{toastMsg}</span>
          <span className="text-[10px] font-mono text-emerald-400">v{CONTENT_VERSION}</span>
        </div>
      )}

      <div className="flex items-center justify-between text-xs px-1">
        <div className="flex items-center gap-1.5 font-mono">
          {isOnline ? (
            <span className="flex items-center gap-1 text-emerald-400 font-bold">
              <Wifi className="w-3.5 h-3.5" /> 🟢 Online
            </span>
          ) : (
            <span className="flex items-center gap-1 text-amber-400 font-bold">
              <WifiOff className="w-3.5 h-3.5" /> 📴 Offline Mode
            </span>
          )}
        </div>
        <div className="text-[11px] text-slate-400 font-mono">
          Bank: <strong className="text-white">{HANGMAN_TERMS.length}</strong> terms
        </div>
      </div>

      <div className="flex items-center justify-between border-b border-white/10 pb-3">
        <div className="text-left">
          <h3 className="text-lg sm:text-xl font-black text-white flex items-center gap-2">
            🔤 Programming Hangman
          </h3>
          <p className="text-xs text-slate-400">Expanded tech term bank with offline persistence</p>
        </div>
        <button
          onClick={startNextWord}
          className="p-2.5 rounded-2xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition-all cursor-pointer flex items-center gap-1 text-xs font-bold"
        >
          <RotateCcw className="w-4 h-4" />
          <span className="hidden sm:inline">Next Word</span>
        </button>
      </div>

      <div className="grid grid-cols-4 gap-2 bg-white/5 border border-white/10 rounded-2xl p-2 text-xs font-mono">
        <div>
          <div className="text-[10px] text-slate-400 uppercase">Wins</div>
          <div className="text-emerald-400 font-bold text-sm">{stats.wins}</div>
        </div>
        <div>
          <div className="text-[10px] text-slate-400 uppercase">Losses</div>
          <div className="text-rose-400 font-bold text-sm">{stats.losses}</div>
        </div>
        <div>
          <div className="text-[10px] text-slate-400 uppercase">Streak</div>
          <div className="text-amber-400 font-bold text-sm">{stats.currentStreak} 🔥</div>
        </div>
        <div>
          <div className="text-[10px] text-slate-400 uppercase">Best</div>
          <div className="text-indigo-400 font-bold text-sm">{stats.bestStreak} 🏆</div>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-1.5 flex-wrap">
          <Filter className="w-3.5 h-3.5 text-indigo-400" />
          <span className="text-slate-400 font-bold">Cat:</span>
          {(["All", "Programming Basics", "C Programming", "Python", "Web Development", "Computer Science", "AI / ML"] as const).map(
            (cat) => (
              <button
                key={cat}
                onClick={() => handleCatChange(cat)}
                className={`px-2 py-1 rounded-lg transition-all text-[10px] font-bold cursor-pointer ${
                  selectedCat === cat ? "bg-indigo-600 text-white shadow-md" : "bg-white/5 hover:bg-white/10 text-slate-400"
                }`}
              >
                {cat}
              </button>
            )
          )}
        </div>

        <div className="flex items-center gap-1.5">
          <span className="text-slate-400 font-bold">Diff:</span>
          {(["All", "Easy", "Medium", "Hard"] as const).map((diff) => (
            <button
              key={diff}
              onClick={() => handleDiffChange(diff)}
              className={`px-2 py-0.5 rounded-md transition-all text-[10px] font-bold cursor-pointer ${
                selectedDiff === diff ? "bg-amber-500 text-slate-950 font-extrabold" : "bg-white/5 hover:bg-white/10 text-slate-400"
              }`}
            >
              {diff}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between text-xs px-2 pt-1">
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-1 rounded-full bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 font-bold text-[11px]">
            {currentTermObj.category}
          </span>
          <span className="px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/30 text-amber-300 font-bold text-[10px]">
            {currentTermObj.difficulty}
          </span>
        </div>

        <div className="flex items-center gap-1">
          {Array.from({ length: maxLives }).map((_, i) => (
            <span key={i} className={i < remainingLives ? "text-rose-400 text-sm" : "text-slate-700 text-sm opacity-40"}>
              ❤️
            </span>
          ))}
        </div>
      </div>

      <div className="p-4 bg-white/5 border border-white/10 rounded-3xl space-y-3">
        <div className="flex flex-wrap justify-center gap-2 my-2">
          {word.split("").map((char, idx) => {
            if (char === " ") {
              return <div key={idx} className="w-6 h-12" />;
            }
            if (!/[A-Z]/.test(char)) {
              return (
                <div key={idx} className="w-8 h-12 flex items-center justify-center text-xl font-mono font-bold text-indigo-400">
                  {char}
                </div>
              );
            }
            const isRevealed = guessedLetters.has(char) || isLost;
            return (
              <div
                key={idx}
                className={`w-9 h-11 sm:w-11 sm:h-13 rounded-2xl border flex items-center justify-center text-lg sm:text-xl font-mono font-black transition-all shadow-md ${
                  isRevealed
                    ? isWon
                      ? "bg-emerald-500/20 border-emerald-500 text-emerald-300 shadow-emerald-500/20"
                      : "bg-indigo-600/30 border-indigo-400 text-white"
                    : "bg-white/5 border-white/15 text-transparent"
                }`}
              >
                {isRevealed ? char : "_"}
              </div>
            );
          })}
        </div>

        <div className="pt-1">
          <button
            onClick={() => setShowHint(true)}
            disabled={showHint}
            className="text-xs text-amber-400 hover:text-amber-300 font-semibold cursor-pointer disabled:opacity-80 flex items-center justify-center gap-1 mx-auto"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>{showHint ? `💡 Hint: ${currentTermObj.hint}` : "Click to Show Hint"}</span>
          </button>
        </div>
      </div>

      {isWon && (
        <div className="p-4 bg-emerald-500/20 border border-emerald-500/40 rounded-2xl text-emerald-300 font-bold text-sm space-y-2">
          <div>🎉 Solved! "{word}"</div>
          <p className="text-xs text-slate-300 font-normal">{currentTermObj.hint}</p>
          <button
            onClick={startNextWord}
            className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs cursor-pointer shadow-md"
          >
            Play Next Term →
          </button>
        </div>
      )}
      {isLost && (
        <div className="p-4 bg-rose-500/20 border border-rose-500/40 rounded-2xl text-rose-300 font-bold text-sm space-y-2">
          <div>☠️ Out of Lives! The term was "{word}"</div>
          <p className="text-xs text-slate-300 font-normal">{currentTermObj.hint}</p>
          <button
            onClick={startNextWord}
            className="px-4 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs cursor-pointer shadow-md"
          >
            Try Another Term
          </button>
        </div>
      )}

      <div className="grid grid-cols-7 gap-1.5 pt-2">
        {"ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("").map((letter) => {
          const isGuessed = guessedLetters.has(letter);
          const isCorrect = isGuessed && word.includes(letter);
          const isWrong = isGuessed && !word.includes(letter);

          return (
            <button
              key={letter}
              onClick={() => handleGuess(letter)}
              disabled={isGuessed || isWon || isLost}
              className={`p-2 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer ${
                isCorrect
                  ? "bg-emerald-600 text-white border border-emerald-400"
                  : isWrong
                  ? "bg-rose-950/80 text-slate-500 border border-rose-900/50"
                  : "bg-white/5 hover:bg-white/10 text-white border border-white/10 hover:border-indigo-500/50"
              }`}
            >
              {letter}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ====================================================================
   5. MEMORY CARD GAME
   ==================================================================== */
const ICONS = ["🐍", "☕", "⚛️", "💻", "🌐", "⚡", "🚀", "🧠"];

export function MemoryCardGame() {
  const [cards, setCards] = useState<{ id: number; icon: string; flipped: boolean; matched: boolean }[]>([]);
  const [flippedIndices, setFlippedIndices] = useState<number[]>([]);
  const [moves, setMoves] = useState<number>(0);
  const [isWon, setIsWon] = useState<boolean>(false);

  const initGame = () => {
    const deck = [...ICONS, ...ICONS]
      .sort(() => Math.random() - 0.5)
      .map((icon, id) => ({ id, icon, flipped: false, matched: false }));
    setCards(deck);
    setFlippedIndices([]);
    setMoves(0);
    setIsWon(false);
  };

  useEffect(() => {
    initGame();
  }, []);

  const handleCardClick = (idx: number) => {
    if (cards[idx].flipped || cards[idx].matched || flippedIndices.length >= 2) return;

    const newCards = [...cards];
    newCards[idx].flipped = true;
    setCards(newCards);

    const newFlipped = [...flippedIndices, idx];
    setFlippedIndices(newFlipped);

    if (newFlipped.length === 2) {
      setMoves((m) => m + 1);
      const [first, second] = newFlipped;
      if (newCards[first].icon === newCards[second].icon) {
        newCards[first].matched = true;
        newCards[second].matched = true;
        setCards(newCards);
        setFlippedIndices([]);

        if (newCards.every((c) => c.matched)) {
          setIsWon(true);
        }
      } else {
        setTimeout(() => {
          newCards[first].flipped = false;
          newCards[second].flipped = false;
          setCards(newCards);
          setFlippedIndices([]);
        }, 800);
      }
    }
  };

  return (
    <div className="space-y-6 text-center max-w-md mx-auto">
      <div className="flex items-center justify-between border-b border-white/10 pb-4">
        <div className="text-left">
          <h3 className="text-xl font-black text-white">🧠 Memory Game</h3>
          <p className="text-xs text-slate-400">Match icon pairs in minimum moves</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs font-mono text-indigo-400 font-bold">Moves: {moves}</span>
          <button
            onClick={initGame}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition-all cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {isWon && (
        <div className="p-4 bg-emerald-500/20 border border-emerald-500/40 rounded-3xl text-emerald-300 font-bold text-sm">
          🎉 Awesome! Cleared in {moves} moves!
        </div>
      )}

      <div className="grid grid-cols-4 gap-3 w-72 h-72 mx-auto">
        {cards.map((card, idx) => (
          <button
            key={card.id}
            onClick={() => handleCardClick(idx)}
            className={`rounded-2xl border text-3xl flex items-center justify-center transition-all cursor-pointer ${
              card.flipped || card.matched
                ? "bg-indigo-600/30 border-indigo-400 text-white rotate-0"
                : "bg-white/5 border-white/10 hover:bg-white/10 text-transparent"
            }`}
          >
            {card.flipped || card.matched ? card.icon : "❓"}
          </button>
        ))}
      </div>
    </div>
  );
}

/* ====================================================================
   6. MATH QUIZ GAME
   ==================================================================== */
export function MathQuizGame() {
  const generateProblem = () => {
    const ops = ["+", "-", "*"];
    const op = ops[Math.floor(Math.random() * ops.length)];
    let a = Math.floor(Math.random() * 20) + 1;
    let b = Math.floor(Math.random() * 20) + 1;
    let ans = 0;
    if (op === "+") ans = a + b;
    else if (op === "-") {
      if (a < b) [a, b] = [b, a];
      ans = a - b;
    } else if (op === "*") {
      a = Math.floor(Math.random() * 12) + 1;
      b = Math.floor(Math.random() * 10) + 1;
      ans = a * b;
    }
    return { problemStr: `${a} ${op} ${b}`, answer: ans };
  };

  const [currentProb, setCurrentProb] = useState(generateProblem);
  const [userAns, setUserAns] = useState("");
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [feedback, setFeedback] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseInt(userAns, 10);
    if (isNaN(val)) return;

    if (val === currentProb.answer) {
      setScore((s) => s + 10);
      setStreak((st) => st + 1);
      setFeedback("Correct! +10 pts");
    } else {
      setStreak(0);
      setFeedback(`Wrong! Ans was ${currentProb.answer}`);
    }

    setUserAns("");
    setCurrentProb(generateProblem());
  };

  return (
    <div className="space-y-6 text-center max-w-sm mx-auto">
      <div className="flex items-center justify-between border-b border-white/10 pb-4">
        <div className="text-left">
          <h3 className="text-xl font-black text-white">⚡ Math Speed Quiz</h3>
          <p className="text-xs text-slate-400">Solve mental math problems fast</p>
        </div>
        <div className="text-right">
          <div className="text-xs font-bold text-emerald-400">Score: {score}</div>
          <div className="text-[10px] text-amber-400 font-mono">Streak: {streak}</div>
        </div>
      </div>

      <div className="p-6 bg-white/5 border border-white/10 rounded-3xl space-y-4">
        <div className="text-4xl font-black font-mono text-indigo-300">
          {currentProb.problemStr} = ?
        </div>

        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            type="number"
            autoFocus
            value={userAns}
            onChange={(e) => setUserAns(e.target.value)}
            placeholder="Answer"
            className="w-full bg-white/5 border border-white/15 rounded-2xl px-4 py-3 text-center text-lg font-mono text-white focus:outline-none focus:border-indigo-500"
          />
          <button
            type="submit"
            className="px-5 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shrink-0 cursor-pointer"
          >
            Submit
          </button>
        </form>

        {feedback && (
          <div className="text-xs font-bold text-indigo-300">{feedback}</div>
        )}
      </div>
    </div>
  );
}

/* ====================================================================
   7. CODING QUIZ GAME
   ==================================================================== */
export function CodingQuizGame() {
  const [selectedCat, setSelectedCat] = useState<Category | "All">("All");
  const [selectedDiff, setSelectedDiff] = useState<Difficulty | "All">("All");
  const [quizStarted, setQuizStarted] = useState(false);
  const [activeQuestions, setActiveQuestions] = useState<typeof ALL_QUIZ_QUESTIONS>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [stats, setStats] = useState(() => loadQuizStats());
  const [isOnline, setIsOnline] = useState(() => (typeof navigator !== "undefined" ? navigator.onLine : true));
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setToastMsg("✓ Content Updated: New coding questions and programming terms available.");
      setTimeout(() => setToastMsg(null), 4000);
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const startQuiz = () => {
    const filtered = ALL_QUIZ_QUESTIONS.filter((q) => {
      const catMatch = selectedCat === "All" || q.category === selectedCat;
      const diffMatch = selectedDiff === "All" || q.difficulty === selectedDiff;
      return catMatch && diffMatch;
    });

    const pool = filtered.length >= 5 ? filtered : ALL_QUIZ_QUESTIONS;
    const shuffled = [...pool].sort(() => Math.random() - 0.5).slice(0, 10);

    setActiveQuestions(shuffled);
    setCurrentIndex(0);
    setSelectedOption(null);
    setScore(0);
    setIsFinished(false);
    setQuizStarted(true);
  };

  const currentQ = activeQuestions[currentIndex];

  const handleSelectOption = (idx: number) => {
    if (selectedOption !== null) return;
    setSelectedOption(idx);
    if (idx === currentQ.answer) {
      setScore((s) => s + 1);
    }
  };

  const handleNext = () => {
    if (currentIndex + 1 < activeQuestions.length) {
      setCurrentIndex((c) => c + 1);
      setSelectedOption(null);
    } else {
      finishQuiz();
    }
  };

  const finishQuiz = () => {
    setIsFinished(true);
    const accuracy = Math.round((score / activeQuestions.length) * 100);

    const updatedStats = { ...stats };
    updatedStats.questionsAttempted += activeQuestions.length;
    updatedStats.correctAnswers += score;
    updatedStats.incorrectAnswers += activeQuestions.length - score;
    updatedStats.bestScorePercent = Math.max(updatedStats.bestScorePercent, accuracy);

    if (currentQ) {
      const catKey = currentQ.category;
      if (!updatedStats.categoryPerformance[catKey]) {
        updatedStats.categoryPerformance[catKey] = { total: 0, correct: 0 };
      }
      updatedStats.categoryPerformance[catKey].total += activeQuestions.length;
      updatedStats.categoryPerformance[catKey].correct += score;
    }

    setStats(updatedStats);
    saveQuizStats(updatedStats);
  };

  return (
    <div className="space-y-6 max-w-lg mx-auto">
      {toastMsg && (
        <div className="p-3 bg-emerald-500/20 border border-emerald-500/40 rounded-2xl text-emerald-300 font-bold text-xs flex items-center justify-between">
          <span>{toastMsg}</span>
          <span className="text-[10px] font-mono text-emerald-400">v{CONTENT_VERSION}</span>
        </div>
      )}

      <div className="flex items-center justify-between text-xs px-1">
        <div className="flex items-center gap-1.5 font-mono">
          {isOnline ? (
            <span className="flex items-center gap-1 text-emerald-400 font-bold">
              <Wifi className="w-3.5 h-3.5" /> 🟢 Online
            </span>
          ) : (
            <span className="flex items-center gap-1 text-amber-400 font-bold">
              <WifiOff className="w-3.5 h-3.5" /> 📴 Offline Mode
            </span>
          )}
        </div>
        <div className="text-[11px] text-slate-400 font-mono">
          Bank: <strong className="text-white">{ALL_QUIZ_QUESTIONS.length}</strong> questions
        </div>
      </div>

      <div className="flex items-center justify-between border-b border-white/10 pb-3">
        <div className="text-left">
          <h3 className="text-xl font-black text-white">💻 Offline Coding Quiz</h3>
          <p className="text-xs text-slate-400">100+ CS questions with category analytics & persistence</p>
        </div>
        {quizStarted && (
          <button
            onClick={() => setQuizStarted(false)}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition-all cursor-pointer text-xs font-bold"
          >
            Filters
          </button>
        )}
      </div>

      {!quizStarted ? (
        <div className="space-y-5 p-5 bg-white/5 border border-white/10 rounded-3xl text-left">
          <div className="space-y-2">
            <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
              <Filter className="w-4 h-4 text-indigo-400" />
              <span>Select Category</span>
            </h4>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {(["All", "C Programming", "Python", "Web Development", "Computer Science", "AI / ML"] as const).map(
                (cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCat(cat)}
                    className={`p-2.5 rounded-xl border transition-all text-left font-bold cursor-pointer ${
                      selectedCat === cat
                        ? "bg-indigo-600 border-indigo-500 text-white shadow-lg"
                        : "bg-white/5 border-white/10 text-slate-300 hover:bg-white/10"
                    }`}
                  >
                    {cat}
                  </button>
                )
              )}
            </div>
          </div>

          <div className="space-y-2 pt-2 border-t border-white/10">
            <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
              <BarChart2 className="w-4 h-4 text-amber-400" />
              <span>Select Difficulty</span>
            </h4>
            <div className="flex gap-2 text-xs">
              {(["All", "Easy", "Medium", "Hard"] as const).map((diff) => (
                <button
                  key={diff}
                  onClick={() => setSelectedDiff(diff)}
                  className={`flex-1 py-2 rounded-xl border font-bold cursor-pointer transition-all ${
                    selectedDiff === diff
                      ? "bg-amber-500 border-amber-400 text-slate-950 font-black"
                      : "bg-white/5 border-white/10 text-slate-300 hover:bg-white/10"
                  }`}
                >
                  {diff}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white/5 rounded-2xl p-3 border border-white/10 flex items-center justify-around text-center text-xs font-mono">
            <div>
              <div className="text-[10px] text-slate-400">Total Solved</div>
              <div className="text-white font-bold text-sm">{stats.questionsAttempted}</div>
            </div>
            <div>
              <div className="text-[10px] text-slate-400">Correct</div>
              <div className="text-emerald-400 font-bold text-sm">{stats.correctAnswers}</div>
            </div>
            <div>
              <div className="text-[10px] text-slate-400">Best Score</div>
              <div className="text-amber-400 font-bold text-sm">{stats.bestScorePercent}%</div>
            </div>
          </div>

          <button
            onClick={startQuiz}
            className="w-full py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-sm shadow-xl cursor-pointer transition-all hover:scale-[1.02] flex items-center justify-center gap-2"
          >
            <Play className="w-4 h-4 fill-white" />
            <span>Start 10-Question Quiz</span>
          </button>
        </div>
      ) : !isFinished ? (
        <div className="space-y-4 text-left">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
              <span>Question {currentIndex + 1} of {activeQuestions.length}</span>
              <span className="text-indigo-300 font-bold">Score: {score}</span>
            </div>
            <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-300"
                style={{ width: `${((currentIndex + 1) / activeQuestions.length) * 100}%` }}
              />
            </div>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 text-[11px] font-bold">
              {currentQ.category}
            </span>
            <span className="px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/30 text-amber-300 text-[10px] font-bold">
              {currentQ.difficulty}
            </span>
          </div>

          <div className="p-4 bg-white/5 border border-white/15 rounded-3xl space-y-4">
            <h4 className="text-sm sm:text-base font-bold text-white leading-relaxed">
              {currentQ.question}
            </h4>

            <div className="space-y-2">
              {currentQ.options.map((opt, idx) => {
                const isSelected = selectedOption === idx;
                const isCorrect = idx === currentQ.answer;
                let btnStyle = "bg-white/5 border-white/10 text-slate-200 hover:bg-white/10";

                if (selectedOption !== null) {
                  if (isCorrect) btnStyle = "bg-emerald-600 border-emerald-500 text-white font-bold shadow-lg shadow-emerald-500/20";
                  else if (isSelected) btnStyle = "bg-rose-600 border-rose-500 text-white font-bold shadow-lg shadow-rose-500/20";
                }

                return (
                  <button
                    key={idx}
                    onClick={() => handleSelectOption(idx)}
                    disabled={selectedOption !== null}
                    className={`w-full p-3.5 rounded-2xl border text-left text-xs sm:text-sm transition-all cursor-pointer flex items-start gap-2.5 ${btnStyle}`}
                  >
                    <span className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                      {String.fromCharCode(65 + idx)}
                    </span>
                    <span className="leading-snug">{opt}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {selectedOption !== null && (
            <div className="space-y-3 pt-1">
              <div className="p-3.5 bg-indigo-950/50 border border-indigo-500/30 rounded-2xl text-xs space-y-1">
                <div className="font-bold text-indigo-300 flex items-center gap-1">
                  <Info className="w-3.5 h-3.5 text-indigo-400" /> Explanation:
                </div>
                <p className="text-slate-300 leading-relaxed">
                  {currentQ.explanation}
                </p>
              </div>

              <button
                onClick={handleNext}
                className="w-full py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs cursor-pointer shadow-xl transition-all flex items-center justify-center gap-2"
              >
                <span>{currentIndex + 1 === activeQuestions.length ? "Finish & View Results" : "Next Question"}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="p-6 bg-white/5 border border-white/15 rounded-3xl text-center space-y-6">
          <div className="space-y-2">
            <Trophy className="w-14 h-14 text-amber-400 mx-auto" />
            <h4 className="text-2xl font-black text-white">QUIZ COMPLETE</h4>
            <p className="text-xs text-slate-400">Performance results & stats saved offline</p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono">
            <div className="p-3 bg-white/5 rounded-2xl border border-white/10">
              <div className="text-[10px] text-slate-400 uppercase">Score</div>
              <div className="text-xl font-bold text-white">{score} / {activeQuestions.length}</div>
            </div>
            <div className="p-3 bg-white/5 rounded-2xl border border-white/10">
              <div className="text-[10px] text-slate-400 uppercase">Accuracy</div>
              <div className="text-xl font-bold text-emerald-400">
                {Math.round((score / activeQuestions.length) * 100)}%
              </div>
            </div>
            <div className="p-3 bg-white/5 rounded-2xl border border-white/10">
              <div className="text-[10px] text-slate-400 uppercase">Correct</div>
              <div className="text-xl font-bold text-emerald-400">{score}</div>
            </div>
            <div className="p-3 bg-white/5 rounded-2xl border border-white/10">
              <div className="text-[10px] text-slate-400 uppercase">Best Score</div>
              <div className="text-xl font-bold text-amber-400">{stats.bestScorePercent}%</div>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              onClick={startQuiz}
              className="flex-1 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs cursor-pointer shadow-lg"
            >
              Try Again
            </button>
            <button
              onClick={() => setQuizStarted(false)}
              className="flex-1 py-3 rounded-2xl bg-white/10 hover:bg-white/15 text-slate-200 font-bold text-xs cursor-pointer border border-white/10"
            >
              Change Filters
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
