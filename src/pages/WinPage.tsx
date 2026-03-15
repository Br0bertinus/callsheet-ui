import { useState, useEffect } from 'react';
import { Navigate, useNavigate } from 'react-router';
import { useGameContext } from '../context/GameContext';
import { ActorCard } from '../components/ActorCard';
import { MovieBadge } from '../components/MovieBadge';
import { CalendarIcon } from '../components/CalendarIcon';
import type { GameState } from '../types';
import { calcObscurityScore } from '../scoring';
import { saveTodayResult } from '../hooks/useDailyChallenge';

// ---------------------------------------------------------------------------
// Share helpers
// ---------------------------------------------------------------------------

function buildShareUrl(gameState: GameState): string {
  // For daily challenges, share the /daily route — no actor IDs needed since
  // the server derives the pair from the date.
  if (gameState.isDailyChallenge) {
    return `${window.location.origin}/daily`;
  }
  const params = new URLSearchParams({
    startActorId: String(gameState.startActor.id),
    targetActorId: String(gameState.targetActor.id),
  });
  // Always point to / so challenge links work regardless of current route.
  return `${window.location.origin}/?${params}`;
}

function buildShareText(gameState: GameState): string {
  const steps = gameState.chain.length;
  const obscurity = Math.round(calcObscurityScore(gameState));
  if (gameState.isDailyChallenge && gameState.challengeDate) {
    return `📅 Callsheet Daily Challenge (${gameState.challengeDate})\nI connected ${gameState.startActor.name} → ${gameState.targetActor.name} in ${steps} ${steps === 1 ? 'step' : 'steps'} with an obscurity score of ${obscurity}! 🎬`;
  }
  return `I connected ${gameState.startActor.name} → ${gameState.targetActor.name} in ${steps} ${steps === 1 ? 'step' : 'steps'} with an obscurity score of ${obscurity}! Can you find a more obscure path? 🎬`;
}

