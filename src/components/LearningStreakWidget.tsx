import React, { useState, useEffect } from "react";
import { Flame, Trophy, Calendar, Check, Sparkles, Clock, AlertCircle } from "lucide-react";
import {
  getLearningStreak,
  recordLearningActivity,
  getRecentDaysStatus,
  subscribeToStreak,
  LearningStreakData,
  DayStreakStatus
} from "../lib/streakTracker";

interface LearningStreakWidgetProps {
  variant?: "card" | "badge" | "compact";
  showLogButton?: boolean;
  className?: string;
  onStreakChange?: (streak: LearningStreakData) => void;
}

export default function LearningStreakWidget({
  variant = "card",
  showLogButton = true,
  className = "",
  onStreakChange
}: LearningStreakWidgetProps) {
  const [streak, setStreak] = useState<LearningStreakData>(() => getLearningStreak());
  const [days, setDays] = useState<DayStreakStatus[]>(() => getRecentDaysStatus(7));
  const [justLogged, setJustLogged] = useState(false);

  useEffect(() => {
    const unsubscribe = subscribeToStreak((updatedStreak) => {
      setStreak(updatedStreak);
      setDays(getRecentDaysStatus(7));
      if (onStreakChange) onStreakChange(updatedStreak);
    });

    // Auto-record initial visit once on mount
    const updated = recordLearningActivity("dashboard_visit");
    setStreak(updated);
    setDays(getRecentDaysStatus(7));
    if (onStreakChange) onStreakChange(updated);

    return () => unsubscribe();
  }, [onStreakChange]);

  const handleManualCheckIn = () => {
    const updated = recordLearningActivity("manual_checkin");
    setStreak(updated);
    setDays(getRecentDaysStatus(7));
    setJustLogged(true);
    setTimeout(() => setJustLogged(false), 3000);
    if (onStreakChange) onStreakChange(updated);
  };

  // 1. SIMPLE BADGE VARIANT
  if (variant === "badge") {
    return (
      <div
        id="current-streak-badge"
        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-amber-500/15 via-orange-500/15 to-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-semibold shadow-sm transition-all hover:border-amber-500/50 ${className}`}
        title={`Current learning streak: ${streak.currentStreak} consecutive days. Best: ${streak.longestStreak} days.`}
      >
        <Flame className={`w-3.5 h-3.5 text-amber-400 fill-amber-400 ${streak.todayActive ? "animate-pulse" : ""}`} />
        <span>Current Streak: {streak.currentStreak} {streak.currentStreak === 1 ? "Day" : "Days"}</span>
      </div>
    );
  }

  // 2. COMPACT VARIANT (Great for sidebar or mini cards)
  if (variant === "compact") {
    return (
      <div className={`p-3.5 rounded-2xl bg-white/[0.03] border border-amber-500/20 flex items-center justify-between gap-3 ${className}`}>
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/25 flex items-center justify-center text-amber-400">
            <Flame className="w-5 h-5 fill-amber-400" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-white">Daily Streak</span>
              <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 text-[10px] font-mono font-semibold">
                {streak.currentStreak} {streak.currentStreak === 1 ? "day" : "days"}
              </span>
            </div>
            <p className="text-[10px] text-slate-400">
              {streak.todayActive ? "Active today" : "Study today to keep streak"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          {days.slice(-5).map((d) => (
            <div
              key={d.dateStr}
              title={`${d.dayName} (${d.dateStr}): ${d.isActive ? "Active" : "Inactive"}`}
              className={`w-2 h-5 rounded-full transition-all ${
                d.isActive
                  ? "bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.5)]"
                  : "bg-white/10"
              } ${d.isToday ? "ring-1 ring-amber-300" : ""}`}
            />
          ))}
        </div>
      </div>
    );
  }

  // 3. FULL CARD VARIANT (Default for Dashboard & Settings)
  return (
    <div
      id="daily-learning-streak-card"
      className={`relative p-5 sm:p-6 rounded-3xl bg-gradient-to-br from-amber-950/20 via-neutral-900/60 to-[#0A0D1E]/80 border border-amber-500/25 shadow-xl backdrop-blur-xl overflow-hidden group hover:border-amber-500/40 transition-all ${className}`}
    >
      {/* Fiery ambient glow */}
      <div className="absolute top-0 right-0 w-48 h-48 bg-amber-500/10 blur-3xl pointer-events-none rounded-full" />
      <div className="absolute bottom-0 left-0 w-40 h-40 bg-orange-600/10 blur-3xl pointer-events-none rounded-full" />

      {/* Top Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500/20 via-orange-500/20 to-yellow-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-md shadow-amber-500/10">
            <Flame className="w-5 h-5 fill-amber-400 text-amber-400 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm sm:text-base font-bold text-white tracking-tight">
                Daily Learning Streak
              </h3>
              {/* Requirement: displays a 'current streak' badge */}
              <span
                id="current-streak-badge"
                className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-[11px] font-semibold font-mono"
              >
                <Flame className="w-3 h-3 fill-amber-400 text-amber-400" />
                Current Streak: {streak.currentStreak} {streak.currentStreak === 1 ? "Day" : "Days"}
              </span>
            </div>
            <p className="text-xs text-neutral-400 mt-0.5">
              Tracks consecutive days of study, quiz solving, and learning activity.
            </p>
          </div>
        </div>

        {/* Quick Streak Record Badge */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white/[0.04] border border-white/10 text-xs">
            <Trophy className="w-3.5 h-3.5 text-yellow-400" />
            <span className="text-slate-400">Best:</span>
            <span className="font-mono font-bold text-yellow-300">{streak.longestStreak} {streak.longestStreak === 1 ? "day" : "days"}</span>
          </div>
        </div>
      </div>

      {/* Main Stats Row & 7-Day Tracker */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 pt-4">
        {/* Streak Big Counter */}
        <div className="lg:col-span-4 flex items-center gap-4 p-3.5 rounded-2xl bg-white/[0.02] border border-white/5">
          <div className="flex items-baseline gap-1.5">
            <span className="text-4xl sm:text-5xl font-black font-mono text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-orange-400 to-amber-200">
              {streak.currentStreak}
            </span>
            <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider">
              {streak.currentStreak === 1 ? "Day Streak" : "Days Streak"}
            </span>
          </div>
          <div className="h-8 w-px bg-white/10 mx-1" />
          <div className="space-y-0.5 min-w-0">
            <div className="text-[11px] font-semibold text-white flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${streak.todayActive ? "bg-emerald-400" : "bg-amber-400 animate-ping"}`} />
              <span className="truncate">{streak.todayActive ? "Active Today" : "Awaiting Today"}</span>
            </div>
            <p className="text-[10px] text-neutral-400">
              {streak.totalActiveDays} total study {streak.totalActiveDays === 1 ? "day" : "days"}
            </p>
          </div>
        </div>

        {/* 7-Day Activity Week Track */}
        <div className="lg:col-span-8 flex flex-col justify-center space-y-2">
          <div className="flex items-center justify-between text-xs text-neutral-400">
            <span className="font-medium flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-amber-400" />
              <span>Last 7 Days Activity</span>
            </span>
            <span className="text-[10px] font-mono text-amber-300">
              {days.filter((d) => d.isActive).length} / 7 Days Active
            </span>
          </div>

          <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
            {days.map((day) => (
              <div
                key={day.dateStr}
                className={`flex flex-col items-center justify-center p-2 rounded-xl border transition-all ${
                  day.isActive
                    ? "bg-gradient-to-b from-amber-500/20 to-orange-500/10 border-amber-500/40 text-white shadow-sm shadow-amber-500/15"
                    : "bg-white/[0.02] border-white/5 text-neutral-500"
                } ${day.isToday ? "ring-2 ring-amber-400/80 font-bold" : ""}`}
                title={`${day.dayName}, ${day.dateStr}: ${day.isActive ? "Studied ✓" : "No Activity"}`}
              >
                <span className="text-[10px] uppercase font-mono tracking-wider mb-1 opacity-80">
                  {day.shortDayName}
                </span>
                <div
                  className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs ${
                    day.isActive
                      ? "bg-amber-400 text-neutral-950 font-bold"
                      : "bg-white/5 text-neutral-500"
                  }`}
                >
                  {day.isActive ? (
                    <Flame className="w-3.5 h-3.5 fill-current" />
                  ) : (
                    <span className="text-[10px]">{day.dayNumber}</span>
                  )}
                </div>
                <span className="text-[9px] mt-1 font-mono">
                  {day.isToday ? "Today" : `${day.dayNumber}`}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer / Interactive check-in button */}
      {showLogButton && (
        <div className="mt-4 pt-3.5 border-t border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
          <p className="text-neutral-400 flex items-center gap-1.5 text-[11px]">
            {streak.todayActive ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-300">
                  Great job! You have maintained your learning streak today.
                </span>
              </>
            ) : (
              <>
                <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
                <span className="text-amber-200">
                  Study a material, take a quiz, or check in to extend your streak.
                </span>
              </>
            )}
          </p>

          <button
            type="button"
            onClick={handleManualCheckIn}
            className={`px-3.5 py-1.5 rounded-xl font-semibold text-xs flex items-center gap-1.5 transition-all cursor-pointer ${
              streak.todayActive
                ? "bg-white/5 hover:bg-white/10 border border-white/10 text-neutral-300"
                : "bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-bold shadow-lg shadow-amber-500/20 active:scale-95"
            }`}
          >
            {justLogged ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span>Streak Updated!</span>
              </>
            ) : streak.todayActive ? (
              <>
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Streak Protected Today</span>
              </>
            ) : (
              <>
                <Flame className="w-3.5 h-3.5 fill-current" />
                <span>Log Study Activity</span>
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
