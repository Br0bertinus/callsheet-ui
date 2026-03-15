import { useEffect } from 'react';
import { useNavigate } from 'react-router';
import { useGameContext } from '../context/GameContext';
import { useDailyChallenge, getTodayResult, getTodayDateString } from '../hooks/useDailyChallenge';
import { ActorCard } from '../components/ActorCard';
import { MovieBadge } from '../components/MovieBadge';
import { ErrorMessage } from '../components/ErrorMessage';
import { CalendarIcon } from '../components/CalendarIcon';
import type { DailyChallengeResult } from '../types';

export function DailyChallengePage() {
  const { initializeGame } = useGameContext();
  const navigate = useNavigate();
  const { dailyChallengeData, isLoadingDailyChallenge, dailyChallengeError } = useDailyChallenge();
  const todayResult = getTodayResult();

  useEffect(() => {
    // Only auto-start if we have the data AND the user hasn't already played today.
    if (!dailyChallengeData || todayResult) return;

    initializeGame(dailyChallengeData.startActor, dailyChallengeData.targetActor, true);
    navigate('/game', { replace: true });
  }, [dailyChallengeData]); // eslint-disable-line react-hooks/exhaustive-deps

  if (isLoadingDailyChallenge) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <p className="text-gray-500 text-lg animate-pulse">Loading today's challenge…</p>
      </div>
    );
  }

  if (dailyChallengeError) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md flex flex-col gap-4">
          <ErrorMessage message="Could not load today's challenge. Please try again later." />
          <button
            type="button"
            onClick={() => navigate('/', { replace: true })}
            className="w-full py-3 px-6 rounded-lg bg-indigo-600 text-white font-semibold hover:bg-indigo-700 active:scale-95 transition-all"
          >
            ← Back to Setup
          </button>
        </div>
      </div>
    );
  }

  // Already played today — show the result summary.
  if (todayResult && dailyChallengeData) {
    return (
      <AlreadyPlayedScreen
        result={todayResult}
        onPlayRandom={() => navigate('/', { replace: true })}
      />
    );
  }

  // Data is loaded but useEffect hasn't fired yet — render nothing to avoid flash.
  return null;
}

// ---------------------------------------------------------------------------
// Already-played screen
// ---------------------------------------------------------------------------

type AlreadyPlayedScreenProps = {
  result: DailyChallengeResult;
  onPlayRandom: () => void;
};

function AlreadyPlayedScreen({ result, onPlayRandom }: AlreadyPlayedScreenProps) {
  const dateLabel = formatChallengeDate(result.date);

  return (
    <div className="min-h-screen bg-linear-to-b from-indigo-50 via-white to-gray-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8 flex flex-col gap-6">
        <div className="text-center">
          <div className="flex justify-center mb-2"><CalendarIcon size="lg" /></div>
          <h1 className="text-2xl font-bold text-gray-900">Daily Challenge</h1>
          <p className="text-sm text-indigo-500 font-medium mt-1">{dateLabel}</p>
        </div>

        <div className="bg-green-50 border border-green-100 rounded-xl p-4 text-center">
          <p className="text-green-700 font-semibold text-lg">✅ Already completed!</p>
          <p className="text-green-600 text-sm mt-1">
            You solved it in <span className="font-bold">{result.steps} {result.steps === 1 ? 'step' : 'steps'}</span> with
            an obscurity score of <span className="font-bold">{result.score}</span>.
          </p>
          <p className="text-green-500 text-sm mt-1">Come back tomorrow for a new challenge.</p>
        </div>

        {/* Your chain */}
        <div className="flex flex-col items-center gap-2">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Your path</p>
          <ActorCard actor={result.startActor} />
          {result.chain.map((step, index) => {
            const isLast = index === result.chain.length - 1;
            const toActor = isLast ? result.targetActor : result.chain[index + 1].actor;
            return (
              <div key={step.movie.id} className="flex flex-col items-center gap-2">
                <div className="w-0.5 h-4 bg-gray-200 rounded" aria-hidden="true" />
                <MovieBadge movie={step.movie} />
                <div className="w-0.5 h-4 bg-gray-200 rounded" aria-hidden="true" />
                <ActorCard actor={toActor} isHighlighted={isLast} />
              </div>
            );
          })}
        </div>

        <button
          type="button"
          onClick={onPlayRandom}
          className="w-full py-3 px-6 rounded-xl bg-indigo-600 text-white font-semibold text-lg hover:bg-indigo-700 active:scale-95 transition-all shadow-md hover:shadow-lg"
        >
          🎬 Play a Random Game
        </button>
      </div>
    </div>
  );
}

function formatChallengeDate(isoDate: string): string {
  // Parse as local date to avoid timezone offset shifting the day.
  const [year, month, day] = isoDate.split('-').map(Number);
  const d = new Date(year, month - 1, day);
  return d.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
}

// Re-export helper so WinPage can use it without importing from the hook file.
export { getTodayDateString };
