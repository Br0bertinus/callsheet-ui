import { ActorCard } from './ActorCard';
import { MovieBadge } from './MovieBadge';
import type { ChainStep, Actor } from '../types';

type ChainDisplayProps = {
  startActor: Actor;
  chain: ChainStep[];
  currentActor: Actor;
};

// Visual trail of the chain built so far:
// [Actor] --[Movie]-- [Actor] --[Movie]-- ... [CurrentActor]
export function ChainDisplay({ startActor, chain, currentActor }: ChainDisplayProps) {
  const isChainEmpty = chain.length === 0;

  return (
    <div className="flex flex-col items-center gap-2">
      <ActorCard
        actor={startActor}
        isHighlighted={isChainEmpty}
      />

      {chain.map((step, index) => {
        const isLastStep = index === chain.length - 1;
        return (
          <ChainLink
            key={step.movie.id}
            step={step}
            isNextActorCurrent={isLastStep}
            nextActor={isLastStep ? currentActor : chain[index + 1]?.actor ?? currentActor}
          />
        );
      })}

      {!isChainEmpty && (
        <ActorCard actor={currentActor} isHighlighted />
      )}
    </div>
  );
}

type ChainLinkProps = {
  step: ChainStep;
  isNextActorCurrent: boolean;
  nextActor: Actor;
};

// A single actor → movie → actor segment in the chain trail
function ChainLink({ step, isNextActorCurrent, nextActor }: ChainLinkProps) {
  return (
    <>
      <ChainConnector />
      <MovieBadge movie={step.movie} />
      <ChainConnector />
      {!isNextActorCurrent && <ActorCard actor={nextActor} />}
    </>
  );
}

function ChainConnector() {
  return <div className="w-0.5 h-4 bg-gray-300 rounded" aria-hidden="true" />;
}
