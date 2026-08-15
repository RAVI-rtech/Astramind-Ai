import React, { useState, useEffect, useRef } from "react";
import { Chess, Square, PieceSymbol } from "chess.js";
import {
  RotateCcw,
  Undo2,
  ArrowRightLeft,
  Bot,
  User,
  Clock,
  Info,
  Sparkles
} from "lucide-react";

type GameMode = "pvp" | "ai";
type AIDifficulty = "easy" | "medium" | "hard";
type PlayerColor = "w" | "b";

interface SavedGameState {
  fen: string;
  history: string[];
  mode: GameMode;
  difficulty: AIDifficulty;
  playerColor: PlayerColor;
  orientation: PlayerColor;
}

const STORAGE_KEY = "astramind_offline_chess_v1";

const PIECE_SYMBOLS: Record<string, string> = {
  pw: "♟", rw: "♜", nw: "♞", bw: "♝", qw: "♛", kw: "♚",
  pb: "♟", rb: "♜", nb: "♞", bb: "♝", qb: "♛", kb: "♚",
};

const PIECE_VALUES: Record<PieceSymbol, number> = {
  p: 10, n: 30, b: 30, r: 50, q: 90, k: 900,
};

const PAWN_TABLE = [
  [0,  0,  0,  0,  0,  0,  0,  0],
  [50, 50, 50, 50, 50, 50, 50, 50],
  [10, 10, 20, 30, 30, 20, 10, 10],
  [5,  5, 10, 25, 25, 10,  5,  5],
  [0,  0,  0, 20, 20,  0,  0,  0],
  [5, -5,-10,  0,  0,-10, -5,  5],
  [5, 10, 10,-20,-20, 10, 10,  5],
  [0,  0,  0,  0,  0,  0,  0,  0]
];

const KNIGHT_TABLE = [
  [-50,-40,-30,-30,-30,-30,-40,-50],
  [-40,-20,  0,  0,  0,  0,-20,-40],
  [-30,  0, 10, 15, 15, 10,  0,-30],
  [-30,  5, 15, 20, 20, 15,  5,-30],
  [-30,  0, 15, 20, 20, 15,  0,-30],
  [-30,  5, 10, 15, 15, 10,  5,-30],
  [-40,-20,  0,  5,  5,  0,-20,-40],
  [-50,-40,-30,-30,-30,-30,-40,-50]
];

