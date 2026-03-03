import { useMutation } from '@tanstack/react-query';
import { startGame } from '../api/game';

type StartGameArgs = {
  startActorId: number;
  targetActorId: number;
};

// Calls POST /game to confirm both actors exist and receive their full details.
// Pass { onSuccess } as the second argument to submitNewGame() at the call site
// rather than wiring it here — avoids stale-closure bugs in TanStack Query v5.
export function useNewGame() {
  const {
    mutate: submitNewGame,
    isPending: isStartingGame,
    error: newGameError,
  } = useMutation({
    mutationFn: (args: StartGameArgs) =>
      startGame({ startActorId: args.startActorId, targetActorId: args.targetActorId }),
  });

  return {
    submitNewGame,
    isStartingGame,
    newGameError,
  };
}
