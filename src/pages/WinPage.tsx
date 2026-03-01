import { useState } from 'react';
import { ActorCard } from '../components/ActorCard';
import { MovieBadge } from '../components/MovieBadge';
import type { GameState } from '../types';

// ---------------------------------------------------------------------------
// Share helpers
// ---------------------------------------------------------------------------

function buildShareUrl(gameState: GameState): string {
  const params = new URLSearchParams({
    startActorId: String(gameState.startActor.id),
    targetActorId: String(gameState.targetActor.id),
  });
  return `${window.location.origin}${window.location.pathname}?${params}`;
}

function buildShareText(gameState: GameState): string {
  const steps = gameState.chain.length;
  return `I connected ${gameState.startActor.name} → ${gameState.targetActor.name} in ${steps} ${steps === 1 ? 'step' : 'steps'}! Can you beat me? 🎬`;
}

function ShareButton({ gameState }: { gameState: GameState }) {
  const [copied, setCopied] = useState(false);

  async function handleShare() {
    const url = buildShareUrl(gameState);
    const message = buildShareText(gameState);

    if (navigator.share) {
      try {
        // Pass text and url separately so the OS doesn't duplicate the link.
        await navigator.share({ title: 'Callsheet Challenge', text: message, url });
        return;
      } catch {
        // User cancelled or Web Share API unavailable — fall through to clipboard.
      }
    }

    await navigator.clipboard.writeText(`${message}\n${url}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <button
      type="button"
      onClick={handleShare}
      className="w-full py-3 px-6 rounded-xl bg-white text-indigo-600 font-semibold text-lg border-2 border-indigo-200 hover:border-indigo-400 hover:bg-indigo-50 active:scale-95 transition-all shadow-sm"
    >
      {copied ? '✅ Copied to clipboard!' : '💪 Challenge a Friend'}
    </button>
  );
}

type WinPageProps = {
  gameState: GameState;
  onPlayAgain: () => void;
};

export function WinPage({ gameState, onPlayAgain }: WinPageProps) {
  const stepCount = gameState.chain.length;

  return (
    <div className="min-h-screen bg-linear-to-b from-indigo-50 via-white to-gray-100 flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-lg p-8 flex flex-col gap-8 relative overflow-hidden">
        <Confetti />
        <WinHeader stepCount={stepCount} />
        <CompletedChain gameState={gameState} />
        <ShareButton gameState={gameState} />
        <button
          type="button"
          onClick={onPlayAgain}
          className="w-full py-3 px-6 rounded-xl bg-indigo-600 text-white font-semibold text-lg hover:bg-indigo-700 active:scale-95 transition-all shadow-md hover:shadow-lg"
        >
          🎬 Play Again
        </button>
      </div>
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

function WinHeader({ stepCount }: { stepCount: number }) {
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
