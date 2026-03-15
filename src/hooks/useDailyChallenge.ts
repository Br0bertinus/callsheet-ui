import { useQuery } from '@tanstack/react-query';
import { getDailyChallenge } from '../api/game';
import type { DailyChallengeResult, GameState } from '../types';

const DAILY_RESULT_KEY = 'callsheet:dailyResult';

// Returns the current date as an ISO date string (YYYY-MM-DD) in local time.
export function getTodayDateString(): string {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

// Reads today's completed result from localStorage.
// Returns null if the user hasn't finished today's challenge yet,
// the stored result is from a previous day, or the stored data is
// an older format that's missing required fields (e.g. chain).
export function getTodayResult(): DailyChallengeResult | null {
  try {
    const raw = localStorage.getItem(DAILY_RESULT_KEY);
    if (!raw) return null;
    const result = JSON.parse(raw) as DailyChallengeResult;
    if (result.date !== getTodayDateString()) return null;
    // Discard results saved before the chain field was introduced.
    if (!Array.isArray(result.chain)) return null;
    return result;
  } catch {
    return null;
  }
}

// Persists the user's result for today's daily challenge to localStorage.
export function saveTodayResult(gameState: GameState, score: number): void {
  const result: DailyChallengeResult = {
    date: getTodayDateString(),
    steps: gameState.chain.length,
    score,
    startActor: gameState.startActor,
    targetActor: gameState.targetActor,
    chain: gameState.chain,
  };
  localStorage.setItem(DAILY_RESULT_KEY, JSON.stringify(result));
}

// Fetches today's daily challenge pair from the server and exposes the
// cached result if the user has already completed it today.
export function useDailyChallenge() {
  const { data, isPending, error } = useQuery({
    queryKey: ['dailyChallenge', getTodayDateString()],
    queryFn: getDailyChallenge,
    // Cache for 10 minutes — daily pair won't change more often than that
    staleTime: 10 * 60 * 1000,
  });

  return {
    dailyChallengeData: data,
    isLoadingDailyChallenge: isPending,
    dailyChallengeError: error,
  };
}
