/**
 * AstraMind Daily Learning Streak Tracker
 * Tracks consecutive days of learning activity across study workspaces,
 * quizzes, flashcards, AI tutoring, and PDF reading.
 */

export interface LearningStreakData {
  currentStreak: number;
  longestStreak: number;
  lastActiveDate: string; // YYYY-MM-DD
  activityDates: string[]; // sorted unique YYYY-MM-DD strings
  todayActive: boolean;
  totalActiveDays: number;
  lastActivitySource?: string;
}

export interface DayStreakStatus {
  dayName: string; // e.g. "Mon", "Tue"
  shortDayName: string; // e.g. "M", "T"
  dayNumber: number; // e.g. 15
  dateStr: string; // "YYYY-MM-DD"
  isToday: boolean;
  isPast: boolean;
  isFuture: boolean;
  isActive: boolean;
}

const STORAGE_KEY = "astramind_learning_streak";
export const STREAK_EVENT = "astramind-streak-updated";

/**
 * Returns local date in YYYY-MM-DD format
 */
export function getLocalDateString(d: Date = new Date()): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Offset date by N days
 */
export function shiftDate(dateStr: string, dayDelta: number): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  date.setDate(date.getDate() + dayDelta);
  return getLocalDateString(date);
}

/**
 * Computes consecutive streak from a sorted list of unique YYYY-MM-DD strings
 */
export function calculateStreakStats(dates: string[]): {
  currentStreak: number;
  longestStreak: number;
  todayActive: boolean;
  totalActiveDays: number;
} {
  const uniqueDates = Array.from(new Set(dates)).sort();
  const dateSet = new Set(uniqueDates);
  const today = getLocalDateString();
  const yesterday = shiftDate(today, -1);

  const todayActive = dateSet.has(today);
  const yesterdayActive = dateSet.has(yesterday);

  // 1. Current streak calculation
  let currentStreak = 0;
  if (todayActive) {
    currentStreak = 1;
    let checkDate = yesterday;
    while (dateSet.has(checkDate)) {
      currentStreak++;
      checkDate = shiftDate(checkDate, -1);
    }
  } else if (yesterdayActive) {
    // If active yesterday, streak is currently active and awaiting today's activity
    currentStreak = 1;
    let checkDate = shiftDate(yesterday, -1);
    while (dateSet.has(checkDate)) {
      currentStreak++;
      checkDate = shiftDate(checkDate, -1);
    }
  } else {
    currentStreak = 0;
  }

  // 2. Longest historical streak
  let longestStreak = currentStreak;
  let runningStreak = 0;
  let prevDate: string | null = null;

  for (const d of uniqueDates) {
    if (!prevDate) {
      runningStreak = 1;
    } else {
      const expectedNext = shiftDate(prevDate, 1);
      if (d === expectedNext) {
        runningStreak++;
      } else {
        runningStreak = 1;
      }
    }
    prevDate = d;
    if (runningStreak > longestStreak) {
      longestStreak = runningStreak;
    }
  }

  return {
    currentStreak,
    longestStreak,
    todayActive,
    totalActiveDays: uniqueDates.length,
  };
}

/**
 * Scan existing local storage data to harvest past activity dates if first time running
 */
function harvestInitialActivityDates(): string[] {
  const dates = new Set<string>();
  const today = getLocalDateString();
  dates.add(today); // Always credit current session as starting day 1

  try {
    // 1. Check workspace materials
    const wsRaw = localStorage.getItem("astramind_study_workspaces");
    if (wsRaw) {
      const workspaces = JSON.parse(wsRaw);
      if (Array.isArray(workspaces)) {
        for (const ws of workspaces) {
          if (ws.createdAt) {
            dates.add(getLocalDateString(new Date(ws.createdAt)));
          }
          if (Array.isArray(ws.materials)) {
            for (const m of ws.materials) {
              if (m.uploadedAt) {
                dates.add(getLocalDateString(new Date(m.uploadedAt)));
              }
            }
          }
        }
      }
    }

    // 2. Check quiz results
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith("astramind_quiz_results_")) {
        const val = localStorage.getItem(key);
        if (val) {
          const results = JSON.parse(val);
          if (Array.isArray(results)) {
            for (const r of results) {
              if (r.timestamp) {
                dates.add(getLocalDateString(new Date(r.timestamp)));
              }
            }
          }
        }
      }
    }
  } catch (err) {
    console.warn("Notice: could not harvest past activity dates:", err);
  }

  return Array.from(dates).sort();
}

