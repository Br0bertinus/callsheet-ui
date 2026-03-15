import { createContext, useContext } from 'react';
import { Outlet } from 'react-router';
import { useGameState } from '../hooks/useGameState';
import type { Actor, Movie, GameState } from '../types';

type GameContextValue = {
  gameState: GameState | null;
  hasWon: boolean;
  initializeGame: (startActor: Actor, targetActor: Actor, isDailyChallenge?: boolean) => void;
  addStepToChain: (nextActor: Actor, connectingMovie: Movie) => void;
  resetChain: () => void;
  resetGame: () => void;
};

const GameContext = createContext<GameContextValue | null>(null);

// Layout route component — owns all game state and provides it to every child route.
export function GameProvider() {
  const value = useGameState();
  return (
    <GameContext.Provider value={value}>
      <Outlet />
    </GameContext.Provider>
  );
}

export function useGameContext(): GameContextValue {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error('useGameContext must be used inside a GameProvider route');
  return ctx;
}
