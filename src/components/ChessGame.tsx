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

const PIECE_VALUES: Record<PieceSymbol, number> = {
  p: 10,
  n: 30,
  b: 30,
  r: 50,
  q: 90,
  k: 900,
};

const PAWN_TABLE = [
  [0, 0, 0, 0, 0, 0, 0, 0],
  [50, 50, 50, 50, 50, 50, 50, 50],
  [10, 10, 20, 30, 30, 20, 10, 10],
  [5, 5, 10, 25, 25, 10, 5, 5],
  [0, 0, 0, 20, 20, 0, 0, 0],
  [5, -5, -10, 0, 0, -10, -5, 5],
  [5, 10, 10, -20, -20, 10, 10, 5],
  [0, 0, 0, 0, 0, 0, 0, 0]
];

const KNIGHT_TABLE = [
  [-50, -40, -30, -30, -30, -30, -40, -50],
  [-40, -20, 0, 0, 0, 0, -20, -40],
  [-30, 0, 10, 15, 15, 10, 0, -30],
  [-30, 5, 15, 20, 20, 15, 5, -30],
  [-30, 0, 15, 20, 20, 15, 0, -30],
  [-30, 5, 10, 15, 15, 10, 5, -30],
  [-40, -20, 0, 5, 5, 0, -20, -40],
  [-50, -40, -30, -30, -30, -30, -40, -50]
];

