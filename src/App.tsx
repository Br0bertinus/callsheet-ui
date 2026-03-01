import { useCallback, useEffect, useRef } from 'react';
import { useGameState } from './hooks/useGameState';
import { startGame } from './api/game';
import { SetupPage } from './pages/SetupPage';
import { GamePage } from './pages/GamePage';
import { WinPage } from './pages/WinPage';
import type { Actor, Movie, NewGameResponse } from './types';

// App is the top-level router between the three game screens.
// All game state lives in useGameState — this component only wires transitions.
export function App() {
  const { gameState, hasWon, initializeGame, addStepToChain, resetChain, resetGame } = useGameState();
  const autoStartAttempted = useRef(false);

  // If the page was loaded with ?startActorId=…&targetActorId=… (from a shared
  // challenge link), skip the setup screen and jump straight into the game.
  useEffect(() => {
    if (autoStartAttempted.current) return;
    autoStartAttempted.current = true;

    const params = new URLSearchParams(window.location.search);
    const startActorId = Number(params.get('startActorId'));
    const targetActorId = Number(params.get('targetActorId'));
    if (!startActorId || !targetActorId) return;

    // Strip the params from the URL so the address bar stays clean.
    window.history.replaceState({}, '', window.location.pathname);

    startGame({ startActorId, targetActorId })
      .then((data) => initializeGame(data.startActor, data.targetActor))
      .catch((err) => console.error('Failed to start shared game:', err));
  }, [initializeGame]);

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

  return <GamePage gameState={gameState} onStepAccepted={handleStepAccepted} onResetChain={resetChain} onGiveUp={resetGame} />;
}
