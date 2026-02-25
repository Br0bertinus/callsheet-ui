import { useMutation } from '@tanstack/react-query';
import { startGame } from '../api/game';
import type { NewGameResponse } from '../types';

type StartGameArgs = {
  startActorId: number;
  targetActorId: number;
};

// Calls POST /game to confirm both actors exist and receive their full details.
// The caller is responsible for handling the onSuccess / onError callbacks.
export function useNewGame(onSuccess: (data: NewGameResponse) => void) {
  const {
    mutate: submitNewGame,
    isPending: isStartingGame,
    error: newGameError,
  } = useMutation({
    mutationFn: (args: StartGameArgs) =>
      startGame({ startActorId: args.startActorId, targetActorId: args.targetActorId }),
    onSuccess,
  });

  return {
    submitNewGame,
    isStartingGame,
    newGameError,
  };
}