export default function ChessGame() {
  const [chess] = useState(() => new Chess());
  const [fen, setFen] = useState<string>(chess.fen());
  const [gameMode, setGameMode] = useState<GameMode>("ai");
  const [difficulty, setDifficulty] = useState<AIDifficulty>("medium");
  const [playerColor, setPlayerColor] = useState<PlayerColor>("w");
  const [orientation, setOrientation] = useState<PlayerColor>("w");
  const [selectedSquare, setSelectedSquare] = useState<Square | null>(null);
  const [possibleMoves, setPossibleMoves] = useState<Square[]>([]);
  const [lastMove, setLastMove] = useState<{ from: Square; to: Square } | null>(null);
  const [moveHistory, setMoveHistory] = useState<string[]>([]);
  const [gameStatus, setGameStatus] = useState<string>("Game in progress");
  const [isThinking, setIsThinking] = useState(false);
  const [capturedPieces, setCapturedPieces] = useState<{ w: string[]; b: string[] }>({ w: [], b: [] });

  const moveSoundRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed: SavedGameState = JSON.parse(saved);
        if (parsed.fen) {
          chess.load(parsed.fen);
          setFen(chess.fen());
          setGameMode(parsed.mode || "ai");
          setDifficulty(parsed.difficulty || "medium");
          setPlayerColor(parsed.playerColor || "w");
          setOrientation(parsed.orientation || "w");
          setMoveHistory(parsed.history || []);
          updateCapturedPieces(chess);
          updateGameStatus(chess);
        }
      }
    } catch (e) {
      console.warn("Failed to load saved chess game:", e);
    }
  }, []);

  const saveGame = (currentChess: Chess, mode: GameMode, diff: AIDifficulty, pColor: PlayerColor, orient: PlayerColor, history: string[]) => {
    try {
      const state: SavedGameState = {
        fen: currentChess.fen(),
        history,
        mode,
        difficulty: diff,
        playerColor: pColor,
        orientation: orient,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      console.warn("Failed to save chess game:", e);
    }
  };

  const updateCapturedPieces = (c: Chess) => {
    const board = c.board();
    const currentCounts: Record<string, number> = {
      pw: 0, rw: 0, nw: 0, bw: 0, qw: 0,
      pb: 0, rb: 0, nb: 0, bb: 0, qb: 0,
    };

    board.forEach(row => {
      row.forEach(square => {
        if (square && square.type !== 'k') {
          const key = `${square.type}${square.color}`;
          currentCounts[key] = (currentCounts[key] || 0) + 1;
        }
      });
    });

    const initialCounts: Record<string, number> = {
      pw: 8, rw: 2, nw: 2, bw: 2, qw: 1,
      pb: 8, rb: 2, nb: 2, bb: 2, qb: 1,
    };

    const capturedW: string[] = [];
    const capturedB: string[] = [];

    (['p', 'r', 'n', 'b', 'q'] as PieceSymbol[]).forEach(type => {
      const lostWhite = initialCounts[`${type}w`] - (currentCounts[`${type}w`] || 0);
      for (let i = 0; i < lostWhite; i++) capturedB.push(type.toUpperCase());

      const lostBlack = initialCounts[`${type}b`] - (currentCounts[`${type}b`] || 0);
      for (let i = 0; i < lostBlack; i++) capturedW.push(type.toUpperCase());
    });

    setCapturedPieces({ w: capturedW, b: capturedB });
  };

  const updateGameStatus = (c: Chess) => {
    if (c.isCheckmate()) {
      const winner = c.turn() === "w" ? "Black" : "White";
      setGameStatus(`Checkmate! ${winner} wins.`);
    } else if (c.isDraw()) {
      if (c.isStalemate()) setGameStatus("Draw by Stalemate");
      else if (c.isThreefoldRepetition()) setGameStatus("Draw by Repetition");
      else if (c.isInsufficientMaterial()) setGameStatus("Draw by Insufficient Material");
      else setGameStatus("Draw");
    } else if (c.inCheck()) {
      setGameStatus(`Check! ${c.turn() === "w" ? "White" : "Black"}'s turn.`);
    } else {
      setGameStatus(`${c.turn() === "w" ? "White" : "Black"}'s turn`);
    }
  };

  const playMoveSound = () => {
    try {
      if (!moveSoundRef.current) {
        moveSoundRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = moveSoundRef.current;
      if (ctx.state === 'suspended') ctx.resume();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(400, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(150, ctx.currentTime + 0.08);
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.01, ctx.currentTime + 0.08);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.08);
    } catch (e) {}
  };

  const evaluateBoard = (c: Chess) => {
    let totalEvaluation = 0;
    const board = c.board();

    for (let r = 0; r < 8; r++) {
      for (let col = 0; col < 8; col++) {
        const square = board[r][col];
        if (square) {
          let val = PIECE_VALUES[square.type];
          if (square.type === 'p') {
            val += square.color === 'w' ? PAWN_TABLE[r][col] : PAWN_TABLE[7 - r][col];
          } else if (square.type === 'n') {
            val += KNIGHT_TABLE[r][col];
          }
          totalEvaluation += square.color === 'w' ? val : -val;
        }
      }
    }
    return totalEvaluation;
  };

  const makeAIMove = () => {
    if (chess.isGameOver()) return;
    setIsThinking(true);

    setTimeout(() => {
      const moves = chess.moves({ verbose: true });
      if (moves.length === 0) {
        setIsThinking(false);
        return;
      }

      let bestMove = moves[Math.floor(Math.random() * moves.length)];

      if (difficulty === "easy") {
        const captures = moves.filter((m) => m.captured);
        if (captures.length > 0 && Math.random() > 0.4) {
          bestMove = captures[Math.floor(Math.random() * captures.length)];
        } else {
          bestMove = moves[Math.floor(Math.random() * moves.length)];
        }
      } else {
        let bestValue = chess.turn() === "w" ? -99999 : 99999;
        const isMax = chess.turn() === "w";

        for (const move of moves) {
          chess.move(move);
          let value = evaluateBoard(chess);
          
          if (difficulty === "hard") {
            const replyMoves = chess.moves({ verbose: true });
            let replyBest = isMax ? 99999 : -99999;
            for (const reply of replyMoves) {
              chess.move(reply);
              const v = evaluateBoard(chess);
              if (isMax) replyBest = Math.min(replyBest, v);
              else replyBest = Math.max(replyBest, v);
              chess.undo();
            }
            value = replyMoves.length > 0 ? replyBest : value;
          }

          chess.undo();

          if (isMax) {
            if (value > bestValue) {
              bestValue = value;
              bestMove = move;
            }
          } else {
            if (value < bestValue) {
              bestValue = value;
              bestMove = move;
            }
          }
        }
      }

      let executedMove = null;
      try {
        executedMove = chess.move(bestMove);
      } catch (err) {
        executedMove = null;
      }
      if (executedMove) {
        playMoveSound();
        setFen(chess.fen());
        setLastMove({ from: executedMove.from, to: executedMove.to });
        const newHistory = [...moveHistory, executedMove.san];
        setMoveHistory(newHistory);
        updateCapturedPieces(chess);
        updateGameStatus(chess);
        saveGame(chess, gameMode, difficulty, playerColor, orientation, newHistory);
      }
      setIsThinking(false);
    }, difficulty === "hard" ? 300 : 150);
  };

  useEffect(() => {
    if (gameMode === "ai" && !chess.isGameOver()) {
      const isAITurn = chess.turn() !== playerColor;
      if (isAITurn && !isThinking) {
        makeAIMove();
      }
    }
  }, [fen, gameMode, playerColor, isThinking]);

  const handleSquareClick = (square: Square) => {
    if (chess.isGameOver()) return;
    if (gameMode === "ai" && chess.turn() !== playerColor) return;

    if (selectedSquare === null) {
      const piece = chess.get(square);
      if (piece && piece.color === chess.turn()) {
        setSelectedSquare(square);
        const moves = chess.moves({ square, verbose: true }).map((m) => m.to);
        setPossibleMoves(moves);
      }
    } else {
      if (selectedSquare === square) {
        setSelectedSquare(null);
        setPossibleMoves([]);
        return;
      }

      let move = null;
      try {
        move = chess.move({
          from: selectedSquare,
          to: square,
          promotion: "q",
        });
      } catch (err) {
        move = null;
      }

      if (move) {
        playMoveSound();
        setFen(chess.fen());
        setLastMove({ from: move.from, to: move.to });
        const newHistory = [...moveHistory, move.san];
        setMoveHistory(newHistory);
        setSelectedSquare(null);
        setPossibleMoves([]);
        updateCapturedPieces(chess);
        updateGameStatus(chess);
        saveGame(chess, gameMode, difficulty, playerColor, orientation, newHistory);
      } else {
        const piece = chess.get(square);
        if (piece && piece.color === chess.turn()) {
          setSelectedSquare(square);
          const moves = chess.moves({ square, verbose: true }).map((m) => m.to);
          setPossibleMoves(moves);
        } else {
          setSelectedSquare(null);
          setPossibleMoves([]);
        }
      }
    }
  };

  const handleRestart = () => {
    chess.reset();
    setFen(chess.fen());
    setSelectedSquare(null);
    setPossibleMoves([]);
    setLastMove(null);
    setMoveHistory([]);
    setCapturedPieces({ w: [], b: [] });
    updateGameStatus(chess);
    saveGame(chess, gameMode, difficulty, playerColor, orientation, []);
  };

  const handleUndo = () => {
    if (moveHistory.length === 0) return;

    if (gameMode === "ai") {
      chess.undo();
      chess.undo();
      const newHist = moveHistory.slice(0, Math.max(0, moveHistory.length - 2));
      setMoveHistory(newHist);
    } else {
      chess.undo();
      const newHist = moveHistory.slice(0, moveHistory.length - 1);
      setMoveHistory(newHist);
    }

    setFen(chess.fen());
    setSelectedSquare(null);
    setPossibleMoves([]);
    setLastMove(null);
    updateCapturedPieces(chess);
    updateGameStatus(chess);
    saveGame(chess, gameMode, difficulty, playerColor, orientation, moveHistory);
  };

  const handleFlipBoard = () => {
    setOrientation((prev) => (prev === "w" ? "b" : "w"));
  };

  const handleModeChange = (mode: GameMode) => {
    setGameMode(mode);
    handleRestart();
  };

  const handleDifficultyChange = (diff: AIDifficulty) => {
    setDifficulty(diff);
  };

  const handlePlayerColorChange = (color: PlayerColor) => {
    setPlayerColor(color);
    setOrientation(color);
    handleRestart();
  };

  const renderBoard = () => {
    const files = ["a", "b", "c", "d", "e", "f", "g", "h"];
    const ranks = ["8", "7", "6", "5", "4", "3", "2", "1"];

    const displayRanks = orientation === "w" ? ranks : [...ranks].reverse();
    const displayFiles = orientation === "w" ? files : [...files].reverse();

    return (
      <div className="w-full max-w-[440px] aspect-square rounded-2xl overflow-hidden border border-white/20 shadow-2xl bg-slate-900 grid grid-cols-8 select-none">
        {displayRanks.map((rank, rIdx) =>
          displayFiles.map((file, fIdx) => {
            const squareKey = `${file}${rank}` as Square;
            const piece = chess.get(squareKey);
            const isDarkSquare = (rIdx + fIdx) % 2 === 1;
            const isSelected = selectedSquare === squareKey;
            const isPossibleMove = possibleMoves.includes(squareKey);
            const isLastMoveSquare = lastMove?.from === squareKey || lastMove?.to === squareKey;

            let squareBg = isDarkSquare ? "bg-[#2d3748]" : "bg-[#e2e8f0]";
            if (isSelected) squareBg = "bg-amber-400/90";
            else if (isLastMoveSquare) squareBg = isDarkSquare ? "bg-indigo-700/80" : "bg-indigo-300/80";

            return (
              <button
                key={squareKey}
                onClick={() => handleSquareClick(squareKey)}
                className={`relative flex items-center justify-center transition-colors ${squareBg} cursor-pointer group`}
                style={{ touchAction: "manipulation" }}
              >
                {fIdx === 0 && (
                  <span className={`absolute top-0.5 left-1 text-[9px] font-mono font-bold ${isDarkSquare ? "text-slate-400" : "text-slate-600"}`}>
                    {rank}
                  </span>
                )}
                {rIdx === 7 && (
                  <span className={`absolute bottom-0.5 right-1 text-[9px] font-mono font-bold ${isDarkSquare ? "text-slate-400" : "text-slate-600"}`}>
                    {file}
                  </span>
                )}

                {isPossibleMove && (
                  <div
                    className={`absolute z-10 ${
                      piece
                        ? "w-full h-full border-4 border-emerald-400/80 bg-emerald-500/20 rounded-lg animate-pulse"
                        : "w-3.5 h-3.5 rounded-full bg-emerald-500/80 shadow-md shadow-emerald-500/50"
                    }`}
                  />
                )}

                {piece && (
                  <span
                    className={`z-20 text-2xl sm:text-3xl transition-transform group-active:scale-95 ${
                      piece.color === "w"
                        ? "text-slate-100 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]"
                        : "text-slate-900 drop-shadow-[0_1px_2px_rgba(255,255,255,0.4)]"
                    }`}
                  >
                    {PIECE_SYMBOLS[`${piece.type}${piece.color}`]}
                  </span>
                )}
              </button>
            );
          })
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Controls Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
            <span className="text-2xl leading-none">♟</span>
          </div>
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <span>Classic Chess Engine</span>
            </h2>
            <p className="text-xs text-slate-400">
              Play Player vs Player or against offline AI Minimax bot.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 p-1 bg-white/5 border border-white/10 rounded-2xl">
          <button
            onClick={() => handleModeChange("ai")}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              gameMode === "ai"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Bot className="w-3.5 h-3.5" />
            <span>vs AI</span>
          </button>
          <button
            onClick={() => handleModeChange("pvp")}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              gameMode === "pvp"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>vs Player</span>
          </button>
        </div>
      </div>

      {gameMode === "ai" && (
        <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-2xl bg-white/[0.02] border border-white/5 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-slate-400 font-medium">Difficulty:</span>
            {(["easy", "medium", "hard"] as AIDifficulty[]).map((d) => (
              <button
                key={d}
                onClick={() => handleDifficultyChange(d)}
                className={`px-3 py-1 rounded-xl font-semibold capitalize transition-all cursor-pointer border ${
                  difficulty === d
                    ? d === "easy"
                      ? "bg-emerald-600/30 text-emerald-300 border-emerald-500/40"
                      : d === "medium"
                      ? "bg-amber-600/30 text-amber-300 border-amber-500/40"
                      : "bg-rose-600/30 text-rose-300 border-rose-500/40"
                    : "bg-white/5 text-slate-400 border-transparent hover:text-white"
                }`}
              >
                {d}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <span className="text-slate-400 font-medium">Play As:</span>
            <button
              onClick={() => handlePlayerColorChange("w")}
              className={`px-3 py-1 rounded-xl font-semibold transition-all cursor-pointer border ${
                playerColor === "w"
                  ? "bg-white text-slate-900 border-white font-bold"
                  : "bg-white/5 text-slate-400 border-transparent hover:text-white"
              }`}
            >
              ⚪ White
            </button>
            <button
              onClick={() => handlePlayerColorChange("b")}
              className={`px-3 py-1 rounded-xl font-semibold transition-all cursor-pointer border ${
                playerColor === "b"
                  ? "bg-slate-800 text-white border-slate-600 font-bold"
                  : "bg-white/5 text-slate-400 border-transparent hover:text-white"
              }`}
            >
              ⚫ Black
            </button>
          </div>
        </div>
      )}

      {/* Board & Info Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-7 flex flex-col items-center justify-center space-y-4">
          <div className="w-full max-w-[440px] flex items-center justify-between text-xs px-1">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-300">
                {gameMode === "ai" ? (playerColor === "w" ? "🤖 AI Bot" : "👤 You") : "Player 2"}
              </span>
              <div className="flex items-center gap-0.5 text-slate-400">
                {capturedPieces.w.map((p, i) => (
                  <span key={i} className="text-xs font-mono font-bold">{p}</span>
                ))}
              </div>
            </div>

            {isThinking && (
              <span className="text-indigo-400 text-xs font-mono animate-pulse flex items-center gap-1">
                <Sparkles className="w-3 h-3 animate-spin" />
                <span>AI thinking...</span>
              </span>
            )}
          </div>

          {renderBoard()}

          <div className="w-full max-w-[440px] flex items-center justify-between text-xs px-1">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-300">
                {gameMode === "ai" ? (playerColor === "w" ? "👤 You" : "🤖 AI Bot") : "Player 1"}
              </span>
              <div className="flex items-center gap-0.5 text-slate-400">
                {capturedPieces.b.map((p, i) => (
                  <span key={i} className="text-xs font-mono font-bold">{p}</span>
                ))}
              </div>
            </div>

            <span className="font-mono text-xs font-semibold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
              {gameStatus}
            </span>
          </div>

          <div className="w-full max-w-[440px] flex items-center justify-between gap-2 pt-2">
            <button
              onClick={handleRestart}
              className="flex-1 min-h-[44px] flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white text-xs font-semibold transition-all border border-white/10 active:scale-95 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
              <span>Restart</span>
            </button>

            <button
              onClick={handleUndo}
              disabled={moveHistory.length === 0}
              className="flex-1 min-h-[44px] flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 disabled:opacity-40 text-slate-300 hover:text-white text-xs font-semibold transition-all border border-white/10 active:scale-95 cursor-pointer"
            >
              <Undo2 className="w-3.5 h-3.5 text-blue-400" />
              <span>Undo</span>
            </button>

            <button
              onClick={handleFlipBoard}
              className="flex-1 min-h-[44px] flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white text-xs font-semibold transition-all border border-white/10 active:scale-95 cursor-pointer"
            >
              <ArrowRightLeft className="w-3.5 h-3.5 text-purple-400" />
              <span>Flip</span>
            </button>
          </div>
        </div>

        <div className="lg:col-span-5 space-y-4">
          <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/10 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-white/10">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-2">
                <Clock className="w-3.5 h-3.5" />
                <span>Move History</span>
              </span>
              <span className="text-[11px] font-mono text-slate-500">
                {moveHistory.length} moves
              </span>
            </div>

            <div className="h-44 overflow-y-auto scrollbar-thin text-xs font-mono space-y-1.5 pr-1">
              {moveHistory.length === 0 ? (
                <div className="h-full flex items-center justify-center text-slate-500 italic text-center p-4">
                  No moves made yet. Tap any piece to start playing.
                </div>
              ) : (
                Array.from({ length: Math.ceil(moveHistory.length / 2) }).map((_, i) => {
                  const whiteMove = moveHistory[i * 2];
                  const blackMove = moveHistory[i * 2 + 1];
                  return (
                    <div key={i} className="flex items-center text-slate-300 bg-white/[0.02] px-2.5 py-1 rounded-lg border border-white/5">
                      <span className="w-8 text-slate-500 font-bold">{i + 1}.</span>
                      <span className="flex-1 text-slate-100 font-semibold">{whiteMove}</span>
                      <span className="flex-1 text-slate-400">{blackMove || "-"}</span>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-indigo-500/5 border border-indigo-500/20 text-xs space-y-2">
            <div className="font-bold text-indigo-300 flex items-center gap-1.5">
              <Info className="w-4 h-4 text-indigo-400 shrink-0" />
              <span>Offline Architecture Guarantee</span>
            </div>
            <p className="text-slate-300 leading-relaxed text-[11px]">
              All chess logic, legal move generation, check/checkmate verification, and Minimax AI evaluation run 100% locally on your device using JavaScript.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
