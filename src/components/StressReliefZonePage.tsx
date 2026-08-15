import React, { useState, useEffect } from "react";
import {
  Brain,
  Wifi,
  WifiOff,
  ArrowLeft,
  Play,
  Gamepad2,
  Clock,
  Sparkles,
  Zap,
  Info,
  RotateCcw,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Shield,
  Trophy
} from "lucide-react";
import ChessGame from "./ChessGame";
import {
  NumberGuessingGame,
  TicTacToeGame,
  RockPaperScissorsGame,
  HangmanGame,
  MemoryCardGame,
  MathQuizGame,
  CodingQuizGame
} from "./OfflineGames";

export type GameKey =
  | "chess"
  | "number"
  | "tictactoe"
  | "rps"
  | "hangman"
  | "memory"
  | "math"
  | "coding";

interface GameInfo {
  id: GameKey;
  name: string;
  icon: string;
  desc: string;
  difficulty: "Easy" | "Medium" | "Hard" | "Adjustable";
  playTime: string;
  isOffline: boolean;
  instructions: string;
}

const ALL_GAMES: GameInfo[] = [
  {
    id: "chess",
    name: "Chess Engine",
    icon: "♟",
    desc: "Classic 8x8 strategy chess with Player vs Player & Minimax AI bot difficulty levels.",
    difficulty: "Adjustable",
    playTime: "5–15 min",
    isOffline: true,
    instructions: "Click any piece to reveal legal move highlights. Capture the opponent's King to win. Switch between AI engine difficulty levels or play local PvP."
  },
  {
    id: "number",
    name: "Number Guessing",
    icon: "🔢",
    desc: "Deduce the secret hidden number in minimum attempts using higher & lower hints.",
    difficulty: "Easy",
    playTime: "1–3 min",
    isOffline: true,
    instructions: "Enter a number guess between 1 and 100. Follow the 'Too High' or 'Too Low' clues to find the secret number in the fewest tries."
  },
  {
    id: "tictactoe",
    name: "Tic Tac Toe",
    icon: "❌",
    desc: "Classic 3x3 strategy alignment game against offline AI or a local friend.",
    difficulty: "Easy",
    playTime: "1–2 min",
    isOffline: true,
    instructions: "Click empty grid cells to place your mark. Connect 3 in a row horizontally, vertically, or diagonally before your opponent does."
  },
  {
    id: "rps",
    name: "Rock Paper Scissors",
    icon: "✂️",
    desc: "Battle the offline computer, build your winning streak, and track game stats.",
    difficulty: "Easy",
    playTime: "1–2 min",
    isOffline: true,
    instructions: "Select Rock, Paper, or Scissors. Rock crushes Scissors, Scissors cuts Paper, Paper covers Rock. Build your highest win streak!"
  },
  {
    id: "hangman",
    name: "Programming Hangman",
    icon: "🔤",
    desc: "Guess hidden B.Tech, CS, and software engineering terms before lives run out.",
    difficulty: "Medium",
    playTime: "2–5 min",
    isOffline: true,
    instructions: "Click letters to guess the hidden technology term. You have 6 lives. Use the 'Show Hint' button if you need a clue."
  },
  {
    id: "memory",
    name: "Memory Match",
    icon: "🧠",
    desc: "Match identical tech icon pairs in minimum moves to test and sharpen focus.",
    difficulty: "Medium",
    playTime: "2–4 min",
    isOffline: true,
    instructions: "Click cards to flip them and reveal tech icons. Match all identical pairs in as few moves as possible."
  },
  {
    id: "math",
    name: "Math Challenge",
    icon: "⚡",
    desc: "Rapid mental arithmetic speed quiz to test calculation speed & accuracy.",
    difficulty: "Medium",
    playTime: "2–3 min",
    isOffline: true,
    instructions: "Solve speed addition, subtraction, and multiplication problems. Type your answer and hit Enter to earn points."
  },
  {
    id: "coding",
    name: "Coding Quiz",
    icon: "💻",
    desc: "Answer computer science & programming questions with instant feedback.",
    difficulty: "Hard",
    playTime: "3–6 min",
    isOffline: true,
    instructions: "Select the correct option for each computer science question. Read explanations to solidify your understanding and achieve a high score."
  }
];