/**
 * Retrieve current learning streak data
 */
export function getLearningStreak(): LearningStreakData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && Array.isArray(parsed.activityDates)) {
        const stats = calculateStreakStats(parsed.activityDates);
        return {
          currentStreak: stats.currentStreak,
          longestStreak: Math.max(stats.longestStreak, parsed.longestStreak || 0),
          lastActiveDate: parsed.lastActiveDate || getLocalDateString(),
          activityDates: parsed.activityDates,
          todayActive: stats.todayActive,
          totalActiveDays: stats.totalActiveDays,
          lastActivitySource: parsed.lastActivitySource,
        };
      }
    }

    // Initialize with harvested or initial activity
    const initialDates = harvestInitialActivityDates();
    const stats = calculateStreakStats(initialDates);
    const initialData: LearningStreakData = {
      currentStreak: stats.currentStreak,
      longestStreak: stats.longestStreak,
      lastActiveDate: getLocalDateString(),
      activityDates: initialDates,
      todayActive: stats.todayActive,
      totalActiveDays: stats.totalActiveDays,
      lastActivitySource: "initial_setup",
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(initialData));
    return initialData;
  } catch (err) {
    console.error("Error reading streak data:", err);
    return {
      currentStreak: 1,
      longestStreak: 1,
      lastActiveDate: getLocalDateString(),
      activityDates: [getLocalDateString()],
      todayActive: true,
      totalActiveDays: 1,
    };
  }
}

/**
 * Record a learning activity for today and advance streak
 */
export function recordLearningActivity(source = "study_activity"): LearningStreakData {
  const current = getLearningStreak();
  const today = getLocalDateString();

  const dateSet = new Set(current.activityDates);
  const wasAlreadyActiveToday = dateSet.has(today);

  dateSet.add(today);
  const updatedDates = Array.from(dateSet).sort();
  const stats = calculateStreakStats(updatedDates);

  const updatedData: LearningStreakData = {
    currentStreak: stats.currentStreak,
    longestStreak: Math.max(stats.longestStreak, current.longestStreak),
    lastActiveDate: today,
    activityDates: updatedDates,
    todayActive: true,
    totalActiveDays: stats.totalActiveDays,
    lastActivitySource: source,
  };

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedData));
    // Notify all active listeners across tabs and components
    window.dispatchEvent(
      new CustomEvent(STREAK_EVENT, {
        detail: { streak: updatedData, wasNewDay: !wasAlreadyActiveToday },
      })
    );
  } catch (err) {
    console.warn("Notice: could not save streak to storage:", err);
  }

  return updatedData;
}

/**
 * Get 7-day streak status (last 7 consecutive days ending today)
 */
export function getRecentDaysStatus(daysCount = 7): DayStreakStatus[] {
  const streak = getLearningStreak();
  const dateSet = new Set(streak.activityDates);
  const todayStr = getLocalDateString();
  const todayDate = new Date();

  const days: DayStreakStatus[] = [];
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const shortNames = ["S", "M", "T", "W", "T", "F", "S"];

  for (let i = daysCount - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(todayDate.getDate() - i);
    const dateStr = getLocalDateString(d);
    const dayOfWeek = d.getDay();

    days.push({
      dayName: dayNames[dayOfWeek],
      shortDayName: shortNames[dayOfWeek],
      dayNumber: d.getDate(),
      dateStr,
      isToday: dateStr === todayStr,
      isPast: dateStr < todayStr,
      isFuture: dateStr > todayStr,
      isActive: dateSet.has(dateStr),
    });
  }

  return days;
}

/**
 * Subscribe to streak updates
 */
export function subscribeToStreak(
  callback: (streak: LearningStreakData, wasNewDay?: boolean) => void
): () => void {
  const handler = (e: Event) => {
    const custom = e as CustomEvent;
    if (custom.detail?.streak) {
      callback(custom.detail.streak, custom.detail.wasNewDay);
    } else {
      callback(getLearningStreak());
    }
  };

  window.addEventListener(STREAK_EVENT, handler);
  window.addEventListener("storage", (e) => {
    if (e.key === STORAGE_KEY) {
      callback(getLearningStreak());
    }
  });

  return () => {
    window.removeEventListener(STREAK_EVENT, handler);
  };
}
