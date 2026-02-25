import { useCallback } from 'react';
import { useGameState } from './hooks/useGameState';
import { SetupPage } from './pages/SetupPage';
import { GamePage } from './pages/GamePage';
import { WinPage } from './pages/WinPage';
import type { Actor, Movie, NewGameResponse } from './types';

// App is the top-level router between the three game screens.
// All game state lives in useGameState — this component only wires transitions.
export function App() {
  const { gameState, hasWon, initializeGame, addStepToChain, resetGame } = useGameState();

  const handleGameStarted = useCallback(
    (data: NewGameResponse) => {
      initializeGame(data.startActor, data.targetActor);
    },
    [initializeGame]
  );

  const handleStepAccepted = useCallback(
    (nextActor: Actor, connectingMovie: Movie) => {
      addStepToChain(nextActor, connectingMovie);
    },
    [addStepToChain]
  );

  if (gameState === null) {
    return <SetupPage onGameStarted={handleGameStarted} />;
  }

  if (hasWon) {
    return <WinPage gameState={gameState} onPlayAgain={resetGame} />;
  }

  return <GamePage gameState={gameState} onStepAccepted={handleStepAccepted} />;
}