export default function StressReliefZonePage() {
  const [activeGame, setActiveGame] = useState<GameKey | null>(null);
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [showInstructions, setShowInstructions] = useState<boolean>(true);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const selectedGameInfo = ALL_GAMES.find((g) => g.id === activeGame);

  return (
    <div id="stress-relief-zone-page" className="min-h-screen text-slate-100 bg-[#030712] pt-6 pb-20 px-3 sm:px-6 font-sans">
      <div className="max-w-6xl mx-auto space-y-6">

        {/* Top Header Card */}
        <div className="relative p-6 sm:p-8 rounded-[28px] bg-[#090d1f]/90 border border-white/15 backdrop-blur-2xl shadow-2xl overflow-hidden space-y-4">
          <div className="absolute top-0 right-0 w-80 h-80 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold">
                <Brain className="w-3.5 h-3.5 text-blue-400" />
                <span>Student Focus & Mental Refresh</span>
              </div>
              <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight flex items-center gap-3">
                <span>🧠 Stress Relief Zone</span>
              </h1>
              <p className="text-sm sm:text-base font-semibold text-blue-300">
                "Take a short break. Refresh your mind. Get back to learning."
              </p>
            </div>

            {/* Live Connection Status Badge */}
            <div className="shrink-0 pt-2 md:pt-0">
              {isOnline ? (
                <div className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs font-bold">
                  <Wifi className="w-4 h-4 text-emerald-400 shrink-0" />
                  <div>
                    <div className="text-emerald-300">🌐 Online</div>
                    <div className="text-[11px] text-emerald-400/80 font-normal">Play offline anytime to save mobile data</div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs font-bold animate-pulse">
                  <WifiOff className="w-4 h-4 text-amber-400 shrink-0" />
                  <div>
                    <div className="text-amber-300">📴 Offline Mode</div>
                    <div className="text-[11px] text-amber-400/80 font-normal">Playing offline without internet</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Offline Friendly Information Banner */}
        <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-blue-500/10 via-indigo-500/10 to-purple-500/10 border border-blue-500/20 backdrop-blur-xl flex items-start gap-3 text-xs sm:text-sm text-slate-200">
          <div className="p-2 rounded-xl bg-blue-500/20 border border-blue-500/30 text-blue-300 shrink-0 mt-0.5">
            <Zap className="w-4 h-4" />
          </div>
          <div className="space-y-1">
            <div className="font-bold text-white flex items-center gap-1.5">
              <span>💡 Offline Friendly</span>
            </div>
            <p className="text-slate-300 text-xs leading-relaxed">
              "These games are designed to work without an internet connection, helping you save mobile data."
            </p>
          </div>
        </div>

        {/* ACTIVE GAME SCREEN OR GAME CATALOG GRID */}
        {activeGame && selectedGameInfo ? (
          <div className="space-y-4">
            {/* Top Control Bar for Active Game */}
            <div className="flex flex-wrap items-center justify-between gap-3 bg-white/[0.04] p-4 rounded-2xl border border-white/10 backdrop-blur-xl">
              <button
                onClick={() => setActiveGame(null)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 hover:text-rose-200 text-xs font-bold transition-all cursor-pointer border border-rose-500/20 active:scale-95"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Exit Game</span>
              </button>

              <div className="flex items-center gap-3">
                <span className="text-2xl">{selectedGameInfo.icon}</span>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-white">{selectedGameInfo.name}</h3>
                  <div className="flex items-center gap-2 text-[11px] text-slate-400">
                    <span>Difficulty: {selectedGameInfo.difficulty}</span>
                    <span>•</span>
                    <span>Time: {selectedGameInfo.playTime}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowInstructions(!showInstructions)}
                  className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <Info className="w-3.5 h-3.5 text-indigo-400" />
                  <span>{showInstructions ? "Hide Rules" : "Rules"}</span>
                </button>
                <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[11px] font-mono font-bold flex items-center gap-1">
                  🟢 Offline Ready
                </span>
              </div>
            </div>

            {/* Instructions Box */}
            {showInstructions && (
              <div className="p-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 backdrop-blur-xl flex items-start gap-3 text-xs text-slate-200">
                <Info className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <span className="font-bold text-indigo-300">How to Play:</span>
                  <p className="text-slate-300 leading-relaxed">{selectedGameInfo.instructions}</p>
                </div>
              </div>
            )}

            {/* Render Actual Game Board Container */}
            <div className="p-4 sm:p-6 rounded-[28px] bg-white/[0.03] border border-white/15 backdrop-blur-2xl shadow-2xl">
              {activeGame === "chess" && <ChessGame />}
              {activeGame === "number" && <NumberGuessingGame />}
              {activeGame === "tictactoe" && <TicTacToeGame />}
              {activeGame === "rps" && <RockPaperScissorsGame />}
              {activeGame === "hangman" && <HangmanGame />}
              {activeGame === "memory" && <MemoryCardGame />}
              {activeGame === "math" && <MathQuizGame />}
              {activeGame === "coding" && <CodingQuizGame />}
            </div>
          </div>
        ) : (
          /* GAME CATALOG GRID */
          <div className="space-y-4">
            <div className="flex items-center justify-between px-1">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Gamepad2 className="w-5 h-5 text-indigo-400" />
                <span>Available Games ({ALL_GAMES.length})</span>
              </h2>
              <span className="text-xs font-mono text-slate-400">100% Client-Side • Zero Data Usage</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {ALL_GAMES.map((game) => (
                <div
                  key={game.id}
                  className="p-5 rounded-2xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/10 hover:border-indigo-500/30 transition-all duration-300 space-y-4 flex flex-col justify-between group shadow-xl backdrop-blur-xl"
                >
                  <div className="space-y-3">
                    {/* Icon & Status */}
                    <div className="flex items-center justify-between">
                      <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                        {game.icon}
                      </div>
                      <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-mono font-bold flex items-center gap-1">
                        🟢 Offline Ready
                      </span>
                    </div>

                    {/* Title & Desc */}
                    <div>
                      <h3 className="text-base font-bold text-white group-hover:text-indigo-300 transition-colors">
                        {game.name}
                      </h3>
                      <p className="text-xs text-slate-300 leading-relaxed mt-1 min-h-[36px]">
                        {game.desc}
                      </p>
                    </div>

                    {/* Difficulty & Play Time */}
                    <div className="pt-2 border-t border-white/5 grid grid-cols-2 gap-2 text-[11px]">
                      <div className="space-y-0.5">
                        <span className="text-slate-400 block text-[10px]">Difficulty</span>
                        <span className="font-semibold text-indigo-300">{game.difficulty}</span>
                      </div>
                      <div className="space-y-0.5">
                        <span className="text-slate-400 block text-[10px]">Play time</span>
                        <span className="font-semibold text-slate-200 flex items-center gap-1">
                          <Clock className="w-3 h-3 text-slate-400" />
                          <span>{game.playTime}</span>
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Play Now Button */}
                  <button
                    onClick={() => setActiveGame(game.id)}
                    className="w-full min-h-[44px] flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition-all shadow-lg shadow-indigo-600/20 active:scale-95 cursor-pointer mt-2"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>PLAY NOW</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
