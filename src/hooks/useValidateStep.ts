import { useMutation } from '@tanstack/react-query';
import { validateStep } from '../api/game';
import type { ValidateStepResponse } from '../types';

type ValidateStepArgs = {
  currentActorId: number;
  nextActorId: number;
  movieId: number;
  visitedActorIds: number[];
  visitedMovieIds: number[];
};

// Calls POST /game/validate-step to check whether the proposed chain link is valid.
// Pass { onSuccess } as the second argument to submitStep() at the call site
// rather than wiring it here — avoids stale-closure bugs in TanStack Query v5.
export function useValidateStep() {
  const {
    mutate: submitStep,
    isPending: isValidatingStep,
    error: validateStepError,
    reset: resetValidateStep,
  } = useMutation({
    mutationFn: (args: ValidateStepArgs) => validateStep(args),
  });

  return {
    submitStep,
    isValidatingStep,
    validateStepError,
    resetValidateStep,
  };
}