function ShareButton({ gameState }: { gameState: GameState }) {
  const [copied, setCopied] = useState(false);

  async function handleShare() {
    const url = buildShareUrl(gameState);
    const message = buildShareText(gameState);

    if (navigator.share) {
      try {
        // Combine message and URL into `text` only — passing `url` separately
        // causes some apps (e.g. Signal) to drop the `text` field entirely.
        await navigator.share({ title: 'Callsheet Challenge', text: `${message}\n${url}` });
        return;
      } catch {
        // User cancelled or Web Share API unavailable — fall through to clipboard.
      }
    }

    await navigator.clipboard.writeText(`${message}\n${url}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const label = gameState.isDailyChallenge
    ? (copied ? '✅ Copied to clipboard!' : '📣 Share Your Result')
    : (copied ? '✅ Copied to clipboard!' : '💪 Challenge a Friend');

  return (
    <button
      type="button"
      onClick={handleShare}
      className="w-full py-3 px-6 rounded-xl bg-white text-indigo-600 font-semibold text-lg border-2 border-indigo-200 hover:border-indigo-400 hover:bg-indigo-50 active:scale-95 transition-all shadow-sm"
    >
      {label}
    </button>
  );
}

export function WinPage() {
  const { gameState, hasWon, resetGame } = useGameContext();
  const navigate = useNavigate();

  // Persist the daily challenge result once when the win screen mounts.
  // Must be called unconditionally (before any early return) to follow Rules of Hooks.
  useEffect(() => {
    if (gameState?.isDailyChallenge && hasWon) {
      const score = Math.round(calcObscurityScore(gameState));
      saveTodayResult(gameState, score);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Guard: if there's no completed game to display, go back to setup.
  if (!gameState || !hasWon) return <Navigate to="/" replace />;

  const stepCount = gameState.chain.length;
  const rarityScore = Math.round(calcObscurityScore(gameState));

  return (
    <div className="min-h-screen bg-linear-to-b from-indigo-50 via-white to-gray-100 flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-lg p-8 flex flex-col gap-8 relative overflow-hidden">
        <Confetti />
        {gameState.isDailyChallenge && gameState.challengeDate && (
          <div className="flex items-center justify-center gap-2 -mb-4">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-semibold bg-indigo-100 text-indigo-700 ring-1 ring-indigo-300 animate-pop-in">
              <CalendarIcon size="sm" />
              Daily Challenge · {gameState.challengeDate}
            </span>
          </div>
        )}
        <WinHeader stepCount={stepCount} rarityScore={rarityScore} />
        <RarityBreakdown gameState={gameState} />
        <CompletedChain gameState={gameState} />
        <ShareButton gameState={gameState} />
        <button
          type="button"
          onClick={() => { resetGame(); navigate('/'); }}
          className="w-full py-3 px-6 rounded-xl bg-indigo-600 text-white font-semibold text-lg hover:bg-indigo-700 active:scale-95 transition-all shadow-md hover:shadow-lg"
        >
          🎬 Play Again
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Rarity breakdown
// ---------------------------------------------------------------------------

function RarityBreakdown({ gameState }: { gameState: GameState }) {
  const [open, setOpen] = useState(false);

  // Intermediate actors only — seed actors (start/target) are excluded from scoring.
  const actors = gameState.chain.slice(1).map(s => s.actor);
  const movies = gameState.chain.map(s => s.movie);

  const actorSum = actors.reduce((sum, a) => sum + a.popularity, 0);
  const movieSum = movies.reduce((sum, m) => sum + m.popularity, 0);

  // Interleaved items in display order, seeds shown but visually marked as excluded.
  type ChainItem =
    | { kind: 'actor'; name: string; popularity: number; seed: boolean }
    | { kind: 'movie'; name: string; popularity: number };

  const items: ChainItem[] = [];
  gameState.chain.forEach((step, index) => {
    items.push({ kind: 'actor', name: step.actor.name, popularity: step.actor.popularity, seed: index === 0 });
    items.push({ kind: 'movie', name: `${step.movie.title} (${step.movie.year})`, popularity: step.movie.popularity });
  });
  items.push({ kind: 'actor', name: gameState.targetActor.name, popularity: gameState.targetActor.popularity, seed: true });

  return (
    <div className="flex flex-col items-center gap-2">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="text-sm text-violet-500 hover:text-violet-700 underline underline-offset-2 transition-colors"
      >
        {open ? 'Hide breakdown' : '💎 See score breakdown'}
      </button>

      {open && (
        <div className="w-full rounded-xl border border-violet-100 bg-violet-50 overflow-hidden text-sm animate-slide-up">
          {/* Subtotals */}
          <div className="grid grid-cols-2 divide-x divide-violet-100 border-b border-violet-100">
            <div className="flex flex-col items-center py-3 gap-0.5">
              <span className="text-violet-400 text-xs uppercase tracking-wide font-medium">🎭 Actors</span>
              <span className="text-violet-800 font-bold tabular-nums text-base">{actorSum.toFixed(1)}</span>
              <span className="text-violet-300 text-xs">seeds excluded</span>
            </div>
            <div className="flex flex-col items-center py-3 gap-0.5">
              <span className="text-violet-400 text-xs uppercase tracking-wide font-medium">🎬 Movies</span>
              <span className="text-violet-800 font-bold tabular-nums text-base">{movieSum.toFixed(1)}</span>
            </div>
          </div>

          {/* Per-item rows */}
          <ul className="divide-y divide-violet-100">
            {items.map((item, i) => (
              <li key={i} className={`flex items-center justify-between px-4 py-2 gap-2 ${item.kind === 'actor' && item.seed ? 'opacity-40' : ''}`}>
                <span className="flex items-center gap-2 text-gray-700 min-w-0">
                  <span className="shrink-0">{item.kind === 'actor' ? '🎭' : '🎬'}</span>
                  <span className="truncate">{item.name}</span>
                  {item.kind === 'actor' && item.seed && (
                    <span className="text-xs text-gray-400 shrink-0">seed</span>
                  )}
                </span>
                <span className={`tabular-nums font-semibold shrink-0 ${item.kind === 'actor' && item.seed ? 'text-gray-400' : 'text-violet-700'}`}>
                  {item.popularity.toFixed(1)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Confetti burst
// ---------------------------------------------------------------------------

const CONFETTI: Array<{
  color: string;
  size: string;
  tx: string;
  ty: string;
  rot: string;
  delay: string;
  shape: 'square' | 'circle';
}> = [
  { color: 'bg-yellow-400', size: 'w-2.5 h-2.5', tx: '-100px', ty: '-80px', rot: '220deg', delay: '0ms',   shape: 'square' },
  { color: 'bg-pink-400',   size: 'w-2   h-3',   tx: '110px',  ty: '-70px', rot: '-190deg', delay: '40ms',  shape: 'square' },
  { color: 'bg-blue-400',   size: 'w-3   h-2',   tx: '-140px', ty: '-30px', rot: '310deg', delay: '80ms',  shape: 'circle' },
  { color: 'bg-green-400',  size: 'w-2.5 h-2.5', tx: '145px',  ty: '-45px', rot: '-250deg', delay: '20ms',  shape: 'square' },
  { color: 'bg-purple-400', size: 'w-2   h-2',   tx: '-70px',  ty: '-100px', rot: '180deg', delay: '100ms', shape: 'circle' },
  { color: 'bg-orange-400', size: 'w-3   h-2',   tx: '75px',   ty: '-90px', rot: '-370deg', delay: '60ms',  shape: 'square' },
  { color: 'bg-red-400',    size: 'w-2.5 h-2',   tx: '-170px', ty: '-15px', rot: '280deg', delay: '130ms', shape: 'circle' },
  { color: 'bg-teal-400',   size: 'w-2   h-3',   tx: '175px',  ty: '-55px', rot: '-210deg', delay: '15ms',  shape: 'square' },
  { color: 'bg-yellow-300', size: 'w-2   h-2',   tx: '-45px',  ty: '-115px', rot: '330deg', delay: '90ms',  shape: 'square' },
  { color: 'bg-rose-400',   size: 'w-3   h-2.5', tx: '50px',   ty: '-120px', rot: '-300deg', delay: '55ms',  shape: 'circle' },
  { color: 'bg-indigo-400', size: 'w-2.5 h-2',   tx: '-215px', ty: '10px',  rot: '245deg', delay: '110ms', shape: 'square' },
  { color: 'bg-emerald-400',size: 'w-2   h-3',   tx: '220px',  ty: '5px',   rot: '-170deg', delay: '70ms',  shape: 'circle' },
  { color: 'bg-amber-300',  size: 'w-3   h-3',   tx: '-90px',  ty: '-140px', rot: '410deg', delay: '35ms',  shape: 'circle' },
  { color: 'bg-cyan-400',   size: 'w-2   h-2',   tx: '95px',   ty: '-135px', rot: '-125deg', delay: '145ms', shape: 'square' },
];

function Confetti() {
  return (
    <div className="pointer-events-none absolute inset-x-0 top-12 flex justify-center" aria-hidden="true">
      {CONFETTI.map((p, i) => (
        <div
          key={i}
          className={`absolute ${p.color} ${p.size} ${p.shape === 'circle' ? 'rounded-full' : 'rounded-sm'} animate-confetti`}
          style={{
            '--tx': p.tx,
            '--ty': p.ty,
            '--rot': p.rot,
            animationDelay: p.delay,
          } as React.CSSProperties}
        />
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Win header
// ---------------------------------------------------------------------------

function scoreBadge(steps: number): { label: string; classes: string } {
  if (steps === 1) return { label: '⭐ One & Done',    classes: 'bg-yellow-100 text-yellow-800 ring-yellow-300' };
  if (steps === 2) return { label: '🔥 Blazing Fast',  classes: 'bg-orange-100 text-orange-800 ring-orange-300' };
  if (steps <= 4)  return { label: '✅ Solid',          classes: 'bg-green-100  text-green-800  ring-green-300'  };
  if (steps <= 6)  return { label: '👍 Got There',      classes: 'bg-blue-100   text-blue-800   ring-blue-300'   };
  return             { label: '🎉 Completed',       classes: 'bg-gray-100   text-gray-700   ring-gray-300'   };
}

function WinHeader({ stepCount, rarityScore }: { stepCount: number; rarityScore: number }) {
  const badge = scoreBadge(stepCount);
  return (
    <div className="text-center flex flex-col items-center gap-3">
      <div className="text-6xl animate-bounce">🏆</div>
      <h1 className="text-3xl font-bold text-gray-900 animate-pop-in">You connected them!</h1>
      <div className="flex items-center gap-3 mt-1">
        <span
          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-semibold ring-1 animate-pop-in ${badge.classes}`}
          style={{ animationDelay: '150ms' }}
        >
          {badge.label}
        </span>
        <span
          className="text-gray-500 text-sm animate-pop-in"
          style={{ animationDelay: '200ms' }}
        >
          {stepCount} {stepCount === 1 ? 'step' : 'steps'}
        </span>
      </div>
      <div
        className="flex items-center gap-2 mt-1 px-4 py-2 rounded-xl bg-violet-50 ring-1 ring-violet-200 animate-pop-in"
        style={{ animationDelay: '250ms' }}
        title="Sum of TMDB popularity scores for every chosen actor and movie in your chain (seed actors excluded) — lower means a more obscure path!"
      >
        <span className="text-violet-500 text-sm">💎 Obscurity score</span>
        <span className="text-violet-800 font-bold tabular-nums">{rarityScore.toLocaleString()}</span>
        <span className="text-violet-400 text-xs">(lower = more obscure)</span>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Completed chain
// ---------------------------------------------------------------------------

function CompletedChain({ gameState }: { gameState: GameState }) {
  const { startActor, targetActor, chain } = gameState;

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="animate-slide-up" style={{ animationDelay: '100ms' }}>
        <ActorCard actor={startActor} />
      </div>

      {chain.map((step, index) => {
        const isLast = index === chain.length - 1;
        // Each ChainStep stores the FROM actor; the TO actor is the next step's
        // FROM actor, or the targetActor for the final step.
        const toActor = isLast ? targetActor : chain[index + 1].actor;
        const delay = `${150 + index * 120}ms`;
        return (
          <div
            key={step.movie.id}
            className="flex flex-col items-center gap-2 animate-slide-up"
            style={{ animationDelay: delay }}
          >
            <div className="w-0.5 h-4 bg-gray-300 rounded" aria-hidden="true" />
            <MovieBadge movie={step.movie} />
            <div className="w-0.5 h-4 bg-gray-300 rounded" aria-hidden="true" />
            <ActorCard actor={toActor} isHighlighted={isLast} />
          </div>
        );
      })}
    </div>
  );
}
