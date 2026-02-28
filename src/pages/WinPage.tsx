import { ActorCard } from '../components/ActorCard';
import { MovieBadge } from '../components/MovieBadge';
import type { GameState } from '../types';

type WinPageProps = {
  gameState: GameState;
  onPlayAgain: () => void;
};

export function WinPage({ gameState, onPlayAgain }: WinPageProps) {
  const stepCount = gameState.chain.length;

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-md p-8 flex flex-col gap-8">
        <WinHeader stepCount={stepCount} />
        <CompletedChain gameState={gameState} />

        <button
          type="button"
          onClick={onPlayAgain}
          className="w-full py-3 px-6 rounded-lg bg-indigo-600 text-white font-semibold text-lg hover:bg-indigo-700 transition-colors"
        >
          Play Again
        </button>
      </div>
    </div>
  );
}

function WinHeader({ stepCount }: { stepCount: number }) {
  return (
    <div className="text-center">
      <div className="text-5xl mb-3">🎬</div>
      <h1 className="text-3xl font-bold text-gray-900">You connected them!</h1>
      <p className="mt-2 text-gray-500">
        Chain completed in{' '}
        <span className="font-semibold text-indigo-600">
          {stepCount} {stepCount === 1 ? 'step' : 'steps'}
        </span>
        .
      </p>
    </div>
  );
}

function CompletedChain({ gameState }: { gameState: GameState }) {
  const { startActor, targetActor, chain } = gameState;

  return (
    <div className="flex flex-col items-center gap-2">
      <ActorCard actor={startActor} />

      {chain.map((step, index) => {
        const isLast = index === chain.length - 1;
        // Each ChainStep stores the FROM actor; the TO actor is the next step's
        // FROM actor, or the targetActor for the final step.
        const toActor = isLast ? targetActor : chain[index + 1].actor;
        return (
          <div key={step.movie.id} className="flex flex-col items-center gap-2">
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
