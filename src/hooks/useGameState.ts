import { useState, useCallback } from 'react';
import type { Actor, Movie, GameState, ChainStep } from '../types';

type UseGameStateResult = {
  gameState: GameState | null;
  hasWon: boolean;
  initializeGame: (startActor: Actor, targetActor: Actor) => void;
  addStepToChain: (nextActor: Actor, connectingMovie: Movie) => void;
  resetChain: () => void;
  resetGame: () => void;
};

// Owns all client-side game state: the current actor, the chain built so far,
// and the lists of visited actors/movies used to enforce no-repeat rules.
export function useGameState(): UseGameStateResult {
  const [gameState, setGameState] = useState<GameState | null>(null);

  const hasWon =
    gameState !== null &&
    gameState.currentActor.id === gameState.targetActor.id;

  const initializeGame = useCallback((startActor: Actor, targetActor: Actor) => {
    setGameState({
      startActor,
      targetActor,
      currentActor: startActor,
      chain: [],
      visitedActorIds: [startActor.id],
      visitedMovieIds: [],
    });
  }, []);

  const addStepToChain = useCallback((nextActor: Actor, connectingMovie: Movie) => {
    setGameState((previousState) => {
      if (previousState === null) return null;

      const newStep: ChainStep = {
        actor: previousState.currentActor,
        movie: connectingMovie,
      };

      return {
        ...previousState,
        currentActor: nextActor,
        chain: [...previousState.chain, newStep],
        visitedActorIds: [...previousState.visitedActorIds, nextActor.id],
        visitedMovieIds: [...previousState.visitedMovieIds, connectingMovie.id],
      };
    });
  }, []);

  const resetChain = useCallback(() => {
    setGameState((prev) => {
      if (prev === null) return null;
      return {
        ...prev,
        currentActor: prev.startActor,
        chain: [],
        visitedActorIds: [prev.startActor.id],
        visitedMovieIds: [],
      };
    });
  }, []);

  const resetGame = useCallback(() => {
    setGameState(null);
  }, []);

  return {
    gameState,
    hasWon,
    initializeGame,
    addStepToChain,
    resetChain,
    resetGame,
  };
}