/* High-Definition Vector Chess Pieces (Universal Staunton Standard) */
function ChessPieceSVG({ type, color }: { type: PieceSymbol; color: "w" | "b" }) {
  const isWhite = color === "w";
  const fill = isWhite ? "#f8fafc" : "#1e293b";
  const stroke = isWhite ? "#334155" : "#f1f5f9";
  const accent = isWhite ? "#cbd5e1" : "#475569";

  switch (type) {
    case "p":
      return (
        <svg viewBox="0 0 45 45" className="w-[78%] h-[78%] drop-shadow-md select-none pointer-events-none">
          <path
            d="m 22.5,9 a 4,4 0 1 1 -0.1,0 z m -2.5,9 a 3,3 0 0 0 5,0 c 1,3 3,6 3,9 0,2 -2,3 -5.5,3 -3.5,0 -5.5,-1 -5.5,-3 0,-3 2,-6 3,-9 z"
            fill={fill}
            stroke={stroke}
            strokeWidth="1.5"
            strokeLinecap="round"
          />
          <path
            d="m 12,36 c 0,-2 2,-4 5,-4.5 1.5,1 3.5,1.5 5.5,1.5 2,0 4,-0.5 5.5,-1.5 3,0.5 5,2.5 5,4.5 z"
            fill={fill}
            stroke={stroke}
            strokeWidth="1.5"
          />
          <path
            d="m 10,40 c 0,-1.5 1.5,-2.5 4,-2.5 2.5,0.5 5.5,0.5 8.5,0.5 3,0 6,0 8.5,-0.5 2.5,0 4,1 4,2.5 z"
            fill={fill}
            stroke={stroke}
            strokeWidth="1.5"
          />
          {!isWhite && (
            <path d="M 22.5,10 A 2.5,2.5 0 0 1 25,12.5" stroke="#94a3b8" strokeWidth="1" fill="none" />
          )}
        </svg>
      );
    case "r":
      return (
        <svg viewBox="0 0 45 45" className="w-[78%] h-[78%] drop-shadow-md select-none pointer-events-none">
          <g fill={fill} stroke={stroke} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M 9,39 L 36,39 L 36,36 L 9,36 z" />
            <path d="M 12,36 L 12,32 L 33,32 L 33,36 z" />
            <path d="M 11,14 L 11,9 L 15,9 L 15,11 L 20,11 L 20,9 L 25,9 L 25,11 L 30,11 L 30,9 L 34,9 L 34,14 z" />
            <path d="M 34,14 L 31,17 L 14,17 L 11,14 z" />
            <path d="M 14,17 L 14,29.5 L 31,29.5 L 31,17 z" />
            <path d="M 14,29.5 L 12,32 L 33,32 L 31,29.5 z" />
            <path d="M 14,40 L 31,40 L 31,42 L 14,42 z" />
          </g>
          {isWhite && <path d="M 14,20 L 31,20 M 14,25 L 31,25" stroke={accent} strokeWidth="1" fill="none" />}
        </svg>
      );
    case "n":
      return (
        <svg viewBox="0 0 45 45" className="w-[80%] h-[80%] drop-shadow-md select-none pointer-events-none">
          <g fill={fill} stroke={stroke} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M 22,10 C 32.5,11 38.5,18 38,39 L 15,39 C 15,30 25,32.5 23,18" />
            <path d="M 24,18 C 24.38,20.91 18.45,25.37 16,27 C 13,29 13.18,31.34 11,31 C 9.958,30.06 12.41,27.96 11,28 C 10,28 11.19,29.23 10,30 C 9,30 5.997,31 6,26 C 6,24 12,14 12,14 C 12,14 13.89,12.1 14,10.5 C 13.27,7.4 17.5,7 17.5,7 C 17.5,7 19.5,8 20,8.5 C 20.5,9 21,9 22,10 z" />
            <circle cx="15" cy="14" r="1.5" fill={isWhite ? "#334155" : "#f8fafc"} stroke="none" />
            <path d="M 9.5 25.5 A 0.5 0.5 0 1 1 8.5 25.5 A 0.5 0.5 0 1 1 9.5 25.5 z" fill={isWhite ? "#334155" : "#f8fafc"} />
          </g>
        </svg>
      );
    case "b":
      return (
        <svg viewBox="0 0 45 45" className="w-[80%] h-[80%] drop-shadow-md select-none pointer-events-none">
          <g fill={fill} stroke={stroke} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M 9,36 C 12.39,35.03 19.11,36.43 22.5,34 C 25.89,36.43 32.61,35.03 36,36 C 36,36 37.65,36.54 39,38 C 38.32,38.97 37.35,38.99 36,38.5 C 32.61,37.53 25.89,38.96 22.5,37.5 C 19.11,38.96 12.39,37.53 9,38.5 C 7.646,38.99 6.677,38.97 6,38 C 7.354,36.54 9,36 9,36 z" />
            <path d="M 15,32 C 17.5,34.5 27.5,34.5 30,32 C 30.5,30.5 30,30 30,30 C 30,27.5 27.5,26 22.5,26 C 17.5,26 15,27.5 15,30 C 15,30 14.5,30.5 15,32 z" />
            <path d="M 22.5,10 C 27,10 31,14 31,21 C 31,26 27,29 22.5,29 C 18,29 14,26 14,21 C 14,14 18,10 22.5,10 z" />
            <circle cx="22.5" cy="8" r="2" />
            <path d="M 17.5,18 L 27.5,18 M 22.5,13 L 22.5,23" stroke={stroke} strokeWidth="1.2" />
            <path d="M 20,20 L 25,25" stroke={accent} strokeWidth="1.2" />
          </g>
        </svg>
      );
    case "q":
      return (
        <svg viewBox="0 0 45 45" className="w-[84%] h-[84%] drop-shadow-md select-none pointer-events-none">
          <g fill={fill} stroke={stroke} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M 9 26 C 17.5 24.5 30 24.5 36 26 L 38 14 L 31 25 L 22.5 12 L 14 25 L 7 14 Z" />
            <path d="M 9,26 C 9,28 10.5,28 11.5,30 C 12.5,31.5 12.5,31 12,33.5 C 10.5,34.5 10.5,36 10,38 C 11,38.5 12,38.5 13,38.5 C 14,38.5 15.5,38 16.5,37.5 C 18.5,36.5 21,36.5 22.5,36.5 C 24,36.5 26.5,36.5 28.5,37.5 C 29.5,38 31,38.5 32,38.5 C 33,38.5 34,38.5 35,38 C 34.5,36 34.5,34.5 33,33.5 C 32.5,31 32.5,31.5 33.5,30 C 34.5,28 36,28 36,26 z" />
            <path d="M 11,38.5 L 34,38.5 L 34,40.5 L 11,40.5 z" />
            <circle cx="6" cy="12" r="2" />
            <circle cx="14" cy="9" r="2" />
            <circle cx="22.5" cy="8" r="2" />
            <circle cx="31" cy="9" r="2" />
            <circle cx="39" cy="12" r="2" />
          </g>
        </svg>
      );
    case "k":
      return (
        <svg viewBox="0 0 45 45" className="w-[84%] h-[84%] drop-shadow-md select-none pointer-events-none">
          <g fill={fill} stroke={stroke} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M 22.5,11.63 L 22.5,6" />
            <path d="M 20,8 L 25,8" />
            <path d="M 22.5,25 C 22.5,25 27,17.5 25.5,14.5 C 24,11.5 21,11.5 19.5,14.5 C 18,17.5 22.5,25 22.5,25" />
            <path d="M 11.5,37 C 17,40.5 28,40.5 33.5,37 C 36.5,35 34.5,32 34.5,32 C 34.5,32 38.5,28 37,23 C 35.5,18 29.5,18 29.5,18 C 29.5,18 27.5,16 22.5,16 C 17.5,16 15.5,18 15.5,18 C 15.5,18 9.5,18 8,23 C 6.5,28 10.5,32 10.5,32 C 10.5,32 8.5,35 11.5,37 z" />
            <path d="M 11.5,30 C 17,27 28,27 33.5,30" />
            <path d="M 11.5,33.5 C 17,30.5 28,30.5 33.5,33.5" />
            <path d="M 11.5,37 C 17,34 28,34 33.5,37" />
          </g>
        </svg>
      );
    default:
      return null;
  }
}

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
  const [gameStatus, setGameStatus] = useState<string>("White's turn");
  const [isThinking, setIsThinking] = useState(false);
  const [capturedPieces, setCapturedPieces] = useState<{ w: string[]; b: string[] }>({ w: [], b: [] });
  const [pendingPromotion, setPendingPromotion] = useState<{ from: Square; to: Square } | null>(null);

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

  const saveGame = (
    currentChess: Chess,
    mode: GameMode,
    diff: AIDifficulty,
    pColor: PlayerColor,
    orient: PlayerColor,
    history: string[]
  ) => {
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

    board.forEach((row) => {
      row.forEach((square) => {
        if (square && square.type !== "k") {
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

    (["p", "r", "n", "b", "q"] as PieceSymbol[]).forEach((type) => {
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

  const playMoveSound = (isCapture = false) => {
    try {
      if (!moveSoundRef.current) {
        const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        moveSoundRef.current = new AudioCtx();
      }
      const ctx = moveSoundRef.current;
      if (ctx.state === "suspended") ctx.resume();

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      if (isCapture) {
        osc.type = "triangle";
        osc.frequency.setValueAtTime(520, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(180, ctx.currentTime + 0.1);
        gain.gain.setValueAtTime(0.2, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.01, ctx.currentTime + 0.1);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.1);
      } else {
        osc.type = "sine";
        osc.frequency.setValueAtTime(380, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(140, ctx.currentTime + 0.08);
        gain.gain.setValueAtTime(0.16, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.01, ctx.currentTime + 0.08);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.08);
      }
    } catch {
      // Audio context silently ignored on browser autoplay restrictions
    }
  };

  const evaluateBoard = (c: Chess) => {
    let totalEvaluation = 0;
    const board = c.board();

    for (let r = 0; r < 8; r++) {
      for (let col = 0; col < 8; col++) {
        const square = board[r][col];
        if (square) {
          let val = PIECE_VALUES[square.type];
          if (square.type === "p") {
            val += square.color === "w" ? PAWN_TABLE[r][col] : PAWN_TABLE[7 - r][col];
          } else if (square.type === "n") {
            val += KNIGHT_TABLE[r][col];
          }
          totalEvaluation += square.color === "w" ? val : -val;
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
      } catch {
        executedMove = null;
      }

      if (executedMove) {
        playMoveSound(!!executedMove.captured);
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

  const executeMove = (from: Square, to: Square, promotionPiece: string = "q") => {
    let move = null;
    try {
      move = chess.move({
        from,
        to,
        promotion: promotionPiece,
      });
    } catch {
      move = null;
    }

    if (move) {
      playMoveSound(!!move.captured);
      setFen(chess.fen());
      setLastMove({ from: move.from, to: move.to });
      const newHistory = [...moveHistory, move.san];
      setMoveHistory(newHistory);
      setSelectedSquare(null);
      setPossibleMoves([]);
      setPendingPromotion(null);
      updateCapturedPieces(chess);
      updateGameStatus(chess);
      saveGame(chess, gameMode, difficulty, playerColor, orientation, newHistory);
    }
  };

  const handleSquareClick = (square: Square) => {
    if (chess.isGameOver()) return;
    if (gameMode === "ai" && chess.turn() !== playerColor) return;
    if (pendingPromotion) return;

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

      const piece = chess.get(selectedSquare);
      const isPawnPromotion =
        piece &&
        piece.type === "p" &&
        ((piece.color === "w" && square[1] === "8") || (piece.color === "b" && square[1] === "1"));

      if (possibleMoves.includes(square)) {
        if (isPawnPromotion) {
          setPendingPromotion({ from: selectedSquare, to: square });
          return;
        }
        executeMove(selectedSquare, square);
      } else {
        const newPiece = chess.get(square);
        if (newPiece && newPiece.color === chess.turn()) {
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
    setPendingPromotion(null);
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
    setPendingPromotion(null);
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

  // Find King square if in check to highlight with warning indicator
  const getKingInCheckSquare = (): Square | null => {
    if (!chess.inCheck()) return null;
    const currentTurn = chess.turn();
    const board = chess.board();
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const piece = board[r][c];
        if (piece && piece.type === "k" && piece.color === currentTurn) {
          const files = ["a", "b", "c", "d", "e", "f", "g", "h"];
          const ranks = ["8", "7", "6", "5", "4", "3", "2", "1"];
          return `${files[c]}${ranks[r]}` as Square;
        }
      }
    }
    return null;
  };

  const kingInCheckSquare = getKingInCheckSquare();

  const renderBoard = () => {
    const files = ["a", "b", "c", "d", "e", "f", "g", "h"];
    const ranks = ["8", "7", "6", "5", "4", "3", "2", "1"];

    const displayRanks = orientation === "w" ? ranks : [...ranks].reverse();
    const displayFiles = orientation === "w" ? files : [...files].reverse();

    return (
      <div className="relative w-full max-w-[480px] aspect-square rounded-2xl overflow-hidden border-2 border-slate-700/80 shadow-[0_20px_50px_rgba(0,0,0,0.6)] bg-[#1e293b] select-none">
        {/* The 8x8 Chess Grid */}
        <div className="w-full h-full grid grid-cols-8 grid-rows-8">
          {displayRanks.map((rank, rIdx) =>
            displayFiles.map((file, fIdx) => {
              const squareKey = `${file}${rank}` as Square;
              const piece = chess.get(squareKey);
              const isDarkSquare = (rIdx + fIdx) % 2 === 1;
              const isSelected = selectedSquare === squareKey;
              const isPossibleMove = possibleMoves.includes(squareKey);
              const isLastMoveSquare = lastMove?.from === squareKey || lastMove?.to === squareKey;
              const isCheck = kingInCheckSquare === squareKey;

              // Modern Professional Board Palette
              let squareBg = isDarkSquare ? "bg-[#475569]" : "bg-[#cbd5e1]";

              if (isCheck) {
                squareBg = "bg-rose-500/85";
              } else if (isSelected) {
                squareBg = "bg-amber-400/90";
              } else if (isLastMoveSquare) {
                squareBg = isDarkSquare ? "bg-[#4338ca]/80" : "bg-[#818cf8]/80";
              }

              return (
                <button
                  key={squareKey}
                  onClick={() => handleSquareClick(squareKey)}
                  className={`relative aspect-square w-full h-full flex items-center justify-center transition-colors duration-150 ${squareBg} cursor-pointer group p-0 m-0 outline-none`}
                  style={{ touchAction: "manipulation" }}
                  aria-label={`${squareKey} ${piece ? `${piece.color === "w" ? "white" : "black"} ${piece.type}` : "empty"}`}
                >
                  {/* Left-edge Rank Coordinates */}
                  {fIdx === 0 && (
                    <span
                      className={`absolute top-0.5 left-1 text-[9px] sm:text-[10px] font-mono font-bold pointer-events-none ${
                        isDarkSquare ? "text-slate-300" : "text-slate-600"
                      }`}
                    >
                      {rank}
                    </span>
                  )}

                  {/* Bottom-edge File Coordinates */}
                  {rIdx === 7 && (
                    <span
                      className={`absolute bottom-0.5 right-1 text-[9px] sm:text-[10px] font-mono font-bold pointer-events-none ${
                        isDarkSquare ? "text-slate-300" : "text-slate-600"
                      }`}
                    >
                      {file}
                    </span>
                  )}

                  {/* Legal Move Indicators */}
                  {isPossibleMove && (
                    <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
                      {piece ? (
                        /* Capture Target Ring */
                        <div className="w-full h-full border-4 border-rose-400/80 bg-rose-500/20 rounded-md animate-pulse" />
                      ) : (
                        /* Move Target Dot */
                        <div className="w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full bg-emerald-500/90 shadow-md shadow-emerald-500/50" />
                      )}
                    </div>
                  )}

                  {/* High-Definition Vector Chess Piece */}
                  {piece && (
                    <div className="z-20 w-full h-full flex items-center justify-center transition-transform duration-100 group-active:scale-95">
                      <ChessPieceSVG type={piece.type} color={piece.color} />
                    </div>
                  )}
                </button>
              );
            })
          )}
        </div>

        {/* Pawn Promotion Modal Overlay */}
        {pendingPromotion && (
          <div className="absolute inset-0 z-40 bg-black/75 backdrop-blur-sm flex flex-col items-center justify-center p-4">
            <div className="bg-slate-900 border border-white/20 rounded-2xl p-4 shadow-2xl space-y-3 text-center max-w-xs w-full">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-400 block">
                Promote Pawn
              </span>
              <p className="text-[11px] text-slate-300">Choose your promotion piece:</p>
              <div className="grid grid-cols-4 gap-2 pt-1">
                {(["q", "r", "b", "n"] as PieceSymbol[]).map((pieceType) => (
                  <button
                    key={pieceType}
                    onClick={() => executeMove(pendingPromotion.from, pendingPromotion.to, pieceType)}
                    className="aspect-square flex items-center justify-center rounded-xl bg-white/10 hover:bg-indigo-600 border border-white/15 hover:border-indigo-400 transition-all cursor-pointer p-2 active:scale-90 shadow-lg"
                  >
                    <ChessPieceSVG type={pieceType} color={chess.turn()} />
                  </button>
                ))}
              </div>
            </div>
          </div>
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
          <div className="w-full max-w-[480px] flex items-center justify-between text-xs px-1">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-300">
                {gameMode === "ai" ? (playerColor === "w" ? "🤖 AI Bot" : "👤 You") : "Player 2"}
              </span>
              <div className="flex items-center gap-0.5 text-slate-400">
                {capturedPieces.w.map((p, i) => (
                  <span key={i} className="text-xs font-mono font-bold">
                    {p}
                  </span>
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

          <div className="w-full max-w-[480px] flex items-center justify-between text-xs px-1">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-300">
                {gameMode === "ai" ? (playerColor === "w" ? "👤 You" : "🤖 AI Bot") : "Player 1"}
              </span>
              <div className="flex items-center gap-0.5 text-slate-400">
                {capturedPieces.b.map((p, i) => (
                  <span key={i} className="text-xs font-mono font-bold">
                    {p}
                  </span>
                ))}
              </div>
            </div>

            <span className="font-mono text-xs font-semibold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
              {gameStatus}
            </span>
          </div>

          <div className="w-full max-w-[480px] flex items-center justify-between gap-2 pt-2">
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
                    <div
                      key={i}
                      className="flex items-center text-slate-300 bg-white/[0.02] px-2.5 py-1 rounded-lg border border-white/5"
                    >
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
