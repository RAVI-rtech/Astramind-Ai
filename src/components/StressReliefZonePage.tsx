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
    <div id="stress-relief-zone-page" className="relative min-h-full w-full bg-[#0d0d0e] text-[#fcfcfc] py-8 px-4 sm:px-6 lg:px-8 overflow-hidden font-sans">
      {/* Variation 3 Ambient Studio Orb Background */}
      <div className="studio-orb pointer-events-none" />

      <div className="relative z-10 max-w-6xl mx-auto space-y-8">

        {/* Top Header Card */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/[0.06]">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-mono-studio tracking-wider bg-[#a78bfa]/10 border border-[#a78bfa]/25 text-[#a78bfa] mb-3">
              <Brain className="w-3.5 h-3.5" />
              <span>Student Focus &amp; Mental Refresh</span>
            </div>
            <h1 className="font-serif-studio text-4xl sm:text-5xl font-medium text-white tracking-tight leading-tight">
              Stress Relief Zone
            </h1>
            <p className="text-sm text-white/50 mt-1 font-normal tracking-wide">
              "Take a short break. Refresh your mind. Get back to learning."
            </p>
          </div>

          {/* Live Connection Status Badge */}
          <div className="shrink-0">
            {isOnline ? (
              <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-[#151517] border border-white/[0.08] text-emerald-400 text-xs font-semibold shadow-md">
                <Wifi className="w-4 h-4 shrink-0" />
                <span>Online • 100% Client-Side</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-[#151517] border border-amber-500/30 text-amber-300 text-xs font-semibold shadow-md animate-pulse">
                <WifiOff className="w-4 h-4 shrink-0" />
                <span>Offline Mode Active</span>
              </div>
            )}
          </div>
        </div>

        {/* Offline Friendly Information Banner */}
        <div className="p-4 sm:p-5 rounded-[22px] bg-[#151517] border border-white/[0.06] shadow-lg flex items-start gap-3.5 text-xs sm:text-sm">
          <div className="p-2 rounded-xl bg-[#a78bfa]/10 border border-[#a78bfa]/20 text-[#a78bfa] shrink-0 mt-0.5">
            <Zap className="w-4 h-4" />
          </div>
          <div className="space-y-0.5">
            <div className="font-semibold text-white flex items-center gap-1.5">
              <span>Offline Friendly Study Breaks</span>
            </div>
            <p className="text-white/60 text-xs leading-relaxed">
              These games are designed to run completely offline without an internet connection, helping you unwind and save mobile data.
            </p>
          </div>
        </div>

        {/* ACTIVE GAME SCREEN OR GAME CATALOG GRID */}
        {activeGame && selectedGameInfo ? (
          <div className="space-y-5">
            {/* Top Control Bar for Active Game */}
            <div className="flex flex-wrap items-center justify-between gap-3 bg-[#151517] p-4 sm:p-5 rounded-[24px] border border-white/[0.06] shadow-xl">
              <button
                onClick={() => setActiveGame(null)}
                className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/[0.04] hover:bg-white/[0.08] text-white/80 hover:text-white text-xs font-semibold transition-all cursor-pointer border border-white/[0.08]"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Exit Game</span>
              </button>

              <div className="flex items-center gap-3">
                <span className="text-2xl">{selectedGameInfo.icon}</span>
                <div>
                  <h3 className="font-serif-studio text-lg font-medium text-white">{selectedGameInfo.name}</h3>
                  <div className="flex items-center gap-2 text-[11px] font-mono-studio text-white/40">
                    <span>Difficulty: {selectedGameInfo.difficulty}</span>
                    <span>•</span>
                    <span>Time: {selectedGameInfo.playTime}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowInstructions(!showInstructions)}
                  className="px-3 py-1.5 rounded-full bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-white/70 hover:text-white text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <Info className="w-3.5 h-3.5 text-[#a78bfa]" />
                  <span>{showInstructions ? "Hide Rules" : "Rules"}</span>
                </button>
                <span className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[11px] font-mono-studio">
                  Offline Ready
                </span>
              </div>
            </div>

            {/* Instructions Box */}
            {showInstructions && (
              <div className="p-4 sm:p-5 rounded-[22px] bg-[#151517] border border-white/[0.06] shadow-md flex items-start gap-3 text-xs">
                <Info className="w-4 h-4 text-[#a78bfa] shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <span className="font-semibold text-white">How to Play:</span>
                  <p className="text-white/60 leading-relaxed">{selectedGameInfo.instructions}</p>
                </div>
              </div>
            )}

            {/* Render Actual Game Board Container */}
            <div className="p-5 sm:p-8 rounded-[28px] bg-[#151517] border border-white/[0.06] shadow-2xl">
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
          <div className="space-y-5">
            <div className="flex items-center justify-between px-1">
              <h2 className="font-serif-studio text-2xl font-medium text-white flex items-center gap-2">
                <Gamepad2 className="w-5 h-5 text-[#a78bfa]" />
                <span>Available Games ({ALL_GAMES.length})</span>
              </h2>
              <span className="text-xs font-mono-studio text-white/40">100% Client-Side • Zero Data Usage</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {ALL_GAMES.map((game) => (
                <div
                  key={game.id}
                  className="p-6 rounded-[26px] bg-[#151517] border border-white/[0.06] hover:border-[#a78bfa]/40 hover:-translate-y-1 transition-all duration-300 space-y-4 flex flex-col justify-between group shadow-xl"
                >
                  <div className="space-y-3">
                    {/* Icon & Status */}
                    <div className="flex items-center justify-between">
                      <div className="w-12 h-12 rounded-2xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-2xl group-hover:scale-105 transition-transform">
                        {game.icon}
                      </div>
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-mono-studio">
                        Offline Ready
                      </span>
                    </div>

                    {/* Title & Desc */}
                    <div>
                      <h3 className="font-serif-studio text-lg font-medium text-white group-hover:text-[#a78bfa] transition-colors">
                        {game.name}
                      </h3>
                      <p className="text-xs text-white/50 leading-relaxed mt-1 min-h-[36px] font-normal">
                        {game.desc}
                      </p>
                    </div>

                    {/* Difficulty & Play Time */}
                    <div className="pt-2 border-t border-white/[0.06] grid grid-cols-2 gap-2 text-[11px] font-mono-studio">
                      <div className="space-y-0.5">
                        <span className="text-white/40 block text-[10px]">Difficulty</span>
                        <span className="font-semibold text-[#a78bfa]">{game.difficulty}</span>
                      </div>
                      <div className="space-y-0.5">
                        <span className="text-white/40 block text-[10px]">Play time</span>
                        <span className="font-semibold text-white/80 flex items-center gap-1">
                          <Clock className="w-3 h-3 text-white/40" />
                          <span>{game.playTime}</span>
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Play Now Button */}
                  <button
                    onClick={() => setActiveGame(game.id)}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-full bg-white text-[#0d0d0e] hover:bg-slate-200 font-semibold text-xs transition-all shadow-md cursor-pointer mt-2"
                  >
                    <Play className="w-3 h-3 fill-current" />
                    <span>Play Now</span>
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
